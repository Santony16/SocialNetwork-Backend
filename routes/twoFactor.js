const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/userController');
const {
    generateTwoFactorSecret,
    verifyAndEnable2FA,
    verify2FALogin,
    disable2FA,
    get2FAStatus
} = require('../controllers/twoFactorController');

// Get 2FA status (protected route)
router.get('/status', verifyToken, get2FAStatus);

// Generate 2FA secret and QR code (protected route)
router.post('/generate', verifyToken, generateTwoFactorSecret);

// Verify and enable 2FA (protected route)
router.post('/verify', verifyToken, verifyAndEnable2FA);

// Verify 2FA for login (public route)
router.post('/login', verify2FALogin);

// Disable 2FA (protected route)
router.post('/disable', verifyToken, disable2FA);

module.exports = router;
