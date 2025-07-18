import express from 'express';
import { getDashboardStats, getRecentActivities, getQuickStats } from '../controllers/dashboardController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard statistics (admin roles only)
router.get('/stats', authorize(['superadmin', 'admin', 'subadmin']), getDashboardStats);

// Recent activities
router.get('/activities', authorize(['superadmin', 'admin', 'subadmin']), getRecentActivities);

// Quick stats for cards
router.get('/quick-stats', authorize(['superadmin', 'admin', 'subadmin']), getQuickStats);

export default router;
