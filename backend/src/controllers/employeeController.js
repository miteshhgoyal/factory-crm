import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import CashFlow from '../models/CashFlow.js';
import mongoose from 'mongoose';
import { createNotification } from './notificationController.js';

const generateEmployeeId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
    const generatedId = `EMP${year}${month}${random}`;
    return generatedId;
};

// Create Employee
export const createEmployee = async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            aadharNo,
            panNo,
            paymentType,
            basicSalary,
            hourlyRate,
            workingDays,
            workingHours,
            bankAccount
        } = req.body;

        // Validate required fields
        if (!name || !phone || !paymentType) {
            return res.status(400).json({
                success: false,
                message: 'Name, employee ID, phone, and payment type are required'
            });
        }

        let employeeId = generateEmployeeId();
        let existingEmployee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });

        while (existingEmployee) {
            employeeId = generateEmployeeId();
            existingEmployee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
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
            workingHours: workingHours || 9,
            bankAccount,
            isActive: true,
            companyId: req.user.currentSelectedCompany,
        });

        await employee.save();

        if (req.user.role !== 'superadmin')
            await createNotification(
                `New Employee Created by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'Employee',
                employee._id
            );

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
            limit = 50,
            search,
            paymentType,
            isActive,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = { companyId: req.user.currentSelectedCompany, };

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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }

        const employee = await Employee.findById(id);

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
                        employeeId: id,
                        date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany,
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
                        date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany,
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

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID format'
            });
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.createdAt;
        delete updateData._id;

        // Validate and format employeeId if provided
        if (updateData.employeeId) {
            const existingEmployee = await Employee.findOne({
                employeeId: updateData.employeeId.toUpperCase(),
                _id: { $ne: id },
                companyId: req.user.currentSelectedCompany,
            });

            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists. Please choose a different ID.'
                });
            }

            updateData.employeeId = updateData.employeeId.toUpperCase().trim();
        }

        // Validate phone number format
        if (updateData.phone) {
            const phoneRegex = /^\d{10}$/;
            const cleanPhone = updateData.phone.replace(/\D/g, '');

            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number must be exactly 10 digits'
                });
            }
            updateData.phone = cleanPhone;
        }

        // Validate Aadhar number if provided
        if (updateData.aadharNo) {
            const aadharRegex = /^\d{12}$/;
            const cleanAadhar = updateData.aadharNo.replace(/\D/g, '');

            if (cleanAadhar && !aadharRegex.test(cleanAadhar)) {
                return res.status(400).json({
                    success: false,
                    message: 'Aadhar number must be exactly 12 digits'
                });
            }
            updateData.aadharNo = cleanAadhar || undefined;
        }

        // Validate PAN number if provided
        if (updateData.panNo) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            const cleanPan = updateData.panNo.toUpperCase().trim();

            if (cleanPan && !panRegex.test(cleanPan)) {
                return res.status(400).json({
                    success: false,
                    message: 'PAN number format is invalid. Format: ABCDE1234F'
                });
            }
            updateData.panNo = cleanPan || undefined;
        }

        // Validate payment type specific fields
        if (updateData.paymentType) {
            if (updateData.paymentType === 'fixed') {
                if (!updateData.basicSalary || updateData.basicSalary <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Basic salary must be greater than 0 for fixed payment type'
                    });
                }
                // Clear hourly rate when switching to fixed
                updateData.hourlyRate = undefined;
            } else if (updateData.paymentType === 'hourly') {
                if (!updateData.hourlyRate || updateData.hourlyRate <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Hourly rate must be greater than 0 for hourly payment type'
                    });
                }
                // Clear basic salary when switching to hourly
                updateData.basicSalary = undefined;
            }
        }

        // Validate working days and hours
        if (updateData.workingDays !== undefined) {
            const workingDays = parseInt(updateData.workingDays);
            if (workingDays < 1 || workingDays > 31) {
                return res.status(400).json({
                    success: false,
                    message: 'Working days must be between 1 and 31'
                });
            }
            updateData.workingDays = workingDays;
        }

        if (updateData.workingHours !== undefined) {
            const workingHours = parseInt(updateData.workingHours);
            if (workingHours < 1 || workingHours > 24) {
                return res.status(400).json({
                    success: false,
                    message: 'Working hours must be between 1 and 24'
                });
            }
            updateData.workingHours = workingHours;
        }

        // Handle bank account data
        if (updateData.bankAccount) {
            const { accountNo, ifsc, bankName, branch } = updateData.bankAccount;

            // If all bank fields are empty, remove bank account entirely
            if (!accountNo && !ifsc && !bankName && !branch) {
                updateData.bankAccount = undefined;
            } else {
                // Validate IFSC format if provided
                if (ifsc) {
                    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                    const cleanIfsc = ifsc.toUpperCase().trim();

                    if (!ifscRegex.test(cleanIfsc)) {
                        return res.status(400).json({
                            success: false,
                            message: 'IFSC code format is invalid. Format: ABCD0123456'
                        });
                    }
                    updateData.bankAccount.ifsc = cleanIfsc;
                }

                // Clean and format other bank fields
                if (accountNo) updateData.bankAccount.accountNo = accountNo.trim();
                if (bankName) updateData.bankAccount.bankName = bankName.trim();
                if (branch) updateData.bankAccount.branch = branch.trim();
            }
        }

        // Handle join date
        if (updateData.joinDate) {
            const joinDate = new Date(updateData.joinDate);
            if (isNaN(joinDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid join date format'
                });
            }
            updateData.joinDate = joinDate;
        }

        // Update the employee
        const employee = await Employee.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updatedAt: new Date()
            },
            {
                new: true,
                runValidators: true,
                context: 'query' // This ensures conditional validators work properly
            }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found. The employee may have been deleted.'
            });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully',
            data: {
                employee,
                updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt')
            }
        });

    } catch (error) {
        console.error('Update employee error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists. Please choose a different value.`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update employee. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Toggle Employee Status (Activate/Deactivate)
export const toggleEmployeeStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }

        const employee = await Employee.findById(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            {
                isActive: !employee.isActive,
                updatedAt: new Date()
            },
            { new: true }
        );

        res.json({
            success: true,
            message: `Employee ${updatedEmployee.isActive ? 'activated' : 'deactivated'} successfully`,
            data: updatedEmployee
        });

    } catch (error) {
        console.error('Toggle employee status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update employee status',
            error: error.message
        });
    }
};

// Delete Employee (Hard delete)
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }

        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully',
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
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
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
                { $match: { companyId: req.user.currentSelectedCompany } },
                {
                    $group: {
                        _id: null,
                        totalEmployees: { $sum: 1 },
                        activeEmployees: { $sum: { $cond: ['$isActive', 1, 0] } },
                        inactiveEmployees: { $sum: { $cond: ['$isActive', 0, 1] } }
                    }
                }
            ]),

            // Today's attendance - Fixed: Moved companyId inside $match
            Attendance.aggregate([
                {
                    $match: {
                        date: { $gte: startOfDay, $lte: endOfDay },
                        companyId: req.user.currentSelectedCompany
                    }
                },
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

            // Monthly salary payments - Fixed: Moved companyId inside $match
            CashFlow.aggregate([
                {
                    $match: {
                        type: 'OUT',
                        category: 'Salary',
                        date: { $gte: startOfMonth },
                        companyId: req.user.currentSelectedCompany
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

            // Payment type breakdown - Fixed: Moved companyId inside $match
            Employee.aggregate([
                {
                    $match: {
                        isActive: true,
                        companyId: req.user.currentSelectedCompany
                    }
                },
                {
                    $group: {
                        _id: '$paymentType',
                        count: { $sum: 1 },
                        avgSalary: { $avg: { $ifNull: ['$basicSalary', '$hourlyRate'] } }
                    }
                }
            ]),

            // Recent employees - Fixed: Moved companyId inside find filter
            Employee.find({ companyId: req.user.currentSelectedCompany })
                .sort({ createdAt: -1 })
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

// Get Employee Salary Summary (Complete Implementation)
export const getEmployeeSalarySummary = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query;
        const currentDate = new Date();
        const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
        const targetYear = year ? parseInt(year) : currentDate.getFullYear();

        // Validate month and year
        if (targetMonth < 0 || targetMonth > 11) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month. Month should be between 1 and 12.'
            });
        }

        if (targetYear < 2020 || targetYear > 2030) {
            return res.status(400).json({
                success: false,
                message: 'Invalid year. Year should be between 2020 and 2030.'
            });
        }

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Build employee filter
        let employeeFilter = { isActive: true, companyId: req.user.currentSelectedCompany, };
        if (employeeId && employeeId !== 'all') {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employee ID'
                });
            }
            employeeFilter._id = new mongoose.Types.ObjectId(employeeId);
        }

        // Get employees
        const employees = await Employee.find(employeeFilter).sort({ name: 1 });

        if (employees.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Get attendance data for the month
        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate },
                    ...(employeeId && employeeId !== 'all' ? {
                        employeeId: new mongoose.Types.ObjectId(employeeId)
                    } : {}), companyId: req.user.currentSelectedCompany,
                }
            },
            {
                $group: {
                    _id: '$employeeId',
                    presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                    totalHours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
                    overtimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } }
                }
            }
        ]);

        // Get salary payments for the month
        const salaryPayments = await CashFlow.find({
            type: 'OUT',
            category: 'Salary',
            date: { $gte: startDate, $lte: endDate },
            companyId: req.user.currentSelectedCompany,
        }).sort({ date: -1 });

        // Get advance payments for the month
        const advancePayments = await CashFlow.find({
            type: 'OUT',
            category: 'Advance',
            date: { $gte: startDate, $lte: endDate },
            companyId: req.user.currentSelectedCompany,
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

            // Filter payments for this specific employee
            const payments = salaryPayments.filter(p =>
                p.employeeName === employee.name ||
                p.description?.includes(employee.name) ||
                p.description?.includes(employee.employeeId)
            );

            const advances = advancePayments.filter(p =>
                p.employeeName === employee.name ||
                p.description?.includes(employee.name) ||
                p.description?.includes(employee.employeeId)
            );

            const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const totalAdvances = advances.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Calculate expected salary
            let expectedSalary = 0;
            const totalDaysInMonth = endDate.getDate();

            if (employee.paymentType === 'fixed') {
                const dailyRate = (employee.basicSalary || 0) / (employee.workingDays || 26);
                expectedSalary = dailyRate * attendance.presentDays;
            } else if (employee.paymentType === 'hourly') {
                const regularHours = Math.max(0, attendance.totalHours - (attendance.overtimeHours || 0));
                const overtimeAmount = (attendance.overtimeHours || 0) * (employee.hourlyRate || 0);
                expectedSalary = (regularHours * (employee.hourlyRate || 0)) + overtimeAmount;
            }

            const grossAmount = Math.round(expectedSalary);
            const netAmount = Math.round(Math.max(0, expectedSalary - totalAdvances));
            const isPaid = totalPaid >= netAmount && netAmount > 0;

            return {
                _id: `${employee._id}_${targetMonth + 1}_${targetYear}`,
                employee: {
                    _id: employee._id,
                    name: employee.name,
                    employeeId: employee.employeeId,
                    paymentType: employee.paymentType,
                    basicSalary: employee.basicSalary,
                    hourlyRate: employee.hourlyRate,
                    workingDays: employee.workingDays,
                    workingHours: employee.workingHours,
                },
                month: targetMonth + 1,
                year: targetYear,
                totalDays: totalDaysInMonth,
                presentDays: attendance.presentDays,
                absentDays: totalDaysInMonth - attendance.presentDays,
                totalHours: attendance.totalHours || 0,
                overtimeHours: attendance.overtimeHours || 0,
                basicSalary: employee.paymentType === 'fixed' ? employee.basicSalary : employee.hourlyRate,
                grossAmount,
                advanceDeducted: totalAdvances,
                otherDeductions: 0,
                bonus: 0,
                netAmount,
                isPaid,
                paidAmount: totalPaid,
                paidDate: payments.length > 0 ? payments[0].date : null,
                payments: payments.map(p => ({
                    _id: p._id,
                    amount: p.amount,
                    date: p.date,
                    paymentMode: p.paymentMode,
                    description: p.description
                })),
                advances: advances.map(a => ({
                    _id: a._id,
                    amount: a.amount,
                    date: a.date,
                    description: a.description
                }))
            };
        });

        res.json({
            success: true,
            data: salarySummary,
            metadata: {
                month: targetMonth + 1,
                year: targetYear,
                totalEmployees: employees.length,
                totalRecords: salarySummary.length
            }
        });

    } catch (error) {
        console.error('Employee salary summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee salary summary',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Calculate Monthly Salary (Complete Implementation)
export const calculateMonthlySalary = async (req, res) => {
    try {
        const { month, year, employeeId } = req.body;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const targetMonth = parseInt(month) - 1;
        const targetYear = parseInt(year);
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Build employee filter
        let employeeFilter = { isActive: true, companyId: req.user.currentSelectedCompany, };
        if (employeeId && employeeId !== 'all') {
            if (!mongoose.Types.ObjectId.isValid(employeeId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid employee ID'
                });
            }
            employeeFilter._id = employeeId;
        }

        const employees = await Employee.find(employeeFilter);

        if (employees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No employees found to calculate salary'
            });
        }

        let calculatedCount = 0;
        const results = [];

        for (const employee of employees) {
            // Get attendance for this employee
            const attendance = await Attendance.aggregate([
                {
                    $match: {
                        employeeId: employee._id,
                        date: { $gte: startDate, $lte: endDate }, companyId: req.user.currentSelectedCompany,
                    }
                },
                {
                    $group: {
                        _id: null,
                        presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' },
                        overtimeHours: { $sum: '$overtimeHours' }
                    }
                }
            ]);

            const attendanceData = attendance[0] || {
                presentDays: 0,
                totalHours: 0,
                overtimeHours: 0
            };

            // Calculate salary
            let grossAmount = 0;
            if (employee.paymentType === 'fixed') {
                const dailyRate = employee.basicSalary / (employee.workingDays || 26);
                grossAmount = dailyRate * attendanceData.presentDays;
            } else if (employee.paymentType === 'hourly') {
                const regularHours = Math.max(0, attendanceData.totalHours - (attendanceData.overtimeHours || 0));
                const overtimeAmount = (attendanceData.overtimeHours || 0) * employee.hourlyRate;
                grossAmount = (regularHours * employee.hourlyRate) + overtimeAmount;
            }

            results.push({
                employee: employee.name,
                employeeId: employee.employeeId,
                presentDays: attendanceData.presentDays,
                totalHours: attendanceData.totalHours,
                grossAmount: Math.round(grossAmount)
            });

            calculatedCount++;
        }

        res.json({
            success: true,
            message: `Salary calculated for ${calculatedCount} employee(s)`,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                calculatedEmployees: calculatedCount,
                results
            }
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

// Mark Salary as Paid (Complete Implementation)
export const markSalaryPaid = async (req, res) => {
    try {
        const { salaryId } = req.params;
        const { amount, paymentMode = 'Cash', description } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid payment amount is required'
            });
        }

        // Parse salary ID to get employee and month/year info
        const salaryIdParts = salaryId.split('_');
        if (salaryIdParts.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Invalid salary record ID format'
            });
        }

        const [employeeId, month, year] = salaryIdParts;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID in salary record'
            });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Validate month and year
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (monthNum < 1 || monthNum > 12 || yearNum < 2020 || yearNum > 2030) {
            return res.status(400).json({
                success: false,
                message: 'Invalid month or year in salary record'
            });
        }

        // Create cash flow entry for salary payment
        const cashFlowEntry = new CashFlow({
            type: 'OUT',
            amount: parseFloat(amount),
            category: 'Salary',
            description: description || `Salary payment for ${employee.name} - ${monthNum}/${yearNum}`,
            employeeName: employee.name,
            paymentMode,
            createdBy: req.user?.userId || new mongoose.Types.ObjectId(),
            date: new Date(),
            companyId: req.user.currentSelectedCompany,
        });

        await cashFlowEntry.save();

        if (req.user.role !== 'superadmin')
            await createNotification(
                `Cash Out Entry Created by marking salary paid by ${req.user.username} (${req.user.email}).`,
                req.user.userId,
                req.user.role,
                req.user.currentSelectedCompany,
                'CashFlow',
                cashFlowEntry._id
            );

        res.json({
            success: true,
            message: 'Salary marked as paid successfully',
            data: {
                employee: employee.name,
                employeeId: employee.employeeId,
                amount: parseFloat(amount),
                paymentMode,
                paymentDate: cashFlowEntry.date,
                cashFlowId: cashFlowEntry._id,
                month: monthNum,
                year: yearNum
            }
        });

    } catch (error) {
        console.error('Mark salary paid error:', error);

        // Handle specific error types
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to mark salary as paid',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Generate Payslip (Complete Implementation)
export const generatePayslip = async (req, res) => {
    try {
        const { salaryId } = req.params;

        // Parse salary ID to get employee and month/year info
        const salaryIdParts = salaryId.split('_');
        if (salaryIdParts.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'Invalid salary record ID format'
            });
        }

        const [employeeId, month, year] = salaryIdParts;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID in salary record'
            });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const targetMonth = parseInt(month) - 1;
        const targetYear = parseInt(year);
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        // Get attendance data
        const attendance = await Attendance.aggregate([
            {
                $match: {
                    employeeId: employee._id,
                    date: { $gte: startDate, $lte: endDate }, companyId: req.user.currentSelectedCompany,
                }
            },
            {
                $group: {
                    _id: null,
                    presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                    totalHours: { $sum: { $ifNull: ['$hoursWorked', 0] } },
                    overtimeHours: { $sum: { $ifNull: ['$overtimeHours', 0] } },
                    attendanceRecords: { $push: '$$ROOT' }
                }
            }
        ]);

        const attendanceData = attendance[0] || {
            presentDays: 0,
            totalHours: 0,
            overtimeHours: 0,
            attendanceRecords: []
        };

        // Get salary payments
        const payments = await CashFlow.find({
            type: 'OUT',
            category: 'Salary',
            employeeName: employee.name,
            date: { $gte: startDate, $lte: endDate },
            companyId: req.user.currentSelectedCompany,
        }).sort({ date: -1 });

        // Get advance payments
        const advances = await CashFlow.find({
            type: 'OUT',
            category: 'Advance',
            employeeName: employee.name,
            date: { $gte: startDate, $lte: endDate },
            companyId: req.user.currentSelectedCompany,
        }).sort({ date: -1 });

        // Calculate salary
        let grossAmount = 0;
        let calculationDetails = {};

        if (employee.paymentType === 'fixed') {
            const dailyRate = (employee.basicSalary || 0) / (employee.workingDays || 26);
            grossAmount = dailyRate * attendanceData.presentDays;
            calculationDetails = {
                type: 'fixed',
                basicSalary: employee.basicSalary,
                workingDays: employee.workingDays,
                dailyRate: Math.round(dailyRate),
                presentDays: attendanceData.presentDays
            };
        } else if (employee.paymentType === 'hourly') {
            const regularHours = Math.max(0, attendanceData.totalHours - (attendanceData.overtimeHours || 0));
            const regularAmount = regularHours * (employee.hourlyRate || 0);
            const overtimeAmount = (attendanceData.overtimeHours || 0) * (employee.hourlyRate || 0);
            grossAmount = regularAmount + overtimeAmount;
            calculationDetails = {
                type: 'hourly',
                hourlyRate: employee.hourlyRate,
                regularHours,
                overtimeHours: attendanceData.overtimeHours,
                regularAmount: Math.round(regularAmount),
                overtimeAmount: Math.round(overtimeAmount)
            };
        }

        const totalAdvances = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
        const totalPaid = payments.reduce((sum, pay) => sum + (pay.amount || 0), 0);
        const netAmount = Math.max(0, grossAmount - totalAdvances);

        const payslipData = {
            employee: {
                _id: employee._id,
                name: employee.name,
                employeeId: employee.employeeId,
                paymentType: employee.paymentType,
                basicSalary: employee.basicSalary,
                hourlyRate: employee.hourlyRate,
                workingDays: employee.workingDays,
                workingHours: employee.workingHours,
            },
            period: {
                month: parseInt(month),
                year: parseInt(year),
                monthName: new Date(targetYear, targetMonth).toLocaleString('default', { month: 'long' }),
                startDate,
                endDate
            },
            attendance: {
                totalDays: endDate.getDate(),
                presentDays: attendanceData.presentDays,
                absentDays: endDate.getDate() - attendanceData.presentDays,
                totalHours: attendanceData.totalHours,
                overtimeHours: attendanceData.overtimeHours,
                attendancePercentage: Math.round((attendanceData.presentDays / endDate.getDate()) * 100)
            },
            salary: {
                grossAmount: Math.round(grossAmount),
                advanceDeducted: totalAdvances,
                otherDeductions: 0,
                bonus: 0,
                netAmount: Math.round(netAmount),
                isPaid: totalPaid >= netAmount && netAmount > 0,
                paidAmount: totalPaid,
                pendingAmount: Math.max(0, netAmount - totalPaid)
            },
            calculationDetails,
            payments: payments.map(p => ({
                _id: p._id,
                amount: p.amount,
                date: p.date,
                paymentMode: p.paymentMode,
                description: p.description
            })),
            advances: advances.map(a => ({
                _id: a._id,
                amount: a.amount,
                date: a.date,
                description: a.description
            })),
            generatedAt: new Date(),
            generatedBy: req.user?.userId || null
        };

        res.json({
            success: true,
            message: 'Payslip generated successfully',
            data: payslipData
        });

    } catch (error) {
        console.error('Generate payslip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payslip',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};