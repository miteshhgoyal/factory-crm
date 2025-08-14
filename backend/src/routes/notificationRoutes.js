import express from 'express';
import {
    getNotifications,
    getNotificationRecordDetails,
    deleteNotification,
    bulkDeleteNotifications,
    deleteOldNotifications,
    getAvailableCreators,
    getAvailableCompanies
} from '../controllers/notificationController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get notifications (superadmin and admin only)
router.get('/', authorize(['superadmin', 'admin']), getNotifications);

// Get record details for a notification (superadmin and admin only)
router.get('/record/:recordType/:recordId', authorize(['superadmin', 'admin']), getNotificationRecordDetails);

// Get available creators for filters (superadmin and admin only)
router.get('/creators', authorize(['superadmin', 'admin']), getAvailableCreators);

// Get available companies for filters (superadmin only)
router.get('/companies', authorize(['superadmin']), getAvailableCompanies);

// Delete single notification (superadmin only)
router.delete('/:id', authorize(['superadmin']), deleteNotification);

// Bulk delete notifications (superadmin only)
router.post('/bulk-delete', authorize(['superadmin']), bulkDeleteNotifications);

// Delete old notifications (superadmin only)
router.post('/delete-old', authorize(['superadmin']), deleteOldNotifications);

export default router;
