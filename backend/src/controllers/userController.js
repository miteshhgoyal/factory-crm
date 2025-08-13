import User from '../models/User.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import Stock from '../models/Stock.js';
import Expense from '../models/Expense.js';
import CashFlow from '../models/CashFlow.js';
import Attendance from '../models/Attendance.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Helper function to check if user can manage target user
const canManageUser = (currentUser, targetUserRole) => {
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'admin' && targetUserRole === 'subadmin') return true;
    return false;
};

// Get users based on role hierarchy
export const getAllUsers = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'admin') {
            // Admin can only see subadmins from their companies
            const adminCompanies = await Company.find({ admins: req.user.userId });
            const companyIds = adminCompanies.map(c => c._id);
            query = {
                role: 'subadmin',
                companies: { $in: companyIds }
            };
        } else if (req.user.role === 'subadmin') {
            // Subadmin can only see themselves
            query = { _id: req.user.userId };
        }

        const users = await User.find(query)
            .populate('companies', 'name description')
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const { username, email, password, name, role, phone, companies } = req.body;

        // Check if current user can create this role
        if (req.user.role === 'admin' && role !== 'subadmin') {
            return res.status(403).json({
                success: false,
                message: 'Admins can only create subadmin users'
            });
        }

        if (req.user.role === 'subadmin') {
            return res.status(403).json({
                success: false,
                message: 'Subadmins cannot create users'
            });
        }

        // If admin is creating subadmin, validate they can only assign to their companies
        if (req.user.role === 'admin' && companies && companies.length > 0) {
            const adminCompanies = await Company.find({
                admins: req.user.userId
            }).select('_id');

            const adminCompanyIds = adminCompanies.map(c => c._id.toString());
            const invalidCompanies = companies.filter(companyId =>
                !adminCompanyIds.includes(companyId)
            );

            if (invalidCompanies.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only assign subadmins to companies you manage'
                });
            }
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Set selectedCompany to first company if companies are provided
        let selectedCompany = null;
        if (companies && companies.length > 0) {
            selectedCompany = companies[0];
        }

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            name,
            role,
            phone,
            companies: companies || [],
            selectedCompany,
            createdBy: req.user.userId
        });

        await user.save();

        // Update companies with user assignment
        if (companies && companies.length > 0) {
            if (role === 'admin' && req.user.role === 'superadmin') {
                await Company.updateMany(
                    { _id: { $in: companies } },
                    { $addToSet: { admins: user._id } }
                );
            } else if (role === 'subadmin') {
                await Company.updateMany(
                    { _id: { $in: companies } },
                    { $addToSet: { subadmins: user._id } }
                );
            }
        }

        const createdUser = await User.findById(user._id)
            .populate('companies', 'name description')
            .select('-password');

        res.status(201).json({
            success: true,
            data: createdUser,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user'
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password, name, role, phone, companies } = req.body;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if current user can update this user
        if (!canManageUser(req.user, targetUser.role) && req.user.userId.toString() !== id) {
            return res.status(403).json({
                success: false,
                message: 'You cannot update this user'
            });
        }

        // Prepare update data
        const updateData = {
            username,
            email,
            name,
            phone,
            companies: companies || []
        };

        // Only allow role change if user has permission
        if (role && canManageUser(req.user, role)) {
            updateData.role = role;
        }

        // Hash new password if provided
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        // Check if user had companies before and now has none
        const hadCompanies = targetUser.companies && targetUser.companies.length > 0;
        const willHaveNoCompanies = !companies || companies.length === 0;

        // If user had companies but now has none, reset selectedCompany
        if (hadCompanies && willHaveNoCompanies) {
            updateData.selectedCompany = null;
        } else if (!hadCompanies && companies && companies.length > 0) {
            updateData.selectedCompany = companies[0];
        }

        // Remove user from old companies
        await Company.updateMany(
            { $or: [{ admins: id }, { subadmins: id }] },
            { $pull: { admins: id, subadmins: id } }
        );

        // Add user to new companies
        if (companies && companies.length > 0) {
            const userRole = updateData.role || targetUser.role;
            if (userRole === 'admin') {
                await Company.updateMany(
                    { _id: { $in: companies } },
                    { $addToSet: { admins: id } }
                );
            } else if (userRole === 'subadmin') {
                await Company.updateMany(
                    { _id: { $in: companies } },
                    { $addToSet: { subadmins: id } }
                );
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })
            .populate('companies', 'name description')
            .select('-password');

        res.json({
            success: true,
            data: updatedUser,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only superadmin can delete users
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete users'
            });
        }

        // Convert string ID to ObjectId for consistent comparison
        const userId = new mongoose.Types.ObjectId(id);

        // Comprehensive cleanup across all models
        await Promise.allSettled([
            // Remove user from Company admins/subadmins arrays
            Company.updateMany(
                { $or: [{ admins: userId }, { subadmins: userId }] },
                { $pull: { admins: userId, subadmins: userId } }
            ),

            // Remove user references from Employee model
            Employee.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from Client model
            Client.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from ClientLedger model
            ClientLedger.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from Stock model
            Stock.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from Expense model
            Expense.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from CashFlow model
            CashFlow.updateMany(
                { $or: [{ createdBy: userId }, { updatedBy: userId }] },
                { $unset: { createdBy: "", updatedBy: "" } }
            ),

            // Remove user references from Attendance model
            Attendance.updateMany(
                { $or: [{ markedBy: userId }, { createdBy: userId }, { updatedBy: userId }] },
                { $unset: { markedBy: "", createdBy: "", updatedBy: "" } }
            )
        ]);

        // Finally delete the user
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

export const createCompany = async (req, res) => {
    try {
        const { name, description, adminIds = [] } = req.body;

        // Only superadmin can create companies
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can create companies'
            });
        }

        // Check if company already exists
        const existingCompany = await Company.findOne({ name });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company with this name already exists'
            });
        }

        // Validate admin IDs if provided
        if (adminIds.length > 0) {
            const validAdmins = await User.find({
                _id: { $in: adminIds },
                role: 'admin'
            });

            if (validAdmins.length !== adminIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some admin IDs are invalid'
                });
            }
        }

        const company = new Company({
            name,
            description,
            admins: adminIds,
            createdBy: req.user.userId
        });

        await company.save();

        // Update user documents to include this company
        if (adminIds.length > 0) {
            await User.updateMany(
                { _id: { $in: adminIds } },
                { $addToSet: { companies: company._id } }
            );
        }

        // Update superadmin's companies and set as selected if they don't have one
        const superadmin = await User.findByIdAndUpdate(req.user.userId, { $addToSet: { companies: company._id } });

        if (!superadmin.selectedCompany || superadmin.selectedCompany === 'undefined') {
            superadmin.selectedCompany = company._id;
            await superadmin.save();
        }

        const createdCompany = await Company.findById(company._id)
            .populate('admins', 'name username email')
            .populate('subadmins', 'name username email')
            .populate('createdBy', 'name username');

        res.status(201).json({
            success: true,
            data: createdCompany,
            message: 'Company created successfully'
        });
    } catch (error) {
        console.error('Create company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create company'
        });
    }
};

export const setSelectedCompany = async (req, res) => {
    try {
        const { id: companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'Must provide company id to set the current selected company'
            });
        }

        await User.findByIdAndUpdate(req.user.userId, { selectedCompany: companyId });

        res.json({
            success: true,
            message: 'Selected company set successfully'
        });
    } catch (error) {
        console.error('Setting selected company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set selected company'
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        // Only superadmin can delete companies
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete companies'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Convert string ID to ObjectId for consistent comparison
        const companyId = new mongoose.Types.ObjectId(id);

        // Comprehensive cascade deletion across all models with companyId
        await Promise.allSettled([
            // Delete all employees belonging to this company
            Employee.deleteMany({ companyId: companyId }),

            // Delete all clients belonging to this company
            Client.deleteMany({ companyId: companyId }),

            // Delete all client ledger entries belonging to this company
            ClientLedger.deleteMany({ companyId: companyId }),

            // Delete all stock entries belonging to this company
            Stock.deleteMany({ companyId: companyId }),

            // Delete all expenses belonging to this company
            Expense.deleteMany({ companyId: companyId }),

            // Delete all cash flow entries belonging to this company
            CashFlow.deleteMany({ companyId: companyId }),

            // Delete all attendance records belonging to this company
            Attendance.deleteMany({ companyId: companyId }),

            // Remove company from all users' companies array
            User.updateMany(
                { companies: companyId },
                { $pull: { companies: companyId } }
            ),

            // Reset selectedCompany for users who had this company selected
            User.updateMany(
                { selectedCompany: companyId },
                { $unset: { selectedCompany: "" } }
            )
        ]);

        // Finally delete the company itself
        await Company.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Company deleted successfully with all associated data',
        });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete company',
            error: error.message
        });
    }
};

export const getAllCompanies = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'admin') {
            // Admins can only see companies they're assigned to as admin
            query = { admins: req.user.userId };
        } else if (req.user.role === 'subadmin') {
            // Subadmins can only see companies they're assigned to as subadmin
            query = { subadmins: req.user.userId };
        }
        // Superadmin can see all companies (no filter)

        const companies = await Company.find(query)
            .populate('admins', 'name username email')
            .populate('subadmins', 'name username email')
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch companies'
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, adminIds = [], subadminIds = [] } = req.body;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check permissions
        let canUpdate = false;
        let canUpdateDetails = false;

        if (req.user.role === 'superadmin') {
            canUpdate = true;
            canUpdateDetails = true;
        } else if (req.user.role === 'admin' && company.admins.some(admin =>
            admin._id ? admin._id.toString() === req.user.userId.toString() : admin.toString() === req.user.userId.toString()
        )) {
            canUpdate = true;
            canUpdateDetails = false;

            if (name !== company.name || description !== company.description || adminIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Admins can only assign/remove subadmins, not modify company details'
                });
            }
        }

        if (!canUpdate) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this company'
            });
        }

        // Validate subadmin IDs
        if (subadminIds.length > 0) {
            const validSubadmins = await User.find({
                _id: { $in: subadminIds },
                role: 'subadmin'
            });

            if (validSubadmins.length !== subadminIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some subadmin IDs are invalid'
                });
            }
        }

        // Get users who are being removed from this company
        const oldAdmins = company.admins || [];
        const oldSubadmins = company.subadmins || [];

        const removedAdmins = oldAdmins.filter(adminId => !adminIds.includes(adminId.toString()));
        const removedSubadmins = oldSubadmins.filter(subadminId => !subadminIds.includes(subadminId.toString()));
        const allRemovedUsers = [...removedAdmins, ...removedSubadmins];

        // Remove company from old users
        await User.updateMany(
            { _id: { $in: oldSubadmins } },
            { $pull: { companies: id } }
        );

        const updateData = {};
        if (canUpdateDetails) {
            updateData.name = name;
            updateData.description = description;
            updateData.admins = adminIds;

            // Handle admin changes for superadmin
            await User.updateMany(
                { _id: { $in: oldAdmins } },
                { $pull: { companies: id } }
            );
        }

        updateData.subadmins = subadminIds;

        const updatedCompany = await Company.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('admins', 'name username email')
            .populate('subadmins', 'name username email')
            .populate('createdBy', 'name username');

        // Add company to new users
        const newUserIds = [...subadminIds];
        if (canUpdateDetails) {
            newUserIds.push(...adminIds);
        }

        if (newUserIds.length > 0) {
            await User.updateMany(
                { _id: { $in: newUserIds } },
                { $addToSet: { companies: id } }
            );
        }

        // Handle selectedCompany for removed users
        if (allRemovedUsers.length > 0) {
            for (const userId of allRemovedUsers) {
                const user = await User.findById(userId).populate('companies');

                // If user's selected company was this company, reset it
                if (user.selectedCompany && user.selectedCompany.toString() === id) {
                    if (user.companies && user.companies.length > 0) {
                        // Set to first remaining company
                        user.selectedCompany = user.companies[0]._id;
                    } else {
                        // No companies left, reset to null
                        user.selectedCompany = null;
                    }
                    await user.save();
                }
            }
        }

        res.json({
            success: true,
            data: updatedCompany,
            message: 'Company updated successfully'
        });
    } catch (error) {
        console.error('Update company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update company'
        });
    }
};

export const getAvailableUsers = async (req, res) => {
    try {
        const { role } = req.query;

        let query = {};

        // Filter by role if specified
        if (role) {
            query.role = role;
        }

        // Role-based filtering
        if (req.user.role === 'admin') {
            // Admins can only see subadmins, and only those not assigned to companies they don't manage
            query.role = 'subadmin';
        } else if (req.user.role === 'subadmin') {
            // Subadmins cannot assign users
            return res.status(403).json({
                success: false,
                message: 'Subadmins cannot assign users'
            });
        }

        const users = await User.find(query)
            .populate('companies', 'name')
            .select('-password')
            .sort({ name: 1, username: 1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get available users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available users'
        });
    }
};

// New function to get admin's assigned companies only
export const getMyAssignedCompanies = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'admin') {
            query = { admins: req.user.userId };
        } else if (req.user.role === 'subadmin') {
            query = { subadmins: req.user.userId };
        } else if (req.user.role === 'superadmin') {
            query = {}; // Superadmin sees all
        }

        const companies = await Company.find(query)
            .populate('admins', 'name username email')
            .populate('subadmins', 'name username email')
            .sort({ name: 1 });

        const user = await User.findById(req.user.userId);
        res.json({
            success: true,
            data: companies,
            currentSelectedCompany: user.selectedCompany,
        });
    } catch (error) {
        console.error('Get assigned companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned companies'
        });
    }
};
