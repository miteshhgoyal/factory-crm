import express from 'express';
import {
    allocateBudget,
    getManagerExpenses,
    reconcileManagerExpenses,
    getManagerDashboardStats
} from '../controllers/managerController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticateToken);

// Allocate budget (superadmin only)
router.post('/allocate', authorize(['superadmin']), allocateBudget);

// Get manager expenses
router.get('/:managerId/expenses', authorize(['superadmin', 'admin']), getManagerExpenses);

// Reconcile expenses (superadmin only)
router.post('/:managerId/reconcile', authorize(['superadmin']), reconcileManagerExpenses);

// Dashboard stats
router.get('/dashboard/stats', authorize(['superadmin', 'admin']), getManagerDashboardStats);

export default router;
