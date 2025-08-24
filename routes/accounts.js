const express = require('express');
const router = express.Router();
const { getConnectedAccounts, deleteConnectedAccount } = require('../controllers/accountsController');
const { verifyToken } = require('../controllers/userController');

router.get('/', verifyToken, (req, res, next) => {
    console.log('GET /api/accounts hit', req.query, req.user);
    next();
}, getConnectedAccounts);

// DELETE /api/accounts/:id
router.delete('/:id', verifyToken, deleteConnectedAccount);

module.exports = router;
