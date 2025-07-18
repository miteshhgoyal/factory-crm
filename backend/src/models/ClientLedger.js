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
