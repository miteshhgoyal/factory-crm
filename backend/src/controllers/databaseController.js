import mongoose from 'mongoose';

// Import all models
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import Stock from '../models/Stock.js';
import Expense from '../models/Expense.js';
import CashFlow from '../models/CashFlow.js';
import Attendance from '../models/Attendance.js';

// Get database statistics
export const getDatabaseStats = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can view database statistics'
            });
        }

        const stats = await Promise.all([
            User.countDocuments(),
            Employee.countDocuments(),
            Manager.countDocuments(),
            Client.countDocuments(),
            ClientLedger.countDocuments(),
            Stock.countDocuments(),
            Expense.countDocuments(),
            CashFlow.countDocuments(),
            Attendance.countDocuments()
        ]);

        const [users, employees, managers, clients, clientLedgers, stocks, expenses, cashFlows, attendances] = stats;

        // Calculate database size (fixed approach)
        let totalSize = 0;
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();

            for (const collectionInfo of collections) {
                try {
                    const collection = mongoose.connection.db.collection(collectionInfo.name);
                    const collStats = await collection.stats();
                    totalSize += collStats.size || 0;
                } catch (collectionError) {
                    console.warn(`Could not get stats for collection ${collectionInfo.name}`);
                    // Continue with next collection
                }
            }
        } catch (sizeError) {
            console.warn('Could not calculate database size:', sizeError.message);
            totalSize = -1; // Indicate size calculation failed
        }

        const databaseStats = {
            users,
            employees,
            managers,
            clients,
            clientLedgers,
            stocks,
            expenses,
            cashFlows,
            attendances,
            totalRecords: users + employees + managers + clients + clientLedgers + stocks + expenses + cashFlows + attendances,
            databaseSize: totalSize,
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

// Clear specific data models
export const clearDataModels = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can clear database'
            });
        }

        const { models, keepSuperadmin } = req.body;

        if (!models || !Array.isArray(models) || models.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one model to clear'
            });
        }

        const results = {};
        const modelMap = {
            'users': User,
            'employees': Employee,
            'managers': Manager,
            'clients': Client,
            'clientLedgers': ClientLedger,
            'stocks': Stock,
            'expenses': Expense,
            'cashFlows': CashFlow,
            'attendances': Attendance
        };

        for (const modelName of models) {
            if (modelMap[modelName]) {
                try {
                    let deleteQuery = {};

                    // If clearing users and keepSuperadmin is true, preserve superadmin
                    if (modelName === 'users' && keepSuperadmin) {
                        deleteQuery = { role: { $ne: 'superadmin' } };
                    }

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
            } else {
                results[modelName] = {
                    success: false,
                    error: 'Invalid model name'
                };
            }
        }

        res.json({
            success: true,
            message: 'Data clearing operation completed',
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear data',
            error: error.message
        });
    }
};

// Clear all data except superadmin
export const clearAllData = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can clear all data'
            });
        }

        const { keepSuperadmin } = req.body;

        const results = {};
        const models = [
            { name: 'attendances', model: Attendance },
            { name: 'expenses', model: Expense },
            { name: 'cashFlows', model: CashFlow },
            { name: 'stocks', model: Stock },
            { name: 'clientLedgers', model: ClientLedger },
            { name: 'clients', model: Client },
            { name: 'managers', model: Manager },
            { name: 'employees', model: Employee },
            { name: 'users', model: User }
        ];

        for (const { name, model } of models) {
            try {
                let deleteQuery = {};

                // If clearing users and keepSuperadmin is true, preserve superadmin
                if (name === 'users' && keepSuperadmin) {
                    deleteQuery = { role: { $ne: 'superadmin' } };
                }

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
            message: 'All data cleared successfully',
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear all data',
            error: error.message
        });
    }
};

// Reset database to initial state (with sample data)
export const resetToSampleData = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can reset database'
            });
        }

        // Clear all data except superadmin
        const models = [
            { name: 'attendances', model: Attendance },
            { name: 'expenses', model: Expense },
            { name: 'cashFlows', model: CashFlow },
            { name: 'stocks', model: Stock },
            { name: 'clientLedgers', model: ClientLedger },
            { name: 'clients', model: Client },
            { name: 'managers', model: Manager },
            { name: 'employees', model: Employee },
            { name: 'users', model: User }
        ];

        const results = {};
        for (const { name, model } of models) {
            try {
                let deleteQuery = {};
                // Always keep superadmin when resetting
                if (name === 'users') {
                    deleteQuery = { role: { $ne: 'superadmin' } };
                }

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
            message: 'Database reset completed. You can now run the seeder to populate with sample data.',
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reset database',
            error: error.message
        });
    }
};

// Backup database (export data)
export const backupDatabase = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can backup database'
            });
        }

        const backup = {
            timestamp: new Date(),
            data: {
                users: await User.find({}).lean(),
                employees: await Employee.find({}).lean(),
                managers: await Manager.find({}).lean(),
                clients: await Client.find({}).lean(),
                clientLedgers: await ClientLedger.find({}).lean(),
                stocks: await Stock.find({}).lean(),
                expenses: await Expense.find({}).lean(),
                cashFlows: await CashFlow.find({}).lean(),
                attendances: await Attendance.find({}).lean()
            }
        };

        res.json({
            success: true,
            message: 'Database backup created successfully',
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

// Get detailed collection statistics (fixed)
export const getCollectionStats = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can view collection statistics'
            });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionStats = [];

        for (const collectionInfo of collections) {
            try {
                const collection = mongoose.connection.db.collection(collectionInfo.name);
                const stats = await collection.stats();
                const indexes = await collection.indexes();

                collectionStats.push({
                    name: collectionInfo.name,
                    documentCount: stats.count || 0,
                    avgDocumentSize: stats.avgObjSize || 0,
                    storageSize: stats.size || 0,
                    totalIndexSize: stats.totalIndexSize || 0,
                    indexCount: indexes.length,
                    capped: stats.capped || false
                });
            } catch (error) {
                console.warn(`Could not get stats for collection ${collectionInfo.name}:`, error.message);
                // Add basic info even if stats fail
                collectionStats.push({
                    name: collectionInfo.name,
                    documentCount: 0,
                    avgDocumentSize: 0,
                    storageSize: 0,
                    totalIndexSize: 0,
                    indexCount: 0,
                    capped: false,
                    error: 'Stats unavailable'
                });
            }
        }

        res.json({
            success: true,
            data: collectionStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collection statistics',
            error: error.message
        });
    }
};

// Export specific collection
export const exportCollection = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can export collections'
            });
        }

        const { collection } = req.params;
        const modelMap = {
            'users': User,
            'employees': Employee,
            'managers': Manager,
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

        const data = await Model.find({}).lean();

        res.json({
            success: true,
            collection: collection,
            count: data.length,
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

// Import data to specific collection
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
            'employees': Employee,
            'managers': Manager,
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
            // Clear existing data (preserve superadmin for users)
            if (collection.toLowerCase() === 'users') {
                await Model.deleteMany({ role: { $ne: 'superadmin' } });
            } else {
                await Model.deleteMany({});
            }
            result = await Model.insertMany(data);
        } else {
            // Insert new data without clearing existing
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

// Optimize database (fixed)
export const optimizeDatabase = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can optimize database'
            });
        }

        const results = {};
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collectionInfo of collections) {
            try {
                const collection = mongoose.connection.db.collection(collectionInfo.name);
                await collection.reIndex();
                results[collectionInfo.name] = {
                    success: true,
                    operation: 'reindexed'
                };
            } catch (error) {
                results[collectionInfo.name] = {
                    success: false,
                    error: error.message
                };
            }
        }

        // Run database stats command
        let dbStats = {};
        try {
            dbStats = await mongoose.connection.db.stats();
        } catch (error) {
            console.warn('Could not get database stats:', error.message);
        }

        res.json({
            success: true,
            message: 'Database optimization completed',
            results,
            dbStats: {
                collections: dbStats.collections || 0,
                dataSize: dbStats.dataSize || 0,
                indexSize: dbStats.indexSize || 0,
                storageSize: dbStats.storageSize || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to optimize database',
            error: error.message
        });
    }
};

// Validate database integrity (fixed)
export const validateDatabaseIntegrity = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can validate database integrity'
            });
        }

        const validationResults = {};

        // Validate Users collection
        const usersWithoutCreatedBy = await User.countDocuments({
            role: { $ne: 'superadmin' },
            createdBy: { $exists: false }
        });
        validationResults.users = {
            orphanedRecords: usersWithoutCreatedBy,
            totalRecords: await User.countDocuments()
        };

        // Validate Employees collection - fixed logic
        const employeesCount = await Employee.countDocuments();
        const employeesWithInvalidPayment = await Employee.countDocuments({
            $or: [
                { paymentType: 'fixed', basicSalary: { $exists: false } },
                { paymentType: 'hourly', hourlyRate: { $exists: false } }
            ]
        });
        validationResults.employees = {
            invalidPaymentStructure: employeesWithInvalidPayment,
            totalRecords: employeesCount
        };

        // Validate Client Ledgers
        const clientLedgersWithoutClient = await ClientLedger.countDocuments({
            clientId: { $exists: false }
        });
        validationResults.clientLedgers = {
            orphanedRecords: clientLedgersWithoutClient,
            totalRecords: await ClientLedger.countDocuments()
        };

        // Validate Managers
        const managersWithoutEmployee = await Manager.countDocuments({
            employeeId: { $exists: false }
        });
        validationResults.managers = {
            orphanedRecords: managersWithoutEmployee,
            totalRecords: await Manager.countDocuments()
        };

        // Validate Attendance
        const attendanceWithoutEmployee = await Attendance.countDocuments({
            employeeId: { $exists: false }
        });
        validationResults.attendance = {
            orphanedRecords: attendanceWithoutEmployee,
            totalRecords: await Attendance.countDocuments()
        };

        // Check for referential integrity - fixed aggregation
        let clientLedgerIntegrityIssues = 0;
        let managerIntegrityIssues = 0;

        try {
            const clientLedgerCheck = await ClientLedger.aggregate([
                {
                    $lookup: {
                        from: 'clients',
                        localField: 'clientId',
                        foreignField: '_id',
                        as: 'client'
                    }
                },
                {
                    $match: { client: { $size: 0 } }
                },
                {
                    $count: "count"
                }
            ]);
            clientLedgerIntegrityIssues = clientLedgerCheck.length > 0 ? clientLedgerCheck[0].count : 0;
        } catch (error) {
            console.warn('Could not check client ledger integrity:', error.message);
        }

        try {
            const managerCheck = await Manager.aggregate([
                {
                    $lookup: {
                        from: 'employees',
                        localField: 'employeeId',
                        foreignField: '_id',
                        as: 'employee'
                    }
                },
                {
                    $match: { employee: { $size: 0 } }
                },
                {
                    $count: "count"
                }
            ]);
            managerIntegrityIssues = managerCheck.length > 0 ? managerCheck[0].count : 0;
        } catch (error) {
            console.warn('Could not check manager integrity:', error.message);
        }

        const referentialIntegrity = {
            clientLedgersWithInvalidClient: clientLedgerIntegrityIssues,
            managersWithInvalidEmployee: managerIntegrityIssues
        };

        const overallHealth = {
            totalIssues: Object.values(validationResults).reduce((sum, result) => sum + (result.orphanedRecords || 0), 0),
            referentialIntegrityIssues: clientLedgerIntegrityIssues + managerIntegrityIssues
        };

        res.json({
            success: true,
            message: 'Database integrity validation completed',
            validationResults,
            referentialIntegrity,
            overallHealth,
            validatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to validate database integrity',
            error: error.message
        });
    }
};
