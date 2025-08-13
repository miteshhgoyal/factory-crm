import mongoose from 'mongoose';

// Import all models
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import Stock from '../models/Stock.js';
import Expense from '../models/Expense.js';
import CashFlow from '../models/CashFlow.js';
import Attendance from '../models/Attendance.js';
import Company from '../models/Company.js';

export const getDatabaseStats = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can view database statistics'
            });
        }

        const currentCompanyId = req.user.currentSelectedCompany;

        // Get global stats (users and companies)
        const globalStats = await Promise.all([
            User.countDocuments(),
            Company.countDocuments()
        ]);

        // Get company-scoped stats
        let companyStats = [0, 0, 0, 0, 0, 0, 0]; // Default values if no company selected

        if (currentCompanyId) {
            companyStats = await Promise.all([
                Employee.countDocuments({ companyId: currentCompanyId }),
                Client.countDocuments({ companyId: currentCompanyId }),
                ClientLedger.countDocuments({ companyId: currentCompanyId }),
                Stock.countDocuments({ companyId: currentCompanyId }),
                Expense.countDocuments({ companyId: currentCompanyId }),
                CashFlow.countDocuments({ companyId: currentCompanyId }),
                Attendance.countDocuments({ companyId: currentCompanyId })
            ]);
        }

        const [users, companies] = globalStats;
        const [employees, clients, clientLedgers, stocks, expenses, cashFlows, attendances] = companyStats;

        const databaseStats = {
            // Global data
            users,
            companies,
            // Company-scoped data
            employees,
            clients,
            clientLedgers,
            stocks,
            expenses,
            cashFlows,
            attendances,
            // Calculated fields
            totalRecords: users + companies + employees + clients + clientLedgers + stocks + expenses + cashFlows + attendances,
            companyRecords: employees + clients + clientLedgers + stocks + expenses + cashFlows + attendances,
            currentCompanyId: currentCompanyId,
            lastUpdated: new Date()
        };

        res.json({
            success: true,
            data: databaseStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch database statistics',
            error: error.message
        });
    }
};

export const clearDataModels = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can clear database'
            });
        }

        const { models } = req.body;
        const currentCompanyId = req.user.currentSelectedCompany;

        if (!currentCompanyId) {
            return res.status(400).json({
                success: false,
                message: 'No company selected. Please select a company first.'
            });
        }

        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one model to clear'
            });
        }

        const results = {};
        const modelMap = {
            'employees': Employee,
            'clients': Client,
            'clientLedgers': ClientLedger,
            'stocks': Stock,
            'expenses': Expense,
            'cashFlows': CashFlow,
            'attendances': Attendance
        };

        // Only allow company-scoped models
        const allowedModels = models.filter(model => modelMap[model]);
        const blockedModels = models.filter(model => !modelMap[model]);

        for (const modelName of allowedModels) {
            try {
                const deleteQuery = { companyId: new mongoose.Types.ObjectId(currentCompanyId) };
                const deleteResult = await modelMap[modelName].deleteMany(deleteQuery);
                results[modelName] = {
                    success: true,
                    deletedCount: deleteResult.deletedCount
                };
            } catch (error) {
                results[modelName] = {
                    success: false,
                    error: error.message
                };
            }
        }

        res.json({
            success: true,
            message: `Data clearing completed for company: ${currentCompanyId}`,
            results,
            blockedModels: blockedModels.length > 0 ? blockedModels : undefined,
            note: blockedModels.length > 0 ? 'Users and Companies cannot be cleared through this operation.' : undefined
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear data',
            error: error.message
        });
    }
};

export const clearAllData = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can clear all data'
            });
        }

        const currentCompanyId = req.user.currentSelectedCompany;

        if (!currentCompanyId) {
            return res.status(400).json({
                success: false,
                message: 'No company selected. Please select a company first.'
            });
        }

        const results = {};
        const models = [
            { name: 'attendances', model: Attendance },
            { name: 'expenses', model: Expense },
            { name: 'cashFlows', model: CashFlow },
            { name: 'stocks', model: Stock },
            { name: 'clientLedgers', model: ClientLedger },
            { name: 'clients', model: Client },
            { name: 'employees', model: Employee }
        ];

        for (const { name, model } of models) {
            try {
                const deleteQuery = { companyId: new mongoose.Types.ObjectId(currentCompanyId) };
                const deleteResult = await model.deleteMany(deleteQuery);
                results[name] = {
                    success: true,
                    deletedCount: deleteResult.deletedCount
                };
            } catch (error) {
                results[name] = {
                    success: false,
                    error: error.message
                };
            }
        }

        res.json({
            success: true,
            message: `All company data cleared for company: ${currentCompanyId}`,
            results,
            note: 'Users and Companies were preserved. Only company-specific data was deleted.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear all data',
            error: error.message
        });
    }
};

// Backup database - company-scoped with user context
export const backupDatabase = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can backup database'
            });
        }

        const currentCompanyId = req.user.currentSelectedCompany;

        if (!currentCompanyId) {
            return res.status(400).json({
                success: false,
                message: 'No company selected. Please select a company first.'
            });
        }

        // Get company details for context
        const company = await Company.findById(currentCompanyId);

        // Get users associated with this company
        const associatedUsers = await User.find({
            $or: [
                { companies: currentCompanyId },
                { selectedCompany: currentCompanyId }
            ]
        }).lean();

        const backup = {
            timestamp: new Date(),
            companyId: currentCompanyId,
            companyName: company?.name || 'Unknown Company',
            metadata: {
                exportedBy: req.user.userId,
                exportedAt: new Date(),
                version: '1.0'
            },
            data: {
                // Company context
                company: company,
                associatedUsers: associatedUsers,
                // Company-specific data
                employees: await Employee.find({ companyId: currentCompanyId }).lean(),
                clients: await Client.find({ companyId: currentCompanyId }).lean(),
                clientLedgers: await ClientLedger.find({ companyId: currentCompanyId }).lean(),
                stocks: await Stock.find({ companyId: currentCompanyId }).lean(),
                expenses: await Expense.find({ companyId: currentCompanyId }).lean(),
                cashFlows: await CashFlow.find({ companyId: currentCompanyId }).lean(),
                attendances: await Attendance.find({ companyId: currentCompanyId }).lean()
            }
        };

        res.json({
            success: true,
            message: `Backup created for company: ${company?.name || currentCompanyId}`,
            backup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            error: error.message
        });
    }
};

export const exportCollection = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can export collections'
            });
        }

        const { collection } = req.params;
        const currentCompanyId = req.user.currentSelectedCompany;

        const modelMap = {
            'users': User,
            'companies': Company,
            'employees': Employee,
            'clients': Client,
            'clientledgers': ClientLedger,
            'stocks': Stock,
            'expenses': Expense,
            'cashflows': CashFlow,
            'attendances': Attendance
        };

        const Model = modelMap[collection.toLowerCase()];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Invalid collection name'
            });
        }

        let data;
        let context = {};

        // Handle different collection types
        if (collection.toLowerCase() === 'users') {
            // For users, get those associated with current company
            if (!currentCompanyId) {
                data = await Model.find({}).lean();
                context.note = 'All users exported (no company filter)';
            } else {
                data = await Model.find({
                    $or: [
                        { companies: currentCompanyId },
                        { selectedCompany: currentCompanyId },
                        { role: 'superadmin' } // Always include superadmins
                    ]
                }).lean();
                context.companyId = currentCompanyId;
                context.note = 'Users associated with selected company';
            }
        } else if (collection.toLowerCase() === 'companies') {
            // For companies, export all but highlight current
            data = await Model.find({}).lean();
            context.currentCompanyId = currentCompanyId;
            context.note = 'All companies exported';
        } else {
            // For company-scoped collections
            if (!currentCompanyId) {
                return res.status(400).json({
                    success: false,
                    message: 'No company selected. Please select a company first.'
                });
            }
            data = await Model.find({ companyId: currentCompanyId }).lean();
            context.companyId = currentCompanyId;
            context.note = 'Company-specific data only';
        }

        res.json({
            success: true,
            collection: collection,
            count: data.length,
            context: context,
            data: data,
            exportedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export collection',
            error: error.message
        });
    }
};

export const importCollection = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can import collections'
            });
        }

        const { collection } = req.params;
        const { data, replaceExisting = false } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Expected an array of documents.'
            });
        }

        const modelMap = {
            'users': User,
            'companies': Company,
            'employees': Employee,
            'clients': Client,
            'clientledgers': ClientLedger,
            'stocks': Stock,
            'expenses': Expense,
            'cashflows': CashFlow,
            'attendances': Attendance
        };

        const Model = modelMap[collection.toLowerCase()];
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: 'Invalid collection name'
            });
        }

        let result;
        if (replaceExisting) {
            if (collection.toLowerCase() === 'users') {
                await Model.deleteMany({ role: { $ne: 'superadmin' } });
            } else if (collection.toLowerCase() === 'companies') {
                await Model.deleteMany({});
            } else {
                const currentCompanyId = req.user.currentSelectedCompany;
                if (currentCompanyId) {
                    await Model.deleteMany({ companyId: currentCompanyId });
                }
            }
            result = await Model.insertMany(data);
        } else {
            result = await Model.insertMany(data);
        }

        res.json({
            success: true,
            message: 'Data imported successfully',
            collection: collection,
            imported: result.length,
            replaceExisting
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to import collection',
            error: error.message
        });
    }
};