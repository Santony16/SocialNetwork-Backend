const express = require('express');
const router = express.Router();
const { getAuthUrl, handleCallback, handleOOBCode, postToReddit } = require('../controllers/redditController');
const { verifyToken } = require('../controllers/userController');

// OAuth2: Get Reddit authorization URL
router.get('/auth', verifyToken, getAuthUrl);

// OAuth2: Handle Reddit callback (redirect_uri)
router.get('/callback', handleCallback);

// OAuth2: Handle OOB code (if using OOB flow)
router.post('/connect', verifyToken, handleOOBCode);

// Post to Reddit
router.post('/post', verifyToken, postToReddit);

module.exports = router;
