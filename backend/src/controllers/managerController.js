import Manager from '../models/Manager.js';
import Employee from '../models/Employee.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

// Allocate budget to manager
export const allocateBudget = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can allocate budgets'
            });
        }

        const { employeeId, allocatedBudget, month, year } = req.body;

        // Check if allocation already exists
        const existingAllocation = await Manager.findOne({
            employeeId,
            month,
            year
        });

        if (existingAllocation) {
            return res.status(400).json({
                success: false,
                message: 'Budget already allocated for this month'
            });
        }

        const manager = new Manager({
            employeeId,
            userId: req.user.userId,
            allocatedBudget,
            remainingAmount: allocatedBudget,
            month,
            year,
            createdBy: req.user.userId
        });

        await manager.save();

        const populatedManager = await Manager.findById(manager._id)
            .populate('employeeId', 'name employeeId')
            .populate('createdBy', 'username name');

        res.status(201).json({
            success: true,
            message: 'Budget allocated successfully',
            data: populatedManager
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to allocate budget',
            error: error.message
        });
    }
};

// Get manager expenses
export const getManagerExpenses = async (req, res) => {
    try {
        const { managerId } = req.params;
        const { month, year } = req.query;

        const manager = await Manager.findById(managerId)
            .populate('employeeId', 'name employeeId');

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager allocation not found'
            });
        }

        // Get expenses for this manager
        const expenses = await Expense.find({
            managerId,
            isManagerExpense: true
        }).populate('createdBy', 'username name');

        res.json({
            success: true,
            data: {
                manager,
                expenses,
                summary: {
                    allocatedBudget: manager.allocatedBudget,
                    spentAmount: manager.spentAmount,
                    remainingAmount: manager.remainingAmount,
                    isReconciled: manager.isReconciled
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch manager expenses',
            error: error.message
        });
    }
};

// Reconcile manager expenses
export const reconcileManagerExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can reconcile expenses'
            });
        }

        const { managerId } = req.params;
        const { notes } = req.body;

        const manager = await Manager.findById(managerId)
            .populate('employeeId', 'name employeeId basicSalary');

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager allocation not found'
            });
        }

        // Calculate total expenses
        const totalExpenses = await Expense.aggregate([
            {
                $match: {
                    managerId: manager._id,
                    isManagerExpense: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const spentAmount = totalExpenses[0]?.totalAmount || 0;
        const remainingAmount = manager.allocatedBudget - spentAmount;

        // Update manager record
        manager.spentAmount = spentAmount;
        manager.remainingAmount = remainingAmount;
        manager.salaryAdjustment = remainingAmount > 0 ? remainingAmount : 0;
        manager.isReconciled = true;
        manager.reconciledBy = req.user.userId;
        manager.reconciledDate = new Date();
        manager.notes = notes;

        await manager.save();

        // TODO: Update employee salary with adjustment
        // This would integrate with your salary management system

        res.json({
            success: true,
            message: 'Manager expenses reconciled successfully',
            data: manager
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reconcile expenses',
            error: error.message
        });
    }
};

// Get manager dashboard stats
export const getManagerDashboardStats = async (req, res) => {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const [
            totalManagers,
            currentMonthAllocations,
            pendingReconciliations,
            totalAllocatedBudget
        ] = await Promise.all([
            Manager.distinct('employeeId').then(ids => ids.length),

            Manager.countDocuments({
                month: currentMonth,
                year: currentYear
            }),

            Manager.countDocuments({
                isReconciled: false
            }),

            Manager.aggregate([
                {
                    $match: {
                        month: currentMonth,
                        year: currentYear
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalBudget: { $sum: '$allocatedBudget' },
                        totalSpent: { $sum: '$spentAmount' },
                        totalRemaining: { $sum: '$remainingAmount' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalManagers,
                currentMonthAllocations,
                pendingReconciliations,
                budget: totalAllocatedBudget[0] || {
                    totalBudget: 0,
                    totalSpent: 0,
                    totalRemaining: 0
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch manager dashboard stats',
            error: error.message
        });
    }
};
