import express from 'express';
import {
    addStockIn,
    addStockOut,
    getStockTransactions,
    getStockBalance,
    getStockDashboardStats,
    getProductList,
    getStockTransactionById,
    updateStockTransaction,
    deleteStockTransaction,
    createProductionReport,
    updateProductionReport,
    getProductionReportByStockId,
    getProductionReports,
    deleteProductionReport
} from '../controllers/stockController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All stock routes require authentication
router.use(authenticateToken);

// Stock In - Add new stock
router.post('/in', authorize(['superadmin', 'admin', 'subadmin']), addStockIn);

// Stock Out - Record stock out
router.post('/out', authorize(['superadmin', 'admin', 'subadmin']), addStockOut);

// Get stock transactions with pagination and filters
router.get('/transactions', authorize(['superadmin', 'admin', 'subadmin']), getStockTransactions);

// Get stock balance by product
router.get('/balance', authorize(['superadmin', 'admin', 'subadmin']), getStockBalance);

// Get stock dashboard statistics
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getStockDashboardStats);

// Get product list
router.get('/products', authorize(['superadmin', 'admin', 'subadmin']), getProductList);

// Get single stock transaction
router.get('/transaction/:id', authorize(['superadmin', 'admin', 'subadmin']), getStockTransactionById);

// Update stock transaction (superadmin only)
router.put('/transaction/:id', authorize(['superadmin']), updateStockTransaction);

// Delete stock transaction (superadmin only)
router.delete('/transaction/:id', authorize(['superadmin']), deleteStockTransaction);

// Production Report Routes
// Create production report for a stock transaction
router.post('/production-report/:stockTransactionId', authorize(['superadmin', 'admin', 'subadmin']), createProductionReport);

// Update production report
router.put('/production-report/:id', authorize(['superadmin', 'admin', 'subadmin']), updateProductionReport);

// Get production report by stock transaction ID
router.get('/production-report/stock/:stockTransactionId', authorize(['superadmin', 'admin', 'subadmin']), getProductionReportByStockId);

// Get all production reports
router.get('/production-reports', authorize(['superadmin', 'admin', 'subadmin']), getProductionReports);

// Delete production report (superadmin only)
router.delete('/production-report/:id', authorize(['superadmin']), deleteProductionReport);

export default router;
