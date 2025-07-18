import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// Get all users (superadmin only)
router.get('/', authorize(['superadmin']), getAllUsers);

// Create new user
router.post('/', authorize(['superadmin', 'admin']), createUser);

// Update user (superadmin only)
router.put('/:id', authorize(['superadmin']), updateUser);

// Delete user (superadmin only)
router.delete('/:id', authorize(['superadmin']), deleteUser);

export default router;
