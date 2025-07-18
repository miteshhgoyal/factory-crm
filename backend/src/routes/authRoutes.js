import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, phone, password, role = 'subadmin' } = req.body;

        // Validate required fields
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    message: 'User with this email already exists'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    message: 'Username is already taken'
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedpass = await bcrypt.hash(password, salt);

        // Set default permissions based on role
        let defaultPermissions = [];
        switch (role) {
            case 'superadmin':
                defaultPermissions = ['read', 'write', 'edit', 'delete', 'manage_users', 'manage_stock', 'manage_finance', 'manage_employees', 'view_reports'];
                break;
            case 'admin':
                defaultPermissions = ['read', 'write', 'edit', 'manage_stock', 'manage_finance', 'manage_employees', 'view_reports'];
                break;
            case 'subadmin':
                defaultPermissions = ['read', 'write', 'manage_stock', 'manage_finance', 'manage_employees'];
                break;
            default:
                defaultPermissions = ['read'];
        }

        // Create new user
        const newUser = new User({
            name,
            username,
            email,
            phone,
            password: hashedpass,
            role,
            permissions: defaultPermissions,
            isActive: true
        });

        await newUser.save();

        // Generate JWT token with role and permissions
        const token = jwt.sign(
            {
                userId: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                permissions: newUser.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                permissions: newUser.permissions,
                isActive: newUser.isActive
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { userInput, password, rememberMe } = req.body;

        // Validate required fields
        if (!userInput || !password) {
            return res.status(400).json({
                message: 'Username/Email and password are required'
            });
        }

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: userInput },
                { username: userInput }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(400).json({
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set token expiration based on rememberMe
        const tokenExpiration = rememberMe ? '30d' : '7d';

        // Generate JWT token with role and permissions
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiration }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive,
                lastLogin: user.lastLogin
            },
            rememberMe
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

// Verify Token Route
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password')
            .populate('createdBy', 'username name');

        if (!user) {
            return res.status(400).json({
                valid: false,
                message: 'User not found'
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                valid: false,
                message: 'Account is deactivated'
            });
        }

        res.status(200).json({
            valid: true,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                createdBy: user.createdBy
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

export default router;
