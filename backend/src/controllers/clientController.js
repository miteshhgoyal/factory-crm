import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import mongoose from 'mongoose';

// Create Client
export const createClient = async (req, res) => {
    try {
        const { name, phone, address, type, currentBalance } = req.body;

        // Validate required fields
        if (!name || !phone || !type) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone, and type are required'
            });
        }

        // Validate type
        if (!['Customer', 'Supplier'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either Customer or Supplier'
            });
        }

        // Check if client with same phone already exists
        const existingClient = await Client.findOne({ phone });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                message: 'Client with this phone number already exists'
            });
        }

        const client = new Client({
            name,
            phone,
            address,
            type,
            currentBalance: currentBalance || 0,
            createdBy: req.user.userId
        });

        await client.save();

        // Create initial ledger entry if there's an opening balance
        if (currentBalance && currentBalance !== 0) {
            await ClientLedger.create({
                clientId: client._id,
                date: new Date(),
                particulars: 'Opening Balance',
                debitAmount: currentBalance > 0 ? currentBalance : 0,
                creditAmount: currentBalance < 0 ? Math.abs(currentBalance) : 0,
                balance: currentBalance,
                createdBy: req.user.userId
            });
        }

        const populatedClient = await Client.findById(client._id)
            .populate('createdBy', 'username name');

        res.status(201).json({
            success: true,
            message: 'Client created successfully',
            data: populatedClient
        });

    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create client',
            error: error.message
        });
    }
};

// Get All Clients
export const getClients = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            search,
            isActive = true,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filter object
        const filter = {};
        if (type) filter.type = type;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') },
                { address: new RegExp(search, 'i') }
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [clients, total] = await Promise.all([
            Client.find(filter)
                .populate('createdBy', 'username name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Client.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                clients,
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
        console.error('Get clients error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch clients',
            error: error.message
        });
    }
};

// Get Client by ID
export const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const client = await Client.findById(id)
            .populate('createdBy', 'username name');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Get recent ledger entries
        const recentLedgerEntries = await ClientLedger.find({ clientId: id })
            .populate('createdBy', 'username name')
            .sort({ date: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                client,
                recentLedgerEntries
            }
        });

    } catch (error) {
        console.error('Get client by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client',
            error: error.message
        });
    }
};

// Update Client
export const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.currentBalance; // Balance should be updated through ledger entries

        // Check if phone is being updated and if it conflicts with another client
        if (updateData.phone) {
            const existingClient = await Client.findOne({
                phone: updateData.phone,
                _id: { $ne: id }
            });

            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Another client with this phone number already exists'
                });
            }
        }

        const client = await Client.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username name');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            message: 'Client updated successfully',
            data: client
        });

    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update client',
            error: error.message
        });
    }
};

// Delete Client (Soft delete)
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // Only superadmin can delete clients
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete clients'
            });
        }

        const client = await Client.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            message: 'Client deactivated successfully',
            data: client
        });

    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete client',
            error: error.message
        });
    }
};

// Get Client Dashboard Stats
export const getClientDashboardStats = async (req, res) => {
    try {
        const [
            clientStats,
            balanceStats,
            recentClients,
            topDebtors,
            topCreditors
        ] = await Promise.all([
            // Client statistics
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

            // Balance statistics
            Client.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: null,
                        totalClients: { $sum: 1 },
                        totalReceivables: {
                            $sum: { $cond: [{ $gt: ['$currentBalance', 0] }, '$currentBalance', 0] }
                        },
                        totalPayables: {
                            $sum: { $cond: [{ $lt: ['$currentBalance', 0] }, { $abs: '$currentBalance' }, 0] }
                        },
                        positiveBalances: {
                            $sum: { $cond: [{ $gt: ['$currentBalance', 0] }, 1, 0] }
                        },
                        negativeBalances: {
                            $sum: { $cond: [{ $lt: ['$currentBalance', 0] }, 1, 0] }
                        }
                    }
                }
            ]),

            // Recent clients
            Client.find({ isActive: true })
                .populate('createdBy', 'username')
                .sort({ date: -1 })
                .limit(5),

            // Top debtors (clients who owe money)
            Client.find({
                isActive: true,
                currentBalance: { $gt: 0 }
            })
                .sort({ currentBalance: -1 })
                .limit(5),

            // Top creditors (clients we owe money to)
            Client.find({
                isActive: true,
                currentBalance: { $lt: 0 }
            })
                .sort({ currentBalance: 1 })
                .limit(5)
        ]);

        // Format client stats
        const formattedClientStats = clientStats.reduce((acc, stat) => {
            acc[stat._id] = {
                count: stat.count,
                totalBalance: stat.totalBalance
            };
            return acc;
        }, { Customer: { count: 0, totalBalance: 0 }, Supplier: { count: 0, totalBalance: 0 } });

        res.json({
            success: true,
            data: {
                clientStats: formattedClientStats,
                balanceStats: balanceStats[0] || {
                    totalClients: 0,
                    totalReceivables: 0,
                    totalPayables: 0,
                    positiveBalances: 0,
                    negativeBalances: 0
                },
                recentClients,
                topDebtors,
                topCreditors
            }
        });

    } catch (error) {
        console.error('Client dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client dashboard stats',
            error: error.message
        });
    }
};
