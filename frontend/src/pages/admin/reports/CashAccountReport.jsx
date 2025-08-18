import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  IndianRupee,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  AlertCircle,
  X,
  Edit,
  Save,
  Plus,
  Eye,
  Trash2,
  Building,
  User,
  FileText,
  Calendar,
  Loader2,
  CreditCard,
  Receipt,
  BarChart3,
  Search,
  RefreshCw,
  FilterX,
  Info,
  Clock,
  CalendarDays,
  PieChart,
  Activity,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  cashFlowAPI,
  employeeLedgerAPI,
  expenseAPI,
  employeeAPI,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";

// DataRow component for section cards
const DataRow = ({
  label,
  value,
  valueColor = "text-gray-900",
  bold = false,
}) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm text-gray-600">{label}</span>
    <span
      className={`${valueColor} ${
        bold ? "font-bold text-base" : "font-medium text-sm"
      }`}
    >
      {value}
    </span>
  </div>
);

const CashAccountReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data States
  const [cashTransactions, setCashTransactions] = useState([]);
  const [employeePayments, setEmployeePayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    paymentMode: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("all"); // all, cash, employees, expenses

  // Pagination States
  const [cashPagination, setCashPagination] = useState({});
  const [employeePagination, setEmployeePagination] = useState({});
  const [expensePagination, setExpensePagination] = useState({});

  // Modal States
  const [viewModal, setViewModal] = useState({
    open: false,
    item: null,
    type: null,
  });
  const [editModal, setEditModal] = useState({
    open: false,
    item: null,
    type: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    item: null,
    type: null,
  });
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        // Cash Transactions
        cashFlowAPI.getTransactions(filters),
        // Employee Payments
        employeeLedgerAPI.getLedgerEntries({
          employeeId: filters.employeeName ? filters.employeeName : undefined,
          paymentType:
            filters.type === "salary"
              ? "salary"
              : filters.type === "advance"
              ? "advance"
              : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        // Expenses
        expenseAPI.getExpenses(filters),
        // Employees
        employeeAPI.getEmployees(),
      ];

      const [
        cashResponse,
        employeeResponse,
        expenseResponse,
        employeesResponse,
      ] = await Promise.all(promises);

      // Set Cash Transactions
      if (cashResponse.data?.success) {
        setCashTransactions(
          Array.isArray(cashResponse.data.data?.transactions)
            ? cashResponse.data.data.transactions
            : []
        );
        setCashPagination(cashResponse.data.data?.pagination || {});
      } else {
        setCashTransactions([]);
        setCashPagination({});
      }

      // Set Employee Payments
      if (employeeResponse.data?.success) {
        setEmployeePayments(
          Array.isArray(employeeResponse.data.data?.ledgerEntries)
            ? employeeResponse.data.data.ledgerEntries
            : []
        );
        setEmployeePagination(employeeResponse.data.data?.pagination || {});
      } else {
        setEmployeePayments([]);
        setEmployeePagination({});
      }

      // Set Expenses
      if (expenseResponse.data?.success) {
        setExpenses(
          Array.isArray(expenseResponse.data.data?.expenses)
            ? expenseResponse.data.data.expenses
            : []
        );
        setExpensePagination(expenseResponse.data.data?.pagination || {});
      } else {
        setExpenses([]);
        setExpensePagination({});
      }

      // Set Employees
      if (employeesResponse.data?.success) {
        setEmployees(
          Array.isArray(employeesResponse.data.data?.employees)
            ? employeesResponse.data.data.employees
            : []
        );
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch account report data. Please try again.");
      setCashTransactions([]);
      setEmployeePayments([]);
      setExpenses([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Enhanced calculations with time-based analysis
  const calculations = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper function to check if date is in range
    const isInDateRange = (dateStr, start, end = now) => {
      const date = new Date(dateStr);
      return date >= start && date <= end;
    };

    // Cash flow calculations
    const allCashIn = cashTransactions.filter((t) => t.type === "IN");
    const allCashOut = cashTransactions.filter((t) => t.type === "OUT");

    const todayCashIn = allCashIn
      .filter((t) => isInDateRange(t.date, todayStart))
      .reduce((sum, t) => sum + t.amount, 0);
    const todayCashOut = allCashOut
      .filter((t) => isInDateRange(t.date, todayStart))
      .reduce((sum, t) => sum + t.amount, 0);

    const yesterdayCashIn = allCashIn
      .filter((t) => isInDateRange(t.date, yesterdayStart, todayStart))
      .reduce((sum, t) => sum + t.amount, 0);
    const yesterdayCashOut = allCashOut
      .filter((t) => isInDateRange(t.date, yesterdayStart, todayStart))
      .reduce((sum, t) => sum + t.amount, 0);

    const weekCashIn = allCashIn
      .filter((t) => isInDateRange(t.date, weekStart))
      .reduce((sum, t) => sum + t.amount, 0);
    const weekCashOut = allCashOut
      .filter((t) => isInDateRange(t.date, weekStart))
      .reduce((sum, t) => sum + t.amount, 0);

    const monthCashIn = allCashIn
      .filter((t) => isInDateRange(t.date, monthStart))
      .reduce((sum, t) => sum + t.amount, 0);
    const monthCashOut = allCashOut
      .filter((t) => isInDateRange(t.date, monthStart))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCashIn = allCashIn.reduce((sum, t) => sum + t.amount, 0);
    const totalCashOut = allCashOut.reduce((sum, t) => sum + t.amount, 0);

    // Employee payments calculations
    const todayEmployeePayments = employeePayments
      .filter((p) => isInDateRange(p.date, todayStart))
      .reduce((sum, p) => sum + p.amount, 0);
    const weekEmployeePayments = employeePayments
      .filter((p) => isInDateRange(p.date, weekStart))
      .reduce((sum, p) => sum + p.amount, 0);
    const monthEmployeePayments = employeePayments
      .filter((p) => isInDateRange(p.date, monthStart))
      .reduce((sum, p) => sum + p.amount, 0);
    const totalEmployeePayments = employeePayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Expenses calculations
    const todayExpenses = expenses
      .filter((e) => isInDateRange(e.date, todayStart))
      .reduce((sum, e) => sum + e.amount, 0);
    const weekExpenses = expenses
      .filter((e) => isInDateRange(e.date, weekStart))
      .reduce((sum, e) => sum + e.amount, 0);
    const monthExpenses = expenses
      .filter((e) => isInDateRange(e.date, monthStart))
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Combined calculations
    const todayTotalOut = todayCashOut + todayEmployeePayments + todayExpenses;
    const todayNetFlow = todayCashIn - todayTotalOut;

    const weekTotalOut = weekCashOut + weekEmployeePayments + weekExpenses;
    const weekNetFlow = weekCashIn - weekTotalOut;

    const monthTotalOut = monthCashOut + monthEmployeePayments + monthExpenses;
    const monthNetFlow = monthCashIn - monthTotalOut;

    const totalOutflow = totalCashOut + totalEmployeePayments + totalExpenses;
    const totalNetFlow = totalCashIn - totalOutflow;

    // Transaction counts
    const todayTransactionCount = [
      ...cashTransactions.filter((t) => isInDateRange(t.date, todayStart)),
      ...employeePayments.filter((p) => isInDateRange(p.date, todayStart)),
      ...expenses.filter((e) => isInDateRange(e.date, todayStart)),
    ].length;

    // Average calculations
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const daysPassed = now.getDate();
    const avgDailyIn = monthCashIn / daysPassed;
    const avgDailyOut = monthTotalOut / daysPassed;

    // Growth calculations
    const cashInGrowth =
      yesterdayCashIn > 0
        ? ((todayCashIn - yesterdayCashIn) / yesterdayCashIn) * 100
        : 0;
    const cashOutGrowth =
      yesterdayCashOut > 0
        ? ((todayCashOut - yesterdayCashOut) / yesterdayCashOut) * 100
        : 0;

    // Payment mode breakdown
    const paymentModeBreakdown = {};
    [...cashTransactions, ...employeePayments, ...expenses].forEach((item) => {
      const mode = item.paymentMode || "Unknown";
      if (!paymentModeBreakdown[mode]) {
        paymentModeBreakdown[mode] = { count: 0, amount: 0 };
      }
      paymentModeBreakdown[mode].count++;
      paymentModeBreakdown[mode].amount += item.amount;
    });

    // Category breakdown
    const categoryBreakdown = {};
    [...cashTransactions, ...employeePayments, ...expenses].forEach((item) => {
      const category = item.category || "Uncategorized";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, amount: 0 };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].amount += item.amount;
    });

    // Top spending categories
    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5);

    return {
      // Today's data
      todayCashIn,
      todayCashOut,
      todayEmployeePayments,
      todayExpenses,
      todayTotalOut,
      todayNetFlow,
      todayTransactionCount,

      // Weekly data
      weekCashIn,
      weekCashOut,
      weekEmployeePayments,
      weekExpenses,
      weekTotalOut,
      weekNetFlow,

      // Monthly data
      monthCashIn,
      monthCashOut,
      monthEmployeePayments,
      monthExpenses,
      monthTotalOut,
      monthNetFlow,

      // Total data
      totalCashIn,
      totalCashOut,
      totalEmployeePayments,
      totalExpenses,
      totalOutflow,
      totalNetFlow,
      totalTransactions:
        cashTransactions.length + employeePayments.length + expenses.length,

      // Averages
      avgDailyIn,
      avgDailyOut,

      // Growth
      cashInGrowth,
      cashOutGrowth,

      // Breakdowns
      paymentModeBreakdown,
      categoryBreakdown,
      topCategories,
    };
  }, [cashTransactions, employeePayments, expenses]);

  // Consolidated data for display
  const allTransactions = useMemo(() => {
    let combined = [];

    // Add cash transactions
    if (dataTypeFilter === "all" || dataTypeFilter === "cash") {
      combined = [
        ...combined,
        ...cashTransactions.map((t) => ({ ...t, dataType: "cash" })),
      ];
    }

    // Add employee payments
    if (dataTypeFilter === "all" || dataTypeFilter === "employees") {
      combined = [
        ...combined,
        ...employeePayments.map((p) => ({
          ...p,
          dataType: "employee",
          type: "OUT",
          description: `${p.category} payment to ${p.employeeName}`,
          category: p.category,
        })),
      ];
    }

    // Add expenses
    if (dataTypeFilter === "all" || dataTypeFilter === "expenses") {
      combined = [
        ...combined,
        ...expenses.map((e) => ({
          ...e,
          dataType: "expense",
          type: "OUT",
          paymentMode: e.paymentMode,
        })),
      ];
    }

    // Filter by search term
    if (searchTerm) {
      combined = combined.filter(
        (item) =>
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [
    cashTransactions,
    employeePayments,
    expenses,
    dataTypeFilter,
    searchTerm,
  ]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: "",
      category: "",
      paymentMode: "",
      employeeName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50,
    });
    setSearchTerm("");
    setDataTypeFilter("all");
    setShowFilters(false);
  }, []);

  const hasActiveFilters = () => {
    return (
      searchTerm ||
      dataTypeFilter !== "all" ||
      filters.type ||
      filters.category ||
      filters.paymentMode ||
      filters.employeeName ||
      filters.startDate ||
      filters.endDate
    );
  };

  // View handlers
  const handleView = useCallback((item, type) => {
    setViewModal({ open: true, item, type });
  }, []);

  // Edit handlers
  const handleEdit = useCallback(async (item, type) => {
    try {
      let itemDetails = item;

      // Fetch detailed item if needed
      if (type === "employee" && item._id) {
        const response = await employeeLedgerAPI.getLedgerEntryById(item._id);
        itemDetails = response.data.data;
      }

      setEditFormData({
        amount: itemDetails.amount || "",
        category: itemDetails.category || "",
        description: itemDetails.description || "",
        employeeName: itemDetails.employeeName || "",
        paymentMode: itemDetails.paymentMode || "Cash",
        receiptNumber: itemDetails.receiptNumber || "",
        notes: itemDetails.notes || "",
        date: itemDetails.date
          ? new Date(itemDetails.date).toISOString().split("T")[0]
          : "",
      });
      setEditModal({ open: true, item: itemDetails, type });
      setEditErrors({});
    } catch (error) {
      console.error("Failed to fetch item details:", error);
    }
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.item || !editModal.type) return;

    const errors = {};
    if (!editFormData.amount || editFormData.amount <= 0) {
      errors.amount = "Valid amount is required";
    }
    if (!editFormData.description?.trim()) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      const updateData = {
        ...editFormData,
        amount: Math.round(editFormData.amount),
      };

      // Update based on type
      switch (editModal.type) {
        case "cash":
          await cashFlowAPI.updateTransaction(editModal.item._id, updateData);
          break;
        case "employee":
          await employeeLedgerAPI.updateLedgerEntry(
            editModal.item._id,
            updateData
          );
          break;
        case "expense":
          await expenseAPI.updateExpense(editModal.item._id, updateData);
          break;
        default:
          throw new Error("Invalid edit type");
      }

      setEditModal({ open: false, item: null, type: null });
      setEditFormData({});
      setEditErrors({});
      fetchAllData();
    } catch (error) {
      console.error("Failed to update item:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update item",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handlers
  const handleDelete = useCallback((item, type) => {
    setDeleteModal({ open: true, item, type });
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.item || !deleteModal.type) return;

    try {
      setDeleteLoading(true);

      // Delete based on type
      switch (deleteModal.type) {
        case "cash":
          await cashFlowAPI.deleteTransaction(deleteModal.item._id);
          break;
        case "employee":
          await employeeLedgerAPI.deleteLedgerEntry(deleteModal.item._id);
          break;
        case "expense":
          await expenseAPI.deleteExpense(deleteModal.item._id);
          break;
        default:
          throw new Error("Invalid delete type");
      }

      setDeleteModal({ open: false, item: null, type: null });
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export functionality
  const exportData = useCallback(() => {
    const csvData = allTransactions.map((item) => ({
      Type:
        item.dataType === "cash"
          ? item.type === "IN"
            ? "Cash In"
            : "Cash Out"
          : item.dataType === "employee"
          ? "Employee Payment"
          : "Expense",
      Amount: item.amount,
      Category: item.category,
      Description: item.description,
      Employee: item.employeeName || "N/A",
      PaymentMode: item.paymentMode,
      Date: formatDate(item.date),
      CreatedBy: item.createdBy?.username || "System",
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cash-account-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [allTransactions]);

  const canEdit = user?.role === "superadmin";
  const canDelete = user?.role === "superadmin";

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Account Report"
          subheader="Comprehensive cash flow analysis and financial overview"
          onRefresh={fetchAllData}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Account Report"
          subheader="Comprehensive cash flow analysis and financial overview"
          onRefresh={fetchAllData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load report data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchAllData} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Account Report"
          subheader="Comprehensive cash flow analysis and financial overview"
          onRefresh={fetchAllData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span>Reports</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Cash Account</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/reports/dashboard")}
              className="btn-secondary btn-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Reports</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-primary btn-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            <button onClick={exportData} className="btn-purple btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Today's Summary Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today's Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Cash In"
              value={`₹${calculations.todayCashIn?.toLocaleString() || 0}`}
              icon={TrendingUp}
              color="green"
              subtitle={
                calculations.cashInGrowth !== 0
                  ? `${
                      calculations.cashInGrowth > 0 ? "+" : ""
                    }${calculations.cashInGrowth.toFixed(1)}% vs yesterday`
                  : "No change from yesterday"
              }
            />
            <StatCard
              title="Today's Cash Out"
              value={`₹${calculations.todayCashOut?.toLocaleString() || 0}`}
              icon={TrendingDown}
              color="red"
              subtitle={
                calculations.cashOutGrowth !== 0
                  ? `${
                      calculations.cashOutGrowth > 0 ? "+" : ""
                    }${calculations.cashOutGrowth.toFixed(1)}% vs yesterday`
                  : "No change from yesterday"
              }
            />
            <StatCard
              title="Today's Employee Payments"
              value={`₹${
                calculations.todayEmployeePayments?.toLocaleString() || 0
              }`}
              icon={User}
              color="blue"
              subtitle="Staff payments today"
            />
            <StatCard
              title="Today's Other Expenses"
              value={`₹${calculations.todayExpenses?.toLocaleString() || 0}`}
              icon={Receipt}
              color="orange"
              subtitle="Other expenses today"
            />
          </div>
        </div>

        {/* Period-wise Summary Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-600" />
            Period Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Net Flow"
              value={`₹${calculations.todayNetFlow?.toLocaleString() || 0}`}
              icon={Activity}
              color={calculations.todayNetFlow >= 0 ? "green" : "red"}
              subtitle={`${calculations.todayTransactionCount} transactions today`}
            />
            <StatCard
              title="This Week's Net Flow"
              value={`₹${calculations.weekNetFlow?.toLocaleString() || 0}`}
              icon={Target}
              color={calculations.weekNetFlow >= 0 ? "green" : "red"}
              subtitle="7-day performance"
            />
            <StatCard
              title="This Month's Net Flow"
              value={`₹${calculations.monthNetFlow?.toLocaleString() || 0}`}
              icon={PieChart}
              color={calculations.monthNetFlow >= 0 ? "green" : "red"}
              subtitle="Monthly performance"
            />
            <StatCard
              title="Overall Net Flow"
              value={`₹${calculations.totalNetFlow?.toLocaleString() || 0}`}
              icon={IndianRupee}
              color={calculations.totalNetFlow >= 0 ? "green" : "red"}
              subtitle={`${calculations.totalTransactions} total transactions`}
            />
          </div>
        </div>

        {/* Averages and Insights */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Insights & Averages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Avg Daily Income"
              value={`₹${
                Math.round(calculations.avgDailyIn)?.toLocaleString() || 0
              }`}
              icon={IndianRupee}
              color="green"
              subtitle="This month average"
            />
            <StatCard
              title="Avg Daily Outflow"
              value={`₹${
                Math.round(calculations.avgDailyOut)?.toLocaleString() || 0
              }`}
              icon={IndianRupee}
              color="red"
              subtitle="This month average"
            />
            <StatCard
              title="Top Payment Mode"
              value={
                Object.keys(calculations.paymentModeBreakdown).length > 0
                  ? Object.entries(calculations.paymentModeBreakdown).sort(
                      (a, b) => b[1].amount - a[1].amount
                    )
                  : "N/A"
              }
              icon={CreditCard}
              color="blue"
              subtitle={
                Object.keys(calculations.paymentModeBreakdown).length > 0
                  ? `₹${
                      Object.entries(calculations.paymentModeBreakdown)
                        .sort((a, b) => b[1].amount - a[1].amount)?.[1]
                        ?.amount?.toLocaleString() || 0
                    }`
                  : "No data"
              }
            />
            <StatCard
              title="Top Category"
              value={
                calculations.topCategories.length > 0
                  ? calculations.topCategories[0]
                  : "N/A"
              }
              icon={FileText}
              color="purple"
              subtitle={
                calculations.topCategories.length > 0
                  ? `₹${
                      calculations.topCategories[0][1].amount?.toLocaleString() ||
                      0
                    }`
                  : "No data"
              }
            />
          </div>
        </div>

        {/* Analytics Section Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Flow Analytics */}
          <SectionCard
            title="Cash Flow Analytics"
            icon={IndianRupee}
            headerColor="green"
          >
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Monthly Summary
                </h4>
                <DataRow
                  label="Total Cash Inflow"
                  value={`₹${calculations.monthCashIn?.toLocaleString() || 0}`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Total Cash Outflow"
                  value={`₹${calculations.monthCashOut?.toLocaleString() || 0}`}
                  valueColor="text-red-600"
                />
                <div className="border-t border-green-200 mt-2 pt-2">
                  <DataRow
                    label="Net Cash Flow"
                    value={`₹${
                      calculations.monthNetFlow?.toLocaleString() || 0
                    }`}
                    valueColor={
                      calculations.monthNetFlow >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                    bold={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Today's Summary
                </h4>
                <DataRow
                  label="Cash Received"
                  value={`₹${calculations.todayCashIn?.toLocaleString() || 0}`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Cash Spent"
                  value={`₹${calculations.todayCashOut?.toLocaleString() || 0}`}
                  valueColor="text-red-600"
                />
              </div>
            </div>
          </SectionCard>

          {/* Expense Analytics */}
          <SectionCard
            title="Expense Analytics"
            icon={Receipt}
            headerColor="red"
          >
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">
                  Expense Overview
                </h4>
                <DataRow
                  label="Total Expenses (Month)"
                  value={`₹${
                    calculations.monthExpenses?.toLocaleString() || 0
                  }`}
                  valueColor="text-red-600"
                />
                <DataRow
                  label="Total Expenses (Today)"
                  value={`₹${
                    calculations.todayExpenses?.toLocaleString() || 0
                  }`}
                  valueColor="text-red-600"
                />
                <DataRow
                  label="Expense Transactions"
                  value={expenses.length}
                  valueColor="text-red-600"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Top Category</h4>
                <DataRow
                  label="Category"
                  value={
                    calculations.topCategories.length > 0
                      ? calculations.topCategories[0][0]
                      : "N/A"
                  }
                />
                <DataRow
                  label="Amount"
                  value={
                    calculations.topCategories.length > 0
                      ? `₹${calculations.topCategories[0][1].amount.toLocaleString()}`
                      : "₹0"
                  }
                  valueColor="text-red-600"
                />
              </div>
            </div>
          </SectionCard>

          {/* Employee Payment Analytics */}
          <SectionCard
            title="Employee Payment Analytics"
            icon={User}
            headerColor="blue"
          >
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Payment Summary
                </h4>
                <DataRow
                  label="Employee Payments (Month)"
                  value={`₹${
                    calculations.monthEmployeePayments?.toLocaleString() || 0
                  }`}
                  valueColor="text-blue-600"
                />
                <DataRow
                  label="Employee Payments (Today)"
                  value={`₹${
                    calculations.todayEmployeePayments?.toLocaleString() || 0
                  }`}
                  valueColor="text-blue-600"
                />
                <DataRow
                  label="Payment Transactions"
                  value={employeePayments.length}
                  valueColor="text-blue-600"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Weekly Performance
                </h4>
                <DataRow
                  label="Week Total Payments"
                  value={`₹${
                    calculations.weekEmployeePayments?.toLocaleString() || 0
                  }`}
                  valueColor="text-blue-600"
                />
                <DataRow
                  label="Average Daily"
                  value={`₹${
                    Math.round(
                      calculations.weekEmployeePayments / 7
                    )?.toLocaleString() || 0
                  }`}
                  valueColor="text-blue-600"
                />
              </div>
            </div>
          </SectionCard>

          {/* Payment Mode Analytics */}
          <SectionCard
            title="Payment Mode Analytics"
            icon={CreditCard}
            headerColor="purple"
          >
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">
                  Mode Breakdown
                </h4>
                {Object.entries(calculations.paymentModeBreakdown)
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .slice(0, 5)
                  .map(([mode, data], i) => (
                    <DataRow
                      key={mode}
                      label={mode}
                      value={`₹${data.amount.toLocaleString()} (${
                        data.count
                      } txns)`}
                      valueColor="text-purple-600"
                    />
                  ))}
                {Object.keys(calculations.paymentModeBreakdown).length ===
                  0 && (
                  <div className="text-sm text-gray-500">
                    No payment mode data available
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter Transactions
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Type
                  </label>
                  <select
                    value={dataTypeFilter}
                    onChange={(e) => setDataTypeFilter(e.target.value)}
                    className="input-primary"
                  >
                    <option value="all">All Data</option>
                    <option value="cash">Cash Flow</option>
                    <option value="employees">Employee Payments</option>
                    <option value="expenses">Other Expenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="input-primary"
                  >
                    <option value="">All Types</option>
                    <option value="IN">Cash In</option>
                    <option value="OUT">Cash Out</option>
                    <option value="salary">Salary</option>
                    <option value="advance">Advance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    placeholder="Search category..."
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    name="paymentMode"
                    value={filters.paymentMode}
                    onChange={handleFilterChange}
                    className="input-primary"
                  >
                    <option value="">All Modes</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    name="employeeName"
                    value={filters.employeeName}
                    onChange={handleFilterChange}
                    className="input-primary"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="input-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="btn-secondary btn-sm"
                  >
                    <FilterX className="w-4 h-4" />
                    Clear All Filters
                  </button>
                )}

                <div className="text-sm text-gray-600 flex items-center">
                  Showing {allTransactions.length} total records
                </div>
              </div>

              {/* Enhanced Filter Summary */}
              {hasActiveFilters() && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Active filters:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                        <Search className="h-3 w-3 mr-1" />"{searchTerm}"
                      </span>
                    )}
                    {dataTypeFilter !== "all" && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {dataTypeFilter}
                      </span>
                    )}
                    {filters.type && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                        {filters.type}
                      </span>
                    )}
                    {filters.startDate && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
                        From: {formatDate(filters.startDate)}
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-800 rounded-full">
                        To: {formatDate(filters.endDate)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* All Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Complete Financial Report
                  </h3>
                  <p className="text-sm text-gray-600">
                    All cash flow, payments, and expenses
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {allTransactions.length} total records
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Payment Mode
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.length > 0 ? (
                    allTransactions.map((transaction) => {
                      const isInflow = transaction.type === "IN";
                      const typeColor = isInflow ? "green" : "red";
                      const typeIcon = isInflow ? TrendingUp : TrendingDown;
                      const TypeIcon = typeIcon;

                      let typeLabel = "";
                      if (transaction.dataType === "cash") {
                        typeLabel = isInflow ? "Cash In" : "Cash Out";
                      } else if (transaction.dataType === "employee") {
                        typeLabel = "Employee Payment";
                      } else if (transaction.dataType === "expense") {
                        typeLabel = "Expense";
                      }

                      return (
                        <tr
                          key={`${transaction.dataType}-${transaction._id}`}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center bg-${typeColor}-100`}
                              >
                                <TypeIcon
                                  className={`w-4 h-4 text-${typeColor}-600`}
                                />
                              </div>
                              <span
                                className={`font-medium text-sm text-${typeColor}-600`}
                              >
                                {typeLabel}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full text-nowrap">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 text-sm">
                              {transaction.description}
                            </span>
                            {transaction.employeeName && (
                              <div className="text-xs text-gray-500">
                                {transaction.employeeName}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold text-sm text-${typeColor}-600`}
                            >
                              {isInflow ? "+" : "-"}₹
                              {transaction.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 text-sm">
                              {transaction.paymentMode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600 text-sm">
                              {formatDate(transaction.date)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleView(transaction, transaction.dataType)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canEdit && (
                                <button
                                  onClick={() =>
                                    handleEdit(
                                      transaction,
                                      transaction.dataType
                                    )
                                  }
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      transaction,
                                      transaction.dataType
                                    )
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No transactions found
                        </p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {allTransactions.length > 0 ? (
                allTransactions.map((transaction) => {
                  const isInflow = transaction.type === "IN";
                  const typeColor = isInflow ? "green" : "red";
                  const typeIcon = isInflow ? TrendingUp : TrendingDown;
                  const TypeIcon = typeIcon;

                  let typeLabel = "";
                  if (transaction.dataType === "cash") {
                    typeLabel = isInflow ? "Cash In" : "Cash Out";
                  } else if (transaction.dataType === "employee") {
                    typeLabel = "Employee Payment";
                  } else if (transaction.dataType === "expense") {
                    typeLabel = "Expense";
                  }

                  return (
                    <div
                      key={`${transaction.dataType}-${transaction._id}`}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <TypeIcon
                              className={`w-4 h-4 text-${typeColor}-600`}
                            />
                            <span
                              className={`font-medium text-${typeColor}-600`}
                            >
                              {typeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleView(transaction, transaction.dataType)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() =>
                                  handleEdit(transaction, transaction.dataType)
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() =>
                                  handleDelete(
                                    transaction,
                                    transaction.dataType
                                  )
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p className="font-medium text-gray-900">
                            {transaction.category}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <p className="text-gray-700">
                            {transaction.description}
                          </p>
                          {transaction.employeeName && (
                            <p className="text-sm text-gray-500 mt-1">
                              {transaction.employeeName}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className={`font-bold text-${typeColor}-600`}>
                              {isInflow ? "+" : "-"}₹
                              {transaction.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {transaction.paymentMode}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No transactions found
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, item: null, type: null })}
        title="Transaction Details"
        subtitle="Complete transaction information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="md"
      >
        {viewModal.item && (
          <div className="space-y-4">
            {/* Transaction Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="h-4 w-4 text-blue-600" />
                <h3 className="text-md font-semibold text-gray-900">
                  Transaction Overview
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Transaction Type
                  </label>
                  <div className="flex items-center gap-2">
                    {viewModal.item.type === "IN" ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span
                      className={`font-medium text-sm ${
                        viewModal.item.type === "IN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {viewModal.item.dataType === "cash"
                        ? viewModal.item.type === "IN"
                          ? "Cash In"
                          : "Cash Out"
                        : viewModal.item.dataType === "employee"
                        ? "Employee Payment"
                        : "Expense"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Amount
                  </label>
                  <div
                    className={`text-lg font-bold ${
                      viewModal.item.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {viewModal.item.type === "IN" ? "+" : "-"}₹
                    {viewModal.item.amount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Category
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {viewModal.item.category}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Payment Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {viewModal.item.paymentMode}
                    </span>
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Description
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {viewModal.item.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Date
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(viewModal.item.date)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Created By
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {viewModal.item.createdBy?.username || "System"}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            {viewModal.item.employeeName && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-green-600" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Employee Information
                  </h3>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-500">
                    Employee Name
                  </label>
                  <div className="text-sm font-medium text-gray-900">
                    {viewModal.item.employeeName}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(viewModal.item.receiptNumber || viewModal.item.notes) && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <h3 className="text-md font-semibold text-gray-900">
                    Additional Information
                  </h3>
                </div>
                <div className="space-y-3">
                  {viewModal.item.receiptNumber && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500">
                        Receipt Number
                      </label>
                      <div className="text-sm font-medium text-gray-900">
                        {viewModal.item.receiptNumber}
                      </div>
                    </div>
                  )}

                  {viewModal.item.notes && (
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-500">
                        Notes
                      </label>
                      <div className="text-sm text-gray-900 bg-white p-2 rounded-lg border">
                        {viewModal.item.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, item: null, type: null })}
        title="Edit Transaction"
        subtitle="Update transaction details"
        headerIcon={<Edit />}
        headerColor="blue"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{editErrors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.amount || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, amount: e.target.value })
                }
                className={`input-primary ${
                  editErrors.amount ? "input-error" : ""
                }`}
                placeholder="Enter amount"
              />
              {editErrors.amount && (
                <p className="mt-1 text-xs text-red-600">{editErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                value={editFormData.category || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, category: e.target.value })
                }
                className={`input-primary ${
                  editErrors.category ? "input-error" : ""
                }`}
                placeholder="Enter category"
              />
              {editErrors.category && (
                <p className="mt-1 text-xs text-red-600">
                  {editErrors.category}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                rows={2}
                className={`input-primary ${
                  editErrors.description ? "input-error" : ""
                }`}
                placeholder="Enter description"
              />
              {editErrors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {editErrors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={editFormData.paymentMode || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    paymentMode: e.target.value,
                  })
                }
                className="input-primary"
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={editFormData.date || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, date: e.target.value })
                }
                className="input-primary"
              />
            </div>

            {editModal.type === "employee" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Name
                </label>
                <input
                  type="text"
                  value={editFormData.employeeName || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      employeeName: e.target.value,
                    })
                  }
                  className="input-primary"
                  placeholder="Enter employee name"
                />
              </div>
            )}

            {editModal.type === "expense" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={editFormData.receiptNumber || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      receiptNumber: e.target.value,
                    })
                  }
                  className="input-primary"
                  placeholder="Enter receipt number"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editFormData.notes || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, notes: e.target.value })
              }
              rows={2}
              className="input-primary"
              placeholder="Enter any notes"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() =>
                setEditModal({ open: false, item: null, type: null })
              }
              className="btn-secondary flex-1"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null, type: null })}
        title="Delete Transaction"
        subtitle="This action cannot be undone"
        headerIcon={<AlertCircle />}
        headerColor="red"
        size="md"
      >
        {deleteModal.item && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this transaction?
                </h4>
                <p className="text-sm text-red-700">
                  {deleteModal.item.category} - ₹
                  {deleteModal.item.amount.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Type:{" "}
                  {deleteModal.item.dataType === "cash"
                    ? deleteModal.item.type === "IN"
                      ? "Cash In"
                      : "Cash Out"
                    : deleteModal.item.dataType === "employee"
                    ? "Employee Payment"
                    : "Expense"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() =>
                  setDeleteModal({ open: false, item: null, type: null })
                }
                className="btn-secondary flex-1"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger flex-1"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CashAccountReport;
