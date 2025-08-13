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
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

export default mongoose.model('CashFlow', cashFlowSchema);
