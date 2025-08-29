import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    type: { type: String, enum: ['Customer', 'Supplier'], required: true },
    currentBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    // Add Aadhaar and PAN fields
    aadharNo: { type: String, default: '' },
    panNo: { type: String, default: '' },
    aadharCardImage: { type: String, default: '' },
    panCardImage: { type: String, default: '' },
    aadharCardImagePublicId: { type: String, default: '' },
    panCardImagePublicId: { type: String, default: '' },

    // Auto-send ledger configuration
    autoSendLedger: { type: Boolean, default: false },
    whatsappVerified: { type: Boolean, default: false },
    lastLedgerSent: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
