import CashFlow from '../models/CashFlow.js';
import Client from '../models/Client.js';
import { createNotification } from './notificationController.js';

export const getCategories = async (req, res) => {
    try {
        const { type } = req.query; // 'IN' or 'OUT'

        let matchStage = { companyId: req.user.currentSelectedCompany };
        if (type) {
            matchStage.type = type;
        }

        const categories = await CashFlow.aggregate([
            { $match: matchStage },
            { $group: { _id: '$category' } },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, category: '$_id' } }
        ]);

        res.json({
            success: true,
            data: categories.map(cat => cat.category)
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
            error: error.message
        });
    }
};

export const addCashIn = async (req, res) => {
    try {
        const {
            amount,
            category,
            description,
            paymentMode,
            transactionId,
            notes,
            clientId,
            clientName,
            date
        } = req.body;

        // Validate required fields
        if (!amount || !category || !description || !paymentMode || !clientId) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category, description, client and payment mode are required'
            });
        }

        const cashInTransaction = new CashFlow({
            type: 'IN',
            amount: parseFloat(amount),
            category,
            description,
            paymentMode,
            transactionId,
            date: date,
            createdBy: req.user.userId,
            notes,
            clientId: clientId || null,
            clientName: clientName || '',
            companyId: req.user.currentSelectedCompany,
        });

        const client = await Client.findById(clientId);
        if (client) {
            client.currentBalance = client.currentBalance - amount;
            await client.save();
        }

        await cashInTransaction.save();

        if (req.user.role !== 'superadmin')
            await createNotification(`Cash In recorded by ${req.user.username} (${req.user.email}).`, req.user.userId, req.user.role, req.user.currentSelectedCompany, 'CashFlow', cashInTransaction._id);

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

export const addCashOut = async (req, res) => {
    try {
        const {
            amount,
            category,
            description,
            paymentMode,
            transactionId,
            notes,
            clientId,
            clientName,
            employeeName,
            employeeId,
            date
        } = req.body;

        // Validate required fields
        if (!amount || !category || !description || !paymentMode || !clientId) {
            return res.status(400).json({
                success: false,
                message: 'Amount, category, description, client and payment mode are required'
            });
        }

        const cashOutTransaction = new CashFlow({
            type: 'OUT',
            amount: parseFloat(amount),
            category,
            description,
            paymentMode,
            transactionId,
            date: date,
            createdBy: req.user.userId,
            notes,
            clientId: clientId || null,
            clientName: clientName || '',
            employeeName,
            employeeId,
            companyId: req.user.currentSelectedCompany
        });

        const client = await Client.findById(clientId);
        if (client) {
            client.currentBalance = client.currentBalance + amount;
            await client.save();
        }

        await cashOutTransaction.save();

        if (req.user.role !== 'superadmin')
            await createNotification(`Cash Out recorded by ${req.user.username} (${req.user.email}).`, req.user.userId, req.user.role, req.user.currentSelectedCompany, 'CashFlow', cashOutTransaction._id);

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
        const filter = { companyId: req.user.currentSelectedCompany, };
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

// Get single cash flow transaction
export const getCashFlowById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await CashFlow.findById(id)
            .populate('createdBy', 'username name');

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Get cash flow by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction',
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
                { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany, } },
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
                { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany, } },
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
                { $match: { date: { $gte: startOfYear }, companyId: req.user.currentSelectedCompany, } },
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
                { $match: { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, companyId: req.user.currentSelectedCompany, } },
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
                { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany, } },
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
            CashFlow.find({ companyId: req.user.currentSelectedCompany, })
                .populate('createdBy', 'username')
                .sort({ date: -1 })
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
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
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

// Get Cash Flow Summary with advanced filtering
export const getCashFlowSummaryAdvanced = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            groupBy = 'day',
            type,
            category,
            paymentMode
        } = req.query;

        let matchStage = {};

        // Date filtering
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        // Additional filters
        if (type) matchStage.type = type;
        if (category) matchStage.category = new RegExp(category, 'i');
        if (paymentMode) matchStage.paymentMode = paymentMode;

        // Group stage based on groupBy parameter
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
            case 'week':
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        week: { $week: '$date' },
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
            default:
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' },
                        type: '$type'
                    }
                };
        }

        const summary = await CashFlow.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    ...groupStage,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    maxAmount: { $max: '$amount' },
                    minAmount: { $min: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
        ]);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Get advanced cash flow summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow summary',
            error: error.message
        });
    }
};

// Get Payment Mode Analytics
export const getPaymentModeAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        if (type) matchStage.type = type;

        const analytics = await CashFlow.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: {
                        paymentMode: '$paymentMode',
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            {
                $group: {
                    _id: '$_id.paymentMode',
                    totalAmount: { $sum: '$totalAmount' },
                    totalCount: { $sum: '$count' },
                    avgAmount: { $avg: '$avgAmount' },
                    breakdown: {
                        $push: {
                            type: '$_id.type',
                            amount: '$totalAmount',
                            count: '$count'
                        }
                    }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get payment mode analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment mode analytics',
            error: error.message
        });
    }
};

// Get Category-wise Analytics
export const getCategoryAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        if (type) matchStage.type = type;

        const analytics = await CashFlow.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: {
                        category: '$category',
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    maxAmount: { $max: '$amount' },
                    minAmount: { $min: '$amount' },
                    lastTransaction: { $max: '$date' }
                }
            },
            {
                $group: {
                    _id: '$_id.category',
                    totalAmount: { $sum: '$totalAmount' },
                    totalCount: { $sum: '$count' },
                    inAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'IN'] }, '$totalAmount', 0]
                        }
                    },
                    outAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$totalAmount', 0]
                        }
                    },
                    breakdown: {
                        $push: {
                            type: '$_id.type',
                            amount: '$totalAmount',
                            count: '$count',
                            avgAmount: '$avgAmount'
                        }
                    },
                    lastTransaction: { $max: '$lastTransaction' }
                }
            },
            {
                $addFields: {
                    netAmount: { $subtract: ['$inAmount', '$outAmount'] }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get category analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category analytics',
            error: error.message
        });
    }
};

// Get Employee-wise Cash Flow Analytics
export const getEmployeeAnalytics = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        if (type) matchStage.type = type;

        const analytics = await CashFlow.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: {
                        employeeName: '$employeeName',
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    lastTransaction: { $max: '$date' }
                }
            },
            {
                $group: {
                    _id: '$_id.employeeName',
                    totalAmount: { $sum: '$totalAmount' },
                    totalCount: { $sum: '$count' },
                    inAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'IN'] }, '$totalAmount', 0]
                        }
                    },
                    outAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$totalAmount', 0]
                        }
                    },
                    breakdown: {
                        $push: {
                            type: '$_id.type',
                            amount: '$totalAmount',
                            count: '$count',
                            avgAmount: '$avgAmount'
                        }
                    },
                    lastTransaction: { $max: '$lastTransaction' }
                }
            },
            {
                $addFields: {
                    netAmount: { $subtract: ['$inAmount', '$outAmount'] }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get employee analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee analytics',
            error: error.message
        });
    }
};

// Get Cash Flow Trends (for charts/graphs)
export const getCashFlowTrends = async (req, res) => {
    try {
        const { startDate, endDate, interval = 'daily' } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        let dateGroup = {};
        switch (interval) {
            case 'hourly':
                dateGroup = {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' },
                    hour: { $hour: '$date' }
                };
                break;
            case 'daily':
                dateGroup = {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    day: { $dayOfMonth: '$date' }
                };
                break;
            case 'weekly':
                dateGroup = {
                    year: { $year: '$date' },
                    week: { $week: '$date' }
                };
                break;
            case 'monthly':
                dateGroup = {
                    year: { $year: '$date' },
                    month: { $month: '$date' }
                };
                break;
        }

        const trends = await CashFlow.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: {
                        ...dateGroup,
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: dateGroup,
                    inAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'IN'] }, '$totalAmount', 0]
                        }
                    },
                    outAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$totalAmount', 0]
                        }
                    },
                    inCount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'IN'] }, '$count', 0]
                        }
                    },
                    outCount: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.type', 'OUT'] }, '$count', 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    netAmount: { $subtract: ['$inAmount', '$outAmount'] },
                    totalTransactions: { $add: ['$inCount', '$outCount'] }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } }
        ]);

        res.json({
            success: true,
            data: trends
        });

    } catch (error) {
        console.error('Get cash flow trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cash flow trends',
            error: error.message
        });
    }
};

