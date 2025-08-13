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
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, {
    timestamps: true
});

// Compound index to prevent duplicate allocations
managerSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model('Manager', managerSchema);
