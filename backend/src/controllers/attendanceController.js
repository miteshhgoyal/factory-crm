import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import CashFlow from '../models/CashFlow.js';

const calculateEmployeeSalary = (employee, attendanceData, currentDate, totalDaysInMonth) => {
    const workingDaysPerMonth = employee.workingDays || 30;
    const workingHoursPerDay = employee.workingHours || 9;

    let calculations = {
        basicInfo: {
            paymentType: employee.paymentType,
            basicSalary: employee.basicSalary || 0,
            hourlyRate: employee.hourlyRate || 0,
            workingDaysPerMonth,
            workingHoursPerDay
        },
        attendance: {
            totalDays: totalDaysInMonth,
            presentDays: attendanceData.presentDays || 0,
            absentDays: totalDaysInMonth - (attendanceData.presentDays || 0),
            totalHours: attendanceData.totalHours || 0,
            attendancePercentage: ((attendanceData.presentDays || 0) / totalDaysInMonth * 100).toFixed(1)
        },
        salary: {}
    };

    if (employee.paymentType === 'fixed') {
        const dailyRate = employee.basicSalary / workingDaysPerMonth;
        const hourlyRate = dailyRate / workingHoursPerDay;
        const expectedHours = calculations.attendance.presentDays * workingHoursPerDay;

        const overtimeHours = Math.max(0, calculations.attendance.totalHours - expectedHours);
        const undertimeHours = Math.max(0, expectedHours - calculations.attendance.totalHours);

        const baseSalary = calculations.attendance.presentDays * dailyRate;
        const overtimePay = overtimeHours * hourlyRate * 1.5;
        const undertimeDeduction = undertimeHours * hourlyRate;

        const grossSalary = baseSalary + overtimePay - undertimeDeduction;

        calculations.salary = {
            dailyRate: Math.round(dailyRate),
            hourlyRate: Math.round(hourlyRate),
            expectedHours,
            overtimeHours,
            undertimeHours,
            baseSalary: Math.round(baseSalary),
            overtimePay: Math.round(overtimePay),
            undertimeDeduction: Math.round(undertimeDeduction),
            grossSalary: Math.round(grossSalary)
        };
    } else if (employee.paymentType === 'hourly') {
        const grossSalary = calculations.attendance.totalHours * employee.hourlyRate;
        const expectedHours = calculations.attendance.presentDays * workingHoursPerDay;

        calculations.salary = {
            hourlyRate: employee.hourlyRate,
            expectedHours,
            grossSalary: Math.round(grossSalary),
            dailyEquivalent: Math.round(employee.hourlyRate * workingHoursPerDay),
            monthlyEquivalent: Math.round(employee.hourlyRate * workingHoursPerDay * workingDaysPerMonth)
        };
    }

    return calculations;
};

// Mark Attendance
export const markAttendance = async (req, res) => {
    try {
        const {
            employeeId,
            date,
            isPresent,
            hoursWorked,
            notes
        } = req.body;

        // Validate required fields
        if (!employeeId || !date) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID and date are required'
            });
        }

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if attendance already exists for this employee on this date
        const existingAttendance = await Attendance.findOne({
            employeeId,
            date: new Date(date)
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this employee on this date'
            });
        }

        const attendance = new Attendance({
            employeeId,
            date: new Date(date),
            isPresent: isPresent || false,
            hoursWorked: hoursWorked || 0,
            notes,
            markedBy: req.user.userId,
            companyId: req.user.currentSelectedCompany,
        });

        await attendance.save();

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('employeeId', 'name employeeId')
            .populate('markedBy', 'username name');

        res.status(201).json({
            success: true,
            message: 'Attendance marked successfully',
            data: populatedAttendance
        });

    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message
        });
    }
};

// Update Attendance
export const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData.markedBy;
        delete updateData.createdAt;

        const attendance = await Attendance.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('employeeId', 'name employeeId')
            .populate('markedBy', 'username name');

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: attendance
        });

    } catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update attendance',
            error: error.message
        });
    }
};

// Get Attendance Records
export const getAttendanceRecords = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            employeeId,
            startDate,
            endDate,
            isPresent
        } = req.query;

        // Build filter object
        const filter = { companyId: req.user.currentSelectedCompany };

        if (employeeId) filter.employeeId = employeeId;
        if (isPresent !== undefined && isPresent !== '') {
            filter.isPresent = isPresent === 'true';
        }

        // Date filtering
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .populate('employeeId', 'name employeeId phone')
                .populate('markedBy', 'username name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                records,
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
        console.error('Get attendance records error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance records',
            error: error.message
        });
    }
};

export const getAttendanceByDate = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendanceRecords = await Attendance.find({
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            companyId: req.user.currentSelectedCompany,
        }).populate('employeeId', 'name employeeId');

        res.json({
            success: true,
            data: attendanceRecords
        });

    } catch (error) {
        console.error('Get attendance by date error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance records',
            error: error.message
        });
    }
};

// Get Attendance Dashboard Stats
export const getAttendanceDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

        const [
            todayStats,
            monthlyStats,
            weeklyStats,
            employeeStats,
            recentAttendance,
            attendanceTrends
        ] = await Promise.all([
            // Today's attendance
            Attendance.aggregate([
                { $match: { date: { $gte: startOfDay, $lte: endOfDay }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        absentCount: { $sum: { $cond: ['$isPresent', 0, 1] } },
                        totalHours: { $sum: '$hoursWorked' }
                    }
                }
            ]),

            // Monthly stats
            Attendance.aggregate([
                { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        absentCount: { $sum: { $cond: ['$isPresent', 0, 1] } },
                        totalHours: { $sum: '$hoursWorked' },
                        avgHours: { $avg: '$hoursWorked' }
                    }
                }
            ]),

            // Weekly stats
            Attendance.aggregate([
                { $match: { date: { $gte: startOfWeek }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: null,
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' }
                    }
                }
            ]),

            // Employee attendance summary
            Attendance.aggregate([
                { $match: { date: { $gte: startOfMonth }, companyId: req.user.currentSelectedCompany, } },
                {
                    $group: {
                        _id: '$employeeId',
                        totalDays: { $sum: 1 },
                        presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' }
                    }
                },
                {
                    $lookup: {
                        from: 'employees',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'employee'
                    }
                },
                { $unwind: '$employee' },
                { $sort: { presentDays: -1 } },
                { $limit: 5 }
            ]),

            // Recent attendance records
            Attendance.find({ companyId: req.user.currentSelectedCompany, })
                .populate('employeeId', 'name employeeId')
                .populate('markedBy', 'username')
                .sort({ date: -1 })
                .limit(5),

            // Daily attendance trends (last 7 days)
            Attendance.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        }, companyId: req.user.currentSelectedCompany,
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            day: { $dayOfMonth: '$date' }
                        },
                        totalMarked: { $sum: 1 },
                        presentCount: { $sum: { $cond: ['$isPresent', 1, 0] } },
                        totalHours: { $sum: '$hoursWorked' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                today: todayStats[0] || {
                    totalMarked: 0,
                    presentCount: 0,
                    absentCount: 0,
                    totalHours: 0
                },
                monthly: monthlyStats[0] || {
                    totalMarked: 0,
                    presentCount: 0,
                    absentCount: 0,
                    totalHours: 0,
                    avgHours: 0
                },
                weekly: weeklyStats[0] || {
                    totalMarked: 0,
                    presentCount: 0,
                    totalHours: 0
                },
                topEmployees: employeeStats,
                recentAttendance,
                attendanceTrends
            }
        });

    } catch (error) {
        console.error('Attendance dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance dashboard stats',
            error: error.message
        });
    }
};

// Get Calendar Data
export const getCalendarData = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query;

        const targetDate = new Date(year || new Date().getFullYear(), (month - 1) || new Date().getMonth(), 1);
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        const filter = {
            date: { $gte: startOfMonth, $lte: endOfMonth },
            companyId: req.user.currentSelectedCompany,
        };

        if (employeeId) {
            filter.employeeId = employeeId;
        }

        const attendanceData = await Attendance.find(filter)
            .populate('employeeId', 'name employeeId')
            .sort({ date: 1 });

        // Group by date
        const calendarData = {};
        attendanceData.forEach(record => {
            const dateKey = record.date.toISOString().split('T')[0];
            if (!calendarData[dateKey]) {
                calendarData[dateKey] = [];
            }
            calendarData[dateKey].push(record);
        });

        res.json({
            success: true,
            data: {
                month: targetDate.getMonth() + 1,
                year: targetDate.getFullYear(),
                calendarData,
                summary: {
                    totalDays: Object.keys(calendarData).length,
                    presentDays: Object.values(calendarData).flat().filter(r => r.isPresent).length,
                    absentDays: Object.values(calendarData).flat().filter(r => !r.isPresent).length
                }
            }
        });

    } catch (error) {
        console.error('Get calendar data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch calendar data',
            error: error.message
        });
    }
};

// Delete Attendance Record
export const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        // Only superadmin can delete attendance records
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete attendance records'
            });
        }

        const attendance = await Attendance.findByIdAndDelete(id);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.json({
            success: true,
            message: 'Attendance record deleted successfully'
        });

    } catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete attendance record',
            error: error.message
        });
    }
};

// Get Employee Attendance Summary
export const getEmployeeAttendanceSummary = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { month, year } = req.query;

        const targetDate = new Date(year || new Date().getFullYear(), (month - 1) || new Date().getMonth(), 1);
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        const summary = await Attendance.aggregate([
            {
                $match: {
                    employeeId: employeeId,
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                    companyId: req.user.currentSelectedCompany,
                }
            },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: 1 },
                    presentDays: { $sum: { $cond: ['$isPresent', 1, 0] } },
                    absentDays: { $sum: { $cond: ['$isPresent', 0, 1] } },
                    totalHours: { $sum: '$hoursWorked' },
                    avgHours: { $avg: '$hoursWorked' }
                }
            }
        ]);

        const employee = await Employee.findById(employeeId);

        res.json({
            success: true,
            data: {
                employee,
                summary: summary[0] || {
                    totalDays: 0,
                    presentDays: 0,
                    absentDays: 0,
                    totalHours: 0,
                    avgHours: 0
                },
                month: targetDate.getMonth() + 1,
                year: targetDate.getFullYear()
            }
        });

    } catch (error) {
        console.error('Get employee attendance summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee attendance summary',
            error: error.message
        });
    }
};

export const getAttendanceSheet = async (req, res) => {
    try {
        const { month, year, employeeId } = req.query;

        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        const today = new Date();
        const currentDate = today.getMonth() === targetMonth && today.getFullYear() === targetYear
            ? today.getDate()
            : endDate.getDate();

        let employeeFilter = { isActive: true, companyId: req.user.currentSelectedCompany };
        if (employeeId && employeeId !== 'all') {
            employeeFilter._id = employeeId;
        }

        const employees = await Employee.find(employeeFilter).sort({ name: 1 });

        const attendanceRecords = await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
            ...(employeeId && employeeId !== 'all' ? {
                employeeId: employeeId
            } : {}),
            companyId: req.user.currentSelectedCompany,
        }).populate('employeeId', 'name employeeId');

        const allCashFlowRecords = await CashFlow.find({
            type: 'OUT',
            $or: [{ category: 'Salary' }, { category: 'Advance' }],
            date: { $gte: startDate, $lte: endDate },
            companyId: req.user.currentSelectedCompany,
        });

        const advancePayments = allCashFlowRecords.filter(p => p.category === 'Advance');
        const salaryPayments = allCashFlowRecords.filter(p => p.category === 'Salary');

        const sheetData = employees.map(employee => {
            // Fix: Use employee._id.toString() for comparison
            const employeeAttendance = attendanceRecords.filter(
                record => record.employeeId && record.employeeId._id.toString() === employee._id.toString()
            );

            const dailyAttendance = {};
            let totalPresent = 0;
            let totalHours = 0;

            // Process attendance records correctly
            employeeAttendance.forEach(record => {
                const day = new Date(record.date).getDate();
                dailyAttendance[day] = {
                    isPresent: record.isPresent,
                    hoursWorked: record.hoursWorked || 0,
                    notes: record.notes
                };
                if (record.isPresent) {
                    totalPresent++;
                    totalHours += record.hoursWorked || 0;
                }
            });

            const attendanceData = { presentDays: totalPresent, totalHours };
            const calculations = calculateEmployeeSalary(employee, attendanceData, currentDate, endDate.getDate());

            const employeeAdvances = advancePayments.filter(payment =>
                payment.employeeName === employee.name ||
                payment.description?.includes(employee.name)
            );

            const employeeSalaryPayments = salaryPayments.filter(payment =>
                payment.employeeName === employee.name ||
                payment.description?.includes(employee.name)
            );

            const totalAdvances = employeeAdvances.reduce((sum, adv) => sum + adv.amount, 0);
            const totalSalaryPaid = employeeSalaryPayments.reduce((sum, sal) => sum + sal.amount, 0);

            const netSalary = calculations.salary.grossSalary - totalAdvances;
            const pendingAmount = netSalary - totalSalaryPaid;

            return {
                employee: {
                    ...employee.toObject(),
                    calculations
                },
                dailyAttendance,
                totalPresent,
                totalAbsent: currentDate - totalPresent,
                totalHours,
                calculations,
                grossSalary: calculations.salary.grossSalary,
                totalAdvances,
                totalSalaryPaid,
                netSalary: Math.round(netSalary),
                pendingAmount: Math.round(pendingAmount),
                advances: employeeAdvances,
                salaryPayments: employeeSalaryPayments
            };
        });

        res.json({
            success: true,
            data: {
                sheetData,
                month: targetMonth + 1,
                year: targetYear,
                totalDays: endDate.getDate(),
                currentDate: currentDate,
                isMonthComplete: currentDate === endDate.getDate() && today > endDate
            }
        });

    } catch (error) {
        console.error('Get attendance sheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance sheet',
            error: error.message
        });
    }
};
