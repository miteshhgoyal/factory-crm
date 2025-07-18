import express from 'express';
import {
    getReportsDashboardStats,
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getYearlyReport
} from '../controllers/reportsController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All reports routes require authentication
router.use(authenticateToken);

// Reports dashboard stats
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getReportsDashboardStats);

// Daily report
router.get('/daily', authorize(['superadmin', 'admin', 'subadmin']), getDailyReport);

// Weekly report
router.get('/weekly', authorize(['superadmin', 'admin', 'subadmin']), getWeeklyReport);

// Monthly report
router.get('/monthly', authorize(['superadmin', 'admin', 'subadmin']), getMonthlyReport);

// Yearly report
router.get('/yearly', authorize(['superadmin', 'admin', 'subadmin']), getYearlyReport);

export default router;
