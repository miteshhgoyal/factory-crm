import Client from '../models/Client.js';
import Stock from '../models/Stock.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';
import { deleteImage } from '../services/cloudinary.js';

// Create Client
export const createClient = async (req, res) => {
    try {
        const { name, phone, address, type, aadharNo, panNo } = req.body;

        // Handle uploaded files
        let aadharCardImage = '';
        let panCardImage = '';
        let aadharCardImagePublicId = '';
        let panCardImagePublicId = '';

        if (req.files) {
            if (req.files.aadharCard && req.files.aadharCard[0]) {
                aadharCardImage = req.files.aadharCard[0].path;
                aadharCardImagePublicId = req.files.aadharCard.filename;
            }

            if (req.files.panCard && req.files.panCard) {
                panCardImage = req.files.panCard[0].path;
                panCardImagePublicId = req.files.panCard.filename;
            }
        }

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

        // Validate Aadhaar number if provided
        if (aadharNo && !/^\d{12}$/.test(aadharNo.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                message: 'Aadhaar number should be 12 digits'
            });
        }

        // Validate PAN number if provided
        if (panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNo.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid PAN number'
            });
        }

        // Check if client with same phone already exists
        const existingClient = await Client.findOne({
            phone,
            isActive: true,
            companyId: req.user.currentSelectedCompany
        });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                message: 'Client with this phone number already exists'
            });
        }

        const client = new Client({
            name,
            phone: '+91' + phone,
            address,
            type,
            aadharNo: aadharNo || '',
            panNo: panNo || '',
            createdBy: req.user.userId,
            companyId: req.user.currentSelectedCompany,
            aadharCardImage,
            panCardImage,
            aadharCardImagePublicId,
            panCardImagePublicId,
        });

        await client.save();

        if (req.user.role !== 'superadmin')
            await createNotification(
                `New Client Created by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'Client',
                client._id
            );

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
            limit = 50,
            type,
            search,
            isActive = true,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        // Build filter object
        const filter = { isActive: isActive === 'true' };
        if (type) filter.type = type;

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') },
                { address: new RegExp(search, 'i') }
            ];
        }

        const [clients, total] = await Promise.all([
            Client.find({ companyId: req.user.currentSelectedCompany })
                .populate('createdBy', 'username name'),
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        const client = await Client.findOne({
            _id: id,
            isActive: true,
            companyId: req.user.currentSelectedCompany
        }).populate('createdBy', 'username name');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Get recent stock entries
        const recentStockEntries = await Stock.find({
            clientId: id,
            companyId: req.user.currentSelectedCompany
        })
            .populate('createdBy', 'username name')
            .sort({ date: -1, createdAt: -1 })
            .limit(10);

        // Process entries to match ledger format
        const recentLedgerEntries = recentStockEntries.map(entry => {
            let debitAmount = 0;
            let creditAmount = 0;

            // Calculate debit/credit based on client type and transaction type
            if (client.type === 'Customer') {
                if (entry.type === 'OUT') {
                    debitAmount = entry.amount; // Customer owes us money
                } else {
                    creditAmount = entry.amount; // Customer paid us or we credited them
                }
            } else { // Supplier
                if (entry.type === 'IN') {
                    debitAmount = entry.amount; // We owe supplier money
                } else {
                    creditAmount = entry.amount; // We paid supplier or they credited us
                }
            }

            return {
                _id: entry._id,
                date: entry.date,
                particulars: `${entry.productName} - ${entry.type === 'IN' ? 'Purchase' : 'Sale'}`,
                bags: entry.bags?.count || 0,
                weight: entry.quantity || 0,
                rate: entry.rate,
                debitAmount,
                creditAmount,
                transactionType: entry.type,
                productName: entry.productName,
                invoiceNo: entry.invoiceNo,
                notes: entry.notes,
                createdBy: entry.createdBy,
                createdAt: entry.createdAt
            };
        });

        // Get ledger summary using Stock model
        const summary = await Stock.aggregate([
            {
                $match: {
                    clientId: new mongoose.Types.ObjectId(id),
                    companyId: new mongoose.Types.ObjectId(req.user.currentSelectedCompany)
                }
            },
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

        const summaryStats = {
            totalDebit: client.type === 'Customer'
                ? (summary.find(s => s._id === 'OUT')?.totalAmount || 0)
                : (summary.find(s => s._id === 'IN')?.totalAmount || 0),
            totalCredit: client.type === 'Customer'
                ? (summary.find(s => s._id === 'IN')?.totalAmount || 0)
                : (summary.find(s => s._id === 'OUT')?.totalAmount || 0),
            totalBags: summary.reduce((acc, s) => acc + (s.totalBags || 0), 0),
            totalWeight: summary.reduce((acc, s) => acc + (s.totalQuantity || 0), 0),
            entryCount: summary.reduce((acc, s) => acc + (s.count || 0), 0),
            purchaseCount: summary.find(s => s._id === 'IN')?.count || 0,
            saleCount: summary.find(s => s._id === 'OUT')?.count || 0
        };

        res.json({
            success: true,
            data: {
                client,
                recentLedgerEntries,
                summary: summaryStats
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
        const updateData = { ...req.body };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        // Get current client to check for existing images
        const currentClient = await Client.findById(id);
        if (!currentClient) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Handle uploaded files
        if (req.files) {
            if (req.files.aadharCard && req.files.aadharCard) {
                // Delete old Aadhaar image if exists
                if (currentClient.aadharCardImagePublicId) {
                    await deleteImage(currentClient.aadharCardImagePublicId);
                }
                updateData.aadharCardImage = req.files.aadharCard[0].path;
                updateData.aadharCardImagePublicId = req.files.aadharCard.filename;
            }

            if (req.files.panCard && req.files.panCard) {
                // Delete old PAN image if exists
                if (currentClient.panCardImagePublicId) {
                    await deleteImage(currentClient.panCardImagePublicId);
                }
                updateData.panCardImage = req.files.panCard[0].path;
                updateData.panCardImagePublicId = req.files.panCard.filename;
            }
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;
        delete updateData.currentBalance; // Balance should be updated through ledger entries
        delete updateData.isActive;

        // Validate type if provided
        if (updateData.type && !['Customer', 'Supplier'].includes(updateData.type)) {
            return res.status(400).json({
                success: false,
                message: 'Type must be either Customer or Supplier'
            });
        }

        // Validate Aadhaar number if provided
        if (updateData.aadharNo && !/^\d{12}$/.test(updateData.aadharNo.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                message: 'Aadhaar number should be 12 digits'
            });
        }

        // Validate PAN number if provided
        if (updateData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(updateData.panNo.toUpperCase())) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid PAN number'
            });
        }

        // Check if phone is being updated and if it conflicts with another client
        if (updateData.phone) {
            const existingClient = await Client.findOne({
                phone: updateData.phone,
                _id: { $ne: id },
                isActive: true,
                companyId: req.user.currentSelectedCompany,
            });

            if (existingClient) {
                return res.status(400).json({
                    success: false,
                    message: 'Another client with this phone number already exists'
                });
            }
        }

        const client = await Client.findOneAndUpdate(
            { _id: id, isActive: true },
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

// Delete Client (Hard delete with cascade)
export const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        // Check if user has permission to delete
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions to delete clients'
            });
        }

        // Get the client first to check if it exists
        const client = await Client.findById(id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Delete all stock entries associated with this client
        const deletedStockEntries = await Stock.deleteMany({
            clientId: id,
            companyId: req.user.currentSelectedCompany
        });

        // Delete client images from cloudinary if they exist
        if (client.aadharCardImagePublicId) {
            await deleteImage(client.aadharCardImagePublicId);
        }
        if (client.panCardImagePublicId) {
            await deleteImage(client.panCardImagePublicId);
        }

        // Delete the client
        await Client.findByIdAndDelete(id);

        // Create notification
        if (req.user.role !== 'superadmin') {
            await createNotification(
                `Client "${client.name}" deleted by ${req.user.username} (${req.user.email}). ${deletedStockEntries.deletedCount} stock entries also removed.`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'Client',
                null // Client is deleted, so no ID reference
            );
        }

        res.json({
            success: true,
            message: `Client deleted successfully. ${deletedStockEntries.deletedCount} related stock entries also removed.`,
            data: {
                deletedClient: client,
                deletedStockEntries: deletedStockEntries.deletedCount
            }
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

// Restore Client (Reactivate)
export const restoreClient = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid client ID'
            });
        }

        // Only superadmin can restore clients
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can restore clients'
            });
        }

        const client = await Client.findOneAndUpdate(
            { _id: id, isActive: false },
            { isActive: true, updatedAt: new Date() },
            { new: true }
        ).populate('createdBy', 'username name');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Deactivated client not found'
            });
        }

        res.json({
            success: true,
            message: 'Client restored successfully',
            data: client
        });

    } catch (error) {
        console.error('Restore client error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore client',
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
                { $match: { isActive: true, companyId: req.user.currentSelectedCompany } },
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
                { $match: { isActive: true, companyId: req.user.currentSelectedCompany } },
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
            Client.find({ isActive: true, companyId: req.user.currentSelectedCompany })
                .populate('createdBy', 'username')
                .sort({ createdAt: -1 })
                .limit(5),

            // Top debtors (clients who owe money)
            Client.find({
                isActive: true,
                currentBalance: { $gt: 0 },
                companyId: req.user.currentSelectedCompany,
            })
                .sort({ currentBalance: -1 })
                .limit(5),

            // Top creditors (clients we owe money to)
            Client.find({
                isActive: true,
                currentBalance: { $lt: 0 },
                companyId: req.user.currentSelectedCompany,
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

// Bulk Operations
export const bulkDeleteClients = async (req, res) => {
    try {
        const { clientIds } = req.body;

        if (!Array.isArray(clientIds) || clientIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Client IDs array is required'
            });
        }

        // Only superadmin can bulk delete
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can perform bulk operations'
            });
        }

        // Get clients first to access their image data
        const clients = await Client.find({ _id: { $in: clientIds } });

        // Delete all stock entries for these clients
        const deletedStockEntries = await Stock.deleteMany({
            clientId: { $in: clientIds },
            companyId: req.user.currentSelectedCompany
        });

        // Delete client images from cloudinary
        for (const client of clients) {
            if (client.aadharCardImagePublicId) {
                await deleteImage(client.aadharCardImagePublicId);
            }
            if (client.panCardImagePublicId) {
                await deleteImage(client.panCardImagePublicId);
            }
        }

        // Delete clients
        const result = await Client.deleteMany({ _id: { $in: clientIds } });

        res.json({
            success: true,
            message: `${result.deletedCount} clients and ${deletedStockEntries.deletedCount} stock entries deleted successfully`,
            data: {
                deletedClients: result.deletedCount,
                deletedStockEntries: deletedStockEntries.deletedCount
            }
        });

    } catch (error) {
        console.error('Bulk delete clients error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete clients',
            error: error.message
        });
    }
};

// Helper function to recalculate client balance based on Stock entries
const recalculateClientBalance = async (clientId) => {
    try {
        const client = await Client.findById(clientId);
        if (!client) return;

        // Get all transactions for this client in chronological order
        const transactions = await Stock.find({
            clientId,
            companyId: client.companyId
        }).sort({ date: 1, createdAt: 1 });

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
        return balance;
    } catch (error) {
        console.error('Error recalculating client balance:', error);
        return 0;
    }
};
