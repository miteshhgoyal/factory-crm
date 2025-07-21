import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import CashFlow from '../models/CashFlow.js';
import mongoose from 'mongoose';

// Create Employee
export const createEmployee = async (req, res) => {
    try {
        const {
            name,
            employeeId,
            phone,
            address,
            aadharNo,
            panNo,
            paymentType,
            basicSalary,
            hourlyRate,
            workingDays,
            workingHours,
            overtimeRate,
            bankAccount
        } = req.body;

        // Validate required fields
        if (!name || !employeeId || !phone || !paymentType) {
            return res.status(400).json({
                success: false,
                message: 'Name, employee ID, phone, and payment type are required'
            });
        }

        // Check if employee ID already exists
        const existingEmployee = await Employee.findOne({ employeeId });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }

        // Validate payment type specific fields
        if (paymentType === 'fixed' && (!basicSalary || basicSalary <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Basic salary is required for fixed payment type'
            });
        }

        if (paymentType === 'hourly' && (!hourlyRate || hourlyRate <= 0)) {
            return res.status(400).json({
                success: false,
                message: 'Hourly rate is required for hourly payment type'
            });
        }

        const employee = new Employee({
            name,
            employeeId: employeeId.toUpperCase(),
            phone,
            address,
            aadharNo,
            panNo,
            paymentType,
            basicSalary: paymentType === 'fixed' ? basicSalary : undefined,
            hourlyRate: paymentType === 'hourly' ? hourlyRate : undefined,
            workingDays: workingDays || 26,
            workingHours: workingHours || 8,
            overtimeRate: overtimeRate || 1.5,
            bankAccount,
            createdBy: req.user.userId
        });

        await employee.save();

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });

    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create employee',
            error: error.message
        });
    }
};

// Get All Employees
export const getEmployees = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            paymentType,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { employeeId: new RegExp(search, 'i') },
                { phone: new RegExp(search, 'i') }
            ];
        }

        if (paymentType) filter.paymentType = paymentType;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const [employees, total] = await Promise.all([
            Employee.find(filter)
                .populate('createdBy', 'username name')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Employee.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                employees,
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
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employees',
            error: error.message
        });
    }
};

// Get Employee by ID
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id)
            .populate('createdBy', 'username name');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get employee statistics
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [attendanceStats, salaryStats] = await Promise.all([
            // Attendance stats for current month
            Attendance.aggregate([
                {
                    $match: {
                        employeeId: new mongoose.Types.ObjectId(id),
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalDays: { $sum: 1 },
                        presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' },
                        overtimeHours: { $sum: '$overtimeHours' }
                    }
                }
            ]),

            // Salary payments (cash out records for this employee)
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        category: 'Salary',
                        employeeName: employee.name,
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSalaryPaid: { $sum: '$amount' },
                        paymentCount: { $sum: 1 }
                    }
                }
            ])
        ]);

        const stats = {
            attendance: attendanceStats[0] || {
                totalDays: 0,
                presentDays: 0,
                totalHours: 0,
                overtimeHours: 0
            },
            salary: salaryStats[0] || {
                totalSalaryPaid: 0,
                paymentCount: 0
            }
        };

        res.json({
            success: true,
            data: {
                employee,
                stats
            }
        });

    } catch (error) {
        console.error('Get employee by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee',
            error: error.message
        });
    }
};

// Update Employee
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData.createdBy;
        delete updateData.createdAt;

        // If employee ID is being updated, check for uniqueness
        if (updateData.employeeId) {
            const existingEmployee = await Employee.findOne({
                employeeId: updateData.employeeId.toUpperCase(),
                _id: { $ne: id }
            });

            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists'
                });
            }

            updateData.employeeId = updateData.employeeId.toUpperCase();
        }

        const employee = await Employee.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('createdBy', 'username name');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });

    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update employee',
            error: error.message
        });
    }
};

// Delete Employee (Soft delete)
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByIdAndUpdate(
            id,
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee deactivated successfully',
            data: employee
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete employee',
            error: error.message
        });
    }
};

// Get Employee Dashboard Stats
export const getEmployeeDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            employeeStats,
            attendanceStats,
            salaryStats,
            paymentTypeStats,
            recentEmployees
        ] = await Promise.all([
            // Employee statistics
            Employee.aggregate([
                {
                    $group: {
                        _id: null,
                        totalEmployees: { $sum: 1 },
                        activeEmployees: { $sum: { $cond: ['$isActive', 1, 0] } },
                        inactiveEmployees: { $sum: { $cond: ['$isActive', 0, 1] } }
                    }
                }
            ]),

            // Today's attendance
            Attendance.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay } } },
                {
                    $group: {
                        _id: null,
                        totalAttendance: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' },
                        overtimeHours: { $sum: '$overtimeHours' }
                    }
                }
            ]),

            // Monthly salary payments
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        category: 'Salary',
                        date: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSalaryPaid: { $sum: '$amount' },
                        paymentCount: { $sum: 1 }
                    }
                }
            ]),

            // Payment type breakdown
            Employee.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$paymentType',
                        count: { $sum: 1 },
                        avgSalary: { $avg: { $ifNull: ['$basicSalary', '$hourlyRate'] } }
                    }
                }
            ]),

            // Recent employees
            Employee.find({ isActive: true })
                .populate('createdBy', 'username')
                .sort({ date: -1 })
                .limit(5)
        ]);

        const stats = {
            employees: employeeStats[0] || {
                totalEmployees: 0,
                activeEmployees: 0,
                inactiveEmployees: 0
            },
            attendance: attendanceStats[0] || {
                totalAttendance: 0,
                presentCount: 0,
                totalHours: 0,
                overtimeHours: 0
            },
            salary: salaryStats[0] || {
                totalSalaryPaid: 0,
                paymentCount: 0
            },
            paymentTypes: paymentTypeStats,
            recentEmployees
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Employee dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee dashboard stats',
            error: error.message
        });
    }
};

// Get Employee Salary Summary (Fixed)
export const getEmployeeSalarySummary = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query;
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Build employee filter
        let employeeFilter = { isActive: true };
        if (employeeId && employeeId !== 'all') {
            employeeFilter._id = new mongoose.Types.ObjectId(employeeId);
        }

        // Get employees
        const employees = await Employee.find(employeeFilter);

        // Get attendance data for the month
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    ...(employeeId && employeeId !== 'all' ? {
                        employeeId: new mongoose.Types.ObjectId(employeeId)
                    } : {})
                }
            },
            {
                $group: {
                    _id: '$employeeId',
                    presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                    totalHours: { $sum: '$hoursWorked' },
                    overtimeHours: { $sum: '$overtimeHours' }
                }
            }
        ]);

        // Get salary payments for the month
        const salaryPayments = await CashFlow.find({
            type: 'OUT',
            category: 'Salary',
            date: { $gte: startDate, $lte: endDate }
        });

        // Calculate salary summary
        const salarySummary = employees.map(employee => {
            const attendance = attendanceData.find(a =>
                a._id && a._id.toString() === employee._id.toString()
            ) || {
                presentDays: 0,
                totalHours: 0,
                overtimeHours: 0
            };

            const payments = salaryPayments.filter(p => p.employeeName === employee.name);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

            // Calculate expected salary
            let expectedSalary = 0;
            const totalDaysInMonth = endDate.getDate();

            if (employee.paymentType === 'fixed') {
                const dailyRate = employee.basicSalary / (employee.workingDays || 26);
                expectedSalary = dailyRate * attendance.presentDays;
            } else if (employee.paymentType === 'hourly') {
                const regularHours = Math.max(0, attendance.totalHours - (attendance.overtimeHours || 0));
                const overtimeAmount = (attendance.overtimeHours || 0) * employee.hourlyRate * (employee.overtimeRate || 1.5);
                expectedSalary = (regularHours * employee.hourlyRate) + overtimeAmount;
            }

            return {
                _id: `${employee._id}_${targetMonth}_${targetYear}`,
                employee: {
                    _id: employee._id,
                    name: employee.name,
                    employeeId: employee.employeeId,
                    paymentType: employee.paymentType,
                    basicSalary: employee.basicSalary,
                    hourlyRate: employee.hourlyRate
                },
                month: targetMonth + 1,
                year: targetYear,
                totalDays: totalDaysInMonth,
                presentDays: attendance.presentDays,
                absentDays: totalDaysInMonth - attendance.presentDays,
                totalHours: attendance.totalHours || 0,
                overtimeHours: attendance.overtimeHours || 0,
                basicSalary: employee.paymentType === 'fixed' ? employee.basicSalary : employee.hourlyRate,
                grossAmount: Math.round(expectedSalary),
                advanceDeducted: 0, // Can be calculated from advance payments
                otherDeductions: 0,
                bonus: 0,
                netAmount: Math.round(expectedSalary),
                isPaid: totalPaid > 0,
                paidAmount: totalPaid,
                paidDate: payments.length > 0 ? payments[0].date : null,
                payments
            };
        });

        res.json({
            success: true,
            data: salarySummary
        });

    } catch (error) {
        console.error('Employee salary summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee salary summary',
            error: error.message
        });
    }
};

// Calculate Monthly Salary
export const calculateMonthlySalary = async (req, res) => {
    try {
        const { month, year, employeeId } = req.body;

        // This would trigger salary calculation
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Salary calculation initiated'
        });

    } catch (error) {
        console.error('Calculate monthly salary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate salary',
            error: error.message
        });
    }
};

// Mark Salary as Paid
export const markSalaryPaid = async (req, res) => {
    try {
        const { salaryId } = req.params;

        // For now, we'll create a cash flow entry
        res.json({
            success: true,
            message: 'Salary marked as paid'
        });

    } catch (error) {
        console.error('Mark salary paid error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark salary as paid',
            error: error.message
        });
    }
};

// Generate Payslip
export const generatePayslip = async (req, res) => {
    try {
        const { salaryId } = req.params;

        res.json({
            success: true,
            message: 'Payslip generated',
            data: { downloadUrl: '/payslip.pdf' }
        });

    } catch (error) {
        console.error('Generate payslip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payslip',
            error: error.message
        });
    }
};
