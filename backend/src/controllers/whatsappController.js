import whatsifyService from '../services/whatsifyService.js';
import schedulerService from '../services/schedulerService.js';
import Client from '../models/Client.js';

// Send manual ledger
export const sendManualLedger = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { startDate, endDate, monthYear, year, transactionType } = req.body;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'Client ID is required'
            });
        }

        // Build filters
        const filters = {};
        if (startDate && endDate) {
            filters.startDate = startDate;
            filters.endDate = endDate;
        } else if (monthYear) {
            filters.monthYear = monthYear;
        } else if (year) {
            filters.year = year;
        }

        if (transactionType && transactionType !== 'all') {
            filters.transactionType = transactionType;
        }

        // Send ledger
        const result = await schedulerService.manualSendLedger(clientId, filters, req.user.userId);

        if (result.success) {
            res.json({
                success: true,
                message: 'Ledger sent successfully via WhatsApp'
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to send ledger'
            });
        }

    } catch (error) {
        console.error('Manual ledger send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send ledger',
            error: error.message
        });
    }
};

// Toggle auto-send for client
export const toggleAutoSend = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { autoSendLedger } = req.body;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // If enabling auto-send, validate WhatsApp number first
        if (autoSendLedger) {
            const validation = await whatsifyService.validateNumber(client.phone);
            if (!validation.success || !validation.exists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or non-WhatsApp number. Please verify the client phone number.'
                });
            }
            client.whatsappVerified = true;
        }

        client.autoSendLedger = autoSendLedger;
        await client.save();

        res.json({
            success: true,
            message: `Auto-send ledger ${autoSendLedger ? 'enabled' : 'disabled'} for ${client.name}`,
            data: {
                clientId: client._id,
                autoSendLedger: client.autoSendLedger,
                whatsappVerified: client.whatsappVerified
            }
        });

    } catch (error) {
        console.error('Toggle auto-send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle auto-send',
            error: error.message
        });
    }
};

// Validate WhatsApp number
export const validateWhatsAppNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = await whatsifyService.validateNumber(phoneNumber);

        res.json({
            success: true,
            data: {
                phoneNumber,
                isValidWhatsApp: result.exists,
                message: result.exists ? 'Valid WhatsApp number' : 'Not a WhatsApp number'
            }
        });

    } catch (error) {
        console.error('WhatsApp validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate WhatsApp number',
            error: error.message
        });
    }
};

// Get WhatsApp account status
export const getAccountStatus = async (req, res) => {
    try {
        const result = await whatsifyService.getAccountStatus();

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.error
            });
        }

    } catch (error) {
        console.error('Account status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get account status',
            error: error.message
        });
    }
};
