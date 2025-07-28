import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    aadharNo: {
        type: String,
        trim: true
    },
    panNo: {
        type: String,
        trim: true,
        uppercase: true
    },
    paymentType: {
        type: String,
        enum: ['fixed', 'hourly'],
        required: true
    },
    basicSalary: {
        type: Number,
        min: 0,
        required: function () {
            return this.paymentType === 'fixed';
        }
    },
    hourlyRate: {
        type: Number,
        min: 0,
        required: function () {
            return this.paymentType === 'hourly';
        }
    },
    workingDays: {
        type: Number,
        default: 26,
        min: 1,
        max: 31
    },
    workingHours: {
        type: Number,
        default: 8,
        min: 1,
        max: 24
    },
    overtimeRate: {
        type: Number,
        default: 1.5,
        min: 1
    },
    bankAccount: {
        accountNo: {
            type: String,
            trim: true
        },
        ifsc: {
            type: String,
            trim: true,
            uppercase: true
        },
        bankName: {
            type: String,
            trim: true
        },
        branch: {
            type: String,
            trim: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ paymentType: 1 });
employeeSchema.index({ name: 'text', employeeId: 'text' });

export default mongoose.model('Employee', employeeSchema);


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

