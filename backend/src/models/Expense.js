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
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
