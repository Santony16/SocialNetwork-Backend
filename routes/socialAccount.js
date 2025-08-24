const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/userController');
const { getUserSocialAccounts, disconnectSocialAccount } = require('../controllers/socialAccountController');

// Get all social accounts for the authenticated user
router.get('/', verifyToken, getUserSocialAccounts);

// Disconnect a social account
router.delete('/:accountId', verifyToken, disconnectSocialAccount);

module.exports = router;
