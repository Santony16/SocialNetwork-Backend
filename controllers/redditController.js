const axios = require('axios');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const { sequelize } = require('../config/database'); 

// Reddit OAuth configuration
const REDDIT_CONFIG = {
    client_id: process.env.REDDIT_CLIENT_ID,
    client_secret: process.env.REDDIT_CLIENT_SECRET,
    redirect_uri: process.env.REDDIT_REDIRECT_URI,
    user_agent: process.env.REDDIT_USER_AGENT
};

// Validate Reddit configuration
const validateConfig = () => {
    if (!REDDIT_CONFIG.client_id) {
        throw new Error('Reddit client ID not configured. Please check REDDIT_CLIENT_ID environment variable.');
    }
    if (!REDDIT_CONFIG.redirect_uri) {
        throw new Error('Reddit redirect URI not configured. Please check REDDIT_REDIRECT_URI environment variable.');
    }
};

// Generate Reddit authorization URL
const getAuthUrl = async (req, res) => {
    try {
        validateConfig();
        const userId = req.user.id;
        const state = `${userId}_${Date.now()}`;
        
        console.log('[Reddit] Configuration:');
        console.log(`  - REDDIT_CLIENT_ID: ${REDDIT_CONFIG.client_id.substring(0, 5)}...`);
        console.log(`  - REDDIT_REDIRECT_URI: ${REDDIT_CONFIG.redirect_uri}`);
        
        const authUrl = `https://www.reddit.com/api/v1/authorize?` +
            `client_id=${REDDIT_CONFIG.client_id}` +
            `&response_type=code` +
            `&state=${state}` +
            `&redirect_uri=${encodeURIComponent(REDDIT_CONFIG.redirect_uri)}` +
            `&duration=permanent` +
            `&scope=identity,submit,read`;
            
        console.log('[Reddit] Generated authUrl:', authUrl);
        res.json({ success: true, authUrl, state });
    } catch (error) {
        console.error('Reddit auth URL error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error generating Reddit auth URL' });
    }
};

// Handle Reddit OAuth callback (GET /callback)
const handleCallback = async (req, res) => {
  try {
    validateConfig();
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    const userIdFromState = state.split('_')[0];
    const userId = Number(userIdFromState) || userIdFromState;

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDDIT_CONFIG.redirect_uri
      }),
      {
        auth: { username: REDDIT_CONFIG.client_id, password: REDDIT_CONFIG.client_secret },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': REDDIT_CONFIG.user_agent
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get Reddit user data
    const meResp = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': REDDIT_CONFIG.user_agent
      }
    });
    const redditUser = meResp.data;

    // Find existing account
    const existing = await SocialAccount.findOne({
      where: {
        user_id: userId,
        provider: 'reddit',
        provider_id: redditUser.id.toString()
      }
    });

    if (existing) {
      // Update without sending date strings
      await existing.update({
        access_token,
        refresh_token,
        username: redditUser.name,
        instance_url: 'https://www.reddit.com',
        connected_at: sequelize.literal('GETDATE()')
      });
    } else {
      // Create without date strings
      await SocialAccount.create({
        user_id: userId,
        provider: 'reddit',
        provider_id: redditUser.id.toString(),
        username: redditUser.name,
        access_token,
        refresh_token,
        instance_url: 'https://www.reddit.com',
        created_at: sequelize.literal('GETDATE()'),
        connected_at: sequelize.literal('GETDATE()')
      });
    }

    res.redirect(`${process.env.FRONTEND_URL}/views/accounts.html?reddit=connected`);
  } catch (error) {
    console.error('Reddit callback error:', error.message);
    if (error.name === 'SequelizeDatabaseError') {
      console.error('SQL Error details:', error);
    }
    res.redirect(
      `${process.env.FRONTEND_URL}/views/accounts.html?reddit=error&message=${encodeURIComponent(error.message)}`
    );
  }
};

// Handle OOB code (POST /connect)
const handleOOBCode = async (req, res) => {
  try {
    validateConfig();
    const { code } = req.body;
    const userId = Number(req.user.id) || req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDDIT_CONFIG.redirect_uri
      }),
      {
        auth: { username: REDDIT_CONFIG.client_id, password: REDDIT_CONFIG.client_secret },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': REDDIT_CONFIG.user_agent
        }
      }
    );
    const { access_token, refresh_token } = tokenResponse.data;

    // Get Reddit user data
    const meResp = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'User-Agent': REDDIT_CONFIG.user_agent
      }
    });
    const redditUser = meResp.data;

    // Find existing account
    const existing = await SocialAccount.findOne({
      where: {
        user_id: userId,
        provider: 'reddit',
        provider_id: redditUser.id.toString()
      }
    });

    if (existing) {
      await existing.update({
        access_token,
        refresh_token,
        username: redditUser.name,
        instance_url: 'https://www.reddit.com',
        connected_at: sequelize.literal('GETDATE()')
      });
    } else {
      await SocialAccount.create({
        user_id: userId,
        provider: 'reddit',
        provider_id: redditUser.id.toString(),
        username: redditUser.name,
        access_token,
        refresh_token,
        instance_url: 'https://www.reddit.com',
        created_at: sequelize.literal('GETDATE()'),
        connected_at: sequelize.literal('GETDATE()')
      });
    }

    res.json({
      success: true,
      message: 'Reddit account connected successfully',
      account: { username: redditUser.name, provider_id: redditUser.id }
    });
  } catch (error) {
    console.error('Reddit OOB code error:', error.response?.data || error.message);
    let msg = 'Error connecting Reddit account';
    if (error.response?.status === 401) msg = 'Invalid or expired authorization code.';
    else if (error.response?.status === 400) msg = 'Invalid request. Please check your authorization code.';
    res.status(500).json({
      success: false,
      message: msg,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const postToReddit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, subreddit, accountIds } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        const accounts = await SocialAccount.findAll({
            where: { user_id: userId, provider: 'reddit', id: accountIds || undefined }
        });
        if (accounts.length === 0) {
            return res.status(400).json({ success: false, message: 'No Reddit accounts connected' });
        }
        const results = [];
        for (const account of accounts) {
            try {
                const params = new URLSearchParams();
                params.append('kind', 'self');
                params.append('sr', subreddit || 'test');
                params.append('title', content.slice(0, 100));
                params.append('text', content);
                const response = await axios.post('https://oauth.reddit.com/api/submit', params, {
                    headers: { 'Authorization': `Bearer ${account.access_token}`, 'User-Agent': REDDIT_CONFIG.user_agent }
                });
                results.push({ accountId: account.id, success: true, postId: response.data.json.data.id });
            } catch (error) {
                results.push({ accountId: account.id, success: false, error: error.response?.data || error.message });
            }
        }
        res.json({
            success: results.some(r => r.success),
            message: `Posted to ${results.filter(r => r.success).length} Reddit account(s)`,
            results
        });
    } catch (error) {
        console.error('Post to Reddit error:', error);
        res.status(500).json({ success: false, message: 'Error posting to Reddit' });
    }
};

module.exports = {
    getAuthUrl,
    handleCallback,
    handleOOBCode,
    postToReddit
};
