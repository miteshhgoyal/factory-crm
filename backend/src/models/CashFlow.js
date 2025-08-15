import mongoose from 'mongoose';

const cashFlowSchema = new mongoose.Schema({
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, required: true },
    employeeName: String,
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    date: { type: Date, required: true, default: Date.now },
    transactionId: { type: String },
    paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online'], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

export default mongoose.model('CashFlow', cashFlowSchema);
