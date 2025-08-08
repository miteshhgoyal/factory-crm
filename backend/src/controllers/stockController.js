import Stock from '../models/Stock.js';
import mongoose from 'mongoose';

// Add Stock In
export const addStockIn = async (req, res) => {
    try {
        const { productName, quantity, unit, weightPerBag, rate, clientName, invoiceNo, notes } = req.body;

        // Validate required fields
        if (!productName || !quantity || !unit || !rate) {
            return res.status(400).json({
                success: false,
                message: 'Product name, quantity, unit, weight per bag and rate are required'
            });
        }

        // Convert to kg if unit is bags (1 bag = 40 kg) (default is 40)
        let quantityInKg = quantity;
        if (unit === 'bag') {
            quantityInKg = quantity * weightPerBag;
        }

        // Calculate amount
        const amount = quantityInKg * rate;

        const newStock = {
            productName,
            type: 'IN',
            quantity: quantityInKg, // Always store in kg
            unit: 'kg',
            rate,
            amount,
            clientName,
            invoiceNo,
            notes,
            date: new Date(),
            createdBy: req.user.userId
        }

        if (unit == 'bag') {
            newStock.bags = {
                count: quantity,
                weight: weightPerBag,
            }
        }

        const stockTransaction = new Stock(newStock);

        await stockTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Stock added successfully',
            data: stockTransaction
        });

    } catch (error) {
        console.error('Stock In error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add stock',
            error: error.message
        });
    }
};

// Add Stock Out
export const addStockOut = async (req, res) => {
    try {
        const { productName, quantity, unit, rate, weightPerBag, clientName, invoiceNo, notes } = req.body;

        // Validate required fields
        if (!productName || !quantity || !unit || !weightPerBag || !rate) {
            return res.status(400).json({
                success: false,
                message: 'Product name, quantity, unit, weight per bag and rate are required'
            });
        }

        // Convert to kg if unit is bags
        let quantityInKg = quantity;
        if (unit === 'bag') {
            quantityInKg = quantity * weightPerBag;
        }

        // Check if sufficient stock is available
        const stockBalance = await getProductBalance(productName);
        if (stockBalance < quantityInKg) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${stockBalance} kg, Requested: ${quantityInKg} kg`
            });
        }

        // Calculate amount
        const amount = quantityInKg * rate;

        const newStock = {
            productName,
            type: 'OUT',
            quantity: quantityInKg, // Always store in kg
            unit: 'kg',
            rate,
            amount,
            clientName,
            invoiceNo,
            notes,
            date: new Date(),
            createdBy: req.user.userId
        }

        if (unit == 'bag') {
            newStock.bags = {
                count: quantity,
                weight: weightPerBag,
            }
        }

        const stockTransaction = new Stock(newStock);

        await stockTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Stock out recorded successfully',
            data: stockTransaction
        });

    } catch (error) {
        console.error('Stock Out error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record stock out',
            error: error.message
        });
    }
};

// Get Stock Transactions
export const getStockTransactions = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            productName,
            clientName,
            startDate,
            endDate
        } = req.query;

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (productName) filter.productName = new RegExp(productName, 'i');
        if (clientName) filter.clientName = new RegExp(clientName, 'i');

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            Stock.find(filter)
                .populate('createdBy', 'username name')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Stock.countDocuments(filter)
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
        console.error('Get stock transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock transactions',
            error: error.message
        });
    }
};

// Get Stock Balance by Product
export const getStockBalance = async (req, res) => {
    try {
        const stockBalance = await Stock.aggregate([
            {
                $group: {
                    _id: '$productName',
                    totalIn: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', 0]
                        }
                    },
                    totalOut: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'OUT'] }, '$quantity', 0]
                        }
                    },
                    totalInValue: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'IN'] }, '$amount', 0]
                        }
                    },
                    totalOutValue: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'OUT'] }, '$amount', 0]
                        }
                    },
                    // Calculate weighted average bag weight from IN transactions
                    totalBagWeight: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$type', 'IN'] },
                                        { $gt: ['$bags.count', 0] }
                                    ]
                                },
                                { $multiply: ['$bags.count', '$bags.weight'] },
                                0
                            ]
                        }
                    },
                    totalBagCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$type', 'IN'] },
                                        { $gt: ['$bags.count', 0] }
                                    ]
                                },
                                '$bags.count',
                                0
                            ]
                        }
                    },
                    lastTransactionDate: { $max: '$date' }
                }
            },
            {
                $addFields: {
                    currentStock: { $subtract: ['$totalIn', '$totalOut'] },
                    averageBagWeight: {
                        $cond: [
                            { $gt: ['$totalBagCount', 0] },
                            { $divide: ['$totalBagWeight', '$totalBagCount'] },
                            40 // Default to 40 if no bag data available
                        ]
                    }
                }
            },
            {
                $addFields: {
                    stockInBags: {
                        $divide: [
                            { $subtract: ['$totalIn', '$totalOut'] },
                            '$averageBagWeight'
                        ]
                    }
                }
            },
            {
                $match: {
                    currentStock: { $gt: 0 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 1,
                    totalIn: 1,
                    totalOut: 1,
                    totalInValue: 1,
                    totalOutValue: 1,
                    currentStock: 1,
                    stockInBags: 1,
                    lastTransactionDate: 1
                }
            }
        ]);

        res.json({
            success: true,
            data: stockBalance
        });

    } catch (error) {
        console.error('Get stock balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock balance',
            error: error.message
        });
    }
};

// Get Stock Dashboard Stats
export const getStockDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            todayStats,
            monthlyStats,
            stockBalance,
            recentTransactions,
            lowStockProducts
        ] = await Promise.all([
            // Today's stats
            Stock.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                {
                    $group: {
                        _id: '$type',
                        totalQuantity: { $sum: '$quantity' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Monthly stats
            Stock.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: '$type',
                        totalQuantity: { $sum: '$quantity' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Stock balance
            Stock.aggregate([
                {
                    $group: {
                        _id: '$productName',
                        currentStock: {
                            $sum: {
                                $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }]
                            }
                        }
                    }
                },
                { $match: { currentStock: { $gt: 0 } } }
            ]),

            // Recent transactions
            Stock.find()
                .populate('createdBy', 'username')
                .sort({ date: -1 })
                .limit(5),

            // Low stock products (less than 100 kg)
            Stock.aggregate([
                {
                    $group: {
                        _id: '$productName',
                        currentStock: {
                            $sum: {
                                $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }]
                            }
                        }
                    }
                },
                { $match: { currentStock: { $lt: 100, $gt: 0 } } }
            ])
        ]);

        // Format today's stats
        const todayStatsFormatted = todayStats.reduce((acc, curr) => {
            acc[curr._id] = {
                quantity: curr.totalQuantity,
                amount: curr.totalAmount,
                count: curr.count
            };
            return acc;
        }, { IN: { quantity: 0, amount: 0, count: 0 }, OUT: { quantity: 0, amount: 0, count: 0 } });

        // Format monthly stats
        const monthlyStatsFormatted = monthlyStats.reduce((acc, curr) => {
            acc[curr._id] = {
                quantity: curr.totalQuantity,
                amount: curr.totalAmount,
                count: curr.count
            };
            return acc;
        }, { IN: { quantity: 0, amount: 0, count: 0 }, OUT: { quantity: 0, amount: 0, count: 0 } });

        const data = {
            today: todayStatsFormatted,
            monthly: monthlyStatsFormatted,
            totalProducts: stockBalance.length,
            lowStockProducts: lowStockProducts.length,
            recentTransactions,
            stockBalance: stockBalance.slice(0, 10) // Top 10 products
        }

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Stock dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stock dashboard stats',
            error: error.message
        });
    }
};

// Helper function to get product balance
const getProductBalance = async (productName) => {
    const result = await Stock.aggregate([
        { $match: { productName } },
        {
            $group: {
                _id: null,
                balance: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }]
                    }
                }
            }
        }
    ]);

    return result[0]?.balance || 0;
};

// Get Product List
export const getProductList = async (req, res) => {
    try {
        const products = await Stock.aggregate([
            {
                $group: {
                    _id: '$productName',
                    currentStock: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'IN'] }, '$quantity', { $multiply: ['$quantity', -1] }]
                        }
                    },
                    lastTransactionDate: { $max: '$date' }
                }
            },
            {
                $match: {
                    currentStock: { $gt: 0 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: products
        });

    } catch (error) {
        console.error('Get product list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product list',
            error: error.message
        });
    }
};
