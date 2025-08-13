import express from 'express';
import {
    getDatabaseStats,
    clearDataModels,
    clearAllData,
    backupDatabase,
    exportCollection,
    importCollection,
} from '../controllers/databaseController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All database routes require authentication
router.use(authenticateToken);

// Get database statistics and overview
router.get('/stats', authorize(['superadmin']), getDatabaseStats);

// Clear specific data models
router.post('/clear-models', authorize(['superadmin']), clearDataModels);

// Clear all data from database
router.post('/clear-all', authorize(['superadmin']), clearAllData);

// Create database backup (export all data)
router.get('/backup', authorize(['superadmin']), backupDatabase);

// Export specific collection data
router.get('/export/:collection', authorize(['superadmin']), exportCollection);

// Import data to specific collection
router.post('/import/:collection', authorize(['superadmin']), importCollection);

export default router;
