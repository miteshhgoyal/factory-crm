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
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [
            stockStats,
            cashFlowStats,
            attendanceStats,
            expenseStats,
            clientStats,
            employeeStats
        ] = await Promise.all([
            // Stock Statistics
            Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalStockValue: { $sum: { $multiply: ['$currentStock', '$averageRate'] } },
                        totalProducts: { $sum: 1 },
                        lowStockItems: { $sum: { $cond: [{ $lt: ['$currentStock', 100] }, 1, 0] } }
                    }
                }
            ]),

            // Cash Flow Statistics
            CashFlow.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                            {
                                $group: {
                                    _id: '$type',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth } } },
                            {
                                $group: {
                                    _id: '$type',
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),

            // Attendance Statistics
            Attendance.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                            {
                                $group: {
                                    _id: null,
                                    totalMarked: { $sum: 1 },
                                    presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                                    totalHours: { $sum: '$hoursWorked' }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth } } },
                            {
                                $group: {
                                    _id: null,
                                    totalMarked: { $sum: 1 },
                                    presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                                    totalHours: { $sum: '$hoursWorked' }
                                }
                            }
                        ]
                    }
                }
            ]),

            // Expense Statistics
            Expense.aggregate([
                {
                    $facet: {
                        today: [
                            { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                            {
                                $group: {
                                    _id: null,
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        monthly: [
                            { $match: { date: { $gte: startOfMonth } } },
                            {
                                $group: {
                                    _id: null,
                                    totalAmount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ]),

            // Client Statistics
            Client.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalBalance: { $sum: '$currentBalance' }
                    }
                }
            ]),

            // Employee Statistics
            Employee.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalEmployees: { $sum: 1 },
                        totalSalary: { $sum: '$basicSalary' }
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
                stock: stockStats[0] || { totalStockValue: 0, totalProducts: 0, lowStockItems: 0 },
                cashFlow: {
                    today: {
                        ...todayCashFlow,
                        netFlow: todayCashFlow.IN.amount - todayCashFlow.OUT.amount
                    },
                    monthly: {
                        ...monthlyCashFlow,
                        netFlow: monthlyCashFlow.IN.amount - monthlyCashFlow.OUT.amount
                    }
                },
                attendance: {
                    today: attendanceStats[0].today[0] || { totalMarked: 0, presentCount: 0, totalHours: 0 },
                    monthly: attendanceStats[0].monthly[0] || { totalMarked: 0, presentCount: 0, totalHours: 0 }
                },
                expenses: {
                    today: expenseStats[0].today[0] || { totalAmount: 0, count: 0 },
                    monthly: expenseStats[0].monthly[0] || { totalAmount: 0, count: 0 }
                },
                clients: clientStats.reduce((acc, item) => {
                    acc[item._id] = { count: item.count, balance: item.totalBalance };
                    return acc;
                }, { Customer: { count: 0, balance: 0 }, Supplier: { count: 0, balance: 0 } }),
                employees: employeeStats[0] || { totalEmployees: 0, totalSalary: 0 }
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

// Get Daily Report
export const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        const reportDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

        const [
            stockTransactions,
            cashFlowTransactions,
            attendanceRecords,
            expenseRecords,
            ledgerEntries
        ] = await Promise.all([
            // Stock transactions for the day
            Stock.aggregate([
                { $match: { lastTransactionDate: { $gte: startOfDay, $lte: endOfDay } } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalValue: { $sum: { $multiply: ['$currentStock', '$averageRate'] } }
                    }
                }
            ]),

            // Cash flow for the day
            CashFlow.find({ date: { $gte: startOfDay, $lte: endOfDay } })
                .populate('createdBy', 'username')
                .sort({ date: -1 }),

            // Attendance for the day
            Attendance.find({ date: { $gte: startOfDay, $lte: endOfDay } })
                .populate('employeeId', 'name employeeId')
                .populate('markedBy', 'username'),

            // Expenses for the day
            Expense.find({ date: { $gte: startOfDay, $lte: endOfDay } })
                .populate('createdBy', 'username'),

            // Client ledger entries for the day
            ClientLedger.find({ date: { $gte: startOfDay, $lte: endOfDay } })
                .populate('clientId', 'name type')
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

        res.json({
            success: true,
            data: {
                date: reportDate.toISOString().split('T')[0],
                summary: {
                    cashFlow: {
                        ...cashFlowSummary,
                        netFlow: cashFlowSummary.totalIncome - cashFlowSummary.totalExpense
                    },
                    attendance: attendanceSummary,
                    expenses: expenseSummary,
                    stock: stockTransactions[0] || { totalProducts: 0, totalValue: 0 }
                },
                transactions: {
                    cashFlow: cashFlowTransactions,
                    attendance: attendanceRecords,
                    expenses: expenseRecords,
                    clientLedger: ledgerEntries
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

// Get Weekly Report
export const getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let weekStart, weekEnd;
        if (startDate && endDate) {
            weekStart = new Date(startDate);
            weekEnd = new Date(endDate);
        } else {
            // Default to current week
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
            stockMovements
        ] = await Promise.all([
            // Daily cash flow trends
            CashFlow.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd } } },
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

            // Daily attendance trends
            Attendance.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd } } },
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

            // Daily expense trends
            Expense.aggregate([
                { $match: { date: { $gte: weekStart, $lte: weekEnd } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),

            // Stock movements summary
            Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockValue: { $sum: { $multiply: ['$currentStock', '$averageRate'] } },
                        lowStockItems: { $sum: { $cond: [{ $lt: ['$currentStock', 100] }, 1, 0] } }
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
                stock: stockMovements[0] || { totalProducts: 0, totalStockValue: 0, lowStockItems: 0 }
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

// Get Monthly Report
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
            employeeSummary,
            stockSummary
        ] = await Promise.all([
            // Monthly cash flow summary
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
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
                            { $limit: 10 }
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

            // Monthly expense summary
            Expense.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
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

            // Monthly attendance summary
            Attendance.aggregate([
                { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
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

            // Client summary
            Client.aggregate([
                { $match: { isActive: true } },
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

            // Employee summary
            Employee.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$paymentType',
                        count: { $sum: 1 },
                        totalSalary: { $sum: { $ifNull: ['$basicSalary', '$hourlyRate'] } }
                    }
                }
            ]),

            // Stock summary
            Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockValue: { $sum: { $multiply: ['$currentStock', '$averageRate'] } },
                        totalQuantity: { $sum: '$currentStock' },
                        lowStockItems: { $sum: { $cond: [{ $lt: ['$currentStock', 100] }, 1, 0] } }
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
                attendance: attendanceSummary[0] || { totalMarked: 0, presentCount: 0, totalHours: 0, avgHours: 0 },
                clients: clientSummary,
                employees: employeeSummary,
                stock: stockSummary[0] || { totalProducts: 0, totalStockValue: 0, totalQuantity: 0, lowStockItems: 0 }
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

// Get Yearly Report
export const getYearlyReport = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

        const [
            monthlyTrends,
            yearlyTotals,
            performanceMetrics
        ] = await Promise.all([
            // Monthly trends throughout the year
            CashFlow.aggregate([
                { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
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

            // Yearly totals across all modules
            Promise.all([
                CashFlow.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                    {
                        $group: {
                            _id: '$type',
                            totalAmount: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Expense.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' },
                            count: { $sum: 1 }
                        }
                    }
                ]),
                Attendance.aggregate([
                    { $match: { date: { $gte: startOfYear, $lte: endOfYear } } },
                    {
                        $group: {
                            _id: null,
                            totalDays: { $sum: 1 },
                            presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                            totalHours: { $sum: '$hoursWorked' }
                        }
                    }
                ])
            ]),

            // Performance metrics
            Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStockValue: { $sum: { $multiply: ['$currentStock', '$averageRate'] } },
                        averageStockValue: { $avg: { $multiply: ['$currentStock', '$averageRate'] } }
                    }
                }
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
                },
                performance: performanceMetrics[0] || { totalProducts: 0, totalStockValue: 0, averageStockValue: 0 }
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
