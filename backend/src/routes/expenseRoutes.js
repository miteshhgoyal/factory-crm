import express from 'express';
import {
    addExpense,
    getExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseDashboardStats,
    getExpenseCategories,
    getExpenseSummary
} from '../controllers/expenseController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All expense routes require authentication
router.use(authenticateToken);

// Add expense
router.post('/', authorize(['superadmin', 'admin', 'subadmin']), addExpense);

// Get expenses with pagination and filters
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getExpenses);

// Get expense dashboard statistics
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getExpenseDashboardStats);

// Get expense categories
router.get('/categories', authorize(['superadmin', 'admin', 'subadmin']), getExpenseCategories);

// Get expense summary
router.get('/summary', authorize(['superadmin', 'admin', 'subadmin']), getExpenseSummary);

// Get expense by ID
router.get('/:id', authorize(['superadmin', 'admin', 'subadmin']), getExpenseById);

// Update expense (superadmin and admin only)
router.put('/:id', authorize(['superadmin']), updateExpense);

// Delete expense (superadmin and admin only)
router.delete('/:id', authorize(['superadmin']), deleteExpense);

export default router;
