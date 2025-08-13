import Expense from '../models/Expense.js';
import mongoose from 'mongoose';

// Add Expense
export const addExpense = async (req, res) => {
    try {
        const {
            category,
            amount,
            description,
            employeeName,
            billNo,
            date,
        } = req.body;

        // Validate required fields
        if (!category || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: 'Category, amount, and description are required'
            });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        const expense = new Expense({
            category,
            amount: parseFloat(amount),
            description,
            employeeName,
            billNo,
            date: date ? new Date(date) : new Date(),
            createdBy: req.user.userId,
            companyId: req.user.currentSelectedCompany,
        });

        await expense.save();

        res.status(201).json({
            success: true,
            message: 'Expense added successfully',
            data: expense
        });

    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add expense',
            error: error.message
        });
    }
};

// Get Expenses
export const getExpenses = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            employeeName,
            startDate,
            endDate,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { companyId: req.user.currentSelectedCompany, };

        if (category) filter.category = new RegExp(category, 'i');
        if (employeeName) filter.employeeName = new RegExp(employeeName, 'i');

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [expenses, total] = await Promise.all([
            Expense.find(filter)
                .populate('createdBy', 'username name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Expense.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                expenses,
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
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses',
            error: error.message
        });
    }
};

// Get Expense by ID
export const getExpenseById = async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await Expense.findById(id)
            .populate('createdBy', 'username name');

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });

    } catch (error) {
        console.error('Get expense by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense',
            error: error.message
        });
    }
};

// Update Expense
export const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find the expense first
        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;

        const updatedExpense = await Expense.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username name');

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: updatedExpense
        });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense',
            error: error.message
        });
    }
};

// Delete Expense
export const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the expense first
        const expense = await Expense.findById(id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        await Expense.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete expense',
            error: error.message
        });
    }
};

// Get Expense Dashboard Stats
export const getExpenseDashboardStats = async (req, res) => {
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
            recentExpenses,
            topCategories
        ] = await Promise.all([
            // Today's expenses
            Expense.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly expenses
            Expense.aggregate([
                { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Yearly expenses
            Expense.aggregate([
                { $match: { date: { $gte: startOfYear }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Category-wise breakdown (last 30 days)
            Expense.aggregate([
                { $match: { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]),

            // Recent expenses
            Expense.find({ companyId: req.user.currentSelectedCompany, })
                .populate('createdBy', 'username')
                .sort({ date: -1 })
                .limit(5),

            // Top spending categories (last 30 days)
            Expense.aggregate([
                { $match: { date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 5 }
            ])
        ]);

        res.json({
            success: true,
            data: {
                today: {
                    totalAmount: todayStats[0]?.totalAmount || 0,
                    count: todayStats[0]?.count || 0
                },
                monthly: {
                    totalAmount: monthlyStats[0]?.totalAmount || 0,
                    count: monthlyStats[0]?.count || 0
                },
                yearly: {
                    totalAmount: yearlyStats[0]?.totalAmount || 0,
                    count: yearlyStats[0]?.count || 0
                },
                categoryBreakdown: categoryStats,
                topCategories,
                recentExpenses
            }
        });

    } catch (error) {
        console.error('Expense dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense dashboard stats',
            error: error.message
        });
    }
};

// Get Expense Categories
export const getExpenseCategories = async (req, res) => {
    try {
        const categories = await Expense.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    lastUsed: { $max: '$date' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Get expense categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense categories',
            error: error.message
        });
    }
};

// Get Expense Summary by Date Range
export const getExpenseSummary = async (req, res) => {
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
                        day: { $dayOfMonth: '$date' }
                    }
                };
                break;
            case 'month':
                groupStage = {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    }
                };
                break;
            case 'year':
                groupStage = {
                    _id: {
                        year: { $year: '$date' }
                    }
                };
                break;
            case 'category':
                groupStage = {
                    _id: '$category'
                };
                break;
        }

        const summary = await Expense.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    ...groupStage,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: summary
        });

    } catch (error) {
        console.error('Get expense summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense summary',
            error: error.message
        });
    }
};

// Get Employee-wise Expense Analytics
export const getEmployeeExpenseAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        const analytics = await Expense.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: '$employeeName',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    maxAmount: { $max: '$amount' },
                    categories: { $addToSet: '$category' },
                    lastExpense: { $max: '$date' }
                }
            },
            {
                $addFields: {
                    categoriesCount: { $size: '$categories' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('Get employee expense analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee expense analytics',
            error: error.message
        });
    }
};

// Get Expense Trends for Charts
export const getExpenseTrends = async (req, res) => {
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

        const trends = await Expense.aggregate([
            { $match: { ...matchStage, companyId: req.user.currentSelectedCompany, } },
            {
                $group: {
                    _id: dateGroup,
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' },
                    categories: { $addToSet: '$category' }
                }
            },
            {
                $addFields: {
                    categoriesCount: { $size: '$categories' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } }
        ]);

        res.json({
            success: true,
            data: trends
        });

    } catch (error) {
        console.error('Get expense trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense trends',
            error: error.message
        });
    }
};

// Get Expense Comparison Analytics
export const getExpenseComparison = async (req, res) => {
    try {
        const { period1Start, period1End, period2Start, period2End } = req.query;

        if (!period1Start || !period1End || !period2Start || !period2End) {
            return res.status(400).json({
                success: false,
                message: 'Both period start and end dates are required'
            });
        }

        const [period1Data, period2Data] = await Promise.all([
            Expense.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(period1Start),
                            $lte: new Date(period1End)
                        }, companyId: req.user.currentSelectedCompany,
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' },
                        categories: { $addToSet: '$category' }
                    }
                }
            ]),
            Expense.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(period2Start),
                            $lte: new Date(period2End)
                        }, companyId: req.user.currentSelectedCompany,
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 },
                        avgAmount: { $avg: '$amount' },
                        categories: { $addToSet: '$category' }
                    }
                }
            ])
        ]);

        const period1 = period1Data[0] || { totalAmount: 0, count: 0, avgAmount: 0, categories: [] };
        const period2 = period2Data[0] || { totalAmount: 0, count: 0, avgAmount: 0, categories: [] };

        const comparison = {
            period1: {
                ...period1,
                categoriesCount: period1.categories.length
            },
            period2: {
                ...period2,
                categoriesCount: period2.categories.length
            },
            changes: {
                totalAmount: period1.totalAmount - period2.totalAmount,
                count: period1.count - period2.count,
                avgAmount: period1.avgAmount - period2.avgAmount,
                categoriesCount: period1.categories.length - period2.categories.length
            },
            percentageChanges: {
                totalAmount: period2.totalAmount > 0 ? ((period1.totalAmount - period2.totalAmount) / period2.totalAmount * 100) : 0,
                count: period2.count > 0 ? ((period1.count - period2.count) / period2.count * 100) : 0,
                avgAmount: period2.avgAmount > 0 ? ((period1.avgAmount - period2.avgAmount) / period2.avgAmount * 100) : 0
            }
        };

        res.json({
            success: true,
            data: comparison
        });

    } catch (error) {
        console.error('Get expense comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expense comparison',
            error: error.message
        });
    }
};
