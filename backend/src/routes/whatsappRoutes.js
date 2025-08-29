import express from 'express';
import {
    sendManualLedger,
    toggleAutoSend,
    validateWhatsAppNumber,
    getAccountStatus
} from '../controllers/whatsappController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Send manual ledger to client
router.post('/send-ledger/:clientId', authorize(['superadmin', 'admin']), sendManualLedger);

// Toggle auto-send for client
router.patch('/auto-send/:clientId', authorize(['superadmin', 'admin']), toggleAutoSend);

// Validate WhatsApp number
router.post('/validate-number', authorize(['superadmin', 'admin', 'subadmin']), validateWhatsAppNumber);

// Get WhatsApp account status
router.get('/account-status', authorize(['superadmin', 'admin']), getAccountStatus);

export default router;
