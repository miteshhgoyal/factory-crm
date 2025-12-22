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
  Building2,
  ScrollText,
  Loader2,
  XCircle,
  Building,
  Save,
  Plus,
  Crown,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions } from "../contexts/PermissionsContext";
import { userAPI } from "../services/api";

import DatabaseManagement from "./admin/globals/DatabaseManagement";

// Import admin components
import Dashboard from "./admin/globals/Dashboard";
import Profile from "./admin/globals/Profile";
import Support from "./admin/globals/Support";

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
import CompaniesAndUsersManagement from "./admin/settings/CompaniesAndUsersManagement";
import CashFlowReport from "./admin/cash/CashFlowReport";
// import FakeEntries from "./admin/globals/FakeEntries";
import Notifications from "./admin/globals/Notifications";
import SwitchCompanyData from "./admin/settings/SwitchCompanyData";
import EmployeeLedger from "./admin/employees/EmployeeLedger";
import SalesAccountReport from "./admin/reports/SalesAccountReport";
import CashAccountReport from "./admin/reports/CashAccountReport";
import PurchaseAccountReport from "./admin/reports/PurchaseAccountReport";
import ProductionAccountReport from "./admin/reports/ProductionAccountReport";

// Protected Route Component
const PermissionProtectedRoute = ({ children, module, action }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasPermission(module, action)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

// Company Selection Barrier Component
const CompanySelectionScreen = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    description: "",
  });

  // Fetch companies based on user role
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      // Admin/Subadmin get only assigned companies
      const response = await userAPI.getMyAssignedCompanies();
      if (response?.data?.success) {
        setCompanies(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSelectCompany = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);
      setError("");
      const response = await userAPI.updateSelectedCompany(selectedCompanyId);
      if (response?.data?.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to select company:", error);
      setError("Failed to select company. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyFormData.name.trim()) return;

    try {
      setSaving(true);
      setError("");
      const response = await userAPI.createCompany({
        name: companyFormData.name.trim(),
        description: companyFormData.description.trim(),
      });

      if (response?.data?.success) {
        const newCompanyId = response.data.data._id;
        await userAPI.updateSelectedCompany(newCompanyId);
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create company:", error);
      setError("Failed to create company. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Superadmin skip option - bypass company selection
  const handleSkipSelection = async () => {
    if (user.role !== "superadmin") return;

    try {
      setSaving(true);
      await userAPI.updateSelectedCompany("skip");
      window.location.reload();
    } catch (error) {
      console.error("Failed to skip company selection:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.role === "superadmin"
              ? "Company Management"
              : "Select Company to Continue"}
          </h1>
          <p className="text-gray-600 text-lg">
            {user.role === "superadmin"
              ? "Create new companies, select existing ones, or continue without selection"
              : "Choose a company to start working with your dashboard"}
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                user.role === "superadmin"
                  ? "bg-red-100"
                  : user.role === "admin"
                  ? "bg-purple-100"
                  : "bg-blue-100"
              }`}
            >
              {user.role === "superadmin" ? (
                <Crown className="w-6 h-6 text-red-600" />
              ) : user.role === "admin" ? (
                <Shield className="w-6 h-6 text-purple-600" />
              ) : (
                <NavUser className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Welcome, {user.name || user.username}
              </h3>
              <p className="text-sm text-gray-600">
                Role: {user.role} | {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {user.role === "superadmin" ? (
            // Superadmin Options
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Superadmin Options
                </h3>
                <p className="text-gray-600 text-sm">
                  Create new companies, select existing ones, or continue
                  without company selection
                </p>
              </div>

              {!showCreateForm ? (
                <div className="space-y-6">
                  {/* Existing Companies */}
                  {companies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Or Select an Existing Company
                      </label>
                      <div className="grid gap-3 max-h-60 overflow-y-auto">
                        {companies.map((company) => (
                          <label
                            key={company._id}
                            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                              selectedCompanyId === company._id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedCompany"
                              value={company._id}
                              checked={selectedCompanyId === company._id}
                              onChange={(e) =>
                                setSelectedCompanyId(e.target.value)
                              }
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div className="flex items-center gap-3 flex-1">
                              <Building className="w-5 h-5 text-orange-600" />
                              <div>
                                <span className="font-medium text-gray-900">
                                  {company.name}
                                </span>
                                {company.description && (
                                  <div className="text-sm text-gray-500">
                                    {company.description}
                                  </div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  Created:{" "}
                                  {new Date(
                                    company.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Company
                    </button>

                    {selectedCompanyId && (
                      <button
                        onClick={handleSelectCompany}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Selecting..." : "Select Company"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Create New Company Form
                <form onSubmit={handleCreateCompany} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={companyFormData.name}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={companyFormData.description}
                      onChange={(e) =>
                        setCompanyFormData({
                          ...companyFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter company description"
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !companyFormData.name.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? "Creating..." : "Create & Select"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // Admin/Subadmin Company Selection
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Your Company
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose from your assigned companies to continue
                </p>
              </div>

              {companies.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {companies.map((company) => (
                      <label
                        key={company._id}
                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                          selectedCompanyId === company._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedCompany"
                          value={company._id}
                          checked={selectedCompanyId === company._id}
                          onChange={(e) => setSelectedCompanyId(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <Building className="w-5 h-5 text-orange-600" />
                          <div>
                            <span className="font-medium text-gray-900">
                              {company.name}
                            </span>
                            {company.description && (
                              <div className="text-sm text-gray-500">
                                {company.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Assigned to you | Created:{" "}
                              {new Date(company.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSelectCompany}
                      disabled={saving || !selectedCompanyId}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? "Selecting..." : "Continue"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No Companies Assigned
                  </h4>
                  <p className="text-gray-500">
                    You don't have any companies assigned to you yet. Contact
                    your administrator to get access to companies.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const { user } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check if user needs to select company
  const needsCompanySelection = () => {
    if (!user) return false;

    // For all roles, check if they need to select a company
    return (
      !user.selectedCompany ||
      user.selectedCompany === "Not Selected" ||
      user.selectedCompany === "Select Company" ||
      user.selectedCompany === "" ||
      user.selectedCompany === null ||
      user.selectedCompany === undefined
    );
  };

  // Check user roles
  const isSuperAdmin = user?.role === "superadmin";

  const navbarLinks = [
    {
      name: "Switch Company Data",
      icon: Building2,
      href: "/admin/settings/switch-company-data",
    },
    ...(isSuperAdmin
      ? [
          {
            name: "Database Management",
            icon: Database,
            href: "/admin/database",
          },
        //   {
        //     name: "Fake Entries",
        //     icon: FileX,
        //     href: "/admin/fake-entries",
        //   },
        ]
      : []),
  ];

  // Filter sidebar links based on permissions
  const sidebarLinks = React.useMemo(() => {
    if (permissionsLoading) return [];

    const links = [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: Home,
        show: hasPermission("dashboard"),
      },
      {
        name: "Stock Management",
        icon: Package,
        show:
          hasPermission("stock", "dashboard") ||
          hasPermission("stock", "stockIn") ||
          hasPermission("stock", "stockOut") ||
          hasPermission("stock", "reports"),
        subItems: [
          {
            name: "Stock Dashboard",
            href: "/admin/stock/dashboard",
            show: hasPermission("stock", "dashboard"),
          },
          {
            name: "Stock In",
            href: "/admin/stock/in",
            show: hasPermission("stock", "stockIn"),
          },
          {
            name: "Stock Out",
            href: "/admin/stock/out",
            show: hasPermission("stock", "stockOut"),
          },
          {
            name: "Stock Report",
            href: "/admin/stock/report",
            show: hasPermission("stock", "reports"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Cash Flow",
        icon: Wallet,
        show:
          hasPermission("cashFlow", "dashboard") ||
          hasPermission("cashFlow", "cashIn") ||
          hasPermission("cashFlow", "cashOut") ||
          hasPermission("cashFlow", "reports"),
        subItems: [
          {
            name: "Cash Dashboard",
            href: "/admin/cash/dashboard",
            show: hasPermission("cashFlow", "dashboard"),
          },
          {
            name: "Cash In",
            href: "/admin/cash/in",
            show: hasPermission("cashFlow", "cashIn"),
          },
          {
            name: "Cash Out",
            href: "/admin/cash/out",
            show: hasPermission("cashFlow", "cashOut"),
          },
          {
            name: "Cash Report",
            href: "/admin/cash/report",
            show: hasPermission("cashFlow", "reports"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Expenses",
        icon: Receipt,
        show:
          hasPermission("expenses", "dashboard") ||
          hasPermission("expenses", "add") ||
          hasPermission("expenses", "reports"),
        subItems: [
          {
            name: "Expense Dashboard",
            href: "/admin/expenses/dashboard",
            show: hasPermission("expenses", "dashboard"),
          },
          {
            name: "Add Expense",
            href: "/admin/expenses/add",
            show: hasPermission("expenses", "add"),
          },
          {
            name: "Expense Report",
            href: "/admin/expenses/report",
            show: hasPermission("expenses", "reports"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Employees",
        icon: Users,
        show:
          hasPermission("employees", "dashboard") ||
          hasPermission("employees", "add") ||
          hasPermission("employees", "list") ||
          hasPermission("employees", "ledger"),
        subItems: [
          {
            name: "Employee Dashboard",
            href: "/admin/employees/dashboard",
            show: hasPermission("employees", "dashboard"),
          },
          {
            name: "Add Employee",
            href: "/admin/employees/add",
            show: hasPermission("employees", "add"),
          },
          {
            name: "Employee List",
            href: "/admin/employees/list",
            show: hasPermission("employees", "list"),
          },
          {
            name: "Employee Ledger",
            href: "/admin/employees/ledger",
            show: hasPermission("employees", "ledger"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Attendance",
        icon: Calendar,
        show:
          hasPermission("attendance", "dashboard") ||
          hasPermission("attendance", "sheet") ||
          hasPermission("attendance", "mark") ||
          hasPermission("attendance", "calendar"),
        subItems: [
          {
            name: "Attendance Dashboard",
            href: "/admin/attendance/dashboard",
            show: hasPermission("attendance", "dashboard"),
          },
          {
            name: "Salary Management",
            href: "/admin/attendance/sheet",
            show: hasPermission("attendance", "sheet"),
          },
          {
            name: "Mark Attendance",
            href: "/admin/attendance/mark",
            show: hasPermission("attendance", "mark"),
          },
          {
            name: "Calendar View",
            href: "/admin/attendance/calendar",
            show: hasPermission("attendance", "calendar"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Clients",
        icon: UserCheck,
        show:
          hasPermission("clients", "dashboard") ||
          hasPermission("clients", "add") ||
          hasPermission("clients", "list") ||
          hasPermission("clients", "ledger"),
        subItems: [
          {
            name: "Client Dashboard",
            href: "/admin/clients/dashboard",
            show: hasPermission("clients", "dashboard"),
          },
          {
            name: "Add Client",
            href: "/admin/clients/add",
            show: hasPermission("clients", "add"),
          },
          {
            name: "Client List",
            href: "/admin/clients/list",
            show: hasPermission("clients", "list"),
          },
          {
            name: "Client Ledger",
            href: "/admin/clients/ledger",
            show: hasPermission("clients", "ledger"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Accounts",
        icon: ScrollText,
        show:
          hasPermission("accounts", "cash") ||
          hasPermission("accounts", "purchase") ||
          hasPermission("accounts", "sales") ||
          hasPermission("accounts", "production"),
        subItems: [
          {
            name: "Cash Account",
            href: "/admin/reports/account/cash",
            show: hasPermission("accounts", "cash"),
          },
          {
            name: "Purchase Account",
            href: "/admin/reports/account/purchase",
            show: hasPermission("accounts", "purchase"),
          },
          {
            name: "Sales Account",
            href: "/admin/reports/account/sales",
            show: hasPermission("accounts", "sales"),
          },
          {
            name: "Production Account",
            href: "/admin/reports/account/production",
            show: hasPermission("accounts", "production"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Reports",
        icon: BarChart3,
        show:
          hasPermission("reports", "dashboard") ||
          hasPermission("reports", "daily") ||
          hasPermission("reports", "weekly") ||
          hasPermission("reports", "monthly") ||
          hasPermission("reports", "yearly"),
        subItems: [
          {
            name: "Reports Dashboard",
            href: "/admin/reports/dashboard",
            show: hasPermission("reports", "dashboard"),
          },
          {
            name: "Daily Report",
            href: "/admin/reports/daily",
            show: hasPermission("reports", "daily"),
          },
          {
            name: "Weekly Report",
            href: "/admin/reports/weekly",
            show: hasPermission("reports", "weekly"),
          },
          {
            name: "Monthly Report",
            href: "/admin/reports/monthly",
            show: hasPermission("reports", "monthly"),
          },
          {
            name: "Yearly Report",
            href: "/admin/reports/yearly",
            show: hasPermission("reports", "yearly"),
          },
        ].filter((item) => item.show),
      },
      {
        name: "Settings",
        icon: Settings,
        show: hasPermission("settings", "companiesAndUsers"),
        subItems: [
          {
            name: "Companies & Users",
            href: "/admin/settings/companies-and-users",
            show: hasPermission("settings", "companiesAndUsers"),
          },
        ].filter((item) => item.show),
      },
    ].filter(
      (link) => link.show && (link.subItems?.length > 0 || !link.subItems)
    );

    return links;
  }, [hasPermission, permissionsLoading]);

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

  // Show loading if permissions are still being fetched
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Show company selection screen if needed
  if (needsCompanySelection()) {
    return <CompanySelectionScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-x-hidden">
      <Navbar
        toggleSidebar={toggleSidebar}
        navigationLinks={navbarLinks}
        systemName={user.selectedCompany || "Admin Panel"}
      />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        navigationLinks={sidebarLinks}
        systemName={user.selectedCompany || "Admin Panel"}
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
                sidebarOpen ? "ml-64" : "ml-20"
              }`
        }`}
      >
        <div className={`py-6 md:py-8 max-w-[1200px] mx-auto`}>
          <Routes>
            {/* Main Routes */}
            <Route path="Notifications" element={<Notifications />} />
            {/* <Route path="fake-entries" element={<FakeEntries />} /> */}
            <Route path="database" element={<DatabaseManagement />} />

            <Route
              path="dashboard"
              element={
                <PermissionProtectedRoute module="dashboard">
                  <Dashboard />
                </PermissionProtectedRoute>
              }
            />

            <Route path="profile" element={<Profile />} />
            <Route path="support" element={<Support />} />

            {/* Stock Management Routes */}
            <Route
              path="stock/dashboard"
              element={
                <PermissionProtectedRoute module="stock" action="dashboard">
                  <StockDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="stock/in"
              element={
                <PermissionProtectedRoute module="stock" action="stockIn">
                  <StockIn />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="stock/out"
              element={
                <PermissionProtectedRoute module="stock" action="stockOut">
                  <StockOut />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="stock/report"
              element={
                <PermissionProtectedRoute module="stock" action="reports">
                  <StockReport />
                </PermissionProtectedRoute>
              }
            />

            {/* Cash Flow Routes */}
            <Route
              path="cash/dashboard"
              element={
                <PermissionProtectedRoute module="cashFlow" action="dashboard">
                  <CashFlowDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="cash/in"
              element={
                <PermissionProtectedRoute module="cashFlow" action="cashIn">
                  <CashIn />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="cash/out"
              element={
                <PermissionProtectedRoute module="cashFlow" action="cashOut">
                  <CashOut />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="cash/report"
              element={
                <PermissionProtectedRoute module="cashFlow" action="reports">
                  <CashFlowReport />
                </PermissionProtectedRoute>
              }
            />

            {/* Expense Routes */}
            <Route
              path="expenses/dashboard"
              element={
                <PermissionProtectedRoute module="expenses" action="dashboard">
                  <ExpenseDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="expenses/add"
              element={
                <PermissionProtectedRoute module="expenses" action="add">
                  <AddExpense />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="expenses/report"
              element={
                <PermissionProtectedRoute module="expenses" action="reports">
                  <ExpenseReport />
                </PermissionProtectedRoute>
              }
            />

            {/* Employee Routes */}
            <Route
              path="employees/dashboard"
              element={
                <PermissionProtectedRoute module="employees" action="dashboard">
                  <EmployeeDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route path="employees/payments" element={<EmployeePayments />} />
            <Route
              path="employees/add"
              element={
                <PermissionProtectedRoute module="employees" action="add">
                  <AddEmployee />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="employees/list"
              element={
                <PermissionProtectedRoute module="employees" action="list">
                  <EmployeeList />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="employees/ledger"
              element={
                <PermissionProtectedRoute module="employees" action="ledger">
                  <EmployeeLedger />
                </PermissionProtectedRoute>
              }
            />

            {/* Attendance Routes */}
            <Route
              path="attendance/dashboard"
              element={
                <PermissionProtectedRoute
                  module="attendance"
                  action="dashboard"
                >
                  <AttendanceDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="attendance/sheet"
              element={
                <PermissionProtectedRoute module="attendance" action="sheet">
                  <AttendanceSheet />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="attendance/mark"
              element={
                <PermissionProtectedRoute module="attendance" action="mark">
                  <MarkAttendance />
                </PermissionProtectedRoute>
              }
            />
            <Route path="attendance/report" element={<AttendanceReport />} />
            <Route
              path="attendance/calendar"
              element={
                <PermissionProtectedRoute module="attendance" action="calendar">
                  <AttendanceCalendar />
                </PermissionProtectedRoute>
              }
            />

            {/* Client Routes */}
            <Route
              path="clients/dashboard"
              element={
                <PermissionProtectedRoute module="clients" action="dashboard">
                  <ClientDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="clients/add"
              element={
                <PermissionProtectedRoute module="clients" action="add">
                  <AddClient />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="clients/list"
              element={
                <PermissionProtectedRoute module="clients" action="list">
                  <ClientList />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="clients/ledger"
              element={
                <PermissionProtectedRoute module="clients" action="ledger">
                  <ClientLedger />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="clients/:clientId/ledger"
              element={
                <PermissionProtectedRoute module="clients" action="ledger">
                  <ClientLedger />
                </PermissionProtectedRoute>
              }
            />

            <Route
              path="reports/account/cash"
              element={
                <PermissionProtectedRoute module="accounts" action="cash">
                  <CashAccountReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/account/purchase"
              element={
                <PermissionProtectedRoute module="accounts" action="purchase">
                  <PurchaseAccountReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/account/sales"
              element={
                <PermissionProtectedRoute module="accounts" action="sales">
                  <SalesAccountReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/account/production"
              element={
                <PermissionProtectedRoute module="accounts" action="production">
                  <ProductionAccountReport />
                </PermissionProtectedRoute>
              }
            />

            {/* Reports Routes */}
            <Route
              path="reports/dashboard"
              element={
                <PermissionProtectedRoute module="reports" action="dashboard">
                  <ReportsDashboard />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/daily"
              element={
                <PermissionProtectedRoute module="reports" action="daily">
                  <DailyReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/weekly"
              element={
                <PermissionProtectedRoute module="reports" action="weekly">
                  <WeeklyReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/monthly"
              element={
                <PermissionProtectedRoute module="reports" action="monthly">
                  <MonthlyReport />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="reports/yearly"
              element={
                <PermissionProtectedRoute module="reports" action="yearly">
                  <YearlyReport />
                </PermissionProtectedRoute>
              }
            />

            <Route
              path="settings/companies-and-users"
              element={
                <PermissionProtectedRoute
                  module="settings"
                  action="companiesAndUsers"
                >
                  <CompaniesAndUsersManagement />
                </PermissionProtectedRoute>
              }
            />
            <Route
              path="settings/switch-company-data"
              element={<SwitchCompanyData />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Admin;
