const express = require('express');
const router = express.Router();
const mastodonController = require('../controllers/mastodonController');
const { verifyToken } = require('../controllers/userController');

// Get authorization URL for Mastodon
router.get('/auth', verifyToken, mastodonController.getAuthUrl);

// Handle OAuth callback from Mastodon
router.get('/callback', mastodonController.handleCallback);

// Handle OOB authorization code
router.post('/connect', verifyToken, mastodonController.handleOOBCode);

router.post('/post', verifyToken, mastodonController.postToMastodon);

module.exports = router;
