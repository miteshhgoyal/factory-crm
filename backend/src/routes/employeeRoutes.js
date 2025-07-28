import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus,
    getEmployeeDashboardStats,
    getEmployeeSalarySummary,
    calculateMonthlySalary,
    markSalaryPaid,
    generatePayslip
} from '../controllers/employeeController.js';
import { authenticateToken, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All employee routes require authentication
router.use(authenticateToken);

// Create employee
router.post('/', authorize(['superadmin', 'admin', 'subadmin']), createEmployee);

// Get all employees with pagination and filters
router.get('/', authorize(['superadmin', 'admin', 'subadmin']), getEmployees);

// Get employee dashboard statistics
router.get('/dashboard/stats', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeDashboardStats);

// Get employee salary summary
router.get('/salary/summary', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeSalarySummary);

// Calculate monthly salary
router.post('/salary/calculate', authorize(['superadmin', 'admin', 'subadmin']), calculateMonthlySalary);

// Mark salary as paid
router.put('/salary/:salaryId/paid', authorize(['superadmin', 'admin']), markSalaryPaid);

// Generate payslip
router.get('/salary/:salaryId/payslip', authorize(['superadmin', 'admin', 'subadmin']), generatePayslip);

// Get employee by ID
router.get('/:id', authorize(['superadmin', 'admin', 'subadmin']), getEmployeeById);

// Update employee (only superadmin can edit)
router.put('/:id', authorize(['superadmin']), updateEmployee);

// Toggle employee status (activate/deactivate)
router.patch('/:id/toggle-status', authorize(['superadmin', 'admin']), toggleEmployeeStatus);

// Delete employee (hard delete - only superadmin)
router.delete('/:id', authorize(['superadmin']), deleteEmployee);

export default router;