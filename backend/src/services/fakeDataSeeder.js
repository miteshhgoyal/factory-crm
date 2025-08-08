import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Import all models
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
// const MONGODB_URI = 'mongodb+srv://miteshgoyal00:miteshgoyal.00@application-1.is4ucwp.mongodb.net/factory-crm?retryWrites=true&w=majority&appName=application-1';
const MONGODB_URI = 'mongodb://localhost:27017/factory-crm';
const SALT_ROUNDS = 12;

// Data generation constants
const USERS_COUNT = 5;
const EMPLOYEES_COUNT = 3;
const MANAGERS_COUNT = 3;
const CLIENTS_COUNT = 4;
const STOCK_ENTRIES_COUNT = 10;
const EXPENSE_ENTRIES_COUNT = 10;
const CASHFLOW_ENTRIES_COUNT = 10;
const ATTENDANCE_DAYS = 0;

// Manual data arrays
const FIRST_NAMES = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica',
    'William', 'Ashley', 'James', 'Amanda', 'Christopher', 'Jennifer', 'Daniel',
    'Lisa', 'Matthew', 'Michelle', 'Anthony', 'Kimberly', 'Mark', 'Donna',
    'Donald', 'Carol', 'Steven', 'Ruth', 'Paul', 'Sharon', 'Andrew', 'Laura'
];

const LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const COMPANY_NAMES = [
    'Global Enterprises', 'Tech Solutions Inc', 'Prime Industries', 'Metro Corp',
    'Elite Systems', 'Unity Holdings', 'Apex Trading', 'Summit Logistics',
    'Alpha Manufacturing', 'Beta Distributors', 'Gamma Supplies', 'Delta Services',
    'Pioneer Group', 'Victory Traders', 'Royal Enterprises', 'Crown Industries',
    'Diamond Corp', 'Golden Gate Trading', 'Silver Line Industries', 'Platinum Holdings',
    'Crystal Clear Solutions', 'Bright Future Inc', 'Green Valley Trading', 'Blue Ocean Corp',
    'Red Stone Industries', 'White Mountain Group', 'Black Pearl Trading', 'Pacific Enterprises'
];

const INDIAN_CITIES = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
    'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot'
];

const PRODUCT_CATEGORIES = [
    'Wheat', 'Rice', 'Barley', 'Corn', 'Oats', 'Soybeans',
    'Lentils', 'Chickpeas', 'Sugar', 'Salt', 'Flour', 'Oil'
];

const EXPENSE_CATEGORIES = [
    'Office Supplies', 'Transportation', 'Utilities', 'Maintenance',
    'Marketing', 'Insurance', 'Equipment', 'Software', 'Training',
    'Fuel', 'Repairs', 'Consulting', 'Legal', 'Accounting'
];

const CASHFLOW_CATEGORIES = [
    'Sales Revenue', 'Service Income', 'Investment', 'Loan',
    'Equipment Purchase', 'Inventory', 'Salaries', 'Rent',
    'Utilities', 'Tax Payment', 'Insurance', 'Marketing'
];

const BUSINESS_NOTES = [
    'Payment received successfully for monthly order',
    'Goods delivered in excellent condition',
    'Quality inspection completed and approved',
    'Invoice processed and sent to accounts',
    'Stock received as per purchase order',
    'Payment cleared through bank transfer',
    'Delivery completed on scheduled time',
    'Product quality meets our standards',
    'Customer feedback positive and satisfied',
    'Regular monthly business transaction',
    'Bulk order processed with discount',
    'Seasonal demand showing increase',
    'Special pricing applied for bulk purchase',
    'Urgent delivery request accommodated',
    'Standard business operation completed'
];

const EXPENSE_DESCRIPTIONS = [
    'Monthly office stationery and supplies purchase',
    'Vehicle fuel expenses for delivery operations',
    'Equipment maintenance and repair costs',
    'Electricity bill payment for current month',
    'Internet and telephone service charges',
    'Staff training and development program',
    'Marketing and promotional campaign expenses',
    'Insurance premium payment quarterly',
    'Software license renewal and upgrades',
    'Building repair and maintenance work',
    'Professional consulting service fees',
    'Legal documentation and compliance costs',
    'Accounting and bookkeeping service charges',
    'Transportation and delivery allowances'
];

const LEDGER_PARTICULARS = [
    'Cash payment received against invoice',
    'Goods sold on credit terms',
    'Advance payment for future orders',
    'Settlement of previous outstanding amount',
    'Discount allowed on bulk purchase',
    'Return of damaged goods adjustment',
    'Interest charged on overdue payment',
    'Credit note issued for return',
    'Debit note for additional charges',
    'Payment adjustment for short delivery',
    'Bonus discount for early payment',
    'Service charges for special handling',
    'Transportation charges adjustment',
    'Quality bonus payment',
    'Penalty deduction for late delivery'
];

const ATTENDANCE_NOTES = [
    'Medical leave due to illness',
    'Personal emergency family matter',
    'Scheduled medical appointment',
    'Attending family wedding ceremony',
    'Public holiday observance',
    'Late arrival due to traffic jam',
    'Early departure for personal work',
    'Training session attendance',
    'Client meeting representation',
    'Official work at different location'
];

// Utility functions
const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const randomDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - randomInt(0, days));
    return date;
};

const generatePhoneNumber = () => {
    const numbers = '0123456789';
    let phone = '+91';
    for (let i = 0; i < 10; i++) {
        phone += numbers[randomInt(0, 9)];
    }
    return phone;
};

const generateEmail = (firstName, lastName) => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const number = randomInt(1, 999);
    const domain = randomElement(domains);
    return `${cleanFirst}.${cleanLast}${number}@${domain}`;
};

const generateUsername = (firstName, lastName) => {
    const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const number = randomInt(1, 999);
    return `${cleanFirst}.${cleanLast}${number}`;
};

const generateEmployeeId = (index) => {
    return `EMP${String(index).padStart(4, '0')}`;
};

const generateInvoiceNumber = () => {
    return `INV-${randomInt(1000, 9999)}`;
};

const generateBillNumber = () => {
    return `BILL-${randomInt(1000, 9999)}`;
};

const generateFullName = () => {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    return `${firstName} ${lastName}`;
};

const generateAddress = () => {
    const streetNumbers = [randomInt(1, 999), randomInt(1, 999)];
    const streetNames = ['Main Street', 'Park Road', 'Mall Road', 'Station Road', 'Market Street'];
    const city = randomElement(INDIAN_CITIES);
    const states = ['Punjab', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat'];
    const state = randomElement(states);

    return `${streetNumbers[0]} ${randomElement(streetNames)}, ${city}, ${state}`;
};

// Data generation functions
const generateUsers = async () => {
    console.log('Generating users...');
    const users = [];

    // Create superadmin
    const superAdmin = {
        name: 'System Administrator',
        username: 'superadmin',
        email: 'admin@factory.com',
        phone: generatePhoneNumber(),
        password: await bcrypt.hash('admin@factory', SALT_ROUNDS),
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

        const firstName = randomElement(FIRST_NAMES);
        const lastName = randomElement(LAST_NAMES);
        const fullName = `${firstName} ${lastName}`;

        const user = {
            name: fullName,
            username: generateUsername(firstName, lastName),
            email: generateEmail(firstName, lastName),
            phone: generatePhoneNumber(),
            password: await bcrypt.hash('password123', SALT_ROUNDS),
            role,
            permissions,
            isActive: Math.random() > 0.1,
            lastLogin: randomDate(30)
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
            name: generateFullName(),
            employeeId: generateEmployeeId(i + 1),
            phone: generatePhoneNumber(),
            paymentType,
            basicSalary: paymentType === 'fixed' ? randomInt(15000, 80000) : undefined,
            hourlyRate: paymentType === 'hourly' ? randomInt(150, 800) : undefined,
            isActive: Math.random() > 0.05,
            joinDate: randomDate(365 * 3)
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
    const shuffledEmployees = [...employees].sort(() => Math.random() - 0.5);
    const managerEmployees = shuffledEmployees.slice(0, MANAGERS_COUNT);

    for (const employee of managerEmployees) {
        for (const month of months) {
            const allocatedBudget = randomInt(50000, 500000);
            const spentAmount = randomInt(0, allocatedBudget);

            const manager = {
                employeeId: employee._id,
                userId: randomElement(users)._id,
                allocatedBudget,
                spentAmount,
                remainingAmount: allocatedBudget - spentAmount,
                month,
                year: currentYear,
                salaryAdjustment: randomInt(-5000, 10000),
                isReconciled: Math.random() > 0.3,
                reconciledBy: Math.random() > 0.5 ? randomElement(users)._id : undefined,
                reconciledDate: Math.random() > 0.5 ? randomDate(10) : undefined,
                notes: randomElement(BUSINESS_NOTES),
                createdBy: randomElement(users)._id
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
            name: randomElement(COMPANY_NAMES),
            phone: generatePhoneNumber(),
            address: generateAddress(),
            type,
            currentBalance: randomInt(-100000, 500000),
            isActive: Math.random() > 0.05,
            createdBy: randomElement(users)._id
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
        const entriesCount = randomInt(5, 25);
        let runningBalance = 0;

        for (let i = 0; i < entriesCount; i++) {
            const debitAmount = Math.random() > 0.5 ? randomInt(0, 50000) : 0;
            const creditAmount = debitAmount === 0 ? randomInt(0, 50000) : 0;
            runningBalance += creditAmount - debitAmount;

            const ledger = {
                clientId: client._id,
                date: randomDate(180),
                particulars: randomElement(LEDGER_PARTICULARS),
                bags: randomInt(0, 100),
                weight: randomInt(0, 5000),
                rate: randomInt(10, 200),
                debitAmount,
                creditAmount,
                balance: runningBalance,
                createdBy: randomElement(users)._id
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
        const quantity = randomInt(1, 1000);
        const unit = Math.random() > 0.3 ? 'kg' : 'bag';
        const rate = randomInt(20, 300);

        const stock = {
            productName: randomElement(PRODUCT_CATEGORIES),
            type,
            quantity,
            unit,
            rate,
            amount: quantity * rate,
            clientName: randomElement(COMPANY_NAMES),
            invoiceNo: generateInvoiceNumber(),
            date: randomDate(365),
            notes: randomElement(BUSINESS_NOTES),
            createdBy: randomElement(users)._id
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
            category: randomElement(EXPENSE_CATEGORIES),
            amount: randomInt(500, 50000),
            description: randomElement(EXPENSE_DESCRIPTIONS),
            employeeName: generateFullName(),
            managerId: isManagerExpense ? randomElement(managers)._id : undefined,
            isManagerExpense,
            date: randomDate(180),
            billNo: generateBillNumber(),
            receiptUrl: `https://example.com/receipts/${randomInt(1000, 9999)}.pdf`,
            isApproved: Math.random() > 0.2,
            approvedBy: Math.random() > 0.2 ? randomElement(users)._id : undefined,
            createdBy: randomElement(users)._id,
            canEdit: Math.random() > 0.8
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
        const paymentMode = randomElement(paymentModes);

        const cashFlow = {
            type,
            amount: randomInt(1000, 200000),
            category: randomElement(CASHFLOW_CATEGORIES),
            description: randomElement(BUSINESS_NOTES),
            employeeName: generateFullName(),
            date: randomDate(365),
            paymentMode,
            isOnline: paymentMode === 'Online',
            createdBy: randomElement(users)._id
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

            const isPresent = Math.random() > 0.1;
            const hoursWorked = isPresent ? randomInt(6, 10) : 0;

            const attendance = {
                employeeId: employee._id,
                date: date,
                isPresent,
                hoursWorked,
                notes: !isPresent ? randomElement(ATTENDANCE_NOTES) : undefined,
                markedBy: randomElement(users)._id
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
        console.log('Password: admin@factory');

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
