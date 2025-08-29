import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from './routes/dashboardRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import cashFlowRoutes from './routes/cashFlowRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import databaseRoutes from './routes/database.routes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import employeeLedgerRoutes from './routes/employeeLedgerRoutes.js';
import clientLedgerRoutes from './routes/clientLedgerRoutes.js';
// NEW: Import WhatsApp routes
import whatsappRoutes from './routes/whatsappRoutes.js';

// NEW: Import scheduler service to initialize WhatsApp automation
import schedulerService from './services/schedulerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'OPTIONS'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/temp');
import fs from 'fs';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/auth", authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/stock', stockRoutes);
app.use('/cashflow', cashFlowRoutes);
app.use('/employees', employeeRoutes);
app.use('/expenses', expenseRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/clients', clientRoutes);
app.use('/reports', reportsRoutes);
app.use('/users', userRoutes);
app.use('/database', databaseRoutes);
app.use('/notifications', notificationRoutes);
app.use('/employee-ledger', employeeLedgerRoutes);
app.use('/client-ledger', clientLedgerRoutes);
// NEW: WhatsApp routes
app.use('/whatsapp', whatsappRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        whatsappEnabled: true
    });
});

// FIXED: 404 handler - Now correctly named for Express v5
app.use('/*path', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Alternative solutions (choose one):
// Option 1: Catch all with named parameter
// app.use('/:catchAll*', (req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// Option 2: Catch all paths including root
// app.use('/*splat', (req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Initialize scheduler on server start
console.log('Initializing WhatsApp ledger scheduler...');

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    schedulerService.stopScheduler();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    schedulerService.stopScheduler();
    process.exit(0);
});

// Start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
            console.log(`📱 WhatsApp automation enabled`);
        });
    })
    .catch(err => {
        console.error("❌ DB connection failed:", err);
        process.exit(1);
    });

export default app;
