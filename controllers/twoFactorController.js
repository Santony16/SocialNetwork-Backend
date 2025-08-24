const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Generate 2FA secret and QR code for user
const generateTwoFactorSecret = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `SocialHub (${user.email})`,
            issuer: 'SocialHub App',
            length: 32
        });

        // Save secret to user (temporarily, until user confirms)
        user.two_factor_secret = secret.base32;
        await user.save();

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            message: 'QR code generated successfully',
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntryKey: secret.base32,
                instructions: {
                    step1: 'Scan the QR code with Google Authenticator',
                    step2: 'Or manually enter the key: ' + secret.base32,
                    step3: 'Enter the 6-digit code to verify'
                }
            }
        });

    } catch (error) {
        console.error('Error generating 2FA secret:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Verify 2FA token and enable 2FA for user
const verifyAndEnable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: '6-digit token required'
            });
        }

        const user = await User.findByPk(userId);

        if (!user || !user.two_factor_secret) {
            return res.status(400).json({
                success: false,
                message: '2FA configuration not found'
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Enable 2FA for user
        user.two_factor_enabled = true;
        await user.save();

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully',
            data: {
                twoFactorEnabled: true
            }
        });

    } catch (error) {
        console.error('Error verifying 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Verify 2FA token for login
const verify2FALogin = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({
                success: false,
                message: 'Email and token required'
            });
        }

        const user = await User.findOne({ where: { email } });

        if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
            return res.status(400).json({
                success: false,
                message: 'Invalid 2FA configuration'
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: '2FA login successful',
            data: {
                token: jwtToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    twoFactorEnabled: user.two_factor_enabled
                }
            }
        });

    } catch (error) {
        console.error('Error verifying 2FA login:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Disable 2FA for user
const disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword } = req.body;

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password required'
            });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Disable 2FA
        user.two_factor_enabled = false;
        user.two_factor_secret = null;
        await user.save();

        res.json({
            success: true,
            message: 'Two-factor authentication disabled',
            data: {
                twoFactorEnabled: false
            }
        });

    } catch (error) {
        console.error('Error disabling 2FA:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get 2FA status for user
const get2FAStatus = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                twoFactorEnabled: user.two_factor_enabled,
                hasSecret: !!user.two_factor_secret
            }
        });

    } catch (error) {
        console.error('Error getting 2FA status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    generateTwoFactorSecret,
    verifyAndEnable2FA,
    verify2FALogin,
    disable2FA,
    get2FAStatus
};
