import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Routes, Route } from "react-router-dom";
import {
  Home,
  Package,
  IndianRupee,
  Receipt,
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  Settings,
  User as NavUser,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Database,
  FileX,
} from "lucide-react";
import { CONFIG } from "../constants";
import { useAuth } from "../contexts/AuthContext";

import DatabaseManagement from "./admin/DatabaseManagement";

// Import admin components
import Dashboard from "./admin/Dashboard";
import Profile from "./admin/Profile";
import Support from "./admin/Support";

// Stock Management
import StockDashboard from "./admin/stock/StockDashboard";
import StockIn from "./admin/stock/StockIn";
import StockOut from "./admin/stock/StockOut";
import StockReport from "./admin/stock/StockReport";

// Cash Flow Management
import CashFlowDashboard from "./admin/cash/CashFlowDashboard";
import CashIn from "./admin/cash/CashIn";
import CashOut from "./admin/cash/CashOut";

// Expense Management
import ExpenseDashboard from "./admin/expenses/ExpenseDashboard";
import AddExpense from "./admin/expenses/AddExpense";
import ExpenseReport from "./admin/expenses/ExpenseReport";

// Employee Management
import EmployeeDashboard from "./admin/employees/EmployeeDashboard";
import AddEmployee from "./admin/employees/AddEmployee";
import EmployeeList from "./admin/employees/EmployeeList";
import EmployeePayments from "./admin/employees/EmployeePayments";

// Attendance Management
import AttendanceDashboard from "./admin/attendance/AttendanceDashboard";
import MarkAttendance from "./admin/attendance/MarkAttendance";
import AttendanceReport from "./admin/attendance/AttendanceReport";
import AttendanceCalendar from "./admin/attendance/AttendanceCalendar";
import AttendanceSheet from "./admin/attendance/AttendanceSheet";

// Client Management
import ClientDashboard from "./admin/clients/ClientDashboard";
import AddClient from "./admin/clients/AddClient";
import ClientList from "./admin/clients/ClientList";
import ClientLedger from "./admin/clients/ClientLedger";

// Reports
import ReportsDashboard from "./admin/reports/ReportsDashboard";
import DailyReport from "./admin/reports/DailyReport";
import WeeklyReport from "./admin/reports/WeeklyReport";
import MonthlyReport from "./admin/reports/MonthlyReport";
import YearlyReport from "./admin/reports/YearlyReport";

// Settings
import UserManagement from "./admin/settings/UserManagement";
import CashFlowReport from "./admin/cash/CashFlowReport";
import FakeEntries from "./admin/FakeEntries";

const Admin = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if user is superadmin
  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isSubAdmin = user?.role === "subadmin";

  const navbarLinks = [
    // { name: "My Profile", href: "/admin/profile", icon: NavUser },
    // { name: "Support", href: "/admin/support", icon: HelpCircle },
    ...(isSuperAdmin
      ? [
          {
            name: "Database Management",
            icon: Database,
            href: "/admin/database",
          },
          {
            name: "Fake Entries",
            icon: FileX,
            href: "/admin/fake-entries",
          },
        ]
      : []),
  ];

  const sidebarLinks = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: Home,
    },
    {
      name: "Stock Management",
      icon: Package,
      subItems: [
        { name: "Stock Dashboard", href: "/admin/stock/dashboard" },
        { name: "Stock In", href: "/admin/stock/in" },
        { name: "Stock Out", href: "/admin/stock/out" },
        { name: "Stock Report", href: "/admin/stock/report" },
      ],
    },
    {
      name: "Cash Flow",
      icon: Wallet,
      subItems: [
        { name: "Cash Dashboard", href: "/admin/cash/dashboard" },
        { name: "Cash In", href: "/admin/cash/in" },
        { name: "Cash Out", href: "/admin/cash/out" },
        { name: "Cash Report", href: "/admin/cash/report" },
      ],
    },
    {
      name: "Expenses",
      icon: Receipt,
      subItems: [
        { name: "Expense Dashboard", href: "/admin/expenses/dashboard" },
        { name: "Add Expense", href: "/admin/expenses/add" },
        { name: "Expense Report", href: "/admin/expenses/report" },
      ],
    },
    {
      name: "Employees",
      icon: Users,
      subItems: [
        { name: "Employee Dashboard", href: "/admin/employees/dashboard" },
        { name: "Employee Payments", href: "/admin/employees/payments" },
        { name: "Add Employee", href: "/admin/employees/add" },
        { name: "Employee List", href: "/admin/employees/list" },
      ],
    },
    {
      name: "Attendance",
      icon: Calendar,
      subItems: [
        { name: "Attendance Dashboard", href: "/admin/attendance/dashboard" },
        { name: "Attendance Sheet", href: "/admin/attendance/sheet" },
        { name: "Mark Attendance", href: "/admin/attendance/mark" },
        { name: "Attendance Report", href: "/admin/attendance/report" },
        { name: "Calendar View", href: "/admin/attendance/calendar" },
      ],
    },
    {
      name: "Clients",
      icon: UserCheck,
      subItems: [
        { name: "Client Dashboard", href: "/admin/clients/dashboard" },
        { name: "Add Client", href: "/admin/clients/add" },
        { name: "Client List", href: "/admin/clients/list" },
        { name: "Client Ledger", href: "/admin/clients/ledger" },
      ],
    },
    {
      name: "Reports",
      icon: BarChart3,
      subItems: [
        { name: "Reports Dashboard", href: "/admin/reports/dashboard" },
        { name: "Daily Report", href: "/admin/reports/daily" },
        { name: "Weekly Report", href: "/admin/reports/weekly" },
        { name: "Monthly Report", href: "/admin/reports/monthly" },
        { name: "Yearly Report", href: "/admin/reports/yearly" },
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            name: "Settings",
            icon: Settings,
            subItems: [
              { name: "User Management", href: "/admin/settings/users" },
            ],
          },
        ]
      : []),
  ];

  useEffect(() => {
    const checkMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);

      if (isMobileNow) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={toggleSidebar}
        navigationLinks={navbarLinks}
        config={CONFIG}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navigationLinks={sidebarLinks}
        config={CONFIG}
      />

      {/* Mobile overlay when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile
            ? "pt-16 px-4 sm:px-6"
            : `pt-20 md:pt-24 px-4 sm:px-6 md:px-12 ${
                sidebarOpen ? "ml-64" : "ml-16"
              }`
        }`}
      >
        <div
          className={`py-6 md:py-8 max-w-full ${
            !isMobile && sidebarOpen ? "max-w-[calc(100vw-16rem)]" : ""
          }`}
        >
          <Routes>
            {/* Main Routes */}
            <Route path="fake-entries" element={<FakeEntries />} />
            <Route path="database" element={<DatabaseManagement />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="support" element={<Support />} />

            {/* Stock Management Routes */}
            <Route path="stock/dashboard" element={<StockDashboard />} />
            <Route path="stock/in" element={<StockIn />} />
            <Route path="stock/out" element={<StockOut />} />
            <Route path="stock/report" element={<StockReport />} />

            {/* Cash Flow Routes */}
            <Route path="cash/dashboard" element={<CashFlowDashboard />} />
            <Route path="cash/in" element={<CashIn />} />
            <Route path="cash/out" element={<CashOut />} />
            <Route path="cash/report" element={<CashFlowReport />} />

            {/* Expense Routes */}
            <Route path="expenses/dashboard" element={<ExpenseDashboard />} />
            <Route path="expenses/add" element={<AddExpense />} />
            <Route path="expenses/report" element={<ExpenseReport />} />

            {/* Employee Routes */}
            <Route path="employees/dashboard" element={<EmployeeDashboard />} />
            <Route path="employees/payments" element={<EmployeePayments />} />
            <Route path="employees/add" element={<AddEmployee />} />
            <Route path="employees/list" element={<EmployeeList />} />

            {/* Attendance Routes */}
            <Route
              path="attendance/dashboard"
              element={<AttendanceDashboard />}
            />
            <Route path="attendance/sheet" element={<AttendanceSheet />} />
            <Route path="attendance/mark" element={<MarkAttendance />} />
            <Route path="attendance/report" element={<AttendanceReport />} />
            <Route
              path="attendance/calendar"
              element={<AttendanceCalendar />}
            />

            {/* Client Routes */}
            <Route path="clients/dashboard" element={<ClientDashboard />} />
            <Route path="clients/add" element={<AddClient />} />
            <Route path="clients/list" element={<ClientList />} />
            <Route path="clients/ledger" element={<ClientLedger />} />
            <Route path="clients/:clientId/ledger" element={<ClientLedger />} />

            {/* Reports Routes */}
            <Route path="reports/dashboard" element={<ReportsDashboard />} />
            <Route path="reports/daily" element={<DailyReport />} />
            <Route path="reports/weekly" element={<WeeklyReport />} />
            <Route path="reports/monthly" element={<MonthlyReport />} />
            <Route path="reports/yearly" element={<YearlyReport />} />

            {/* Settings Routes (Only for Superadmin) */}
            {isSuperAdmin && (
              <>
                <Route path="settings/users" element={<UserManagement />} />
              </>
            )}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Admin;
