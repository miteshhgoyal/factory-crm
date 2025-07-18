import express from 'express';
import {
    addCashIn,
    addCashOut,
    getCashFlowTransactions,
    getCashFlowDashboardStats,
    updateCashFlowTransaction,
    deleteCashFlowTransaction,
    getCashFlowSummary
} from '../controllers/cashFlowController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All cash flow routes require authentication
router.use(authenticateToken);

// Cash In - Add new cash inflow
router.post('/in', authorize(['superadmin', 'admin', 'subadmin']), addCashIn);

// Cash Out - Record cash outflow
router.post('/out', authorize(['superadmin', 'admin', 'subadmin']), addCashOut);

// Get cash flow transactions with pagination and filters
router.get('/transactions', authorize(['superadmin', 'admin', 'subadmin']), getCashFlowTransactions);

// Get cash flow dashboard statistics
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getCashFlowDashboardStats);

// Get cash flow summary by date range
router.get('/summary', authorize(['superadmin', 'admin', 'subadmin']), getCashFlowSummary);

// Update cash flow transaction (superadmin only)
router.put('/transaction/:id', authorize(['superadmin']), updateCashFlowTransaction);

// Delete cash flow transaction (superadmin only)
router.delete('/transaction/:id', authorize(['superadmin']), deleteCashFlowTransaction);

export default router;
