const axios = require('axios');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const { sequelize } = require('../config/database');

// Mastodon OAuth Configuration
const MASTODON_CONFIG = {
    instance: process.env.MASTODON_INSTANCE,
    client_id: process.env.MASTODON_CLIENT_ID,
    client_secret: process.env.MASTODON_CLIENT_SECRET,
    redirect_uri: process.env.MASTODON_REDIRECT_URI
};

// Validate Mastodon configuration
const validateConfig = () => {
    if (!MASTODON_CONFIG.client_id || !MASTODON_CONFIG.client_secret) {
        throw new Error('Mastodon credentials not configured. Please check MASTODON_CLIENT_ID and MASTODON_CLIENT_SECRET environment variables.');
    }
};

// Handle Mastodon OAuth callback
const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Extract user ID from state
        const userId = state.split('_')[0];

        // Exchange code for access token
        const tokenResponse = await axios.post(`https://${MASTODON_CONFIG.instance}/oauth/token`, {
            client_id: MASTODON_CONFIG.client_id,
            client_secret: MASTODON_CONFIG.client_secret,
            redirect_uri: MASTODON_CONFIG.redirect_uri,
            grant_type: 'authorization_code',
            code: code
        });

        const { access_token } = tokenResponse.data;

        // Get user info from Mastodon
        const userInfoResponse = await axios.get(`https://${MASTODON_CONFIG.instance}/api/v1/accounts/verify_credentials`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const mastodonUser = userInfoResponse.data;

        // Check if account already exists
        const existingAccount = await SocialAccount.findOne({
            where: {
                user_id: userId,
                provider: 'mastodon',
                provider_id: mastodonUser.id.toString()
            }
        });

        if (existingAccount) {
            // Update existing account 
            await existingAccount.update({
                access_token,
                username: mastodonUser.username,
                instance_url: `https://${MASTODON_CONFIG.instance}`
            });
        } else {
            // Create new account
            await SocialAccount.create({
                user_id: userId,
                provider: 'mastodon',
                provider_id: mastodonUser.id.toString(),
                username: mastodonUser.username,
                access_token,
                instance_url: `https://${MASTODON_CONFIG.instance}`
            });
        }

        res.redirect(`http://localhost:8081/views/main.html?mastodon=connected`);

    } catch (error) {
        console.error('Mastodon callback error:', error);
        res.redirect(`http://localhost:8081/views/main.html?mastodon=error`);
    }
};

// Handle OOB (Out of Band) authorization code
const handleOOBCode = async (req, res) => {
    try {
        validateConfig();
        const { code } = req.body;
        
        // Use consistent userId approach
        const userId = req.user.userId || req.user.id;
        
        console.log('Processing OOB code for user:', userId);

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange authorization code for access token
        console.log('Exchanging authorization code for token...');
        const tokenResponse = await axios.post(`https://${MASTODON_CONFIG.instance}/oauth/token`, {
            client_id: MASTODON_CONFIG.client_id,
            client_secret: MASTODON_CONFIG.client_secret,
            redirect_uri: MASTODON_CONFIG.redirect_uri,
            grant_type: 'authorization_code',
            code: code
        });

        const { access_token } = tokenResponse.data;
        console.log('Token obtained successfully');

        // Get user information from Mastodon
        console.log('Getting user info from Mastodon...');
        const userResponse = await axios.get(`https://${MASTODON_CONFIG.instance}/api/v1/accounts/verify_credentials`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        const mastodonUser = userResponse.data;
        console.log('Mastodon user info retrieved:', mastodonUser.username);

        // Check if account already exists
        console.log('Checking if account already exists...');
        const existingAccount = await SocialAccount.findOne({
            where: {
                user_id: userId,
                provider: 'mastodon',
                provider_id: mastodonUser.id.toString()
            }
        });

        if (existingAccount) {
            console.log('Updating existing account');
            await existingAccount.update({
                access_token,
                refresh_token: tokenResponse.data.refresh_token || null,
                username: mastodonUser.username,
                instance_url: `https://${MASTODON_CONFIG.instance}`,
                connected_at: new Date()
            });
        } else {
            console.log('Creating new social account');
            await SocialAccount.create({
                user_id: userId,
                provider: 'mastodon',
                provider_id: mastodonUser.id.toString(),
                username: mastodonUser.username,
                access_token,
                refresh_token: tokenResponse.data.refresh_token || null,
                instance_url: `https://${MASTODON_CONFIG.instance}`,
                connected_at: new Date() 
            });
        }

        res.json({
            success: true,
            message: 'Mastodon account connected successfully',
            account: {
                username: mastodonUser.username,
                display_name: mastodonUser.display_name || mastodonUser.username,
                instance: MASTODON_CONFIG.instance
            }
        });

    } catch (error) {
        console.error('Mastodon OOB code error details:', {
            message: error.message,
            stack: error.stack,
            responseData: error.response?.data,
            responseStatus: error.response?.status
        });

        let errorMessage = 'Error connecting Mastodon account';
        if (error.response?.status === 401) {
            errorMessage = 'Invalid or expired authorization code. Please try again.';
        } else if (error.response?.status === 400) {
            errorMessage = 'Invalid request. Please check your authorization code.';
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Generate Mastodon authorization URL
const getAuthUrl = async (req, res) => {
    try {
        validateConfig();
        const userId = req.user.userId || req.user.id;
        console.log('Getting auth URL for user:', userId);
        
        // Generate state parameter for security
        const state = `${userId}_${Date.now()}`;
        
        const authUrl = `https://${MASTODON_CONFIG.instance}/oauth/authorize?` +
            `client_id=${MASTODON_CONFIG.client_id}&` +
            `redirect_uri=${encodeURIComponent(MASTODON_CONFIG.redirect_uri)}&` +
            `response_type=code&` +
            `scope=read write follow&` +
            `state=${state}`;

        res.json({
            success: true,
            authUrl: authUrl,
            state: state,
            isOOB: MASTODON_CONFIG.redirect_uri
        });

    } catch (error) {
        console.error('Mastodon auth URL error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error generating authorization URL'
        });
    }
};

// Post to Mastodon
const postToMastodon = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, accountIds } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        let accounts;
        if (accountIds && accountIds.length > 0) {
            accounts = await SocialAccount.findAll({
                where: { id: accountIds, user_id: userId, provider: 'mastodon' }
            });
        } else {
            accounts = await SocialAccount.findAll({
                where: { user_id: userId, provider: 'mastodon' }
            });
        }

        if (accounts.length === 0) {
            return res.status(400).json({ success: false, message: 'No Mastodon accounts connected' });
        }

        const results = [];

        for (const account of accounts) {
            try {
                const instanceUrl = account.instance_url || `https://${MASTODON_CONFIG.instance}`;
                const response = await axios.post(`${instanceUrl}/api/v1/statuses`, {
                    status: content,
                    visibility: 'public'
                }, {
                    headers: {
                        'Authorization': `Bearer ${account.access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                results.push({
                    accountId: account.id,
                    success: true,
                    postId: response.data.id,
                    url: response.data.url
                });

            } catch (error) {
                results.push({
                    accountId: account.id,
                    success: false,
                    error: error.response?.data?.error || 'Failed to post'
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: successCount > 0,
            message: `Posted to ${successCount} account(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
            results
        });

    } catch (error) {
        console.error('Post to Mastodon error:', error);
        res.status(500).json({
            success: false,
            message: 'Error posting to Mastodon'
        });
    }
};

module.exports = {
    getAuthUrl,
    handleCallback,
    handleOOBCode,
    postToMastodon
};

