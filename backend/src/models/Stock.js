import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true },
    bags: {
        count: {
            type: Number,
            default: 0,
        },
        weight: {
            type: Number,
            default: 0,
        }
    },
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
