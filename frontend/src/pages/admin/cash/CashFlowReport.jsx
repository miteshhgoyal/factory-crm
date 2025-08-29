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
  User,
  FileText,
  Loader2,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cashFlowAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";

const CashFlowReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    paymentMode: "",
    employeeName: "",
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

      const response = await cashFlowAPI.getTransactions(filters);

      if (response.data?.success) {
        setTransactions(
          Array.isArray(response.data.data?.transactions)
            ? response.data.data.transactions
            : []
        );
        setPagination(response.data.data?.pagination || {});
      } else {
        setTransactions([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch cash flow data. Please try again.");
      setTransactions([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculations = useMemo(() => {
    if (!Array.isArray(transactions)) return {};

    const totalIn = transactions
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOut = transactions
      .filter((t) => t.type === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      netFlow,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

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
      category: "",
      paymentMode: "",
      employeeName: "",
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
      amount: transaction.amount || "",
      category: transaction.category || "",
      description: transaction.description || "",
      employeeName: transaction.employeeName || "",
      paymentMode: transaction.paymentMode || "",
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
    if (!editFormData.amount || editFormData.amount <= 0) {
      errors.amount = "Valid amount is required";
    }
    if (!editFormData.category?.trim()) {
      errors.category = "Category is required";
    }
    if (!editFormData.description?.trim()) {
      errors.description = "Description is required";
    }
    if (!editFormData.paymentMode) {
      errors.paymentMode = "Payment mode is required";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      await cashFlowAPI.updateTransaction(editModal.transaction._id, {
        ...editFormData,
        amount: Math.round(editFormData.amount),
      });

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
      await cashFlowAPI.deleteTransaction(deleteModal.transaction._id);
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
      Amount: t.amount,
      Category: t.category,
      Description: t.description,
      Employee: t.employeeName,
      PaymentMode: t.paymentMode,
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
          header="Cash Flow Reports"
          subheader="Comprehensive cash flow reports and analytics"
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
          header="Cash Flow Reports"
          subheader="Comprehensive cash flow reports and analytics"
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
          header="Cash Flow Reports"
          subheader="Comprehensive cash flow reports and analytics"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span>Cash Flow Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Reports</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/cashflow/dashboard")}
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
              onClick={() => navigate("/admin/cash/in")}
              className="btn-success btn-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Cash In</span>
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
            title="Total Cash In"
            value={`₹${calculations.totalIn?.toLocaleString() || 0}`}
            icon={TrendingUp}
            color="green"
            subtitle="Money received"
          />
          <StatCard
            title="Total Cash Out"
            value={`₹${calculations.totalOut?.toLocaleString() || 0}`}
            icon={TrendingDown}
            color="red"
            subtitle="Money spent"
          />
          <StatCard
            title="Net Cash Flow"
            value={`₹${calculations.netFlow?.toLocaleString() || 0}`}
            icon={IndianRupee}
            color={calculations.netFlow >= 0 ? "green" : "red"}
            subtitle={
              calculations.netFlow >= 0 ? "Positive flow" : "Negative flow"
            }
          />
          <StatCard
            title="Total Transactions"
            value={calculations.totalTransactions || 0}
            icon={IndianRupee}
            color="blue"
            subtitle="Number of records"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                <input
                  type="text"
                  name="employeeName"
                  value={filters.employeeName}
                  onChange={handleFilterChange}
                  placeholder="Search employee..."
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

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Cash Flow Transactions
                  </h3>
                  <p className="text-sm text-gray-600">All money movements</p>
                </div>
              </div>
              <div className="text-sm text-purple-600">
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
                              className={`font-medium text-sm text-nowrap ${
                                transaction.type === "IN"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "IN"
                                ? "Cash In"
                                : "Cash Out"}
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
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold text-nowrap text-sm ${
                              transaction.type === "IN"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "IN" ? "+" : "-"}₹
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
                        <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                              {transaction.type === "IN"
                                ? "Cash In"
                                : "Cash Out"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-500">
                            Category
                          </span>
                          <div className="mt-1">
                            <span className="font-medium text-gray-900">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-500">
                            Description
                          </span>
                          <div className="mt-1">
                            <span className="text-gray-700">
                              {transaction.description}
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
                            <span
                              className={`font-bold ${
                                transaction.type === "IN"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "IN" ? "+" : "-"}₹
                              {transaction.amount.toLocaleString()}
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
                  <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                  Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
                  {Math.min(
                    pagination.currentPage * filters.limit,
                    pagination.totalItems
                  )}{" "}
                  of {pagination.totalItems} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                    {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
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

      {/* View Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, transaction: null })}
        title="Cash Flow Transaction Details"
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
                <IndianRupee className="h-5 w-5 text-blue-600" />
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
                      Cash {viewModal.transaction.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.category}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Amount
                  </label>
                  <div
                    className={`text-xl font-bold ${
                      viewModal.transaction.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {viewModal.transaction.type === "IN" ? "+" : "-"}₹
                    {viewModal.transaction.amount.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Payment Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.paymentMode}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.transaction.date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            {viewModal.transaction.employeeName && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employee Information
                  </h3>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Employee Name
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.employeeName}
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
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        title="Edit Cash Flow Transaction"
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
                <p className="mt-1 text-sm text-red-600">{editErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="mt-1 text-sm text-red-600">
                  {editErrors.category}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                rows={3}
                className={`input-primary ${
                  editErrors.description ? "input-error" : ""
                }`}
                placeholder="Enter description"
              />
              {editErrors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {editErrors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={editFormData.paymentMode || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    paymentMode: e.target.value,
                  })
                }
                className={`input-primary ${
                  editErrors.paymentMode ? "input-error" : ""
                }`}
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
              {editErrors.paymentMode && (
                <p className="mt-1 text-sm text-red-600">
                  {editErrors.paymentMode}
                </p>
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
          </div>

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
                  {deleteModal.transaction.category} - ₹
                  {deleteModal.transaction.amount.toLocaleString()}
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

export default CashFlowReport;
