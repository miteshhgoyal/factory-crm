import axios from 'axios';
import { tokenService } from './tokenService';

// Create axios instance with proper base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/',
    timeout: 30000,
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
    getTransactionById: (id) => api.get(`/stock/transaction/${id}`),
    updateTransaction: (id, data) => api.put(`/stock/transaction/${id}`, data),
    deleteTransaction: (id) => api.delete(`/stock/transaction/${id}`),
    getBalance: () => api.get('/stock/balance'),
    getDashboardStats: () => api.get('/stock/dashboard/stats'),
    getProducts: () => api.get('/stock/products'),

    // Production Report methods
    createProductionReport: (stockTransactionId, data) =>
        api.post(`/stock/production-report/${stockTransactionId}`, data),

    updateProductionReport: (reportId, data) =>
        api.put(`/stock/production-report/${reportId}`, data),

    getProductionReportByStockId: (stockTransactionId) =>
        api.get(`/stock/production-report/stock/${stockTransactionId}`),

    getProductionReports: (params = {}) =>
        api.get('/stock/production-reports', { params }),

    deleteProductionReport: (reportId) =>
        api.delete(`/stock/production-report/${reportId}`),

    downloadProductionReportPDF: (stockTransactionId) => {
        return api.get(`/stock/production-report/pdf/stock/${stockTransactionId}`, {
            responseType: 'blob'
        });
    },

    // Alternative method using report ID
    downloadProductionReportPDFById: (reportId) => {
        return api.get(`/stock/production-report/pdf/${reportId}`, {
            responseType: 'blob'
        });
    }
};

export const cashFlowAPI = {
    addCashIn: (data) => api.post('/cashflow/in', data),
    addCashOut: (data) => api.post('/cashflow/out', data),
    getTransactions: (params) => api.get('/cashflow/transactions', { params }),
    getTransactionById: (id) => api.get(`/cashflow/transaction/${id}`),
    getSummary: (params) => api.get('/cashflow/summary', { params }),
    updateTransaction: (id, data) => api.put(`/cashflow/transaction/${id}`, data),
    deleteTransaction: (id) => api.delete(`/cashflow/transaction/${id}`),
    getDashboardStats: () => api.get('/cashflow/dashboard/stats'),
    getPaymentModeAnalytics: (params) => api.get('/cashflow/payment-mode-analytics', { params }),
    getCategoryAnalytics: (params) => api.get('/cashflow/category-analytics', { params }),
    getEmployeeAnalytics: (params) => api.get('/cashflow/employee-analytics', { params }),
    getTrends: (params) => api.get('/cashflow/trends', { params }),
    getCategories: (params) => api.get('/cashflow/categories', { params }),
};

export const employeeLedgerAPI = {
    getLedgerEntries: (params) => api.get('/employee-ledger', { params }),
    getLedgerEntryById: (id) => api.get(`/employee-ledger/${id}`),
    updateLedgerEntry: (id, data) => api.put(`/employee-ledger/${id}`, data),
    deleteLedgerEntry: (id) => api.delete(`/employee-ledger/${id}`),
    getStats: () => api.get('/employee-ledger/stats'),
};

export const employeeAPI = {
    getEmployee: (id) => api.get(`/employees/${id}`),
    deleteEmployee: (id) => api.delete(`/employees/${id}`),
    getSalaryData: (params) => api.get('/employees/salary', { params }),

    generatePayslip: (salaryId) => api.get(`/employees/salary/${salaryId}/payslip`),
    getEmployeeById: (id) => api.get(`/employees/${id}`),
    getDashboardStats: () => api.get('/employees/dashboard/stats'),
    getSalarySummary: (params) => api.get('/employees/salary/summary', { params }),
    getEmployees: (params) => api.get('/employees', { params }),
    toggleEmployeeStatus: (id) => api.patch(`/employees/${id}/toggle-status`),

    createEmployee: (formData) => {
        return api.post('/employees', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    updateEmployee: (id, formData) => {
        return api.put(`/employees/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
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
    getEmployeeAttendanceSummary: (employeeId, params) => api.get(`/attendance/employee/${employeeId}/summary`, { params }),
    getAttendanceByDate: (date) => api.get('/attendance/by-date', { params: { date } }),
    getAttendanceSheet: (params) => api.get('/attendance/sheet', { params }),
};

export const clientAPI = {
    // Client management - Updated to handle multipart/form-data
    createClient: (formData) => {
        return api.post('/clients', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    getClients: (params) => api.get('/clients', { params }),
    getClientById: (id) => api.get(`/clients/${id}`),

    updateClient: (id, formData) => {
        return api.put(`/clients/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deleteClient: (id) => api.delete(`/clients/${id}`),
    getDashboardStats: () => api.get('/clients/dashboard/stats'),

    // Client ledger
    getClientLedger: (clientId, params) => api.get(`/client-ledger/${clientId}`, { params }),
    getLedgerEntryById: (id) => api.get(`/client-ledger/entry/${id}`),
    updateLedgerEntry: (id, data) => api.put(`/client-ledger/entry/${id}`, data),
    deleteLedgerEntry: (id) => api.delete(`/client-ledger/entry/${id}`),
    getClientLedgerStats: () => api.get('/client-ledger/stats'),

    // Cash flow entry management
    getCashFlowEntryById: (id) => api.get(`/client-ledger/cashflow-entry/${id}`),
    updateCashFlowEntry: (id, data) => api.put(`/client-ledger/cashflow-entry/${id}`, data),
    deleteCashFlowEntry: (id) => api.delete(`/client-ledger/cashflow-entry/${id}`),

    sendWhatsAppLedger: (clientId, filters) => api.post(`/whatsapp/send-ledger/${clientId}`, filters),
    toggleAutoSend: (clientId, autoSendLedger) => api.patch(`/whatsapp/auto-send/${clientId}`, { autoSendLedger }),
    validateWhatsAppNumber: (phoneNumber) => api.post('/whatsapp/validate-number', { phoneNumber }),
    getWhatsAppAccountStatus: () => api.get('/whatsapp/account-status'),
};

export const reportsAPI = {
    getDashboardStats: () => api.get('/reports/dashboard/stats'),
    getDailyReport: (params) => api.get('/reports/daily', { params }),
    getWeeklyReport: (params) => api.get('/reports/weekly', { params }),
    getMonthlyReport: (params) => api.get('/reports/monthly', { params }),
    getYearlyReport: (params) => api.get('/reports/yearly', { params })
};

export const userAPI = {
    // User management
    getAllUsers: () => api.get('/users'),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),

    // Company management
    createCompany: (data) => api.post('/users/companies', data),
    updateCompany: (id, data) => api.put(`/users/companies/${id}`, data),
    deleteCompany: (id) => api.delete(`/users/companies/${id}`),

    getAvailableUsers: (role = '') => api.get(`/users/available-users${role ? `?role=${role}` : ''}`),
    getMyAssignedCompanies: () => api.get('/users/my-assigned-companies'),

    updateSelectedCompany: (id) => api.put(`/users/set-selected-company/${id}`),
};

export const notificationAPI = {
    getNotifications: (params) => api.get('/notifications', { params }),
    getNotificationRecordDetails: (recordType, recordId) =>
        api.get(`/notifications/record/${recordType}/${recordId}`),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
    bulkDeleteNotifications: (data) => api.post('/notifications/bulk-delete', data),
    deleteOldNotifications: (data) => api.post('/notifications/delete-old', data),
    getNotificationCreators: () => api.get("/notifications/creators"),
}

export const databaseAPI = {
    getStats: () => api.get('/database/stats'),
    clearModels: (data) => api.post('/database/clear-models', data),
    clearAll: (data) => api.post('/database/clear-all', data),
    resetSample: () => api.post('/database/reset-sample'),
    backup: () => api.get('/database/backup')
};


export default api;