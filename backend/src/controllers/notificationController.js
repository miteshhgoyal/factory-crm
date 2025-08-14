import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Employee from "../models/Employee.js";
import Client from "../models/Client.js";
import Stock from "../models/Stock.js";
import CashFlow from "../models/CashFlow.js";
import Expense from "../models/Expense.js";
import Attendance from "../models/Attendance.js";
import ClientLedger from "../models/ClientLedger.js";
import mongoose from "mongoose";

// Helper function to get model by name
const getModelByName = (modelName) => {
    const models = {
        'Employee': Employee,
        'Client': Client,
        'Stock': Stock,
        'CashFlow': CashFlow,
        'Expense': Expense,
        'Attendance': Attendance,
        'ClientLedger': ClientLedger,
        'User': User,
        'Company': Company
    };
    return models[modelName];
};

export const createNotification = async (message, createdBy, creatorRole, companyId, recordType, newRecordId) => {
    try {
        if (!message || !createdBy || !creatorRole || !companyId || !recordType || !newRecordId) {
            return {
                success: false,
                message: "Message, creator id, creator role, company id, record type and new record id are required.",
            }
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
            message: "Notification Created Successfully - " + notification.message,
            data: notification
        }
    } catch (error) {
        return {
            success: false,
            message: "Creating Notification failed.",
            error: error.message,
        }
    }
}

export const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const {
            date,
            createdBy,
            creatorRole,
            recordType,
            companyId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        // Default to today's notifications
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Role-based filtering
        if (user.role === 'superadmin') {
            // Superadmin can see notifications from admins and subadmins
            query.creatorRole = { $in: ['admin', 'subadmin'] };
        } else if (user.role === 'admin') {
            // Admin can only see notifications from their subadmins
            const subadmins = await User.find({
                createdBy: user.userId,
                role: 'subadmin'
            }).select('_id');

            if (subadmins.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No notifications found",
                    data: [],
                    meta: { total: 0 }
                });
            }

            query.createdBy = { $in: subadmins.map(sub => sub._id) };
        } else {
            // Subadmins can't see any notifications
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view notifications"
            });
        }

        // Apply filters
        if (createdBy) query.createdBy = createdBy;
        if (creatorRole) query.creatorRole = creatorRole;
        if (recordType) query.recordType = recordType;
        if (companyId) query.companyId = companyId;

        // Date filtering - default to today if no date specified
        if (date) {
            const targetDate = new Date(date);
            const dateStart = new Date(targetDate.setHours(0, 0, 0, 0));
            const dateEnd = new Date(targetDate.setHours(23, 59, 59, 999));
            query.createdAt = { $gte: dateStart, $lte: dateEnd };
        } else {
            query.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }

        // Build sort object
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const notifications = await Notification.find(query)
            .populate('createdBy', 'name email role')
            .populate('companyId', 'name')
            .sort(sortObj);

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications,
            meta: {
                total: notifications.length,
                hasFilters: Object.keys(req.query).length > 0
            }
        });

    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Fetching Notifications failed.",
            error: error.message,
        });
    }
}

export const getNotificationRecordDetails = async (req, res) => {
    try {
        const { user } = req;
        const { recordType, recordId } = req.params;

        if (!recordType || !recordId) {
            return res.status(400).json({
                success: false,
                message: "Record type and record ID are required"
            });
        }

        const Model = getModelByName(recordType);
        if (!Model) {
            return res.status(400).json({
                success: false,
                message: "Invalid record type"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid record ID format"
            });
        }

        let record;

        // Fetch record with appropriate population based on model type
        switch (recordType) {
            case 'Employee':
                record = await Model.findById(recordId).populate('companyId', 'name');
                break;
            case 'Client':
                record = await Model.findById(recordId)
                    .populate('createdBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'Stock':
                record = await Model.findById(recordId)
                    .populate('createdBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'CashFlow':
                record = await Model.findById(recordId)
                    .populate('createdBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'Expense':
                record = await Model.findById(recordId)
                    .populate('createdBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'Attendance':
                record = await Model.findById(recordId)
                    .populate('employeeId', 'name employeeId')
                    .populate('markedBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'ClientLedger':
                record = await Model.findById(recordId)
                    .populate('clientId', 'name phone type')
                    .populate('createdBy', 'name email')
                    .populate('companyId', 'name');
                break;
            case 'User':
                record = await Model.findById(recordId)
                    .populate('companies', 'name')
                    .populate('selectedCompany', 'name')
                    .populate('createdBy', 'name email');
                break;
            case 'Company':
                record = await Model.findById(recordId);
                break;
            default:
                record = await Model.findById(recordId);
                break;
        }

        if (!record) {
            return res.status(404).json({
                success: false,
                message: `${recordType} record not found`
            });
        }

        return res.status(200).json({
            success: true,
            message: `${recordType} record details fetched successfully`,
            data: {
                record,
                recordType,
                recordId
            }
        });

    } catch (error) {
        console.error("Get notification record details error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch record details",
            error: error.message
        });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Notification ID is required"
            });
        }

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        await Notification.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Delete notification error:", error);
        return res.status(500).json({
            success: false,
            message: "Deleting notification failed",
            error: error.message
        });
    }
}

export const bulkDeleteNotifications = async (req, res) => {
    try {
        const { notificationIds } = req.body;

        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Notification IDs array is required"
            });
        }

        const deleteResult = await Notification.deleteMany({
            _id: { $in: notificationIds }
        });

        return res.status(200).json({
            success: true,
            message: `${deleteResult.deletedCount} notifications deleted successfully`,
            deletedCount: deleteResult.deletedCount
        });

    } catch (error) {
        console.error("Bulk delete notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Bulk deleting notifications failed",
            error: error.message
        });
    }
}

export const deleteOldNotifications = async (req, res) => {
    try {
        const { daysOld = 2 } = req.body;

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysOld);
        dateThreshold.setHours(23, 59, 59, 999);

        const deleteResult = await Notification.deleteMany({
            createdAt: { $lte: dateThreshold }
        });

        return res.status(200).json({
            success: true,
            message: `${deleteResult.deletedCount} old notifications (${daysOld}+ days) deleted successfully`,
            deletedCount: deleteResult.deletedCount,
            daysOld: daysOld
        });

    } catch (error) {
        console.error("Delete old notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Deleting old notifications failed",
            error: error.message
        });
    }
}

// Helper functions for filters
export const getAvailableCreators = async (req, res) => {
    try {
        const user = req.user;
        let creators = [];

        if (user.role === 'superadmin') {
            creators = await User.find({
                role: { $in: ['admin', 'subadmin'] }
            }).select('_id name email role');
        } else if (user.role === 'admin') {
            creators = await User.find({
                createdBy: user.userId,
                role: 'subadmin'
            }).select('_id name email role');
        }

        return res.status(200).json({
            success: true,
            data: creators
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch creators",
            error: error.message
        });
    }
}

export const getAvailableCompanies = async (req, res) => {
    try {
        const companies = await Company.find({}).select('_id name');

        return res.status(200).json({
            success: true,
            data: companies
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch companies",
            error: error.message
        });
    }
}
