import Stock from '../models/Stock.js';
import CashFlow from '../models/CashFlow.js';
import Attendance from '../models/Attendance.js';
import Expense from '../models/Expense.js';
import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';

// Get Reports Dashboard Stats
export const getReportsDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            stockStats,
            cashFlowStats,
            attendanceStats,
            expenseStats,
            clientStats,
            employeeStats
        ] = await Promise.all([
            // Stock Statistics - Fixed: Separated $match and $group stages
            Stock.aggregate([
                {
                    $match: { companyId: req.user.currentSelectedCompany }
                },
                {
                    $group: {
                        _id: null,
                        totalStockValue: { $sum: { $multiply: ['$quantity', '$rate'] } },
                        totalProducts: { $sum: 1 },
                        totalQuantity: { $sum: '$quantity' },
                        inStock: { $sum: { $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0] } },
                        outStock: { $sum: { $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0] } },
                        avgRate: { $avg: '$rate' }
                    }
                }
            ]),

            // Cash Flow - Fixed: Moved companyId inside $match objects
            CashFlow.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: '$type',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: '$type',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        recentTransactions: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany } },
                            { $sort: { date: -1 } },
                            { $limit: 5 },
                            {
                                $project: {
                                    type: 1,
                                    amount: 1,
                                    category: 1,
                                    description: 1,
                                    paymentMode: 1,
                                    date: 1
                                }
                            }
                        ]
                    }
                }
            ]),

            // Attendance - Fixed: Moved companyId inside $match objects
            Attendance.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: null,
                                    totalMarked: { $sum: 1 },
                                    presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                                    totalHours: { $sum: '$hoursWorked' },
                                    avgHours: { $avg: '$hoursWorked' }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: null,
                                    totalMarked: { $sum: 1 },
                                    presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                                    totalHours: { $sum: '$hoursWorked' },
                                    avgHours: { $avg: '$hoursWorked' }
                                }
                            }
                        ]
                    }
                }
            ]),

            // Expense - Fixed: Moved companyId inside $match objects
            Expense.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: null,
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 },
                                    avgAmount: { $avg: '$amount' }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: null,
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 },
                                    avgAmount: { $avg: '$amount' }
                                }
                            }
                        ],
                        topCategories: [
                            { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany } },
                            {
                                $group: {
                                    _id: '$category',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { totalAmount: -1 } },
                            { $limit: 3 }
                        ]
                    }
                }
            ]),

            // Client balances - Fixed: Moved companyId inside $match
            Client.aggregate([
                { $match: { isActive: true, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalBalance: { $sum: '$currentBalance' },
                        positiveBalance: { $sum: { $cond: [{ $gt: ['$currentBalance', 0] }, '$currentBalance', 0] } },
                        negativeBalance: { $sum: { $cond: [{ $lt: ['$currentBalance', 0] }, '$currentBalance', 0] } }
                    }
                }
            ]),

            // Employee stats - Fixed: Moved companyId inside $match
            Employee.aggregate([
                { $match: { isActive: true, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: '$paymentType',
                        count: { $sum: 1 },
                        totalSalary: { $sum: { $ifNull: ['$basicSalary', '$hourlyRate'] } },
                        avgSalary: { $avg: { $ifNull: ['$basicSalary', '$hourlyRate'] } }
                    }
                }
            ])
        ]);

        // Format data
        const formatCashFlowData = (data) => {
            return data.reduce((acc, item) => {
                acc[item._id] = { amount: item.totalAmount, count: item.count };
                return acc;
            }, { IN: { amount: 0, count: 0 }, OUT: { amount: 0, count: 0 } });
        };

        const todayCashFlow = formatCashFlowData(cashFlowStats[0].today);
        const monthlyCashFlow = formatCashFlowData(cashFlowStats[0].monthly);

        res.json({
            success: true,
            data: {
                stock: {
                    ...stockStats[0] || { totalStockValue: 0, totalProducts: 0, totalQuantity: 0, inStock: 0, outStock: 0, avgRate: 0 },
                    netStock: (stockStats[0]?.inStock || 0) - (stockStats[0]?.outStock || 0)
                },
                cashFlow: {
                    today: {
                        ...todayCashFlow,
                        netFlow: todayCashFlow.IN.amount - todayCashFlow.OUT.amount,
                        transactions: cashFlowStats[0].recentTransactions
                    },
                    monthly: {
                        ...monthlyCashFlow,
                        netFlow: monthlyCashFlow.IN.amount - monthlyCashFlow.OUT.amount
                    }
                },
                attendance: {
                    today: {
                        ...attendanceStats[0].today[0] || { totalMarked: 0, presentCount: 0, totalHours: 0, avgHours: 0 },
                        attendanceRate: attendanceStats[0].today[0] ? Math.round((attendanceStats[0].today[0].presentCount / attendanceStats[0].today[0].totalMarked) * 100) : 0
                    },
                    monthly: {
                        ...attendanceStats[0].monthly[0] || { totalMarked: 0, presentCount: 0, totalHours: 0, avgHours: 0 },
                        attendanceRate: attendanceStats[0].monthly[0] ? Math.round((attendanceStats[0].monthly[0].presentCount / attendanceStats[0].monthly[0].totalMarked) * 100) : 0
                    }
                },
                expenses: {
                    today: expenseStats[0].today[0] || { totalAmount: 0, count: 0, avgAmount: 0 },
                    monthly: expenseStats[0].monthly[0] || { totalAmount: 0, count: 0, avgAmount: 0 },
                    topCategories: expenseStats[0].topCategories
                },
                clients: clientStats.reduce((acc, item) => {
                    acc[item._id] = {
                        count: item.count,
                        balance: item.totalBalance,
                        receivables: item.positiveBalance,
                        payables: Math.abs(item.negativeBalance)
                    };
                    return acc;
                }, { Customer: { count: 0, balance: 0, receivables: 0, payables: 0 }, Supplier: { count: 0, balance: 0, receivables: 0, payables: 0 } }),
                employees: {
                    total: employeeStats.reduce((sum, emp) => sum + emp.count, 0),
                    byType: employeeStats,
                    totalSalaryBudget: employeeStats.reduce((sum, emp) => sum + emp.totalSalary, 0)
                }
            }
        });

    } catch (error) {
        console.error('Reports dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports dashboard stats',
            error: error.message
        });
    }
};

export const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

        const [
            cashFlowTransactions,
            attendanceRecords,
            expenseRecords,
            stockTransactions
        ] = await Promise.all([
            CashFlow.find({ date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany })
                .populate('createdBy', 'username')
                .sort({ date: -1 }),

            Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany })
                .populate('employeeId', 'name employeeId')
                .populate('markedBy', 'username'),

            Expense.find({ date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany })
                .populate('createdBy', 'username'),

            Stock.find({ date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany })
                .populate('createdBy', 'username')
        ]);

        // Calculate summaries
        const cashFlowSummary = cashFlowTransactions.reduce(
            (acc, transaction) => {
                if (transaction.type === 'IN') {
                    acc.totalIncome += transaction.amount;
                    acc.incomeCount++;
                } else {
                    acc.totalExpense += transaction.amount;
                    acc.expenseCount++;
                }
                return acc;
            },
            { totalIncome: 0, totalExpense: 0, incomeCount: 0, expenseCount: 0 }
        );

        const attendanceSummary = attendanceRecords.reduce(
            (acc, record) => {
                acc.totalMarked++;
                if (record.isPresent) {
                    acc.presentCount++;
                    acc.totalHours += record.hoursWorked || 0;
                }
                return acc;
            },
            { totalMarked: 0, presentCount: 0, totalHours: 0 }
        );

        const expenseSummary = expenseRecords.reduce(
            (acc, expense) => {
                acc.totalAmount += expense.amount;
                acc.count++;
                return acc;
            },
            { totalAmount: 0, count: 0 }
        );

        const stockSummary = stockTransactions.reduce(
            (acc, stock) => {
                acc.totalValue += stock.amount;
                acc.totalQuantity += stock.quantity;
                acc.count++;
                if (stock.type === 'IN') {
                    acc.inQuantity += stock.quantity;
                } else {
                    acc.outQuantity += stock.quantity;
                }
                return acc;
            },
            { totalValue: 0, totalQuantity: 0, count: 0, inQuantity: 0, outQuantity: 0 }
        );

        res.json({
            success: true,
            data: {
                date: reportDate.toISOString().split('T')[0],
                summary: {
                    cashFlow: {
                        ...cashFlowSummary,
                        netFlow: cashFlowSummary.totalIncome - cashFlowSummary.totalExpense
                    },
                    attendance: {
                        ...attendanceSummary,
                        attendanceRate: attendanceSummary.totalMarked > 0 ? Math.round((attendanceSummary.presentCount / attendanceSummary.totalMarked) * 100) : 0
                    },
                    expenses: expenseSummary,
                    stock: stockSummary
                },
                transactions: {
                    cashFlow: cashFlowTransactions,
                    attendance: attendanceRecords,
                    expenses: expenseRecords,
                    stock: stockTransactions
                }
            }
        });

    } catch (error) {
        console.error('Daily report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate daily report',
            error: error.message
        });
    }
};

export const getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let weekStart, weekEnd;
        if (startDate && endDate) {
            weekStart = new Date(startDate);
            weekEnd = new Date(endDate);
        } else {
            const today = new Date();
            weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
            weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        }

        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);

        const [
            cashFlowTrends,
            attendanceTrends,
            expenseTrends,
            stockSummary
        ] = await Promise.all([
            CashFlow.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                            type: '$type'
                        },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]),

            Attendance.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),

            Expense.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),

            Stock.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        totalValue: { $sum: '$amount' },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                period: {
                    startDate: weekStart.toISOString().split('T')[0],
                    endDate: weekEnd.toISOString().split('T')[0]
                },
                trends: {
                    cashFlow: cashFlowTrends,
                    attendance: attendanceTrends,
                    expenses: expenseTrends
                },
                stock: stockSummary[0] || { totalTransactions: 0, totalValue: 0, totalQuantity: 0 }
            }
        });

    } catch (error) {
        console.error('Weekly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate weekly report',
            error: error.message
        });
    }
};

export const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const targetDate = new Date(year || new Date().getFullYear(), (month - 1) || new Date().getMonth(), 1);
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        const [
            cashFlowSummary,
            expenseSummary,
            attendanceSummary,
            clientSummary,
            stockSummary
        ] = await Promise.all([
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, companyId: req.user.currentSelectedCompany } },
                {
                    $facet: {
                        byType: [
                            {
                                $group: {
                                    _id: '$type',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        byCategory: [
                            {
                                $group: {
                                    _id: '$category',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { totalAmount: -1 } },
                            { $limit: 5 }
                        ],
                        byPaymentMode: [
                            {
                                $group: {
                                    _id: '$paymentMode',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),

            Expense.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, companyId: req.user.currentSelectedCompany } },
                {
                    $facet: {
                        total: [
                            {
                                $group: {
                                    _id: null,
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        byCategory: [
                            {
                                $group: {
                                    _id: '$category',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { totalAmount: -1 } }
                        ]
                    }
                }
            ]),

            Attendance.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: null,
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' },
                        avgHours: { $avg: '$hoursWorked' }
                    }
                }
            ]),

            Client.aggregate([
                { $match: { isActive: true, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalBalance: { $sum: '$currentBalance' },
                        positiveBalance: { $sum: { $cond: [{ $gt: ['$currentBalance', 0] }, '$currentBalance', 0] } },
                        negativeBalance: { $sum: { $cond: [{ $lt: ['$currentBalance', 0] }, '$currentBalance', 0] } }
                    }
                }
            ]),

            Stock.aggregate([
                { $match: { companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockValue: { $sum: '$amount' },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                period: {
                    month: targetDate.getMonth() + 1,
                    year: targetDate.getFullYear(),
                    monthName: targetDate.toLocaleDateString('en-US', { month: 'long' })
                },
                cashFlow: cashFlowSummary[0] || { byType: [], byCategory: [], byPaymentMode: [] },
                expenses: expenseSummary[0] || { total: [], byCategory: [] },
                attendance: {
                    ...attendanceSummary[0] || { totalMarked: 0, presentCount: 0, totalHours: 0, avgHours: 0 },
                    attendanceRate: attendanceSummary[0] ? Math.round((attendanceSummary[0].presentCount / attendanceSummary[0].totalMarked) * 100) : 0
                },
                clients: clientSummary,
                stock: stockSummary[0] || { totalProducts: 0, totalStockValue: 0, totalQuantity: 0 }
            }
        });

    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate monthly report',
            error: error.message
        });
    }
};

export const getYearlyReport = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

        const [
            monthlyTrends,
            yearlyTotals
        ] = await Promise.all([
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfYear, $lte: endOfYear }, companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: {
                            month: { $month: '$date' },
                            type: '$type'
                        },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.month': 1 } }
            ]),

            Promise.all([
                CashFlow.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear }, companyId: req.user.currentSelectedCompany } },
                    {
                        $group: {
                            _id: '$type',
                            totalAmount: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Expense.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear }, companyId: req.user.currentSelectedCompany } },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Attendance.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear }, companyId: req.user.currentSelectedCompany } },
                    {
                        $group: {
                            _id: null,
                            totalDays: { $sum: 1 },
                            presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                            totalHours: { $sum: '$hoursWorked' }
                        }
                    }
                ])
            ])
        ]);

        res.json({
            success: true,
            data: {
                year: targetYear,
                monthlyTrends,
                yearlyTotals: {
                    cashFlow: yearlyTotals[0],
                    expenses: yearlyTotals[1][0] || { totalAmount: 0, count: 0 },
                    attendance: yearlyTotals[2][0] || { totalDays: 0, presentDays: 0, totalHours: 0 }
                }
            }
        });

    } catch (error) {
        console.error('Yearly report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate yearly report',
            error: error.message
        });
    }
};
