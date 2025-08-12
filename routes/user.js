const express = require("express");
const router = express.Router();
const { 
    registerUser, 
    loginUser,
    verifyToken,
    getUserProfile
} = require("../controllers/userController");

// Routes for user authentication
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.get("/profile", verifyToken, getUserProfile);

module.exports = router;
