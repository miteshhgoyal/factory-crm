import CashFlow from '../models/CashFlow.js';
import mongoose from 'mongoose';

// Add Cash In
export const addCashIn = async (req, res) => {
    try {
        const {
            amount,
            category,
            description,
            employeeName,
            paymentMode,
            transactionId,
            isOnline,
            notes
        } = req.body;

        // Validate required fields
        if (!amount || !category || !description || !paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category, description, and payment mode are required'
            });
        }

        // Check if user can create online transactions
        if (isOnline && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can create online transactions'
            });
        }

        const cashInTransaction = new CashFlow({
            type: 'IN',
            amount: parseFloat(amount),
            category,
            description,
            employeeName,
            paymentMode,
            transactionId,
            isOnline: isOnline || false,
            date: new Date(),
            createdBy: req.user.userId,
            notes
        });

        await cashInTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Cash in recorded successfully',
            data: cashInTransaction
        });

    } catch (error) {
        console.error('Cash In error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record cash in',
            error: error.message
        });
    }
};

// Add Cash Out
export const addCashOut = async (req, res) => {
    try {
        const {
            amount,
            category,
            description,
            employeeName,
            paymentMode,
            transactionId,
            isOnline,
            notes
        } = req.body;

        // Validate required fields
        if (!amount || !category || !description || !paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category, description, and payment mode are required'
            });
        }

        // Check if user can create online transactions
        if (isOnline && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can create online transactions'
            });
        }

        const cashOutTransaction = new CashFlow({
            type: 'OUT',
            amount: parseFloat(amount),
            category,
            description,
            employeeName,
            paymentMode,
            transactionId,
            isOnline: isOnline || false,
            date: new Date(),
            createdBy: req.user.userId,
            notes
        });

        await cashOutTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Cash out recorded successfully',
            data: cashOutTransaction
        });

    } catch (error) {
        console.error('Cash Out error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record cash out',
            error: error.message
        });
    }
};

// Get Cash Flow Transactions
export const getCashFlowTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            category,
            paymentMode,
            employeeName,
            startDate,
            endDate
        } = req.query;

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (category) filter.category = new RegExp(category, 'i');
        if (paymentMode) filter.paymentMode = paymentMode;
        if (employeeName) filter.employeeName = new RegExp(employeeName, 'i');

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            CashFlow.find(filter)
                .populate('createdBy', 'username name')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            CashFlow.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                transactions,
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
        console.error('Get cash flow transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow transactions',
            error: error.message
        });
    }
};

// Get Cash Flow Dashboard Stats
export const getCashFlowDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [
            todayStats,
            monthlyStats,
            yearlyStats,
            categoryStats,
            paymentModeStats,
            recentTransactions
        ] = await Promise.all([
            // Today's stats
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly stats
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Yearly stats
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfYear } } },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Category-wise breakdown (last 30 days)
            CashFlow.aggregate([
                { $match: { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { category: '$category', type: '$type' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 10 }
            ]),

            // Payment mode stats
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: '$paymentMode',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]),

            // Recent transactions
            CashFlow.find()
                .populate('createdBy', 'username')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        // Format stats
        const formatStats = (stats) => {
            return stats.reduce((acc, curr) => {
                acc[curr._id] = {
                    amount: curr.totalAmount,
                    count: curr.count
                };
                return acc;
            }, { IN: { amount: 0, count: 0 }, OUT: { amount: 0, count: 0 } });
        };

        const todayFormatted = formatStats(todayStats);
        const monthlyFormatted = formatStats(monthlyStats);
        const yearlyFormatted = formatStats(yearlyStats);

        res.json({
            success: true,
            data: {
                today: {
                    ...todayFormatted,
                    netCash: todayFormatted.IN.amount - todayFormatted.OUT.amount
                },
                monthly: {
                    ...monthlyFormatted,
                    netCash: monthlyFormatted.IN.amount - monthlyFormatted.OUT.amount
                },
                yearly: {
                    ...yearlyFormatted,
                    netCash: yearlyFormatted.IN.amount - yearlyFormatted.OUT.amount
                },
                categoryBreakdown: categoryStats,
                paymentModeBreakdown: paymentModeStats,
                recentTransactions
            }
        });

    } catch (error) {
        console.error('Cash flow dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow dashboard stats',
            error: error.message
        });
    }
};

// Update Cash Flow Transaction (Superadmin only)
export const updateCashFlowTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Only superadmin can update transactions
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can update cash flow transactions'
            });
        }

        const transaction = await CashFlow.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username name');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });

    } catch (error) {
        console.error('Update cash flow transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transaction',
            error: error.message
        });
    }
};

// Delete Cash Flow Transaction (Superadmin only)
export const deleteCashFlowTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        // Only superadmin can delete transactions
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete cash flow transactions'
            });
        }

        const transaction = await CashFlow.findByIdAndDelete(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Delete cash flow transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transaction',
            error: error.message
        });
    }
};

// Get Cash Flow Summary by Date Range
export const getCashFlowSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        // Group by time period
        let groupStage = {};
        switch (groupBy) {
            case 'day':
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' },
                        type: '$type'
                    }
                };
                break;
            case 'month':
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        type: '$type'
                    }
                };
                break;
            case 'year':
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        type: '$type'
                    }
                };
                break;
        }

        const summary = await CashFlow.aggregate([
            { $match: matchStage },
            {
                $group: {
                    ...groupStage,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Get cash flow summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow summary',
            error: error.message
        });
    }
};
