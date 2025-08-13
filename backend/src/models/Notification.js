import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorRole: { type: String, required: true, },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    newRecordId: { type: String, required: true, },
    recordType: { type: String, required: true, },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
