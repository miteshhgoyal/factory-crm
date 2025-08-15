// backend/src/controllers/clientLedgerController.js
import Stock from '../models/Stock.js';
import Client from '../models/Client.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';

// Get Client Ledger with pagination and filters
export const getClientLedger = async (req, res) => {
    try {
        const { clientId } = req.params;
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate,
            transactionType,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Verify client exists
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Build filter object
        const filter = {
            companyId: req.user.currentSelectedCompany,
            clientId: clientId,
        };

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Transaction type filter
        if (transactionType && transactionType !== 'all') {
            filter.type = transactionType.toUpperCase();
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        // Fetch ledger entries and total count
        const [ledgerEntries, total] = await Promise.all([
            Stock.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate({
                    path: 'clientId',
                    select: 'name phone address type currentBalance'
                }),
            Stock.countDocuments(filter)
        ]);

        // Get all transactions for balance calculation (sorted by date ascending)
        const allTransactions = await Stock.find({
            companyId: req.user.currentSelectedCompany,
            clientId: clientId,
        }).sort({ date: 1, createdAt: 1 });

        // Calculate running balance for each transaction
        const processedEntries = [];
        let runningBalance = 0;

        for (let transaction of allTransactions) {
            // For customers: sales (OUT) increase receivables, purchases (IN) decrease receivables
            // For suppliers: purchases (IN) increase payables, sales (OUT) decrease payables
            if (client.type === 'Customer') {
                if (transaction.type === 'OUT') {
                    runningBalance += transaction.amount; // Customer owes us money
                } else {
                    runningBalance -= transaction.amount; // Customer paid us or we credited them
                }
            } else { // Supplier
                if (transaction.type === 'IN') {
                    runningBalance += transaction.amount; // We owe supplier money
                } else {
                    runningBalance -= transaction.amount; // We paid supplier or they credited us
                }
            }

            const entry = {
                _id: transaction._id,
                date: transaction.date,
                particulars: `${transaction.productName} - ${transaction.type === 'IN' ? 'Purchase' : 'Sale'}`,
                bags: transaction.bags?.count || 0,
                weight: transaction.quantity || 0,
                rate: transaction.rate,
                debitAmount: (client.type === 'Customer' && transaction.type === 'OUT') ||
                    (client.type === 'Supplier' && transaction.type === 'IN') ? transaction.amount : 0,
                creditAmount: (client.type === 'Customer' && transaction.type === 'IN') ||
                    (client.type === 'Supplier' && transaction.type === 'OUT') ? transaction.amount : 0,
                balance: runningBalance,
                transactionType: transaction.type,
                productName: transaction.productName,
                invoiceNo: transaction.invoiceNo,
                notes: transaction.notes,
                originalUnit: transaction.bags && transaction.bags.count > 0 ? 'bag' : 'kg'
            };

            processedEntries.push(entry);
        }

        // Filter processed entries for current page
        const sortedEntries = processedEntries
            .sort((a, b) => sortOrder === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

        const paginatedEntries = sortedEntries.slice(skip, skip + parseInt(limit));

        // Calculate summary statistics
        const summaryStats = await Stock.aggregate([
            { $match: { companyId: req.user.currentSelectedCompany, clientId: new mongoose.Types.ObjectId(clientId) } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    totalQuantity: { $sum: '$quantity' },
                    totalBags: { $sum: '$bags.count' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            totalDebit: summaryStats.find(s => s._id === 'OUT')?.totalAmount || 0,
            totalCredit: summaryStats.find(s => s._id === 'IN')?.totalAmount || 0,
            totalWeight: summaryStats.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
            totalBags: summaryStats.reduce((acc, s) => acc + (s.totalBags || 0), 0),
            purchaseCount: summaryStats.find(s => s._id === 'IN')?.count || 0,
            saleCount: summaryStats.find(s => s._id === 'OUT')?.count || 0
        };

        // Update client's current balance
        await Client.findByIdAndUpdate(clientId, { currentBalance: runningBalance });

        res.json({
            success: true,
            data: {
                client: { ...client.toObject(), currentBalance: runningBalance },
                entries: paginatedEntries,
                summary,
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

// Get Client Ledger Entry by ID
export const getLedgerEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        const ledgerEntry = await Stock.findById(id)
            .populate({
                path: 'clientId',
                select: 'name phone address type currentBalance'
            });

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        // Get client by name if clientId is not populated
        let client = ledgerEntry.clientId;
        if (!client && ledgerEntry.clientName) {
            client = await Client.findOne({
                name: ledgerEntry.clientName,
                companyId: req.user.currentSelectedCompany
            });
        }

        // Determine original unit
        const originalUnit = ledgerEntry.bags && ledgerEntry.bags.count > 0 ? 'bag' : 'kg';

        res.json({
            success: true,
            data: {
                ...ledgerEntry.toObject(),
                client,
                originalUnit
            }
        });

    } catch (error) {
        console.error('Get ledger entry by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ledger entry',
            error: error.message
        });
    }
};

// Update Client Ledger Entry
export const updateLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        // Get the original entry to check its unit type
        const originalEntry = await Stock.findById(id);
        if (!originalEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdAt;
        delete updateData._id;
        delete updateData.companyId;
        delete updateData.createdBy;
        delete updateData.originalUnit;

        // Handle unit conversions and validations
        const wasOriginallyInBags = originalEntry.bags && originalEntry.bags.count > 0;

        if (wasOriginallyInBags) {
            // If originally in bags, maintain bag structure
            if (updateData.bags && updateData.bags.count && updateData.bags.weight) {
                updateData.quantity = updateData.bags.count * updateData.bags.weight;
                updateData.unit = 'kg'; // Always store in kg internally
            }
        } else {
            // If originally in kg, remove bag data
            delete updateData.bags;
            updateData.unit = 'kg';
        }

        // Recalculate amount
        if (updateData.quantity && updateData.rate) {
            updateData.amount = updateData.quantity * updateData.rate;
        } else if (updateData.rate) {
            updateData.amount = originalEntry.quantity * updateData.rate;
        } else if (updateData.quantity) {
            updateData.amount = updateData.quantity * originalEntry.rate;
        }

        const ledgerEntry = await Stock.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        // Update client balance after modification
        if (ledgerEntry.clientId) {
            await updateClientBalance(ledgerEntry.clientId);
        }

        if (req.user.role !== 'superadmin') {
            await createNotification(
                `Client Ledger Entry Updated by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'Stock',
                ledgerEntry._id
            );
        }

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

// Delete Client Ledger Entry
export const deleteLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        const ledgerEntry = await Stock.findById(id);

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        const clientId = ledgerEntry.clientId;
        await Stock.findByIdAndDelete(id);

        // Update client balance after deletion
        if (clientId) {
            await updateClientBalance(clientId);
        }

        if (req.user.role !== 'superadmin') {
            await createNotification(
                `Client Ledger Entry Deleted by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'Stock',
                ledgerEntry._id
            );
        }

        res.json({
            success: true,
            message: 'Ledger entry deleted successfully',
            data: ledgerEntry
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

// Helper function to update client balance
const updateClientBalance = async (clientId) => {
    try {
        const client = await Client.findById(clientId);
        if (!client) return;

        // Get all transactions for this client in chronological order
        const transactions = await Stock.find({ clientId }).sort({ date: 1, createdAt: 1 });

        let balance = 0;
        for (let transaction of transactions) {
            if (client.type === 'Customer') {
                if (transaction.type === 'OUT') {
                    balance += transaction.amount; // Customer owes us money
                } else {
                    balance -= transaction.amount; // Customer paid us or we credited them
                }
            } else { // Supplier
                if (transaction.type === 'IN') {
                    balance += transaction.amount; // We owe supplier money
                } else {
                    balance -= transaction.amount; // We paid supplier or they credited us
                }
            }
        }

        await Client.findByIdAndUpdate(clientId, { currentBalance: balance });
    } catch (error) {
        console.error('Error updating client balance:', error);
    }
};

// Get Client Ledger Dashboard Stats
export const getClientLedgerStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [monthlyStats, yearlyStats, topClients] = await Promise.all([
            // Monthly statistics
            Stock.aggregate([
                {
                    $match: {
                        date: { $gte: startOfMonth },
                        companyId: req.user.currentSelectedCompany
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        totalQuantity: { $sum: '$quantity' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Yearly statistics
            Stock.aggregate([
                {
                    $match: {
                        date: { $gte: startOfYear },
                        companyId: req.user.currentSelectedCompany
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        totalQuantity: { $sum: '$quantity' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Top clients by transaction volume
            Stock.aggregate([
                {
                    $match: {
                        date: { $gte: startOfMonth },
                        companyId: req.user.currentSelectedCompany
                    }
                },
                {
                    $group: {
                        _id: '$clientName',
                        totalAmount: { $sum: '$amount' },
                        purchaseAmount: {
                            $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$amount', 0] }
                        },
                        saleAmount: {
                            $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$amount', 0] }
                        },
                        transactionCount: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 5 }
            ])
        ]);

        const stats = {
            monthly: {
                totalPurchases: monthlyStats.find(s => s._id === 'IN')?.totalAmount || 0,
                totalSales: monthlyStats.find(s => s._id === 'OUT')?.totalAmount || 0,
                totalWeight: monthlyStats.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
                purchaseCount: monthlyStats.find(s => s._id === 'IN')?.count || 0,
                saleCount: monthlyStats.find(s => s._id === 'OUT')?.count || 0
            },
            yearly: {
                totalPurchases: yearlyStats.find(s => s._id === 'IN')?.totalAmount || 0,
                totalSales: yearlyStats.find(s => s._id === 'OUT')?.totalAmount || 0,
                totalWeight: yearlyStats.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
                purchaseCount: yearlyStats.find(s => s._id === 'IN')?.count || 0,
                saleCount: yearlyStats.find(s => s._id === 'OUT')?.count || 0
            },
            topClients
        };

        stats.monthly.totalTransactions = stats.monthly.totalPurchases + stats.monthly.totalSales;
        stats.yearly.totalTransactions = stats.yearly.totalPurchases + stats.yearly.totalSales;

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Client ledger stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client ledger stats',
            error: error.message
        });
    }
};
