import ClientLedger from '../models/ClientLedger.js';
import Client from '../models/Client.js';
import mongoose from 'mongoose';

// Add Ledger Entry
export const addLedgerEntry = async (req, res) => {
    try {
        const {
            clientId,
            date,
            particulars,
            bags,
            weight,
            rate,
            debitAmount,
            creditAmount
        } = req.body;

        // Validate required fields
        if (!clientId || !particulars) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and particulars are required'
            });
        }

        // Check if client exists
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Get the last balance for this client
        const lastEntry = await ClientLedger.findOne({ clientId })
            .sort({ createdAt: -1 });

        const previousBalance = lastEntry ? lastEntry.balance : 0;
        const newBalance = previousBalance + (debitAmount || 0) - (creditAmount || 0);

        const ledgerEntry = new ClientLedger({
            clientId,
            date: date ? new Date(date) : new Date(),
            particulars,
            bags: bags || 0,
            weight: weight || 0,
            rate: rate || 0,
            debitAmount: debitAmount || 0,
            creditAmount: creditAmount || 0,
            balance: newBalance,
            createdBy: req.user.userId
        });

        await ledgerEntry.save();

        // Update client's current balance
        await Client.findByIdAndUpdate(clientId, { currentBalance: newBalance });

        const populatedEntry = await ClientLedger.findById(ledgerEntry._id)
            .populate('clientId', 'name type')
            .populate('createdBy', 'username name');

        res.status(201).json({
            success: true,
            message: 'Ledger entry added successfully',
            data: populatedEntry
        });

    } catch (error) {
        console.error('Add ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add ledger entry',
            error: error.message
        });
    }
};

// Get Client Ledger
export const getClientLedger = async (req, res) => {
    try {
        const { clientId } = req.params;
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { clientId };

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [entries, total, client] = await Promise.all([
            ClientLedger.find(filter)
                .populate('createdBy', 'username name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            ClientLedger.countDocuments(filter),
            Client.findById(clientId)
        ]);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Calculate summary
        const summary = await ClientLedger.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalDebit: { $sum: '$debitAmount' },
                    totalCredit: { $sum: '$creditAmount' },
                    totalBags: { $sum: '$bags' },
                    totalWeight: { $sum: '$weight' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                client,
                entries,
                summary: summary[0] || {
                    totalDebit: 0,
                    totalCredit: 0,
                    totalBags: 0,
                    totalWeight: 0
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get client ledger error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client ledger',
            error: error.message
        });
    }
};

// Update Ledger Entry
export const updateLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Only superadmin can update ledger entries
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can update ledger entries'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.balance; // Balance will be recalculated

        const ledgerEntry = await ClientLedger.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('clientId', 'name type')
            .populate('createdBy', 'username name');

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        // Recalculate balances for all entries after this one
        await recalculateClientBalance(ledgerEntry.clientId._id);

        res.json({
            success: true,
            message: 'Ledger entry updated successfully',
            data: ledgerEntry
        });

    } catch (error) {
        console.error('Update ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ledger entry',
            error: error.message
        });
    }
};

// Delete Ledger Entry
export const deleteLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;

        // Only superadmin can delete ledger entries
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete ledger entries'
            });
        }

        const ledgerEntry = await ClientLedger.findById(id);
        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        const clientId = ledgerEntry.clientId;
        await ClientLedger.findByIdAndDelete(id);

        // Recalculate client balance
        await recalculateClientBalance(clientId);

        res.json({
            success: true,
            message: 'Ledger entry deleted successfully'
        });

    } catch (error) {
        console.error('Delete ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ledger entry',
            error: error.message
        });
    }
};

// Helper function to recalculate client balance
const recalculateClientBalance = async (clientId) => {
    const entries = await ClientLedger.find({ clientId }).sort({ createdAt: 1 });

    let balance = 0;
    for (const entry of entries) {
        balance += (entry.debitAmount || 0) - (entry.creditAmount || 0);
        await ClientLedger.findByIdAndUpdate(entry._id, { balance });
    }

    // Update client's current balance
    await Client.findByIdAndUpdate(clientId, { currentBalance: balance });
};
