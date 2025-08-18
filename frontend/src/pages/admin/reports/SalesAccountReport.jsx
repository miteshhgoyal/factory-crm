import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
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
  IndianRupee,
  Search,
  RefreshCw,
  FilterX,
  Info,
  Clock,
  CalendarDays,
  PieChart,
  Activity,
  Target,
  CreditCard,
  Receipt,
  BarChart3,
  Weight,
  Hash,
  MapPin,
  Phone,
  ShoppingCart,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI, clientAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";
import * as XLSX from "xlsx";

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

const SalesAccountReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data States
  const [salesTransactions, setSalesTransactions] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "OUT", // Only sales transactions (Stock OUT)
    productName: "",
    clientName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  // Pagination States
  const [pagination, setPagination] = useState({});

  // Modal States
  const [viewModal, setViewModal] = useState({
    open: false,
    transaction: null,
  });
  const [editModal, setEditModal] = useState({
    open: false,
    transaction: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    transaction: null,
  });
  const [clientDetailModal, setClientDetailModal] = useState({
    open: false,
    client: null,
    ledgerEntries: [],
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
        // Sales Transactions (Stock OUT only)
        stockAPI.getTransactions({ ...filters, type: "OUT" }),
        // Stock Balance
        stockAPI.getBalance(),
        // Clients (Suppliers)
        clientAPI.getClients({ limit: 100 }),
      ];

      const [transactionsResponse, balanceResponse, clientsResponse] =
        await Promise.all(promises);

      // Set Sales Transactions
      if (transactionsResponse.data?.success) {
        setSalesTransactions(
          Array.isArray(transactionsResponse.data.data?.transactions)
            ? transactionsResponse.data.data.transactions
            : []
        );
        setPagination(transactionsResponse.data.data?.pagination || {});
      } else {
        setSalesTransactions([]);
        setPagination({});
      }

      // Set Stock Balance
      if (balanceResponse.data?.success) {
        setStockBalance(
          Array.isArray(balanceResponse.data.data)
            ? balanceResponse.data.data
            : []
        );
      } else {
        setStockBalance([]);
      }

      // Set Clients
      if (clientsResponse.data?.success) {
        setClients(
          Array.isArray(clientsResponse.data.data?.clients)
            ? clientsResponse.data.data.clients
            : []
        );
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch sales report data. Please try again.");
      setSalesTransactions([]);
      setStockBalance([]);
      setClients([]);
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

    // Helper function to check if date is in range
    const isInDateRange = (dateStr, start, end = now) => {
      const date = new Date(dateStr);
      return date >= start && date <= end;
    };

    // Sales calculations
    const todaySaless = salesTransactions.filter((t) =>
      isInDateRange(t.date, todayStart)
    );
    const yesterdaySaless = salesTransactions.filter((t) =>
      isInDateRange(t.date, yesterdayStart, todayStart)
    );
    const weekSaless = salesTransactions.filter((t) =>
      isInDateRange(t.date, weekStart)
    );
    const monthSaless = salesTransactions.filter((t) =>
      isInDateRange(t.date, monthStart)
    );

    const todaySalesValue = todaySaless.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const todaySalesQuantity = todaySaless.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    const yesterdaySalesValue = yesterdaySaless.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );

    const weekSalesValue = weekSaless.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const weekSalesQuantity = weekSaless.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    const monthSalesValue = monthSaless.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const monthSalesQuantity = monthSaless.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    const totalSalesValue = salesTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const totalSalesQuantity = salesTransactions.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    // Supplier breakdown
    const supplierBreakdown = {};
    salesTransactions.forEach((transaction) => {
      const supplier = transaction.clientName || "Unknown Supplier";
      if (!supplierBreakdown[supplier]) {
        supplierBreakdown[supplier] = {
          count: 0,
          totalAmount: 0,
          totalQuantity: 0,
        };
      }
      supplierBreakdown[supplier].count++;
      supplierBreakdown[supplier].totalAmount += transaction.amount || 0;
      supplierBreakdown[supplier].totalQuantity += transaction.quantity || 0;
    });

    // Product breakdown
    const productBreakdown = {};
    salesTransactions.forEach((transaction) => {
      const product = transaction.productName || "Unknown Product";
      if (!productBreakdown[product]) {
        productBreakdown[product] = {
          count: 0,
          totalAmount: 0,
          totalQuantity: 0,
          averageRate: 0,
        };
      }
      productBreakdown[product].count++;
      productBreakdown[product].totalAmount += transaction.amount || 0;
      productBreakdown[product].totalQuantity += transaction.quantity || 0;
      productBreakdown[product].averageRate =
        productBreakdown[product].totalAmount /
        productBreakdown[product].totalQuantity;
    });

    // Top suppliers and products
    const topSuppliers = Object.entries(supplierBreakdown)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 5);

    const topProducts = Object.entries(productBreakdown)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 5);

    // Growth calculations
    const salesGrowth =
      yesterdaySalesValue > 0
        ? ((todaySalesValue - yesterdaySalesValue) / yesterdaySalesValue) * 100
        : 0;

    // Averages
    const avgDailySales = monthSalesValue / now.getDate();
    const avgTransactionValue =
      salesTransactions.length > 0
        ? totalSalesValue / salesTransactions.length
        : 0;

    return {
      // Today's data
      todaySalesValue,
      todaySalesQuantity,
      todayTransactionCount: todaySaless.length,

      // Weekly data
      weekSalesValue,
      weekSalesQuantity,
      weekTransactionCount: weekSaless.length,

      // Monthly data
      monthSalesValue,
      monthSalesQuantity,
      monthTransactionCount: monthSaless.length,

      // Total data
      totalSalesValue,
      totalSalesQuantity,
      totalTransactionCount: salesTransactions.length,

      // Averages and growth
      avgDailySales,
      avgTransactionValue,
      salesGrowth,

      // Breakdowns
      supplierBreakdown,
      productBreakdown,
      topSuppliers,
      topProducts,

      // Unique counts
      uniqueSuppliers: Object.keys(supplierBreakdown).length,
      uniqueProducts: Object.keys(productBreakdown).length,
    };
  }, [salesTransactions]);

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    let filtered = [...salesTransactions];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.productName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.clientName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.invoiceNo
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Filter by client
    if (clientFilter) {
      filtered = filtered.filter((transaction) =>
        transaction.clientName
          ?.toLowerCase()
          .includes(clientFilter.toLowerCase())
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesTransactions, searchTerm, clientFilter]);

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
      type: "OUT",
      productName: "",
      clientName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50,
    });
    setSearchTerm("");
    setClientFilter("");
    setShowFilters(false);
  }, []);

  const hasActiveFilters = () => {
    return (
      searchTerm ||
      clientFilter ||
      filters.productName ||
      filters.clientName ||
      filters.startDate ||
      filters.endDate
    );
  };

  // View handlers
  const handleView = useCallback((transaction) => {
    setViewModal({ open: true, transaction });
  }, []);

  // Client detail handler
  const handleViewClientDetails = useCallback(
    async (clientName) => {
      try {
        // Find client by name
        const client = clients.find((c) => c.name === clientName);
        if (!client) return;

        // Fetch client ledger
        const response = await clientAPI.getClientLedger(client._id, {
          limit: 100,
        });

        if (response.data?.success) {
          setClientDetailModal({
            open: true,
            client: response.data.data.client,
            ledgerEntries: response.data.data.entries || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch client details:", error);
      }
    },
    [clients]
  );

  // In handleEdit function, determine original unit:
  const handleEdit = useCallback(async (transaction) => {
    const response = await stockAPI.getTransactionById(transaction._id);
    const transactionDetails = response.data.data;

    // Determine original unit based on bags data
    const isOriginallyBags =
      transactionDetails.bags && transactionDetails.bags.count > 0;

    if (isOriginallyBags) {
      setEditFormData({
        productName: transactionDetails.productName || "",
        type: transactionDetails.type || "",
        bagCount: transactionDetails.bags?.count || "",
        bagWeight: transactionDetails.bags?.weight || "",
        rate: transactionDetails.rate || "",
        clientName: transactionDetails.clientName || "",
        invoiceNo: transactionDetails.invoiceNo || "",
        notes: transactionDetails.notes || "",
        date: transactionDetails.date
          ? new Date(transactionDetails.date).toISOString().split("T")[0]
          : "",
        originalUnit: "bag",
      });
    } else {
      setEditFormData({
        productName: transactionDetails.productName || "",
        type: transactionDetails.type || "",
        quantity: transactionDetails.quantity || "",
        rate: transactionDetails.rate || "",
        clientName: transactionDetails.clientName || "",
        invoiceNo: transactionDetails.invoiceNo || "",
        notes: transactionDetails.notes || "",
        date: transactionDetails.date
          ? new Date(transactionDetails.date).toISOString().split("T")
          : "",
        originalUnit: "kg",
      });
    }
    setEditModal({ open: true, transaction: transactionDetails });
    setEditErrors({});
  }, []);

  const calculateAmount = () => {
    if (editFormData.originalUnit === "bag") {
      if (
        editFormData.bagCount &&
        editFormData.bagWeight &&
        editFormData.rate
      ) {
        return (
          editFormData.bagCount * editFormData.bagWeight * editFormData.rate
        );
      }
    } else {
      if (editFormData.quantity && editFormData.rate) {
        return editFormData.quantity * editFormData.rate;
      }
    }
    return 0;
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.productName?.trim()) {
      errors.productName = "Product name is required";
    }
    if (editFormData.originalUnit === "bag") {
      if (!editFormData.bagCount || editFormData.bagCount <= 0) {
        errors.bagCount = "Valid bag count is required";
      }
      if (!editFormData.bagWeight || editFormData.bagWeight <= 0) {
        errors.bagWeight = "Valid bag weight is required";
      }
    } else {
      if (!editFormData.quantity || editFormData.quantity <= 0) {
        errors.quantity = "Valid quantity is required";
      }
    }
    if (!editFormData.rate || editFormData.rate <= 0) {
      errors.rate = "Valid rate is required";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;
    try {
      setEditLoading(true);
      let updateData = {
        productName: editFormData.productName,
        type: "OUT",
        rate: editFormData.rate,
        clientName: editFormData.clientName,
        invoiceNo: editFormData.invoiceNo,
        notes: editFormData.notes,
        date: editFormData.date,
      };
      if (editFormData.originalUnit === "bag") {
        updateData.bags = {
          count: Math.round(editFormData.bagCount),
          weight: Math.round(editFormData.bagWeight),
        };
        updateData.quantity = updateData.bags.count * updateData.bags.weight;
        updateData.amount = updateData.quantity * editFormData.rate;
      } else {
        updateData.quantity = Math.round(editFormData.quantity);
        updateData.amount = updateData.quantity * editFormData.rate;
      }
      await stockAPI.updateTransaction(editModal.transaction._id, updateData);
      setEditModal({ open: false, transaction: null });
      setEditFormData({});
      setEditErrors({});
      fetchAllData();
    } catch (error) {
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update transaction",
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete handlers
  const handleDelete = useCallback((transaction) => {
    setDeleteModal({ open: true, transaction });
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.transaction) return;

    try {
      setDeleteLoading(true);
      await stockAPI.deleteTransaction(deleteModal.transaction._id);
      setDeleteModal({ open: false, transaction: null });
      fetchAllData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export functionality
  const exportData = useCallback(() => {
    try {
      const exportData = filteredTransactions.map((transaction, index) => ({
        "S.No": index + 1,
        Date: formatDate(transaction.date),
        "Product Name": transaction.productName,
        Supplier: transaction.clientName || "N/A",
        Quantity: `${transaction.quantity} ${transaction.unit}`,
        "Rate (₹)": transaction.rate,
        "Total Amount": `₹${transaction.amount}`,
        "Invoice No": transaction.invoiceNo || "",
        Notes: transaction.notes || "",
        "Created By": transaction.createdBy?.username || "System",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

      // Auto-width columns
      const colWidths = Object.keys(exportData[0] || {}).map(() => ({
        wch: 15,
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `Sales_Report_${new Date().toISOString().split("T")}.xlsx`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  }, [filteredTransactions]);

  const canEdit = user?.role === "superadmin";
  const canDelete = user?.role === "superadmin";

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and supplier overview"
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
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and supplier overview"
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
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and supplier overview"
          onRefresh={fetchAllData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>Reports</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Sales Account</span>
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
            <button
              onClick={() => navigate("/admin/stock/out")}
              className="btn-success btn-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Sales</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button onClick={exportData} className="btn-purple btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Excel</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Today's Summary Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today's Sales Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Sales Value"
              value={`₹${calculations.todaySalesValue?.toLocaleString() || 0}`}
              icon={ShoppingCart}
              color="green"
              subtitle={
                calculations.salesGrowth !== 0
                  ? `${
                      calculations.salesGrowth > 0 ? "+" : ""
                    }${calculations.salesGrowth.toFixed(1)}% vs yesterday`
                  : "No change from yesterday"
              }
            />
            <StatCard
              title="Today's Quantity"
              value={`${calculations.todaySalesQuantity?.toFixed(0) || 0} kg`}
              icon={Weight}
              color="blue"
              subtitle="Total quantity salesd"
            />
            <StatCard
              title="Today's Transactions"
              value={calculations.todayTransactionCount || 0}
              icon={Receipt}
              color="purple"
              subtitle="Sales orders processed"
            />
            <StatCard
              title="Active Suppliers"
              value={calculations.uniqueSuppliers || 0}
              icon={UserCheck}
              color="orange"
              subtitle="Total suppliers"
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
              title="Weekly Saless"
              value={`₹${calculations.weekSalesValue?.toLocaleString() || 0}`}
              icon={Target}
              color="green"
              subtitle={`${calculations.weekTransactionCount} transactions this week`}
            />
            <StatCard
              title="Monthly Saless"
              value={`₹${calculations.monthSalesValue?.toLocaleString() || 0}`}
              icon={PieChart}
              color="blue"
              subtitle={`${calculations.monthTransactionCount} transactions this month`}
            />
            <StatCard
              title="Total Saless"
              value={`₹${calculations.totalSalesValue?.toLocaleString() || 0}`}
              icon={IndianRupee}
              color="purple"
              subtitle={`${calculations.totalTransactionCount} total transactions`}
            />
            <StatCard
              title="Avg Transaction Value"
              value={`₹${
                Math.round(
                  calculations.avgTransactionValue
                )?.toLocaleString() || 0
              }`}
              icon={Activity}
              color="orange"
              subtitle="Average sales amount"
            />
          </div>
        </div>

        {/* Analytics Section Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Analytics */}
          <SectionCard
            title="Sales Analytics"
            icon={ShoppingCart}
            headerColor="green"
          >
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Monthly Summary
                </h4>
                <DataRow
                  label="Total Sales Value"
                  value={`₹${
                    calculations.monthSalesValue?.toLocaleString() || 0
                  }`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Total Quantity"
                  value={`${
                    calculations.monthSalesQuantity?.toFixed(0) || 0
                  } kg`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Transaction Count"
                  value={calculations.monthTransactionCount || 0}
                  valueColor="text-green-600"
                />
                <div className="border-t border-green-200 mt-2 pt-2">
                  <DataRow
                    label="Avg Daily Sales"
                    value={`₹${
                      Math.round(
                        calculations.avgDailySales
                      )?.toLocaleString() || 0
                    }`}
                    valueColor="text-green-600"
                    bold={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Today's Summary
                </h4>
                <DataRow
                  label="Sales Value"
                  value={`₹${
                    calculations.todaySalesValue?.toLocaleString() || 0
                  }`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Quantity Salesd"
                  value={`${
                    calculations.todaySalesQuantity?.toFixed(0) || 0
                  } kg`}
                  valueColor="text-green-600"
                />
              </div>
            </div>
          </SectionCard>

          {/* Top Suppliers */}
          <SectionCard title="Top Suppliers" icon={Building} headerColor="blue">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Supplier Performance
                </h4>
                {calculations.topSuppliers
                  .slice(0, 5)
                  .map(([supplier, data], i) => (
                    <div key={supplier} className="mb-2">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleViewClientDetails(supplier)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate"
                        >
                          {supplier}
                        </button>
                        <span className="text-sm text-blue-600">
                          ₹{data.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-blue-500">
                        {data.count} orders • {data.totalQuantity.toFixed(0)} kg
                      </div>
                    </div>
                  ))}
                {calculations.topSuppliers.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No supplier data available
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Top Products */}
          <SectionCard title="Top Products" icon={Package} headerColor="purple">
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">
                  Product Performance
                </h4>
                {calculations.topProducts
                  .slice(0, 5)
                  .map(([product, data], i) => (
                    <DataRow
                      key={product}
                      label={product}
                      value={`₹${data.totalAmount.toLocaleString()} (${data.totalQuantity.toFixed(
                        0
                      )} kg)`}
                      valueColor="text-purple-600"
                    />
                  ))}
                {calculations.topProducts.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No product data available
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Stock Status */}
          <SectionCard
            title="Current Stock Status"
            icon={Package}
            headerColor="orange"
          >
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">
                  Stock Overview
                </h4>
                <DataRow
                  label="Total Products"
                  value={stockBalance.length || 0}
                  valueColor="text-orange-600"
                />
                <DataRow
                  label="Low Stock Items"
                  value={
                    stockBalance.filter(
                      (item) => (item.currentStock || 0) < 100
                    ).length
                  }
                  valueColor="text-red-600"
                />
                <DataRow
                  label="Well Stocked Items"
                  value={
                    stockBalance.filter(
                      (item) => (item.currentStock || 0) >= 100
                    ).length
                  }
                  valueColor="text-green-600"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {stockBalance.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600 truncate">{item._id}</span>
                    <span
                      className={`font-medium ${
                        (item.currentStock || 0) < 100
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {(item.currentStock || 0).toFixed(0)} kg
                    </span>
                  </div>
                ))}
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
                  Filter Sales Transactions
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={filters.productName}
                    onChange={handleFilterChange}
                    placeholder="Search product..."
                    className="input-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={filters.clientName}
                    onChange={handleFilterChange}
                    placeholder="Search supplier..."
                    className="input-primary"
                  />
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
                  Showing {filteredTransactions.length} total records
                </div>
              </div>

              {/* Filter Summary */}
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
                    {filters.productName && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                        Product: {filters.productName}
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

        {/* Sales Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sales Transactions
                  </h3>
                  <p className="text-sm text-gray-600">
                    All sales orders and stock receipts
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {filteredTransactions.length} total records
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
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Supplier
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Invoice
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(transaction.date)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {transaction.productName}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {transaction.clientName ? (
                            <button
                              onClick={() =>
                                handleViewClientDetails(transaction.clientName)
                              }
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {transaction.clientName}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-500">
                              No supplier
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Weight className="w-3 h-3 text-gray-400" />
                            <span className="font-medium text-gray-900 text-sm">
                              {transaction.quantity} {transaction.unit}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 text-sm">
                            ₹{transaction.rate}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-green-600 text-sm">
                            ₹{(transaction.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {transaction.invoiceNo ? (
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="text-sm font-mono text-gray-700">
                                {transaction.invoiceNo}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(transaction)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleEdit(transaction)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => handleDelete(transaction)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No sales transactions found
                        </p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your filters or add new saless
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              Sales
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900">
                            {transaction.productName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ₹{(transaction.amount || 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.quantity} {transaction.unit}
                          </div>
                        </div>
                      </div>

                      {transaction.clientName && (
                        <div>
                          <p className="text-sm text-gray-500">Supplier</p>
                          <button
                            onClick={() =>
                              handleViewClientDetails(transaction.clientName)
                            }
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {transaction.clientName}
                          </button>
                        </div>
                      )}

                      {transaction.invoiceNo && (
                        <div>
                          <p className="text-sm text-gray-500">Invoice</p>
                          <p className="text-sm font-mono text-gray-700">
                            {transaction.invoiceNo}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleView(transaction)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No sales transactions found
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters or add new saless
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Transaction Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, transaction: null })}
        title="Sales Transaction Details"
        subtitle="Complete sales information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="md"
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Transaction Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Sales Overview
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Product Name
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.productName}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Sales Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.transaction.date)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Quantity
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.quantity}{" "}
                    {viewModal.transaction.unit}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Rate per Unit
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    ₹{viewModal.transaction.rate}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Total Amount
                  </label>
                  <div className="text-xl font-bold text-green-600">
                    ₹{(viewModal.transaction.amount || 0).toLocaleString()}
                  </div>
                </div>

                {viewModal.transaction.invoiceNo && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Invoice Number
                    </label>
                    <div className="text-lg font-medium text-gray-900 font-mono">
                      {viewModal.transaction.invoiceNo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            {viewModal.transaction.clientName && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supplier Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Supplier Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.clientName}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() =>
                        handleViewClientDetails(
                          viewModal.transaction.clientName
                        )
                      }
                      className="btn-primary btn-sm"
                    >
                      View Supplier Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Additional Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.createdBy?.username || "System"}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Created Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.transaction.createdAt)}
                  </div>
                </div>

                {viewModal.transaction.notes && (
                  <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Notes
                    </label>
                    <div className="text-gray-900 bg-white p-3 rounded-lg border">
                      {viewModal.transaction.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        title="Edit Sales Transaction"
        subtitle={`Update sales details (Original unit: ${editFormData.originalUnit})`}
        headerIcon={<Edit />}
        headerColor="green"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          {editErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-3" />
              <span className="text-red-700">{editErrors.submit}</span>
            </div>
          )}
          {/* Banner */}
          <div
            className={`border rounded-lg p-3 ${
              editFormData.originalUnit === "bag"
                ? "bg-blue-50 border-blue-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {editFormData.originalUnit === "bag"
                  ? "This transaction was originally entered in bags. You can edit bag count and weight."
                  : "This transaction was originally entered in kgs. You can edit the quantity in kg."}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={editFormData.productName || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    productName: e.target.value,
                  })
                }
                className={`input-primary ${
                  editErrors.productName ? "input-error" : ""
                }`}
                placeholder="Enter product name"
              />
              {editErrors.productName && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {editErrors.productName}
                </p>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier Name
              </label>
              <input
                type="text"
                value={editFormData.clientName || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    clientName: e.target.value,
                  })
                }
                className="input-primary"
                placeholder="Enter supplier name"
              />
            </div>

            {/* Bags/Kgs */}
            {editFormData.originalUnit === "bag" ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bag Count *
                  </label>
                  <input
                    type="number"
                    value={editFormData.bagCount || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        bagCount: e.target.value,
                      })
                    }
                    className={`input-primary ${
                      editErrors.bagCount ? "input-error" : ""
                    }`}
                    placeholder="Number of bags"
                  />
                  {editErrors.bagCount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.bagCount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weight per Bag (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.bagWeight || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        bagWeight: e.target.value,
                      })
                    }
                    className={`input-primary ${
                      editErrors.bagWeight ? "input-error" : ""
                    }`}
                    placeholder="Weight per bag in kg"
                  />
                  {editErrors.bagWeight && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.bagWeight}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.quantity || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      quantity: e.target.value,
                    })
                  }
                  className={`input-primary ${
                    editErrors.quantity ? "input-error" : ""
                  }`}
                  placeholder="Enter quantity in kg"
                />
                {editErrors.quantity && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.quantity}
                  </p>
                )}
              </div>
            )}

            {/* Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate (₹/kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.rate}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, rate: e.target.value })
                }
                className={`input-primary ${
                  editErrors.rate ? "input-error" : ""
                }`}
                placeholder="Enter rate per kg"
              />
              {editErrors.rate && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {editErrors.rate}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
          </div>

          {/* Amount Calculation */}
          {calculateAmount() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Calculated Amount:
                </span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{calculateAmount().toLocaleString()}
                </span>
              </div>
              {editFormData.originalUnit === "bag" &&
                editFormData.bagCount &&
                editFormData.bagWeight && (
                  <div className="text-xs text-gray-600 mt-1">
                    {editFormData.bagCount} bags × {editFormData.bagWeight}{" "}
                    kg/bag × ₹{editFormData.rate}/kg
                  </div>
                )}
            </div>
          )}

          <div className="border-t pt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setEditModal({ open: false, transaction: null })}
              className="btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className={`btn-primary btn-sm ${
                editLoading ? "btn-disabled" : ""
              }`}
            >
              {editLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Update Sales
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, transaction: null })}
        title="Delete Sales Transaction"
        subtitle="This action cannot be undone"
        headerIcon={<AlertCircle />}
        headerColor="red"
        size="sm"
      >
        {deleteModal.transaction && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this sales transaction?
                </h4>
                <p className="text-sm text-red-700">
                  {deleteModal.transaction.productName} - ₹
                  {deleteModal.transaction.amount?.toLocaleString()}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Supplier: {deleteModal.transaction.clientName || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() =>
                  setDeleteModal({ open: false, transaction: null })
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
                {deleteLoading ? "Deleting..." : "Delete Transaction"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Client Detail Modal */}
      <Modal
        isOpen={clientDetailModal.open}
        onClose={() =>
          setClientDetailModal({ open: false, client: null, ledgerEntries: [] })
        }
        title="Supplier Details"
        subtitle="Complete supplier information and transaction history"
        headerIcon={<Building />}
        headerColor="blue"
        size="md"
      >
        {clientDetailModal.client && (
          <div className="space-y-6">
            {/* Supplier Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Supplier Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {clientDetailModal.client.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Type
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                      clientDetailModal.client.type === "Customer"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {clientDetailModal.client.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <div className="flex items-center text-lg text-gray-900">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {clientDetailModal.client.phone}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Current Balance
                  </label>
                  <div
                    className={`text-lg font-bold ${
                      clientDetailModal.client.currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {clientDetailModal.client.currentBalance < 0 && "-"}₹
                    {Math.abs(
                      clientDetailModal.client.currentBalance || 0
                    ).toLocaleString()}
                  </div>
                </div>

                {clientDetailModal.client.address && (
                  <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <div className="flex items-start text-gray-900">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      {clientDetailModal.client.address}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </h3>
              </div>

              {clientDetailModal.ledgerEntries.length > 0 ? (
                <div className="space-y-2">
                  {clientDetailModal.ledgerEntries
                    .slice(0, 10)
                    .map((entry, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3 border border-green-200"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {entry.particulars}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(entry.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            {entry.debitAmount > 0 && (
                              <span className="text-red-600 font-medium">
                                -₹{entry.debitAmount.toLocaleString()}
                              </span>
                            )}
                            {entry.creditAmount > 0 && (
                              <span className="text-green-600 font-medium">
                                +₹{entry.creditAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SalesAccountReport;
