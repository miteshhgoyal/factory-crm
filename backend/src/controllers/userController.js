import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcryptjs';

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

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            name,
            role,
            phone,
            companies: companies || [],
            createdBy: req.user.userId
        });

        await user.save();

        // Update companies with user assignment (only for subadmins when created by admin)
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

        // Remove user from all companies
        await Company.updateMany(
            { $or: [{ admins: id }, { subadmins: id }] },
            { $pull: { admins: id, subadmins: id } }
        );

        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
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

        // Remove company from all users
        await User.updateMany(
            { companies: id },
            { $pull: { companies: id } }
        );

        await Company.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error('Delete company error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete company'
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
            canUpdateDetails = false; // Admin cannot update company details

            // Admin can only manage subadmins, not company details or other admins
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

        // Remove company from old subadmins only (admins can only manage subadmins)
        const oldSubadmins = company.subadmins || [];
        await User.updateMany(
            { _id: { $in: oldSubadmins } },
            { $pull: { companies: id } }
        );

        // Update company data
        const updateData = {};
        if (canUpdateDetails) {
            // Only superadmin can update these
            updateData.name = name;
            updateData.description = description;
            updateData.admins = adminIds;

            // Handle admin changes for superadmin
            const oldAdmins = company.admins || [];
            await User.updateMany(
                { _id: { $in: oldAdmins } },
                { $pull: { companies: id } }
            );
        }

        // Both superadmin and admin can update subadmins
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
            // Only add admins if superadmin is updating
            newUserIds.push(...adminIds);
        }

        if (newUserIds.length > 0) {
            await User.updateMany(
                { _id: { $in: newUserIds } },
                { $addToSet: { companies: id } }
            );
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

        res.json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error('Get assigned companies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned companies'
        });
    }
};
