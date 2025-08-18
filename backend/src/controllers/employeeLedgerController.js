import CashFlow from '../models/CashFlow.js';
import Employee from '../models/Employee.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';

// Get Employee Ledger with pagination and filters
export const getEmployeeLedger = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            employeeId,
            startDate,
            endDate,
            paymentType,
            sortBy = 'date',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {
            type: 'OUT',
            companyId: req.user.currentSelectedCompany,
            $or: [
                { category: 'Salary' },
                { category: 'Advance' }
            ]
        };

        // Employee filter
        if (employeeId && employeeId !== 'all') {
            const employee = await Employee.findById(employeeId);
            if (employee) {
                filter.employeeName = employee.name;
            }
        }

        // Date range filter
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Payment type filter
        if (paymentType && paymentType !== 'all') {
            filter.category = paymentType === 'salary' ? 'Salary' : 'Advance';
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [ledgerEntries, total] = await Promise.all([
            CashFlow.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('employeeId', 'name employeeId paymentType basicSalary hourlyRate')
                .populate('createdBy', 'name username email role'),
            CashFlow.countDocuments(filter)
        ]);

        // Get summary statistics
        const summaryStats = await CashFlow.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const summary = {
            totalSalary: summaryStats.find(s => s._id === 'Salary')?.totalAmount || 0,
            totalAdvances: summaryStats.find(s => s._id === 'Advance')?.totalAmount || 0,
            salaryCount: summaryStats.find(s => s._id === 'Salary')?.count || 0,
            advanceCount: summaryStats.find(s => s._id === 'Advance')?.count || 0
        };
        summary.totalPaid = summary.totalSalary + summary.totalAdvances;

        res.json({
            success: true,
            data: {
                ledgerEntries,
                summary,
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
        console.error('Get employee ledger error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee ledger',
            error: error.message
        });
    }
};

// Get Employee Ledger Entry by ID
export const getLedgerEntryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        const ledgerEntry = await CashFlow.findById(id)
            .populate({
                path: 'employeeId',
                select: 'name employeeId paymentType basicSalary hourlyRate phone address'
            }).populate('createdBy', 'name username email role');

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        // Get employee by name if employeeId is not populated
        let employee = ledgerEntry.employeeId;
        if (!employee && ledgerEntry.employeeName) {
            employee = await Employee.findOne({
                name: ledgerEntry.employeeName,
                companyId: req.user.currentSelectedCompany
            });
        }

        res.json({
            success: true,
            data: {
                ...ledgerEntry.toObject(),
                employee
            }
        });

    } catch (error) {
        console.error('Get ledger entry by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ledger entry',
            error: error.message
        });
    }
};

// Update Employee Ledger Entry
export const updateLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdAt;
        delete updateData._id;
        delete updateData.companyId;
        delete updateData.createdBy;

        const ledgerEntry = await CashFlow.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        if (req.user.role !== 'superadmin')
            await createNotification(
                `Employee Ledger Entry Updated by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'CashFlow',
                ledgerEntry._id
            );

        res.json({
            success: true,
            message: 'Ledger entry updated successfully',
            data: ledgerEntry
        });

    } catch (error) {
        console.error('Update ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ledger entry',
            error: error.message
        });
    }
};

// Delete Employee Ledger Entry
export const deleteLedgerEntry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid ledger entry ID'
            });
        }

        const ledgerEntry = await CashFlow.findById(id);

        if (!ledgerEntry) {
            return res.status(404).json({
                success: false,
                message: 'Ledger entry not found'
            });
        }

        await CashFlow.findByIdAndDelete(id);

        if (req.user.role !== 'superadmin')
            await createNotification(
                `Employee Ledger Entry Deleted by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'CashFlow',
                ledgerEntry._id
            );

        res.json({
            success: true,
            message: 'Ledger entry deleted successfully',
            data: ledgerEntry
        });

    } catch (error) {
        console.error('Delete ledger entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete ledger entry',
            error: error.message
        });
    }
};

// Get Employee Ledger Dashboard Stats
export const getEmployeeLedgerStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        const [monthlyStats, yearlyStats, topEmployees] = await Promise.all([
            // Monthly statistics
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        date: { $gte: startOfMonth },
                        companyId: req.user.currentSelectedCompany,
                        $or: [{ category: 'Salary' }, { category: 'Advance' }]
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Yearly statistics
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        date: { $gte: startOfYear },
                        companyId: req.user.currentSelectedCompany,
                        $or: [{ category: 'Salary' }, { category: 'Advance' }]
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Top employees by payment amount
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        date: { $gte: startOfMonth },
                        companyId: req.user.currentSelectedCompany,
                        $or: [{ category: 'Salary' }, { category: 'Advance' }]
                    }
                },
                {
                    $group: {
                        _id: '$employeeName',
                        totalAmount: { $sum: '$amount' },
                        salaryAmount: {
                            $sum: { $cond: [{ $eq: ['$category', 'Salary'] }, '$amount', 0] }
                        },
                        advanceAmount: {
                            $sum: { $cond: [{ $eq: ['$category', 'Advance'] }, '$amount', 0] }
                        },
                        paymentCount: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 5 }
            ])
        ]);

        const stats = {
            monthly: {
                totalSalary: monthlyStats.find(s => s._id === 'Salary')?.totalAmount || 0,
                totalAdvances: monthlyStats.find(s => s._id === 'Advance')?.totalAmount || 0,
                salaryCount: monthlyStats.find(s => s._id === 'Salary')?.count || 0,
                advanceCount: monthlyStats.find(s => s._id === 'Advance')?.count || 0
            },
            yearly: {
                totalSalary: yearlyStats.find(s => s._id === 'Salary')?.totalAmount || 0,
                totalAdvances: yearlyStats.find(s => s._id === 'Advance')?.totalAmount || 0,
                salaryCount: yearlyStats.find(s => s._id === 'Salary')?.count || 0,
                advanceCount: yearlyStats.find(s => s._id === 'Advance')?.count || 0
            },
            topEmployees
        };

        stats.monthly.totalPaid = stats.monthly.totalSalary + stats.monthly.totalAdvances;
        stats.yearly.totalPaid = stats.yearly.totalSalary + stats.yearly.totalAdvances;

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Employee ledger stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee ledger stats',
            error: error.message
        });
    }
};
