import axios from 'axios';
import { tokenService } from './tokenService';

// Create axios instance with proper base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = tokenService.getToken();
        if (token && !tokenService.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            tokenService.removeToken();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    verifyToken: () => api.get('/auth/verify'),
};

export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getRecentActivities: (limit = 10) => api.get(`/dashboard/activities?limit=${limit}`),
    getQuickStats: () => api.get('/dashboard/quick-stats')
};

export const stockAPI = {
    addStockIn: (data) => api.post('/stock/in', data),
    addStockOut: (data) => api.post('/stock/out', data),
    getTransactions: (params) => api.get('/stock/transactions', { params }),
    getBalance: () => api.get('/stock/balance'),
    getDashboardStats: () => api.get('/stock/dashboard/stats'),
    getProducts: () => api.get('/stock/products')
};

export const cashFlowAPI = {
    addCashIn: (data) => api.post('/cashflow/in', data),
    addCashOut: (data) => api.post('/cashflow/out', data),
    getTransactions: (params) => api.get('/cashflow/transactions', { params }),
    // getDashboardStats: () => api.get('/cashflow/dashboard/stats'),
    getSummary: (params) => api.get('/cashflow/summary', { params }),
    updateTransaction: (id, data) => api.put(`/cashflow/transaction/${id}`, data),
    deleteTransaction: (id) => api.delete(`/cashflow/transaction/${id}`),

    getDashboardStats: () => api.get('/cashflow/dashboard/stats'),
    getPaymentModeAnalytics: (params) => api.get('/cashflow/payment-mode-analytics', { params }),
    getCategoryAnalytics: (params) => api.get('/cashflow/category-analytics', { params }),
    getEmployeeAnalytics: (params) => api.get('/cashflow/employee-analytics', { params }),
    getTrends: (params) => api.get('/cashflow/trends', { params }),
};

export const employeeAPI = {
    getEmployee: (id) => api.get(`/employees/${id}`),
    createEmployee: (data) => api.post('/employees', data),
    updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
    deleteEmployee: (id) => api.delete(`/employees/${id}`),
    getSalaryData: (params) => api.get('/employees/salary', { params }),

    markSalaryPaid: (salaryId, paymentData) =>
        api.put(`/employees/salary/${salaryId}/paid`, paymentData),

    generatePayslip: (salaryId) => api.get(`/employees/salary/${salaryId}/payslip`),
    getEmployeeById: (id) => api.get(`/employees/${id}`),
    getDashboardStats: () => api.get('/employees/dashboard/stats'),
    getSalarySummary: (params) => api.get('/employees/salary/summary', { params }),
    getEmployees: (params) => api.get('/employees', { params }),
    calculateMonthlySalary: (data) => api.post('/employees/salary/calculate', data),
    toggleEmployeeStatus: (id) => api.patch(`/employees/${id}/toggle-status`),
};

export const expenseAPI = {
    addExpense: (data) => api.post('/expenses', data),
    getExpenses: (params) => api.get('/expenses', { params }),
    getExpenseById: (id) => api.get(`/expenses/${id}`),
    updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/expenses/${id}`),
    getDashboardStats: () => api.get('/expenses/dashboard/stats'),
    getCategories: () => api.get('/expenses/categories'),
    getSummary: (params) => api.get('/expenses/summary', { params }),
    getEmployeeAnalytics: (params) => api.get('/expenses/employee-analytics', { params }),
    getTrends: (params) => api.get('/expenses/trends', { params }),
    getComparison: (params) => api.get('/expenses/comparison', { params }),
};

export const attendanceAPI = {
    markAttendance: (data) => api.post('/attendance', data),
    getAttendanceRecords: (params) => api.get('/attendance', { params }),
    updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
    deleteAttendance: (id) => api.delete(`/attendance/${id}`),
    getDashboardStats: () => api.get('/attendance/dashboard/stats'),
    getCalendarData: (params) => api.get('/attendance/calendar', { params }),
    getEmployeeAttendanceSummary: (employeeId, params) => api.get(`/attendance/employee/${employeeId}/summary`, { params })
};

export const clientAPI = {
    // Client management
    createClient: (data) => api.post('/clients', data),
    getClients: (params) => api.get('/clients', { params }),
    getClientById: (id) => api.get(`/clients/${id}`),
    updateClient: (id, data) => api.put(`/clients/${id}`, data),
    deleteClient: (id) => api.delete(`/clients/${id}`),
    getDashboardStats: () => api.get('/clients/dashboard/stats'),

    // Client ledger
    addLedgerEntry: (data) => api.post('/clients/ledger', data),
    getClientLedger: (clientId, params) => api.get(`/clients/${clientId}/ledger`, { params }),
    updateLedgerEntry: (id, data) => api.put(`/clients/ledger/${id}`, data),
    deleteLedgerEntry: (id) => api.delete(`/clients/ledger/${id}`)
};

export const reportsAPI = {
    getDashboardStats: () => api.get('/reports/dashboard/stats'),
    getDailyReport: (params) => api.get('/reports/daily', { params }),
    getWeeklyReport: (params) => api.get('/reports/weekly', { params }),
    getMonthlyReport: (params) => api.get('/reports/monthly', { params }),
    getYearlyReport: (params) => api.get('/reports/yearly', { params })
};

export const userAPI = {
    getAllUsers: () => api.get('/users'),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`)
};

export const managerAPI = {
    allocateBudget: (data) => api.post('/managers/allocate', data),
    getManagerExpenses: (managerId) => api.get(`/managers/${managerId}/expenses`),
    reconcileExpenses: (managerId, data) => api.post(`/managers/${managerId}/reconcile`, data),
    getDashboardStats: () => api.get('/managers/dashboard/stats')
};

export const systemSettingsAPI = {
    getSettings: () => api.get('/system-settings'),
    updateSettings: (data) => api.put('/system-settings', data),
    getStats: () => api.get('/system-settings/stats'),
    testEmail: (data) => api.post('/system-settings/test-email', data),
    createBackup: () => api.post('/system-settings/backup'),
    toggleMaintenance: (data) => api.post('/system-settings/maintenance', data),
    getLogs: (params) => api.get('/system-settings/logs', { params })
};

export const databaseAPI = {
    getStats: () => api.get('/database/stats'),
    clearModels: (data) => api.post('/database/clear-models', data),
    clearAll: (data) => api.post('/database/clear-all', data),
    resetSample: () => api.post('/database/reset-sample'),
    backup: () => api.get('/database/backup')
};


export default api;