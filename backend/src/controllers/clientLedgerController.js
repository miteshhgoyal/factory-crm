import Stock from '../models/Stock.js';
import Client from '../models/Client.js';
import CashFlow from '../models/CashFlow.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';

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

        // Build filter object for stock transactions
        const stockFilter = {
            companyId: req.user.currentSelectedCompany,
            clientId: clientId,
        };

        // Build filter object for cash flow transactions
        const cashFlowFilter = {
            companyId: req.user.currentSelectedCompany,
            clientId: clientId,
        };

        // Date range filter
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);

            stockFilter.date = dateFilter;
            cashFlowFilter.date = dateFilter;
        }

        // Transaction type filter
        if (transactionType && transactionType !== 'all') {
            if (transactionType === 'stock') {
                cashFlowFilter._id = { $in: [] }; // Exclude cash flow
            } else if (transactionType === 'cash') {
                stockFilter._id = { $in: [] }; // Exclude stock
            } else {
                stockFilter.type = transactionType.toUpperCase();
                cashFlowFilter.type = transactionType.toUpperCase();
            }
        }

        // Fetch both stock and cash flow transactions
        const [stockTransactions, cashFlowTransactions] = await Promise.all([
            Stock.find(stockFilter)
                .populate({
                    path: 'clientId',
                    select: 'name phone address type currentBalance'
                }),
            CashFlow.find(cashFlowFilter)
                .populate('createdBy', 'username name')
        ]);

        // Combine and process all transactions
        const allTransactions = [];

        // Add stock transactions
        stockTransactions.forEach(transaction => {
            allTransactions.push({
                ...transaction.toObject(),
                transactionCategory: 'stock',
                sourceModel: 'Stock'
            });
        });

        // Add cash flow transactions
        cashFlowTransactions.forEach(transaction => {
            allTransactions.push({
                ...transaction.toObject(),
                transactionCategory: 'cash',
                sourceModel: 'CashFlow',
                productName: transaction.description, // Map description to productName for consistency
                particulars: transaction.description,
                quantity: null,
                rate: null,
                bags: null
            });
        });

        // Sort all transactions by date
        allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance for each transaction
        const processedEntries = [];
        let runningBalance = 0;

        for (let transaction of allTransactions) {
            let balanceChange = 0;
            let debitAmount = 0;
            let creditAmount = 0;

            if (transaction.transactionCategory === 'stock') {
                if (transaction.type === 'IN') {
                    debitAmount = transaction.amount;
                    balanceChange = -transaction.amount;
                } else {
                    creditAmount = transaction.amount;
                    balanceChange = transaction.amount;
                }
            } else {
                if (transaction.type === 'IN') {
                    creditAmount = transaction.amount;
                    balanceChange = -transaction.amount;
                } else {
                    debitAmount = transaction.amount;
                    balanceChange = transaction.amount;
                }
            }

            runningBalance += balanceChange;

            const entry = {
                _id: transaction._id,
                date: transaction.date,
                particulars: transaction.particulars || transaction.productName || transaction.description,
                bags: transaction.bags?.count || 0,
                weight: transaction.quantity || 0,
                rate: transaction.rate || 0,
                debitAmount: debitAmount,
                creditAmount: creditAmount,
                balance: runningBalance,
                transactionType: transaction.type,
                transactionCategory: transaction.transactionCategory,
                productName: transaction.productName || transaction.description,
                invoiceNo: transaction.invoiceNo || null,
                notes: transaction.notes,
                originalUnit: transaction.bags && transaction.bags.count > 0 ? 'bag' : 'kg',
                paymentMode: transaction.paymentMode || null,
                category: transaction.category || null,
                sourceModel: transaction.sourceModel
            };

            processedEntries.push(entry);
        }

        // Apply sorting
        const sortedEntries = processedEntries.sort((a, b) => {
            const aValue = sortBy === 'date' ? new Date(a.date) : a[sortBy];
            const bValue = sortBy === 'date' ? new Date(b.date) : b[sortBy];

            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });

        // Apply pagination
        const skip = (page - 1) * limit;
        const paginatedEntries = sortedEntries.slice(skip, skip + parseInt(limit));
        const total = sortedEntries.length;

        // Calculate summary statistics for both stock and cash flow
        const stockSummary = await Stock.aggregate([
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

        const cashFlowSummary = await CashFlow.aggregate([
            { $match: { companyId: req.user.currentSelectedCompany, clientId: new mongoose.Types.ObjectId(clientId) } },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            stock: {
                totalDebit: stockSummary.find(s => s._id === 'OUT')?.totalAmount || 0,
                totalCredit: stockSummary.find(s => s._id === 'IN')?.totalAmount || 0,
                totalWeight: stockSummary.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
                totalBags: stockSummary.reduce((acc, s) => acc + (s.totalBags || 0), 0),
                purchaseCount: stockSummary.find(s => s._id === 'IN')?.count || 0,
                saleCount: stockSummary.find(s => s._id === 'OUT')?.count || 0
            },
            cashFlow: {
                totalCashIn: cashFlowSummary.find(s => s._id === 'IN')?.totalAmount || 0,
                totalCashOut: cashFlowSummary.find(s => s._id === 'OUT')?.totalAmount || 0,
                cashInCount: cashFlowSummary.find(s => s._id === 'IN')?.count || 0,
                cashOutCount: cashFlowSummary.find(s => s._id === 'OUT')?.count || 0
            },
            // Combined totals
            totalDebit: (stockSummary.find(s => s._id === 'OUT')?.totalAmount || 0) +
                (client.type === 'Supplier' ? (cashFlowSummary.find(s => s._id === 'IN')?.totalAmount || 0) :
                    (cashFlowSummary.find(s => s._id === 'OUT')?.totalAmount || 0)),
            totalCredit: (stockSummary.find(s => s._id === 'IN')?.totalAmount || 0) +
                (client.type === 'Customer' ? (cashFlowSummary.find(s => s._id === 'IN')?.totalAmount || 0) :
                    (cashFlowSummary.find(s => s._id === 'OUT')?.totalAmount || 0)),
            totalWeight: stockSummary.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
            totalBags: stockSummary.reduce((acc, s) => acc + (s.totalBags || 0), 0),
            totalTransactions: sortedEntries.length
        };

        // Update client's current balance
        await Client.findByIdAndUpdate(clientId, { currentBalance: runningBalance });

        const data = {
            client: {
                ...client.toObject(), currentBalance: runningBalance
            },
            entries: sortedEntries,
            summary,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        }

        res.json({
            success: true,
            data
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
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        // Update client balance after modification
        if (ledgerEntry.clientId) {
            await updateClientBalanceWithCashFlow(ledgerEntry.clientId);
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
            if (transaction.type === 'OUT') {
                balance += transaction.amount;
            } else {
                balance -= transaction.amount;
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

// Get Cash Flow Entry by ID
export const getCashFlowEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cash flow entry ID'
            });
        }

        const cashFlowEntry = await CashFlow.findById(id)
            .populate('createdBy', 'username name')
            .populate('clientId', 'name phone address type currentBalance');

        if (!cashFlowEntry) {
            return res.status(404).json({
                success: false,
                message: 'Cash flow entry not found'
            });
        }

        res.json({
            success: true,
            data: cashFlowEntry
        });

    } catch (error) {
        console.error('Get cash flow entry by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow entry',
            error: error.message
        });
    }
};

// Update Cash Flow Entry
export const updateCashFlowEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cash flow entry ID'
            });
        }

        // Only superadmin can update cash flow entries
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can update cash flow entries'
            });
        }

        // Get the original entry
        const originalEntry = await CashFlow.findById(id);
        if (!originalEntry) {
            return res.status(404).json({
                success: false,
                message: 'Cash flow entry not found'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdAt;
        delete updateData._id;
        delete updateData.companyId;
        delete updateData.createdBy;

        // Convert amount to number
        if (updateData.amount) {
            updateData.amount = parseFloat(updateData.amount);
        }

        const cashFlowEntry = await CashFlow.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate('createdBy', 'username name')
            .populate('clientId', 'name phone address type currentBalance');

        // Update client balance after modification if clientId exists
        if (cashFlowEntry.clientId) {
            await updateClientBalanceWithCashFlow(cashFlowEntry.clientId._id);
        }

        if (req.user.role !== 'superadmin') {
            await createNotification(
                `Cash Flow Entry Updated by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'CashFlow',
                cashFlowEntry._id
            );
        }

        res.json({
            success: true,
            message: 'Cash flow entry updated successfully',
            data: cashFlowEntry
        });

    } catch (error) {
        console.error('Update cash flow entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cash flow entry',
            error: error.message
        });
    }
};

// Delete Cash Flow Entry
export const deleteCashFlowEntry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cash flow entry ID'
            });
        }

        // Only superadmin can delete cash flow entries
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete cash flow entries'
            });
        }

        const cashFlowEntry = await CashFlow.findById(id);

        if (!cashFlowEntry) {
            return res.status(404).json({
                success: false,
                message: 'Cash flow entry not found'
            });
        }

        const clientId = cashFlowEntry.clientId;
        await CashFlow.findByIdAndDelete(id);

        // Update client balance after deletion if clientId exists
        if (clientId) {
            await updateClientBalanceWithCashFlow(clientId);
        }

        if (req.user.role !== 'superadmin') {
            await createNotification(
                `Cash Flow Entry Deleted by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'CashFlow',
                cashFlowEntry._id
            );
        }

        res.json({
            success: true,
            message: 'Cash flow entry deleted successfully',
            data: cashFlowEntry
        });

    } catch (error) {
        console.error('Delete cash flow entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete cash flow entry',
            error: error.message
        });
    }
};

// Helper function to update client balance including cash flow transactions
const updateClientBalanceWithCashFlow = async (clientId) => {
    try {
        const client = await Client.findById(clientId);
        if (!client) return;

        // Get all stock transactions
        const stockTransactions = await Stock.find({ clientId }).sort({ date: 1, createdAt: 1 });
        // Get all cash flow transactions
        const cashFlowTransactions = await CashFlow.find({ clientId }).sort({ date: 1, createdAt: 1 });

        // Combine and sort all transactions by date
        const allTransactions = [];

        stockTransactions.forEach(transaction => {
            allTransactions.push({
                ...transaction.toObject(),
                transactionCategory: 'stock'
            });
        });

        cashFlowTransactions.forEach(transaction => {
            allTransactions.push({
                ...transaction.toObject(),
                transactionCategory: 'cash'
            });
        });

        // Sort by date
        allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        let balance = 0;
        for (let transaction of allTransactions) {
            if (transaction.transactionCategory === 'stock') {
                if (transaction.type === 'OUT') {
                    balance += transaction.amount;
                } else {
                    balance -= transaction.amount;
                }
            } else { // Cash flow transaction
                if (transaction.type === 'IN') {
                    balance -= transaction.amount;
                } else {
                    balance += transaction.amount;
                }
            }
        }

        await Client.findByIdAndUpdate(clientId, { currentBalance: balance });
    } catch (error) {
        console.error('Error updating client balance with cash flow:', error);
    }
};
