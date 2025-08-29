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
        default: 30,
    },
    workingHours: {
        type: Number,
        default: 9,
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
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    aadharCardImage: {
        type: String, // Cloudinary URL
        required: false
    },
    panCardImage: {
        type: String, // Cloudinary URL  
        required: false
    },
    aadharCardImagePublicId: {
        type: String, // Cloudinary public ID for deletion
        required: false
    },
    panCardImagePublicId: {
        type: String, // Cloudinary public ID for deletion
        required: false
    }
}, {
    timestamps: true
});

// Indexes for better performance
employeeSchema.index({ isActive: 1 });
employeeSchema.index({ paymentType: 1 });
employeeSchema.index({ name: 'text', employeeId: 'text' });

export default mongoose.model('Employee', employeeSchema);