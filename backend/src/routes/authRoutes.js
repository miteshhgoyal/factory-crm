import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

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

        // Find user by email or username and populate selectedCompany
        const user = await User.findOne({
            $or: [
                { email: userInput },
                { username: userInput }
            ]
        }).populate('selectedCompany', 'name');

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

        // Generate JWT token with role
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
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
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                selectedCompany: user.selectedCompany ? user.selectedCompany.name : 'Select Company'
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
            .populate('createdBy', 'username name')
            .populate('selectedCompany', 'name');

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
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                createdBy: user.createdBy,
                selectedCompany: user.selectedCompany?.name || 'Not Selected',
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

export default router;
