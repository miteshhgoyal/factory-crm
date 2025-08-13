import Notification from "../models/Notification";
import User from "../models/User";
import Company from "../models/Company";

export const createNotification = async (message, createdBy, creatorRole, companyId, recordType, newRecordId) => {
    try {
        if (!message || !createdBy || !creatorRole || !companyId || !recordType || !newRecordId) {
            return res.status(400).json({
                success: false,
                message: "Message, creator id, creator role, company id, record type and new record id are required.",
            })
        }

        const user = await User.findById(createdBy);
        if (!user) {
            return {
                success: false,
                message: "User creating the notification not found.",
            }
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return {
                success: false,
                message: "Company for which the notification being created not found.",
            }
        }

        const notification = new Notification({
            message,
            createdBy,
            creatorRole,
            companyId,
            newRecordId: newRecordId.toString(),
            recordType
        });

        await notification.save();

        return {
            success: true,
            message: "Notification Created Successfully -" + notification.message,
        }
    } catch (error) {
        return {
            success: false,
            message: "Creating Notification failed.",
            error: error.message,
        }
    }
}