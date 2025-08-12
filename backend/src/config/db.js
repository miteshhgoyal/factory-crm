import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from "../models/User.js";
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MONGO_URI = process.env.NODE_ENV === 'development'
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_PROD;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed admin user if not exists
        await seedAdminUser();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const seedAdminUser = async () => {
    try {
        const adminUserId = process.env.ADMIN_USER_ID || 'superadmin';
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@factory.com';
        const adminMobile = process.env.ADMIN_MOBILE || '0000000000';

        if (!adminPassword) {
            console.warn('ADMIN_PASSWORD not set in environment variables');
            return;
        }

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: adminUserId });

        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Create admin user
        const admin = new User({
            username: adminUserId,
            name: 'Super Admin',
            email: adminEmail,
            phone: adminMobile,
            password: hashedPassword,
            role: 'superadmin',
        });

        await admin.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
};

export default connectDB;