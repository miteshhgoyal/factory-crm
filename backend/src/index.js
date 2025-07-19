import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import connectDB from "./config/db.js";
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
import managerRoutes from './routes/managerRoutes.js';

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'OPTIONS'],
    credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use('/managers', managerRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler - FIXED
app.use('*path', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("❌ DB connection failed:", err);
        process.exit(1);
    });

export default app;
