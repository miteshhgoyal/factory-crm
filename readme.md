# MERN Stack App Setup With Authentication

A comprehensive MERN stack application featuring dual-role authentication system with separate admin and user dashboards. This project provides a complete foundation for building scalable web applications with role-based access control, JWT authentication, and administrative functionalities.

## Overview

This application is designed to serve as a robust starting point for projects requiring both administrative and user-facing interfaces. The system automatically creates a default admin account on first run if none exists, ensuring smooth initial setup. The architecture supports independent development of admin and user features while maintaining secure authentication and authorization mechanisms throughout the application.

The backend implements RESTful API endpoints with comprehensive authentication middleware, while the frontend provides separate dashboard interfaces for administrators and regular users. Each role has distinct access privileges and dedicated dashboard pages that can be extended with additional features as needed.

## Key Features

The application includes user registration and login functionality with secure password hashing using bcryptjs. JWT tokens are implemented for stateless authentication, providing secure session management across both user and admin interfaces. CORS configuration ensures proper cross-origin resource sharing, while protected routes prevent unauthorized access to sensitive areas.

Role-based access control distinguishes between admin and user privileges, with separate dashboard areas for each role. The system includes automatic admin seeding functionality that creates a default administrator account during initial setup, eliminating manual database configuration requirements.

## Technology Stack

The backend leverages Node.js with Express.js framework for robust server-side development, MongoDB for flexible data storage, and Mongoose for elegant object modeling. Security is ensured through JWT for token-based authentication, bcryptjs for password hashing, and CORS for safe cross-origin requests. Development efficiency is enhanced with nodemon for automatic server restarts.

The frontend utilizes React.js for dynamic user interfaces, React Router for client-side navigation, and Axios for seamless API communication. The component architecture allows for easy extension of both admin and user dashboard functionalities.

## Project Architecture

The application follows a clean separation of concerns with distinct client and server directories. The backend contains organized folders for database models, API routes, authentication middleware, and utility functions. The frontend maintains separate components for admin and user interfaces, with shared services for API communication and authentication management.

Dashboard pages are structured to accommodate future feature development, with dedicated routes and components for admin management functions and user-specific features. The authentication system seamlessly handles role detection and redirects users to appropriate dashboard interfaces based on their access level.

## Installation & Setup

Backend setup requires initializing a Node.js project and installing essential dependencies including Express, Mongoose, JWT, bcryptjs, and CORS packages. Development dependencies like nodemon enhance the development experience with automatic server restarts.

Frontend setup involves creating a React application and installing necessary packages for routing and API communication. Environment variables must be configured for database connections, JWT secrets, and API endpoints to ensure proper application functionality.

## Default Admin Configuration

The application includes intelligent admin seeding functionality that automatically creates a default administrator account during the first server startup. This eliminates the need for manual database configuration and ensures immediate access to administrative features. The default admin credentials are securely generated and can be customized through environment variables.

## Dashboard Development

Both admin and user dashboard interfaces are designed with extensibility in mind. The admin dashboard provides a foundation for implementing user management, system configuration, analytics, and other administrative features. The user dashboard offers a personalized interface for user-specific functionalities and can be enhanced with profile management, settings, and custom features.

The modular component structure allows developers to easily add new dashboard sections, integrate additional APIs, and implement complex user workflows without disrupting the existing authentication and authorization systems.

## API Endpoints & Authentication

The application provides comprehensive API endpoints for user registration, authentication, and profile management. Protected routes ensure secure access to sensitive data, while role-based middleware controls access to admin-specific endpoints. The JWT implementation provides stateless authentication suitable for scalable applications.

## Development Workflow

The development environment supports concurrent frontend and backend development with hot-reloading capabilities. The project structure facilitates team collaboration with clear separation between client and server code. Environment-specific configurations ensure smooth transitions between development, staging, and production environments.

This foundation provides everything needed to build sophisticated web applications with multiple user roles, secure authentication, and expandable dashboard interfaces for both administrative and end-user functionalities.

---

## System Enhancements and New Features

### Role-Based Permission Management

The Super Admin should have the ability to decide and assign specific permissions to each Admin. Similarly, each Admin should be able to assign and control the permissions of their respective Sub-Admins. The system should clearly show the hierarchy tracking - for example, if Rishabh (Super Admin) appoints Sagar as an Admin, and Sagar appoints Mitesh as a Sub-Admin, then Rishabh should be able to view Mitesh in the system with a note such as "Mitesh — Sub-Admin, Created by Sagar Siddhu".

---

### Reports Module

Implement multiple report types for better monitoring and analysis. The Production Report should track daily, weekly, and monthly production data. The Raw Material Report will monitor usage and availability of raw materials. A Workforce Report should provide an overview of manpower allocation and productivity. Credit Report will summarize all credit transactions, while the Debit Report will summarize all debit transactions.

---

### PDF Export

Add a feature to download data in PDF format for ledgers, reports, attendance sheets, and payment histories.

---

### Payment Options & Fix

Payment modes should include Online, Cheque, and Cash. There's a glitch that needs fixing: when "Cash" is selected, the Transaction ID field should be hidden. Instead, a Description field should appear for entering details such as "Paid cash on 10-08-2025 for purchase of raw materials".

---

### Account Categories

Add predefined account categories for better bookkeeping including Sales Account, Cash Account, and Purchase Account.

---

### Client Ledger Improvements

Fix the client ledger system for making entries and showing data properly to ensure accurate client transaction tracking.

---

### New Features

Employee Bank Details - list of banks while ading bank name - and searching in it
Employee Bank Details - ifsc code entered then fetching name of bank branch automatically

