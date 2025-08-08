import express from 'express';
import {
    markAttendance,
    updateAttendance,
    getAttendanceRecords,
    getAttendanceDashboardStats,
    getCalendarData,
    deleteAttendance,
    getEmployeeAttendanceSummary,
    getAttendanceByDate
} from '../controllers/attendanceController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All attendance routes require authentication
router.use(authenticateToken);

// Mark attendance
router.post('/', authorize(['superadmin', 'admin', 'subadmin']), markAttendance);

// Get attendance records with pagination and filters
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getAttendanceRecords);

// FOR BY-DATE ATTENDANCE
router.get('/by-date', authorize(['superadmin', 'admin', 'subadmin']), getAttendanceByDate);

// Get attendance dashboard statistics
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getAttendanceDashboardStats);

// Get calendar data
router.get('/calendar', authorize(['superadmin', 'admin', 'subadmin']), getCalendarData);

// Get employee attendance summary
router.get('/employee/:employeeId/summary', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeAttendanceSummary);

// Update attendance record
router.put('/:id', authorize(['superadmin', 'admin', 'subadmin']), updateAttendance);

// Delete attendance record (superadmin only)
router.delete('/:id', authorize(['superadmin']), deleteAttendance);

export default router;
