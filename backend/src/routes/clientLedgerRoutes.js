// backend/src/routes/clientLedgerRoutes.js
import express from 'express';
import {
    getClientLedger,
    getLedgerEntryById,
    updateLedgerEntry,
    deleteLedgerEntry,
    getClientLedgerStats
} from '../controllers/clientLedgerController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get client ledger stats
router.get('/stats', authorize(['superadmin', 'admin', 'subadmin']), getClientLedgerStats);

// Get client ledger entries with pagination and filters
router.get('/:clientId', authorize(['superadmin', 'admin', 'subadmin']), getClientLedger);

// Get ledger entry by ID
router.get('/entry/:id', authorize(['superadmin', 'admin', 'subadmin']), getLedgerEntryById);

// Update ledger entry
router.put('/entry/:id', authorize(['superadmin', 'admin']), updateLedgerEntry);

// Delete ledger entry
router.delete('/entry/:id', authorize(['superadmin']), deleteLedgerEntry);

export default router;
