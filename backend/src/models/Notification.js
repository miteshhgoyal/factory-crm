import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
