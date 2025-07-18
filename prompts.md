based on all the info given now , give me dummy data for the system and testing purposes and a script to inject all data in db. give data for all kind of modals ohk. make a nodejs script using mongoose etc.

Attendance.js

import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    isPresent: { type: Boolean, default: false },
    hoursWorked: { type: Number, default: 0 },
    notes: String,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);

CashFlow.js

import mongoose from 'mongoose';

const cashFlowSchema = new mongoose.Schema({
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, required: true },
    employeeName: String,
    date: { type: Date, required: true, default: Date.now },
    paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'Online'], required: true },
    isOnline: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('CashFlow', cashFlowSchema);

Client.js

import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    type: { type: String, enum: ['Customer', 'Supplier'], required: true },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);

ClientLedger.js

import mongoose from 'mongoose';

const clientLedgerSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    date: { type: Date, required: true, default: Date.now },
    particulars: { type: String, required: true },
    bags: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    debitAmount: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('ClientLedger', clientLedgerSchema);


Employee.js

import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    paymentType: { type: String, enum: ['fixed', 'hourly'], required: true },
    basicSalary: { type: Number, min: 0 }, // For fixed employees
    hourlyRate: { type: Number, min: 0 }, // For hourly employees
    isActive: { type: Boolean, default: true },
    joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);


Expense.js

import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    category: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    employeeName: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    isManagerExpense: { type: Boolean, default: false },
    date: { type: Date, required: true, default: Date.now },
    billNo: String,
    receiptUrl: String,
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    canEdit: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);


Manager.js

import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    allocatedBudget: {
        type: Number,
        required: true,
        default: 0
    },
    spentAmount: {
        type: Number,
        default: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    salaryAdjustment: {
        type: Number,
        default: 0
    },
    isReconciled: {
        type: Boolean,
        default: false
    },
    reconciledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reconciledDate: {
        type: Date
    },
    notes: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate allocations
managerSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Manager', managerSchema);



Stock.js

import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['kg', 'bag'], required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    clientName: String,
    invoiceNo: String,
    date: { type: Date, required: true, default: Date.now },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Stock', stockSchema);


User.js

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'subadmin'],
        default: 'subadmin'
    },
    permissions: [{
        type: String,
        enum: ['read', 'write', 'edit', 'delete', 'manage_users', 'manage_stock', 'manage_finance', 'manage_employees', 'view_reports']
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);

make the script systematic to use actual ids object ids acorss data. properly industry level data give me at big scale.