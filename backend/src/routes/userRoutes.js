import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getAllCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getAvailableUsers,
    getMyAssignedCompanies
} from '../controllers/userController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User routes
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getAllUsers);
router.post('/', authorize(['superadmin', 'admin']), createUser);
router.put('/:id', authorize(['superadmin', 'admin', 'subadmin']), updateUser);
router.delete('/:id', authorize(['superadmin']), deleteUser);

// Company routes
router.get('/companies', authorize(['superadmin', 'admin', 'subadmin']), getAllCompanies);
router.post('/companies', authorize(['superadmin']), createCompany);
router.put('/companies/:id', authorize(['superadmin', 'admin']), updateCompany);
router.delete('/companies/:id', authorize(['superadmin']), deleteCompany);

// User assignment routes
router.get('/available-users', authorize(['superadmin', 'admin']), getAvailableUsers);
router.get('/my-assigned-companies', authorize(['admin', 'subadmin']), getMyAssignedCompanies);

export default router;
