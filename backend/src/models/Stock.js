import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },

    // Stock source
    stockSource: {
        type: String,
        enum: ['PURCHASED', 'MANUFACTURED'],
        default: 'PURCHASED'
    },

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

    // Rate and amount - only required for purchased stock
    rate: {
        type: Number,
        required: function () {
            return this.stockSource === 'PURCHASED';
        }
    },
    amount: {
        type: Number,
        required: function () {
            return this.stockSource === 'PURCHASED';
        }
    },

    // Client info - only for purchased stock
    clientName: {
        type: String,
        required: function () {
            return this.stockSource === 'PURCHASED';
        }
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: function () {
            return this.stockSource === 'PURCHASED';
        }
    },

    invoiceNo: {
        type: String,
        required: function () {
            return this.stockSource === 'PURCHASED';
        }
    },
    date: { type: Date, required: true, default: Date.now },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

export default mongoose.model('Stock', stockSchema);
