import Stock from '../models/Stock.js';
import CashFlow from '../models/CashFlow.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Expense from '../models/Expense.js';
import Client from '../models/Client.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Stock Statistics
        const stockStats = await Promise.all([
            Stock.aggregate([
                { $match: { type: 'IN', date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, totalIn: { $sum: '$amount' }, quantityIn: { $sum: '$quantity' } } }
            ]),
            Stock.aggregate([
                { $match: { type: 'OUT', date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, totalOut: { $sum: '$amount' }, quantityOut: { $sum: '$quantity' } } }
            ]),
            Stock.aggregate([
                { $group: { _id: '$productName', totalStock: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }] } } } },
                { $match: { totalStock: { $gt: 0 } } }
            ])
        ]);

        // Cash Flow Statistics
        const cashStats = await Promise.all([
            CashFlow.aggregate([
                { $match: { type: 'IN', date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, totalCashIn: { $sum: '$amount' } } }
            ]),
            CashFlow.aggregate([
                { $match: { type: 'OUT', date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, totalCashOut: { $sum: '$amount' } } }
            ]),
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: '$type', total: { $sum: '$amount' } } }
            ])
        ]);

        // Employee & Attendance Statistics
        const employeeStats = await Promise.all([
            Employee.countDocuments({ isActive: true }),
            Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, isPresent: true }),
            Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, isPresent: false })
        ]);

        // Expense Statistics
        const expenseStats = await Promise.all([
            Expense.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Client Statistics
        const clientStats = await Promise.all([
            Client.countDocuments({ isActive: true }),
            Client.aggregate([
                { $match: { currentBalance: { $gt: 0 } } },
                { $group: { _id: null, totalOutstanding: { $sum: '$currentBalance' } } }
            ])
        ]);

        // Recent Activities
        const recentActivities = await Promise.all([
            Stock.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username'),
            CashFlow.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username'),
            Expense.find().sort({ createdAt: -1 }).limit(5).populate('createdBy', 'username')
        ]);

        // Format response
        const dashboardData = {
            stock: {
                todayIn: stockStats[0][0]?.totalIn || 0,
                todayOut: stockStats[1][0]?.totalOut || 0,
                todayQuantityIn: stockStats[0][0]?.quantityIn || 0,
                todayQuantityOut: stockStats[1][0]?.quantityOut || 0,
                totalProducts: stockStats[2].length || 0,
                lowStockProducts: stockStats[2].filter(item => item.totalStock < 100).length || 0
            },
            cash: {
                todayIn: cashStats[0][0]?.totalCashIn || 0,
                todayOut: cashStats[1][0]?.totalCashOut || 0,
                monthlyFlow: cashStats[2].reduce((acc, curr) => {
                    acc[curr._id] = curr.total;
                    return acc;
                }, { IN: 0, OUT: 0 })
            },
            employees: {
                total: employeeStats[0] || 0,
                presentToday: employeeStats[1] || 0,
                absentToday: employeeStats[2] || 0
            },
            expenses: {
                todayTotal: expenseStats[0][0]?.totalExpenses || 0,
                monthlyByCategory: expenseStats[1] || []
            },
            clients: {
                total: clientStats[0] || 0,
                totalOutstanding: clientStats[1][0]?.totalOutstanding || 0
            },
            recentActivities: {
                stock: recentActivities[0] || [],
                cashFlow: recentActivities[1] || [],
                expenses: recentActivities[2] || []
            }
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};

// Get recent activities
export const getRecentActivities = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const activities = await Promise.all([
            Stock.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .populate('createdBy', 'username')
                .lean(),
            CashFlow.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .populate('createdBy', 'username')
                .lean(),
            Expense.find()
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .populate('createdBy', 'username')
                .lean()
        ]);

        // Combine and sort all activities
        const allActivities = [
            ...activities[0].map(item => ({ ...item, type: 'stock' })),
            ...activities[1].map(item => ({ ...item, type: 'cash' })),
            ...activities[2].map(item => ({ ...item, type: 'expense' }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: allActivities
        });

    } catch (error) {
        console.error('Recent activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
};

// Get quick stats for cards
export const getQuickStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const quickStats = await Promise.all([
            // Today's cash flow
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                { $group: { _id: '$type', total: { $sum: '$amount' } } }
            ]),
            // Active employees
            Employee.countDocuments({ isActive: true }),
            // Today's attendance
            Attendance.countDocuments({ date: { $gte: startOfDay, $lte: endOfDay }, isPresent: true }),
            // Total clients
            Client.countDocuments({ isActive: true })
        ]);

        const cashFlow = quickStats[0].reduce((acc, curr) => {
            acc[curr._id] = curr.total;
            return acc;
        }, { IN: 0, OUT: 0 });

        res.json({
            success: true,
            data: {
                cashIn: cashFlow.IN || 0,
                cashOut: cashFlow.OUT || 0,
                netCash: (cashFlow.IN || 0) - (cashFlow.OUT || 0),
                totalEmployees: quickStats[1] || 0,
                presentToday: quickStats[2] || 0,
                totalClients: quickStats[3] || 0
            }
        });

    } catch (error) {
        console.error('Quick stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quick statistics',
            error: error.message
        });
    }
};
