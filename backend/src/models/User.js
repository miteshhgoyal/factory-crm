import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'subadmin'],
        default: 'subadmin'
    },
    companies: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
        }
    ],
    selectedCompany: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    // permissions field
    permissions: {
        dashboard: { type: Boolean, default: true },
        stock: {
            dashboard: { type: Boolean, default: true },
            stockIn: { type: Boolean, default: true },
            stockOut: { type: Boolean, default: true },
            reports: { type: Boolean, default: true }
        },
        cashFlow: {
            dashboard: { type: Boolean, default: true },
            cashIn: { type: Boolean, default: true },
            cashOut: { type: Boolean, default: true },
            reports: { type: Boolean, default: true }
        },
        expenses: {
            dashboard: { type: Boolean, default: true },
            add: { type: Boolean, default: true },
            reports: { type: Boolean, default: true }
        },
        employees: {
            dashboard: { type: Boolean, default: true },
            add: { type: Boolean, default: true },
            list: { type: Boolean, default: true },
            ledger: { type: Boolean, default: true }
        },
        attendance: {
            dashboard: { type: Boolean, default: true },
            sheet: { type: Boolean, default: true },
            mark: { type: Boolean, default: true },
            calendar: { type: Boolean, default: true }
        },
        clients: {
            dashboard: { type: Boolean, default: true },
            add: { type: Boolean, default: true },
            list: { type: Boolean, default: true },
            ledger: { type: Boolean, default: true }
        },
        accounts: {
            cash: { type: Boolean, default: true },
            purchase: { type: Boolean, default: true },
            sales: { type: Boolean, default: true },
            production: { type: Boolean, default: true }
        },
        reports: {
            dashboard: { type: Boolean, default: true },
            daily: { type: Boolean, default: true },
            weekly: { type: Boolean, default: true },
            monthly: { type: Boolean, default: true },
            yearly: { type: Boolean, default: true }
        },
        settings: {
            companiesAndUsers: { type: Boolean, default: true }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Set default permissions based on role
userSchema.pre('save', function (next) {
    if ((this.isNew || !this.permissions) && this.role) {
        if (this.role === 'superadmin') {
            // Superadmin gets all permissions
            this.permissions = {
                dashboard: true,
                stock: { dashboard: true, stockIn: true, stockOut: true, reports: true },
                cashFlow: { dashboard: true, cashIn: true, cashOut: true, reports: true },
                expenses: { dashboard: true, add: true, reports: true },
                employees: { dashboard: true, add: true, list: true, ledger: true },
                attendance: { dashboard: true, sheet: true, mark: true, calendar: true },
                clients: { dashboard: true, add: true, list: true, ledger: true },
                accounts: { cash: true, purchase: true, sales: true, production: true },
                reports: { dashboard: true, daily: true, weekly: true, monthly: true, yearly: true },
                settings: { companiesAndUsers: true }
            };
        } else if (this.role === 'admin') {
            // Admin gets most permissions except some settings
            this.permissions = {
                dashboard: true,
                stock: { dashboard: true, stockIn: true, stockOut: true, reports: true },
                cashFlow: { dashboard: true, cashIn: true, cashOut: true, reports: true },
                expenses: { dashboard: true, add: true, reports: true },
                employees: { dashboard: true, add: true, list: true, ledger: true },
                attendance: { dashboard: true, sheet: true, mark: true, calendar: true },
                clients: { dashboard: true, add: true, list: true, ledger: true },
                accounts: { cash: true, purchase: true, sales: true, production: true },
                reports: { dashboard: true, daily: true, weekly: true, monthly: true, yearly: true },
                settings: { companiesAndUsers: true }
            };
        } else {
            // Subadmin gets limited permissions
            this.permissions = {
                dashboard: true,
                stock: { dashboard: true, stockIn: true, stockOut: false, reports: false },
                cashFlow: { dashboard: true, cashIn: true, cashOut: false, reports: false },
                expenses: { dashboard: true, add: true, reports: false },
                employees: { dashboard: true, add: true, list: true, ledger: false },
                attendance: { dashboard: true, sheet: false, mark: true, calendar: true },
                clients: { dashboard: true, add: true, list: true, ledger: false },
                accounts: { cash: false, purchase: false, sales: false, production: false },
                reports: { dashboard: false, daily: false, weekly: false, monthly: false, yearly: false },
                settings: { companiesAndUsers: false }
            };
        }
    }
    next();
});

export default mongoose.model('User', userSchema);
