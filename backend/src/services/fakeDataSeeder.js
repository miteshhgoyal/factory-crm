import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

faker.locale = 'en';

// Import all models (assuming they're in a models directory)
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Manager from '../models/Manager.js';
import Client from '../models/Client.js';
import ClientLedger from '../models/ClientLedger.js';
import Stock from '../models/Stock.js';
import Expense from '../models/Expense.js';
import CashFlow from '../models/CashFlow.js';
import Attendance from '../models/Attendance.js';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/business_management';
const SALT_ROUNDS = 12;

// Data generation constants
const USERS_COUNT = 25;
const EMPLOYEES_COUNT = 150;
const MANAGERS_COUNT = 15;
const CLIENTS_COUNT = 200;
const STOCK_ENTRIES_COUNT = 1000;
const EXPENSE_ENTRIES_COUNT = 800;
const CASHFLOW_ENTRIES_COUNT = 600;
const ATTENDANCE_DAYS = 90; // Last 90 days

// Product categories for stock
const PRODUCT_CATEGORIES = [
    'Wheat', 'Rice', 'Barley', 'Corn', 'Oats', 'Soybeans',
    'Lentils', 'Chickpeas', 'Sugar', 'Salt', 'Flour', 'Oil'
];

// Expense categories
const EXPENSE_CATEGORIES = [
    'Office Supplies', 'Transportation', 'Utilities', 'Maintenance',
    'Marketing', 'Insurance', 'Equipment', 'Software', 'Training',
    'Fuel', 'Repairs', 'Consulting', 'Legal', 'Accounting'
];

// Cash flow categories
const CASHFLOW_CATEGORIES = [
    'Sales Revenue', 'Service Income', 'Investment', 'Loan',
    'Equipment Purchase', 'Inventory', 'Salaries', 'Rent',
    'Utilities', 'Tax Payment', 'Insurance', 'Marketing'
];

// Utility functions
const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const generatePhoneNumber = () => {
    return `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
};

const generateEmployeeId = (index) => {
    return `EMP${String(index).padStart(4, '0')}`;
};

// Data generation functions
const generateUsers = async () => {
    console.log('Generating users...');
    const users = [];

    // Create superadmin
    const superAdmin = {
        name: 'System Administrator',
        username: 'superadmin',
        email: 'admin@company.com',
        phone: generatePhoneNumber(),
        password: await bcrypt.hash('admin123', SALT_ROUNDS),
        role: 'superadmin',
        permissions: ['read', 'write', 'edit', 'delete', 'manage_users', 'manage_stock', 'manage_finance', 'manage_employees', 'view_reports'],
        isActive: true,
        lastLogin: new Date()
    };
    users.push(superAdmin);

    // Create admins and subadmins
    for (let i = 1; i < USERS_COUNT; i++) {
        const role = i <= 5 ? 'admin' : 'subadmin';
        const permissions = role === 'admin'
            ? ['read', 'write', 'edit', 'delete', 'manage_stock', 'manage_finance', 'manage_employees', 'view_reports']
            : ['read', 'write', 'edit'];

        const user = {
            name: faker.person.fullName(),
            username: faker.internet.username().toLowerCase(),
            email: faker.internet.email().toLowerCase(),
            phone: generatePhoneNumber(),
            password: await bcrypt.hash('password123', SALT_ROUNDS),
            role,
            permissions,
            isActive: Math.random() > 0.1, // 90% active
            lastLogin: faker.date.recent({ days: 30 })
        };
        users.push(user);
    }

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);
    return createdUsers;
};

const generateEmployees = async (users) => {
    console.log('Generating employees...');
    const employees = [];

    for (let i = 0; i < EMPLOYEES_COUNT; i++) {
        const paymentType = Math.random() > 0.3 ? 'fixed' : 'hourly';
        const employee = {
            name: faker.person.fullName(),
            employeeId: generateEmployeeId(i + 1),
            phone: generatePhoneNumber(),
            paymentType,
            basicSalary: paymentType === 'fixed' ? faker.number.int({ min: 15000, max: 80000 }) : undefined,
            hourlyRate: paymentType === 'hourly' ? faker.number.int({ min: 150, max: 800 }) : undefined,
            isActive: Math.random() > 0.05, // 95% active
            joinDate: faker.date.past({ years: 3 })
        };
        employees.push(employee);
    }

    const createdEmployees = await Employee.insertMany(employees);
    console.log(`Created ${createdEmployees.length} employees`);
    return createdEmployees;
};

const generateManagers = async (employees, users) => {
    console.log('Generating managers...');
    const managers = [];
    const currentYear = new Date().getFullYear();
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    // Select random employees to be managers
    const managerEmployees = faker.helpers.shuffle(employees).slice(0, MANAGERS_COUNT);

    for (const employee of managerEmployees) {
        for (const month of months) {
            const allocatedBudget = faker.number.int({ min: 50000, max: 500000 });
            const spentAmount = faker.number.int({ min: 0, max: allocatedBudget });

            const manager = {
                employeeId: employee._id,
                userId: getRandomElement(users)._id,
                allocatedBudget,
                spentAmount,
                remainingAmount: allocatedBudget - spentAmount,
                month,
                year: currentYear,
                salaryAdjustment: faker.number.int({ min: -5000, max: 10000 }),
                isReconciled: Math.random() > 0.3,
                reconciledBy: Math.random() > 0.5 ? getRandomElement(users)._id : undefined,
                reconciledDate: Math.random() > 0.5 ? faker.date.recent({ days: 10 }) : undefined,
                notes: faker.lorem.sentence(),
                createdBy: getRandomElement(users)._id
            };
            managers.push(manager);
        }
    }

    const createdManagers = await Manager.insertMany(managers);
    console.log(`Created ${createdManagers.length} manager records`);
    return createdManagers;
};

const generateClients = async (users) => {
    console.log('Generating clients...');
    const clients = [];

    for (let i = 0; i < CLIENTS_COUNT; i++) {
        const type = Math.random() > 0.4 ? 'Customer' : 'Supplier';
        const client = {
            name: faker.company.name(),
            phone: generatePhoneNumber(),
            address: faker.location.streetAddress({ useFullAddress: true }),
            type,
            currentBalance: faker.number.int({ min: -100000, max: 500000 }),
            isActive: Math.random() > 0.05, // 95% active
            createdBy: getRandomElement(users)._id
        };
        clients.push(client);
    }

    const createdClients = await Client.insertMany(clients);
    console.log(`Created ${createdClients.length} clients`);
    return createdClients;
};

const generateClientLedgers = async (clients, users) => {
    console.log('Generating client ledgers...');
    const ledgers = [];

    for (const client of clients) {
        const entriesCount = faker.number.int({ min: 5, max: 25 });
        let runningBalance = 0;

        for (let i = 0; i < entriesCount; i++) {
            const debitAmount = Math.random() > 0.5 ? faker.number.int({ min: 0, max: 50000 }) : 0;
            const creditAmount = debitAmount === 0 ? faker.number.int({ min: 0, max: 50000 }) : 0;
            runningBalance += creditAmount - debitAmount;

            const ledger = {
                clientId: client._id,
                date: faker.date.recent({ days: 180 }),
                particulars: faker.lorem.sentence(),
                bags: faker.number.int({ min: 0, max: 100 }),
                weight: faker.number.int({ min: 0, max: 5000 }),
                rate: faker.number.int({ min: 10, max: 200 }),
                debitAmount,
                creditAmount,
                balance: runningBalance,
                createdBy: getRandomElement(users)._id
            };
            ledgers.push(ledger);
        }
    }

    const createdLedgers = await ClientLedger.insertMany(ledgers);
    console.log(`Created ${createdLedgers.length} client ledger entries`);
    return createdLedgers;
};

const generateStock = async (users) => {
    console.log('Generating stock entries...');
    const stocks = [];

    for (let i = 0; i < STOCK_ENTRIES_COUNT; i++) {
        const type = Math.random() > 0.5 ? 'IN' : 'OUT';
        const quantity = faker.number.int({ min: 1, max: 1000 });
        const unit = Math.random() > 0.3 ? 'kg' : 'bag';
        const rate = faker.number.int({ min: 20, max: 300 });

        const stock = {
            productName: getRandomElement(PRODUCT_CATEGORIES),
            type,
            quantity,
            unit,
            rate,
            amount: quantity * rate,
            clientName: faker.company.name(),
            invoiceNo: `INV-${faker.number.int({ min: 1000, max: 9999 })}`,
            date: faker.date.recent({ days: 365 }),
            notes: faker.lorem.sentence(),
            createdBy: getRandomElement(users)._id
        };
        stocks.push(stock);
    }

    const createdStocks = await Stock.insertMany(stocks);
    console.log(`Created ${createdStocks.length} stock entries`);
    return createdStocks;
};

const generateExpenses = async (users, managers) => {
    console.log('Generating expenses...');
    const expenses = [];

    for (let i = 0; i < EXPENSE_ENTRIES_COUNT; i++) {
        const isManagerExpense = Math.random() > 0.7;
        const expense = {
            category: getRandomElement(EXPENSE_CATEGORIES),
            amount: faker.number.int({ min: 500, max: 50000 }),
            description: faker.lorem.sentence(),
            employeeName: faker.person.fullName(),
            managerId: isManagerExpense ? getRandomElement(managers)._id : undefined,
            isManagerExpense,
            date: faker.date.recent({ days: 180 }),
            billNo: `BILL-${faker.number.int({ min: 1000, max: 9999 })}`,
            receiptUrl: faker.internet.url(),
            isApproved: Math.random() > 0.2, // 80% approved
            approvedBy: Math.random() > 0.2 ? getRandomElement(users)._id : undefined,
            createdBy: getRandomElement(users)._id,
            canEdit: Math.random() > 0.8 // 20% can edit
        };
        expenses.push(expense);
    }

    const createdExpenses = await Expense.insertMany(expenses);
    console.log(`Created ${createdExpenses.length} expense entries`);
    return createdExpenses;
};

const generateCashFlow = async (users) => {
    console.log('Generating cash flow entries...');
    const cashFlows = [];

    for (let i = 0; i < CASHFLOW_ENTRIES_COUNT; i++) {
        const type = Math.random() > 0.4 ? 'IN' : 'OUT';
        const paymentModes = ['Cash', 'Bank Transfer', 'Online'];
        const paymentMode = getRandomElement(paymentModes);

        const cashFlow = {
            type,
            amount: faker.number.int({ min: 1000, max: 200000 }),
            category: getRandomElement(CASHFLOW_CATEGORIES),
            description: faker.lorem.sentence(),
            employeeName: faker.person.fullName(),
            date: faker.date.recent({ days: 365 }),
            paymentMode,
            isOnline: paymentMode === 'Online',
            createdBy: getRandomElement(users)._id
        };
        cashFlows.push(cashFlow);
    }

    const createdCashFlows = await CashFlow.insertMany(cashFlows);
    console.log(`Created ${createdCashFlows.length} cash flow entries`);
    return createdCashFlows;
};

const generateAttendance = async (employees, users) => {
    console.log('Generating attendance records...');
    const attendances = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - ATTENDANCE_DAYS);

    for (const employee of employees) {
        for (let day = 0; day < ATTENDANCE_DAYS; day++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + day);

            // Skip some days randomly (weekends, holidays, absences)
            if (Math.random() > 0.8) continue;

            const isPresent = Math.random() > 0.1; // 90% attendance rate
            const hoursWorked = isPresent ? faker.number.int({ min: 6, max: 10 }) : 0;

            const attendance = {
                employeeId: employee._id,
                date: date,
                isPresent,
                hoursWorked,
                notes: !isPresent ? faker.lorem.sentence() : undefined,
                markedBy: getRandomElement(users)._id
            };
            attendances.push(attendance);
        }
    }

    const createdAttendances = await Attendance.insertMany(attendances);
    console.log(`Created ${createdAttendances.length} attendance records`);
    return createdAttendances;
};

// Main seeder function
const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Promise.all([
            User.deleteMany({}),
            Employee.deleteMany({}),
            Manager.deleteMany({}),
            Client.deleteMany({}),
            ClientLedger.deleteMany({}),
            Stock.deleteMany({}),
            Expense.deleteMany({}),
            CashFlow.deleteMany({}),
            Attendance.deleteMany({})
        ]);
        console.log('Existing data cleared');

        // Generate data in order (maintaining relationships)
        const users = await generateUsers();
        const employees = await generateEmployees(users);
        const managers = await generateManagers(employees, users);
        const clients = await generateClients(users);

        // Generate dependent data
        await generateClientLedgers(clients, users);
        await generateStock(users);
        await generateExpenses(users, managers);
        await generateCashFlow(users);
        await generateAttendance(employees, users);

        console.log('\n=== DATABASE SEEDING COMPLETED ===');
        console.log('Summary:');
        console.log(`- Users: ${users.length}`);
        console.log(`- Employees: ${employees.length}`);
        console.log(`- Managers: ${managers.length}`);
        console.log(`- Clients: ${clients.length}`);
        console.log(`- Stock Entries: ${STOCK_ENTRIES_COUNT}`);
        console.log(`- Expense Entries: ${EXPENSE_ENTRIES_COUNT}`);
        console.log(`- Cash Flow Entries: ${CASHFLOW_ENTRIES_COUNT}`);
        console.log(`- Attendance Records: Generated for last ${ATTENDANCE_DAYS} days`);

        console.log('\nDefault login credentials:');
        console.log('Username: superadmin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed');
        process.exit(0);
    }
};

// Run the seeder
seedDatabase();