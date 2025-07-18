import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    paymentType: { type: String, enum: ['fixed', 'hourly'], required: true },
    basicSalary: { type: Number, min: 0 }, // For fixed employees
    hourlyRate: { type: Number, min: 0 }, // For hourly employees
    isActive: { type: Boolean, default: true },
    joinDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
