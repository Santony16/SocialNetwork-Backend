const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// JWT Secret (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Registrar nuevo usuario
const registerUser = async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validaciones básicas
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Encriptar la contraseña
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear el usuario
        const newUser = await User.create({
            username,
            email,
            password_hash,
            two_factor_enabled: false
        });

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: newUser.id, 
                username: newUser.username,
                email: newUser.email 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                created_at: newUser.created_at
            },
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

// Iniciar sesión
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Buscar usuario por email
        const user = await User.findOne({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                email: user.email 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                two_factor_enabled: user.two_factor_enabled
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['id', 'username', 'email', 'two_factor_enabled', 'created_at']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyToken,
    getUserProfile
};
