const { SocialAccount } = require('../models/index.js');

/**
 * Get all connected social accounts for the specified user (by id)
 */
const getConnectedAccounts = async (req, res) => {
    try {
        // get user_id from query param or token
        const userId = req.query.user_id || req.user?.id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not provided'
            });
        }

        const accounts = await SocialAccount.findAll({
            where: { user_id: userId },
            attributes: ['id', 'provider', 'username', 'instance_url', 'connected_at'],
            order: [['connected_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: accounts
        });
    } catch (error) {
        console.error('Error fetching connected accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve connected accounts',
            error: error.message
        });
    }
};

/**
 * Disconnect (delete) a social account by id for the authenticated user
 */
const deleteConnectedAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        if (!userId || !accountId) {
            return res.status(400).json({ success: false, message: 'User ID or Account ID missing' });
        }

        const account = await SocialAccount.findOne({ where: { id: accountId, user_id: userId } });

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        await account.destroy();

        return res.status(200).json({ success: true, message: 'Account disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to disconnect account',
            error: error.message
        });
    }
};

module.exports = {
    getConnectedAccounts,
    deleteConnectedAccount
};
