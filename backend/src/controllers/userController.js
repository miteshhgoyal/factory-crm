import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get all users (superadmin only)
export const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can view all users'
            });
        }

        const users = await User.find({ _id: { $ne: req.user.userId } })
            .select('-password')
            .populate('createdBy', 'username name')
            .sort({ date: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        if (!['superadmin', 'admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        const { name, username, email, phone, password, role, permissions } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Role restrictions
        if (req.user.role === 'admin' && role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admins cannot create other admins'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
            role,
            permissions: permissions || [],
            createdBy: req.user.userId
        });

        await newUser.save();

        const userResponse = await User.findById(newUser._id)
            .select('-password')
            .populate('createdBy', 'username name');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// Update user (superadmin only)
export const updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can update users'
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        delete updateData.password;
        delete updateData.createdBy;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password').populate('createdBy', 'username name');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
};

// Delete user (superadmin only)
export const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete users'
            });
        }

        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};
