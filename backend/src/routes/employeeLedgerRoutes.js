import express from 'express';
import {
    getEmployeeLedger,
    getLedgerEntryById,
    updateLedgerEntry,
    deleteLedgerEntry,
    getEmployeeLedgerStats
} from '../controllers/employeeLedgerController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get employee ledger stats
router.get('/stats', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeLedgerStats);

// Get all employee ledger entries with pagination and filters
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeLedger);

// Get ledger entry by ID
router.get('/:id', authorize(['superadmin', 'admin', 'subadmin']), getLedgerEntryById);

// Update ledger entry
router.put('/:id', authorize(['superadmin', 'admin']), updateLedgerEntry);

// Delete ledger entry
router.delete('/:id', authorize(['superadmin']), deleteLedgerEntry);

export default router;
