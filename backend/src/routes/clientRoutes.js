import express from 'express';
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
    restoreClient,
    getClientDashboardStats,
    bulkDeleteClients
} from '../controllers/clientController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';
import { upload } from '../services/cloudinary.js';

const router = express.Router();

// All client routes require authentication
router.use(authenticateToken);

// Create client with image upload
router.post('/',
    authorize(['superadmin', 'admin', 'subadmin']),
    upload.fields([
        { name: 'aadharCard', maxCount: 1 },
        { name: 'panCard', maxCount: 1 }
    ]),
    createClient
);

// Update client with image upload
router.put('/:id',
    authorize(['superadmin', 'admin', 'subadmin']),
    upload.fields([
        { name: 'aadharCard', maxCount: 1 },
        { name: 'panCard', maxCount: 1 }
    ]),
    updateClient
);

// Client routes
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getClients);
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getClientDashboardStats);

// Bulk operations
router.post('/bulk-delete', authorize(['superadmin']), bulkDeleteClients);

// Individual client routes
router.get('/:id', authorize(['superadmin', 'admin', 'subadmin']), getClientById);
router.delete('/:id', authorize(['superadmin', 'admin']), deleteClient);

// Client restoration
router.patch('/:id/restore', authorize(['superadmin']), restoreClient);

export default router;
