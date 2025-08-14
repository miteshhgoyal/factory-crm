import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Package,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";

const StockReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    productName: "",
    clientName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
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
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsResponse, balanceResponse] = await Promise.all([
        stockAPI.getTransactions(filters),
        stockAPI.getBalance(),
      ]);

      if (transactionsResponse.data?.success) {
        setTransactions(
          Array.isArray(transactionsResponse.data.data?.transactions)
            ? transactionsResponse.data.data.transactions
            : []
        );
        setPagination(transactionsResponse.data.data?.pagination || {});
      } else {
        setTransactions([]);
        setPagination({});
      }

      if (balanceResponse.data?.success) {
        setStockBalance(
          Array.isArray(balanceResponse.data.data)
            ? balanceResponse.data.data
            : []
        );
      } else {
        setStockBalance([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch stock data. Please try again.");
      setTransactions([]);
      setStockBalance([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculations = useMemo(() => {
    if (!Array.isArray(stockBalance)) return {};

    const totalValue = stockBalance.reduce((total, product) => {
      return total + (product.currentStock || 0) * (product.averageRate || 0);
    }, 0);

    const totalQuantity = stockBalance.reduce(
      (total, product) => total + (product.currentStock || 0),
      0
    );

    const lowStockCount = stockBalance.filter(
      (p) => (p.currentStock || 0) < 100
    ).length;

    return {
      totalValue,
      totalQuantity,
      lowStockCount,
      totalProducts: stockBalance.length,
    };
  }, [stockBalance]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      type: "",
      productName: "",
      clientName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
    setShowFilters(false);
  }, []);

  const handleView = useCallback((transaction) => {
    setViewModal({ open: true, transaction });
  }, []);

  const handleEdit = useCallback((transaction) => {
    setEditFormData({
      productName: transaction.productName || "",
      type: transaction.type || "",
      quantity: transaction.quantity || "",
      unit: transaction.unit || "kg",
      rate: transaction.rate || "",
      amount: transaction.amount || "",
      clientName: transaction.clientName || "",
      invoiceNo: transaction.invoiceNo || "",
      notes: transaction.notes || "",
      date: transaction.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : "",
    });
    setEditModal({ open: true, transaction });
    setEditErrors({});
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.transaction) return;

    const errors = {};
    if (!editFormData.productName?.trim()) {
      errors.productName = "Product name is required";
    }
    if (!editFormData.quantity || editFormData.quantity <= 0) {
      errors.quantity = "Valid quantity is required";
    }
    if (!editFormData.rate || editFormData.rate <= 0) {
      errors.rate = "Valid rate is required";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setEditLoading(true);

      const formDataToSubmit = {
        ...editFormData,
        amount:
          parseFloat(editFormData.quantity) * parseFloat(editFormData.rate),
      };

      await stockAPI.updateTransaction(
        editModal.transaction._id,
        formDataToSubmit
      );

      setEditModal({ open: false, transaction: null });
      setEditFormData({});
      setEditErrors({});
      fetchData();
    } catch (error) {
      console.error("Failed to update transaction:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update transaction",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = useCallback((transaction) => {
    setDeleteModal({ open: true, transaction });
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.transaction) return;

    try {
      setDeleteLoading(true);
      await stockAPI.deleteTransaction(deleteModal.transaction._id);
      setDeleteModal({ open: false, transaction: null });
      fetchData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportData = useCallback(() => {
    const csvData = transactions.map((t) => ({
      Type: t.type,
      Product: t.productName,
      Quantity: t.quantity,
      Unit: t.unit,
      Rate: t.rate,
      Amount: t.amount,
      Client: t.clientName,
      Invoice: t.invoiceNo,
      Date: new Date(t.date).toLocaleDateString(),
      CreatedBy: t.createdBy?.username,
    }));
  }, [transactions]);

  const canEdit = user?.role === "superadmin";
  const canDelete = user?.role === "superadmin";

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
          onRefresh={fetchData}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
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
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
          onRefresh={fetchData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load report data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={fetchData} className="btn-primary">
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
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>Stock Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Reports</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/stock/dashboard")}
              className="btn-secondary btn-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
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
              onClick={() => navigate("/admin/stock/add-in")}
              className="btn-success btn-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Stock</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button onClick={exportData} className="btn-purple btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Stock Value"
            value={`₹${calculations.totalValue?.toLocaleString() || 0}`}
            icon={Package}
            color="blue"
            subtitle="Current inventory value"
          />
          <StatCard
            title="Total Quantity"
            value={`${calculations.totalQuantity?.toFixed(0) || 0} kg`}
            icon={Package}
            color="green"
            subtitle="Available stock"
          />
          <StatCard
            title="Total Products"
            value={calculations.totalProducts || 0}
            icon={Package}
            color="purple"
            subtitle="Active product categories"
          />
          <StatCard
            title="Low Stock Items"
            value={calculations.lowStockCount || 0}
            icon={AlertCircle}
            color={calculations.lowStockCount > 0 ? "red" : "green"}
            subtitle={
              calculations.lowStockCount > 0
                ? "Need attention"
                : "All well stocked"
            }
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
                  Transaction Type
                </label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="input-primary"
                >
                  <option value="">All Types</option>
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                </select>
              </div>

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
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={filters.clientName}
                  onChange={handleFilterChange}
                  placeholder="Search client..."
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
              <button onClick={clearFilters} className="btn-secondary btn-sm">
                <X className="w-4 h-4" />
                Clear Filters
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                Showing {transactions.length} of {pagination.totalItems || 0}{" "}
                results
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Transactions List */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Stock Transactions
                      </h3>
                      <p className="text-sm text-gray-600">
                        All inventory movements
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-blue-600">
                    {pagination.totalItems || 0} total transactions
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
                          Product
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
                          Date
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                          <tr
                            key={transaction._id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    transaction.type === "IN"
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  {transaction.type === "IN" ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                                <span
                                  className={`font-medium text-sm ${
                                    transaction.type === "IN"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.type}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {transaction.productName}
                                </p>
                                {transaction.clientName && (
                                  <p className="text-xs text-gray-500">
                                    {transaction.clientName}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900 text-sm">
                                {transaction.quantity} {transaction.unit}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 text-sm">
                                ₹{transaction.rate}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900 text-sm">
                                ₹{(transaction.amount || 0).toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-600 text-sm">
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}
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
                          <td colSpan="7" className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500">
                                Type
                              </span>
                              <div className="mt-1 flex items-center gap-2">
                                {transaction.type === "IN" ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span
                                  className={`font-medium ${
                                    transaction.type === "IN"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500">
                                Product
                              </span>
                              <div className="mt-1">
                                <span className="font-medium text-gray-900">
                                  {transaction.productName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500">
                                Quantity
                              </span>
                              <div className="mt-1">
                                <span className="font-medium text-gray-900">
                                  {transaction.quantity} {transaction.unit}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500">
                                Amount
                              </span>
                              <div className="mt-1">
                                <span className="font-bold text-gray-900">
                                  ₹{(transaction.amount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

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
                        No transactions found
                      </p>
                      <p className="text-gray-400 text-sm">
                        Try adjusting your filters
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {(pagination.currentPage - 1) * filters.limit + 1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * filters.limit,
                        pagination.totalItems
                      )}{" "}
                      of {pagination.totalItems} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={!pagination.hasPrev}
                        className="btn-secondary btn-sm"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                        {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={!pagination.hasNext}
                        className="btn-secondary btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Balance Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Current Stock
                    </h3>
                    <p className="text-sm text-gray-600">Available inventory</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(stockBalance) && stockBalance.length > 0 ? (
                    stockBalance.map((product) => (
                      <div
                        key={product._id}
                        className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {product._id}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                              (product.currentStock || 0) < 100
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {(product.currentStock || 0) < 100 ? "Low" : "Good"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-medium text-gray-900">
                              {(product.currentStock || 0).toFixed(0)} kg
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Bags:</span>
                            <span className="font-medium text-gray-900">
                              {(product.stockInBags || 0).toFixed(1)}
                            </span>
                          </div>
                          {product.lastTransactionDate && (
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Updated:</span>
                              <span className="text-gray-600">
                                {new Date(
                                  product.lastTransactionDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No stock data</p>
                      <p className="text-gray-400 text-sm">
                        Stock levels will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, transaction: null })}
        title="Stock Transaction Details"
        subtitle="Complete transaction information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="lg"
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Transaction Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Transaction Overview
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Transaction Type
                  </label>
                  <div className="flex items-center gap-2">
                    {viewModal.transaction.type === "IN" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        viewModal.transaction.type === "IN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Stock {viewModal.transaction.type}
                    </span>
                  </div>
                </div>

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
                  <div className="text-xl font-bold text-gray-900">
                    ₹{(viewModal.transaction.amount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {new Date(viewModal.transaction.date).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Information */}
            {viewModal.transaction.clientName && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Client Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Client Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.clientName}
                    </div>
                  </div>

                  {viewModal.transaction.invoiceNo && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-500">
                        Invoice Number
                      </label>
                      <div className="text-lg font-medium text-gray-900">
                        {viewModal.transaction.invoiceNo}
                      </div>
                    </div>
                  )}
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
                    {new Date(
                      viewModal.transaction.createdAt
                    ).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        title="Edit Stock Transaction"
        subtitle="Update transaction details"
        headerIcon={<Edit />}
        headerColor="blue"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
          {editErrors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{editErrors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-red-600">
                  {editErrors.productName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={editFormData.type || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, type: e.target.value })
                }
                className="input-primary"
              >
                <option value="">Select Type</option>
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.quantity || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, quantity: e.target.value })
                }
                className={`input-primary ${
                  editErrors.quantity ? "input-error" : ""
                }`}
                placeholder="Enter quantity"
              />
              {editErrors.quantity && (
                <p className="mt-1 text-sm text-red-600">
                  {editErrors.quantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={editFormData.unit || "kg"}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, unit: e.target.value })
                }
                className="input-primary"
              >
                <option value="kg">Kg</option>
                <option value="bag">Bag</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.rate || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, rate: e.target.value })
                }
                className={`input-primary ${
                  editErrors.rate ? "input-error" : ""
                }`}
                placeholder="Enter rate"
              />
              {editErrors.rate && (
                <p className="mt-1 text-sm text-red-600">{editErrors.rate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
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
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice No
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
                placeholder="Enter invoice number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={editFormData.notes || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, notes: e.target.value })
              }
              rows={3}
              className="input-primary"
              placeholder="Enter any notes"
            />
          </div>

          {/* Calculated Amount Display */}
          {editFormData.quantity && editFormData.rate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">
                  Calculated Amount:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  ₹
                  {(
                    parseFloat(editFormData.quantity || 0) *
                    parseFloat(editFormData.rate || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => setEditModal({ open: false, transaction: null })}
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
                  Update Transaction
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
        title="Delete Transaction"
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
                  Are you sure you want to delete this transaction?
                </h4>
                <p className="text-sm text-red-700">
                  {deleteModal.transaction.productName} -{" "}
                  {deleteModal.transaction.type}
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
    </>
  );
};

export default StockReport;
