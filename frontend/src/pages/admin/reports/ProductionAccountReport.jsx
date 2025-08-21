import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Filter,
  Download,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  X,
  Edit,
  Save,
  Plus,
  Eye,
  Trash2,
  FileText,
  Calendar,
  Loader2,
  Search,
  FilterX,
  Info,
  Clock,
  CalendarDays,
  PieChart,
  Activity,
  Target,
  BarChart3,
  Weight,
  Hash,
  Factory,
  ClipboardList,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
import ProductionReportModal from "../../../components/modals/ProductionReportModal";
import { formatDate } from "../../../utils/dateUtils";
import { generateProductionReportPDF } from "../../../services/pdfGenerator";
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

const ProductionAccountReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data States
  const [productionTransactions, setProductionTransactions] = useState([]);
  const [productionReports, setProductionReports] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "IN",
    productName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState("");

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

  // Production Report Modal States
  const [productionReportModal, setProductionReportModal] = useState({
    open: false,
    stockTransaction: null,
  });
  const [reportViewModal, setReportViewModal] = useState({
    open: false,
    report: null,
  });

  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [pdfGenerating, setPdfGenerating] = useState({});

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [
        stockAPI.getTransactions({
          type: "IN",
          limit: 100,
          ...filters,
        }),
        stockAPI.getProductionReports({ limit: 100 }),
        stockAPI.getBalance(),
      ];

      const [transactionsResponse, reportsResponse, balanceResponse] =
        await Promise.all(promises);

      // Handle Production Transactions (filter for MANUFACTURED only)
      if (transactionsResponse.data?.success) {
        const allTransactions =
          transactionsResponse.data.data?.transactions || [];
        const manufacturedTransactions = allTransactions.filter(
          (transaction) => transaction.stockSource === "MANUFACTURED"
        );
        setProductionTransactions(manufacturedTransactions);
      } else {
        setProductionTransactions([]);
      }

      // Set Production Reports
      if (reportsResponse.data?.success) {
        const reports =
          reportsResponse.data.data?.reports || reportsResponse.data.data || [];
        setProductionReports(Array.isArray(reports) ? reports : []);
      } else {
        setProductionReports([]);
      }

      // Set Stock Balance
      if (balanceResponse.data?.success) {
        const balance = balanceResponse.data.data || [];
        setStockBalance(Array.isArray(balance) ? balance : []);
      } else {
        setStockBalance([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch production report data. Please try again.");
      setProductionTransactions([]);
      setProductionReports([]);
      setStockBalance([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const generateProductionReportPDFHandler = useCallback(
    async (transaction) => {
      if (
        !transaction.productReportId &&
        transaction.reportStatus !== "COMPLETED"
      ) {
        alert("No production report available for this transaction");
        return;
      }

      try {
        setPdfGenerating((prev) => ({ ...prev, [transaction._id]: true }));

        // Fetch the production report data
        const response = await stockAPI.getProductionReportByStockId(
          transaction._id
        );

        if (response.data.success) {
          const reportData = response.data.data;
          await generateProductionReportPDF(reportData);
        } else {
          alert("No production report found for this transaction");
        }
      } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        setPdfGenerating((prev) => ({ ...prev, [transaction._id]: false }));
      }
    },
    []
  );

  const handleOpenProductionReport = useCallback((transaction) => {
    const stockTransaction = {
      _id: transaction._id,
      productName: transaction.productName,
      quantity: transaction.quantity,
      unit: transaction.unit || "kg",
      stockSource: transaction.stockSource,
      date: transaction.date,
    };

    setProductionReportModal({
      open: true,
      stockTransaction: stockTransaction,
    });
  }, []);

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
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const isInDateRange = (dateStr, start, end = now) => {
      const date = new Date(dateStr);
      return date >= start && date <= end;
    };

    const todayProduction = productionTransactions.filter((t) =>
      isInDateRange(t.date, todayStart)
    );
    const weekProduction = productionTransactions.filter((t) =>
      isInDateRange(t.date, weekStart)
    );
    const monthProduction = productionTransactions.filter((t) =>
      isInDateRange(t.date, monthStart)
    );
    const yearProduction = productionTransactions.filter((t) =>
      isInDateRange(t.date, yearStart)
    );

    const todayProductionQuantity = todayProduction.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const weekProductionQuantity = weekProduction.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const monthProductionQuantity = monthProduction.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const yearProductionQuantity = yearProduction.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const totalProductionQuantity = productionTransactions.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

    // Product breakdown
    const productBreakdown = {};
    productionTransactions.forEach((transaction) => {
      const product = transaction.productName || "Unknown Product";
      if (!productBreakdown[product]) {
        productBreakdown[product] = {
          count: 0,
          totalQuantity: 0,
        };
      }
      productBreakdown[product].count++;
      productBreakdown[product].totalQuantity += transaction.quantity || 0;
    });

    const topProducts = Object.entries(productBreakdown)
      .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
      .slice(0, 5);

    const avgDailyProductionQuantity = monthProductionQuantity / now.getDate();

    return {
      todayProductionQuantity,
      todayTransactionCount: todayProduction.length,
      weekProductionQuantity,
      weekTransactionCount: weekProduction.length,
      monthProductionQuantity,
      monthTransactionCount: monthProduction.length,
      yearProductionQuantity,
      yearTransactionCount: yearProduction.length,
      totalProductionQuantity,
      totalTransactionCount: productionTransactions.length,
      avgDailyProductionQuantity,
      productBreakdown,
      topProducts,
      uniqueProducts: Object.keys(productBreakdown).length,
      totalReports: productionReports.length,
      completedReports: productionReports.filter(
        (r) => r.status === "COMPLETED"
      ).length,
      pendingReports: productionReports.filter((r) => r.status === "PENDING")
        .length,
    };
  }, [productionTransactions, productionReports]);

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    let filtered = [...productionTransactions];

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.productName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.invoiceNo
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [productionTransactions, searchTerm]);

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
      type: "IN",
      productName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 50,
    });
    setSearchTerm("");
    setShowFilters(false);
  }, []);

  const hasActiveFilters = () => {
    return (
      searchTerm || filters.productName || filters.startDate || filters.endDate
    );
  };

  // View handlers
  const handleView = useCallback((transaction) => {
    setViewModal({ open: true, transaction });
  }, []);

  const handleViewProductionReport = useCallback(async (transaction) => {
    try {
      const response = await stockAPI.getProductionReportByStockId(
        transaction._id
      );
      if (response.data.success) {
        setReportViewModal({
          open: true,
          report: response.data.data,
        });
      } else {
        alert("No production report found for this transaction");
      }
    } catch (error) {
      console.error("Failed to fetch production report:", error);
      alert("Failed to load production report");
    }
  }, []);

  // Edit handlers
  const handleEdit = useCallback(async (transaction) => {
    const response = await stockAPI.getTransactionById(transaction._id);
    const transactionDetails = response.data.data;

    const isOriginallyBags =
      transactionDetails.bags && transactionDetails.bags.count > 0;

    if (isOriginallyBags) {
      setEditFormData({
        productName: transactionDetails.productName || "",
        type: transactionDetails.type || "",
        bagCount: transactionDetails.bags?.count || "",
        bagWeight: transactionDetails.bags?.weight || "",
        invoiceNo: transactionDetails.invoiceNo || "",
        notes: transactionDetails.notes || "",
        date: transactionDetails.date
          ? new Date(transactionDetails.date).toISOString().split("T")
          : "",
        originalUnit: "bag",
      });
    } else {
      setEditFormData({
        productName: transactionDetails.productName || "",
        type: transactionDetails.type || "",
        quantity: transactionDetails.quantity || "",
        invoiceNo: transactionDetails.invoiceNo || "",
        notes: transactionDetails.notes || "",
        date: transactionDetails.date
          ? new Date(transactionDetails.date).toISOString().split("T")[0]
          : "",
        originalUnit: "kg",
      });
    }
    setEditModal({ open: true, transaction: transactionDetails });
    setEditErrors({});
  }, []);

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
        type: "IN",
        stockSource: "MANUFACTURED",
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
      } else {
        updateData.quantity = Math.round(editFormData.quantity);
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
        Quantity: `${transaction.quantity} ${transaction.unit}`,
        "Batch/Invoice No": transaction.invoiceNo || "",
        "Report Status": transaction.reportStatus || "PENDING",
        Notes: transaction.notes || "",
        "Created By": transaction.createdBy?.username || "System",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Production Report");

      const colWidths = Object.keys(exportData[0] || {}).map(() => ({
        wch: 15,
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `Production_Report_${new Date().toISOString().split("T")}.xlsx`
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
          header="Production Account Report"
          subheader="Comprehensive manufacturing analysis and production overview"
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
          header="Production Account Report"
          subheader="Comprehensive manufacturing analysis and production overview"
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
          header="Production Account Report"
          subheader="Comprehensive manufacturing analysis and production overview"
          onRefresh={fetchAllData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Factory className="w-4 h-4" />
            <span>Reports</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              Production Account
            </span>
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
              onClick={() => navigate("/admin/stock/in")}
              className="btn-success btn-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Production</span>
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
            <Clock className="w-5 h-5 text-green-600" />
            Today's Production Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Quantity"
              value={`${
                calculations.todayProductionQuantity?.toFixed(0) || 0
              } kg`}
              icon={Weight}
              color="blue"
              subtitle="Production output today"
            />
            <StatCard
              title="Today's Transactions"
              value={calculations.todayTransactionCount || 0}
              icon={BarChart3}
              color="purple"
              subtitle="Production orders processed"
            />
            <StatCard
              title="Production Reports"
              value={calculations.completedReports || 0}
              icon={ClipboardList}
              color="green"
              subtitle={`${calculations.pendingReports || 0} pending reports`}
            />
            <StatCard
              title="Active Production Lines"
              value={calculations.todayTransactionCount > 0 ? "Active" : "Idle"}
              icon={Factory}
              color="orange"
              subtitle="Production status"
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
              title="Weekly Production"
              value={`${
                calculations.weekProductionQuantity?.toFixed(0) || 0
              } kg`}
              icon={Target}
              color="green"
              subtitle={`${calculations.weekTransactionCount} transactions this week`}
            />
            <StatCard
              title="Monthly Production"
              value={`${
                calculations.monthProductionQuantity?.toFixed(0) || 0
              } kg`}
              icon={PieChart}
              color="blue"
              subtitle={`${calculations.monthTransactionCount} transactions this month`}
            />
            <StatCard
              title="Yearly Production"
              value={`${
                calculations.yearProductionQuantity?.toFixed(0) || 0
              } kg`}
              icon={Calendar}
              color="purple"
              subtitle={`${calculations.yearTransactionCount} transactions this year`}
            />
            <StatCard
              title="Total Transactions"
              value={calculations.totalTransactionCount || 0}
              icon={Activity}
              color="orange"
              subtitle="All production entries"
            />
          </div>
        </div>

        {/* Analytics Section Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Analytics */}
          <SectionCard
            title="Production Analytics"
            icon={Factory}
            headerColor="green"
          >
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Monthly Summary
                </h4>
                <DataRow
                  label="Total Quantity"
                  value={`${
                    calculations.monthProductionQuantity?.toFixed(0) || 0
                  } kg`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Transaction Count"
                  value={calculations.monthTransactionCount || 0}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Unique Products"
                  value={calculations.uniqueProducts || 0}
                  valueColor="text-green-600"
                />
                <div className="border-t border-green-200 mt-2 pt-2">
                  <DataRow
                    label="Avg Daily Production"
                    value={`${
                      Math.round(
                        calculations.avgDailyProductionQuantity
                      )?.toFixed(0) || 0
                    } kg`}
                    valueColor="text-green-600"
                    bold={true}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Top Products */}
          <SectionCard title="Top Products" icon={Package} headerColor="blue">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Product Performance (by Quantity)
                </h4>
                {calculations.topProducts
                  .slice(0, 5)
                  .map(([product, data], i) => (
                    <DataRow
                      key={product}
                      label={product}
                      value={`${data.totalQuantity.toFixed(0)} kg (${
                        data.count
                      } batches)`}
                      valueColor="text-blue-600"
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
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <SectionCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter Production Transactions
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
            </div>
          </SectionCard>
        )}

        {/* Production Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Factory className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Production Transactions
                  </h3>
                  <p className="text-sm text-gray-600">
                    All manufactured stock entries with production reports
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-600">
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
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Batch No
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Report Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Notes
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => {
                      const hasReport =
                        transaction.reportStatus === "COMPLETED";

                      return (
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
                            <div className="flex items-center gap-1">
                              <Weight className="w-3 h-3 text-gray-400" />
                              <span className="font-medium text-gray-900 text-sm">
                                {transaction.quantity} {transaction.unit}
                              </span>
                            </div>
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
                            <div className="flex items-center gap-2">
                              {hasReport ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <ClipboardList className="w-3 h-3 mr-1" />
                                  Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 text-sm">
                              {transaction.notes || "-"}
                            </span>
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

                              {hasReport ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleViewProductionReport(transaction)
                                    }
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="View Production Report"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      generateProductionReportPDFHandler(
                                        transaction
                                      )
                                    }
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors relative"
                                    title="Download PDF Report"
                                    disabled={pdfGenerating[transaction._id]}
                                  >
                                    {pdfGenerating[transaction._id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleOpenProductionReport(transaction)
                                  }
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Create Production Report"
                                >
                                  <ClipboardList className="w-4 h-4" />
                                </button>
                              )}

                              {canEdit && (
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="Edit Transaction"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={() => handleDelete(transaction)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Transaction"
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
                        <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No production transactions found
                        </p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your filters or add new production
                          entries
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
                filteredTransactions.map((transaction) => {
                  const hasReport = transaction.reportStatus === "COMPLETED";

                  return (
                    <div
                      key={transaction._id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Factory className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                Production
                              </span>
                              {hasReport ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <ClipboardList className="w-3 h-3 mr-1" />
                                  Report Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  No Report
                                </span>
                              )}
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
                              {transaction.quantity} {transaction.unit}
                            </div>
                          </div>
                        </div>

                        {transaction.invoiceNo && (
                          <div>
                            <p className="text-sm text-gray-500">
                              Batch Number
                            </p>
                            <p className="text-sm font-mono text-gray-700">
                              {transaction.invoiceNo}
                            </p>
                          </div>
                        )}

                        {transaction.notes && (
                          <div>
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="text-sm text-gray-700">
                              {transaction.notes}
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

                          {hasReport ? (
                            <>
                              <button
                                onClick={() =>
                                  handleViewProductionReport(transaction)
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View Production Report"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  generateProductionReportPDFHandler(
                                    transaction
                                  )
                                }
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Download PDF Report"
                                disabled={pdfGenerating[transaction._id]}
                              >
                                {pdfGenerating[transaction._id] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                handleOpenProductionReport(transaction)
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Create Production Report"
                            >
                              <ClipboardList className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
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
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Factory className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No production transactions found
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters or add new production entries
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
        title="Production Transaction Details"
        subtitle="Complete production information"
        headerIcon={<Eye />}
        headerColor="green"
        size="md"
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Transaction Overview */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Factory className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Production Overview
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
                    Production Date
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

                {viewModal.transaction.invoiceNo && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Batch Number
                    </label>
                    <div className="text-lg font-medium text-gray-900 font-mono">
                      {viewModal.transaction.invoiceNo}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Report Status
                  </label>
                  <div className="text-lg font-medium">
                    {viewModal.transaction.reportStatus === "COMPLETED" ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Report Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Report Pending
                      </span>
                    )}
                  </div>
                </div>

                {viewModal.transaction.bags &&
                  viewModal.transaction.bags.count > 0 && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-500">
                          Bag Count
                        </label>
                        <div className="text-lg font-medium text-gray-900">
                          {viewModal.transaction.bags.count} bags
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-500">
                          Weight per Bag
                        </label>
                        <div className="text-lg font-medium text-gray-900">
                          {viewModal.transaction.bags.weight} kg
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Additional Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Stock Source
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      <Factory className="h-3 w-3 mr-1" />
                      Manufactured
                    </span>
                  </div>
                </div>

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

              {/* Action buttons for production report */}
              <div className="mt-6 pt-4 border-t border-blue-200">
                <div className="flex flex-wrap gap-3">
                  {viewModal.transaction.reportStatus === "COMPLETED" ? (
                    <>
                      <button
                        onClick={() => {
                          setViewModal({ open: false, transaction: null });
                          handleViewProductionReport(viewModal.transaction);
                        }}
                        className="btn-primary btn-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        View Production Report
                      </button>
                      <button
                        onClick={() => {
                          setViewModal({ open: false, transaction: null });
                          generateProductionReportPDFHandler(
                            viewModal.transaction
                          );
                        }}
                        className="btn-purple btn-sm"
                        disabled={pdfGenerating[viewModal.transaction._id]}
                      >
                        {pdfGenerating[viewModal.transaction._id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download PDF Report
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setViewModal({ open: false, transaction: null });
                        handleOpenProductionReport(viewModal.transaction);
                      }}
                      className="btn-success btn-sm"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Create Production Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        title="Edit Production Transaction"
        subtitle={`Update production details (Original unit: ${editFormData.originalUnit})`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Batch/Invoice No
              </label>
              <input
                type="text"
                value={editFormData.invoiceNo || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    invoiceNo: e.target.value,
                  })
                }
                className="input-primary"
                placeholder="Enter batch or invoice number"
              />
            </div>

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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={editFormData.notes || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, notes: e.target.value })
              }
              className="input-primary"
              rows="3"
              placeholder="Additional notes about this production..."
            />
          </div>

          {editFormData.originalUnit === "bag" &&
            editFormData.bagCount &&
            editFormData.bagWeight && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Quantity:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {(editFormData.bagCount * editFormData.bagWeight).toFixed(
                      2
                    )}{" "}
                    kg
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {editFormData.bagCount} bags × {editFormData.bagWeight} kg/bag
                </div>
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
                  Update Production
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
        title="Delete Production Transaction"
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
                  Are you sure you want to delete this production transaction?
                </h4>
                <p className="text-sm text-red-700">
                  {deleteModal.transaction.productName} -{" "}
                  {deleteModal.transaction.quantity} kg
                </p>
                <p className="text-xs text-red-600 mt-1">
                  This manufactured stock entry and any associated production
                  report will be permanently removed.
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

      {/* Production Report Modal */}
      <ProductionReportModal
        isOpen={productionReportModal.open}
        onClose={() =>
          setProductionReportModal({ open: false, stockTransaction: null })
        }
        stockTransactionId={productionReportModal.stockTransaction?._id}
        stockTransaction={productionReportModal.stockTransaction}
        onReportCreated={(report) => {
          fetchAllData();
        }}
      />

      {/* Report View Modal */}
      <Modal
        isOpen={reportViewModal.open}
        onClose={() => setReportViewModal({ open: false, report: null })}
        title="Production Report Details"
        subtitle="Complete production report information"
        headerIcon={<ClipboardList />}
        headerColor="green"
        size="md"
      >
        {reportViewModal.report && (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Basic Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
              <h4 className="font-semibold text-green-900 mb-3">
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Batch Number:</span>{" "}
                  {reportViewModal.report.batchNumber}
                </div>
                <div>
                  <span className="font-medium">Quality Grade:</span>{" "}
                  {reportViewModal.report.qualityGrade}
                </div>
                <div>
                  <span className="font-medium">Supervisor:</span>{" "}
                  {reportViewModal.report.supervisor}
                </div>
                <div>
                  <span className="font-medium">Operator:</span>{" "}
                  {reportViewModal.report.operator}
                </div>
                <div>
                  <span className="font-medium">Production Date:</span>{" "}
                  {formatDate(reportViewModal.report.productionDate)}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {reportViewModal.report.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Process Parameters */}
            {(reportViewModal.report.polymerizationTemperature ||
              reportViewModal.report.mixingTemperature) && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-3">
                  Process Parameters
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {reportViewModal.report.polymerizationTemperature && (
                    <div>
                      <span className="font-medium">Polymerization Temp:</span>{" "}
                      {reportViewModal.report.polymerizationTemperature}°C
                    </div>
                  )}
                  {reportViewModal.report.polymerizationPressure && (
                    <div>
                      <span className="font-medium">
                        Polymerization Pressure:
                      </span>{" "}
                      {reportViewModal.report.polymerizationPressure} bar
                    </div>
                  )}
                  {reportViewModal.report.mixingTemperature && (
                    <div>
                      <span className="font-medium">Mixing Temp:</span>{" "}
                      {reportViewModal.report.mixingTemperature}°C
                    </div>
                  )}
                  {reportViewModal.report.mixingTime && (
                    <div>
                      <span className="font-medium">Mixing Time:</span>{" "}
                      {reportViewModal.report.mixingTime} min
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quality Tests */}
            {(reportViewModal.report.moistureContent ||
              reportViewModal.report.kValue) && (
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-semibold text-purple-900 mb-3">
                  Quality Test Results
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {reportViewModal.report.moistureContent && (
                    <div>
                      <span className="font-medium">Moisture Content:</span>{" "}
                      {reportViewModal.report.moistureContent}%
                    </div>
                  )}
                  {reportViewModal.report.kValue && (
                    <div>
                      <span className="font-medium">K-Value:</span>{" "}
                      {reportViewModal.report.kValue}
                    </div>
                  )}
                  {reportViewModal.report.bulkDensity && (
                    <div>
                      <span className="font-medium">Bulk Density:</span>{" "}
                      {reportViewModal.report.bulkDensity} g/cm³
                    </div>
                  )}
                  {reportViewModal.report.tensileStrength && (
                    <div>
                      <span className="font-medium">Tensile Strength:</span>{" "}
                      {reportViewModal.report.tensileStrength} MPa
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Production Efficiency */}
            {(reportViewModal.report.yieldPercentage ||
              reportViewModal.report.energyConsumed) && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-semibold text-orange-900 mb-3">
                  Production Efficiency
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {reportViewModal.report.yieldPercentage && (
                    <div>
                      <span className="font-medium">Yield:</span>{" "}
                      {reportViewModal.report.yieldPercentage}%
                    </div>
                  )}
                  {reportViewModal.report.energyConsumed && (
                    <div>
                      <span className="font-medium">Energy Consumed:</span>{" "}
                      {reportViewModal.report.energyConsumed} kWh
                    </div>
                  )}
                  {reportViewModal.report.cycleTime && (
                    <div>
                      <span className="font-medium">Cycle Time:</span>{" "}
                      {reportViewModal.report.cycleTime} hours
                    </div>
                  )}
                  {reportViewModal.report.throughputRate && (
                    <div>
                      <span className="font-medium">Throughput Rate:</span>{" "}
                      {reportViewModal.report.throughputRate} kg/hr
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(reportViewModal.report.remarks ||
              reportViewModal.report.qualityNotes ||
              reportViewModal.report.productionNotes) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Notes & Remarks
                </h4>
                <div className="space-y-2 text-sm">
                  {reportViewModal.report.productionNotes && (
                    <div>
                      <span className="font-medium">Production Notes:</span>{" "}
                      {reportViewModal.report.productionNotes}
                    </div>
                  )}
                  {reportViewModal.report.qualityNotes && (
                    <div>
                      <span className="font-medium">Quality Notes:</span>{" "}
                      {reportViewModal.report.qualityNotes}
                    </div>
                  )}
                  {reportViewModal.report.remarks && (
                    <div>
                      <span className="font-medium">General Remarks:</span>{" "}
                      {reportViewModal.report.remarks}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setReportViewModal({ open: false, report: null });
                  setProductionReportModal({
                    open: true,
                    stockTransaction: {
                      _id: reportViewModal.report.stockTransactionId._id,
                    },
                  });
                }}
                className="btn-primary btn-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Report
              </button>
              <button
                onClick={async () => {
                  try {
                    await generateProductionReportPDF(reportViewModal.report);
                    setReportViewModal({ open: false, report: null });
                  } catch (error) {
                    alert("Failed to generate PDF");
                  }
                }}
                className="btn-purple btn-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ProductionAccountReport;
