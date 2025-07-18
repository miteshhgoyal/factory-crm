import express from 'express';
import {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
    getClientDashboardStats
} from '../controllers/clientController.js';
import {
    addLedgerEntry,
    getClientLedger,
    updateLedgerEntry,
    deleteLedgerEntry
} from '../controllers/clientLedgerController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All client routes require authentication
router.use(authenticateToken);

// Client routes
router.post('/', authorize(['superadmin', 'admin', 'subadmin']), createClient);
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getClients);
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getClientDashboardStats);
router.get('/:id', authorize(['superadmin', 'admin', 'subadmin']), getClientById);
router.put('/:id', authorize(['superadmin', 'admin', 'subadmin']), updateClient);
router.delete('/:id', authorize(['superadmin']), deleteClient);

// Client Ledger routes
router.post('/ledger', authorize(['superadmin', 'admin', 'subadmin']), addLedgerEntry);
router.get('/:clientId/ledger', authorize(['superadmin', 'admin', 'subadmin']), getClientLedger);
router.put('/ledger/:id', authorize(['superadmin']), updateLedgerEntry);
router.delete('/ledger/:id', authorize(['superadmin']), deleteLedgerEntry);

export default router;
