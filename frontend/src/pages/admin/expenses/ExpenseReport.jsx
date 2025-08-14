import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard,
  Filter,
  Download,
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
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";

const ExpenseReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    employeeName: "",
    paymentMode: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  // Modal States
  const [viewModal, setViewModal] = useState({ open: false, expense: null });
  const [editModal, setEditModal] = useState({ open: false, expense: null });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    expense: null,
  });
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await expenseAPI.getExpenses(filters);

      if (response.data?.success) {
        setExpenses(
          Array.isArray(response.data.data?.expenses)
            ? response.data.data.expenses
            : []
        );
        setPagination(response.data.data?.pagination || {});
      } else {
        setExpenses([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch expense data. Please try again.");
      setExpenses([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculations = useMemo(() => {
    if (!Array.isArray(expenses)) return {};

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const categorySummary = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const topCategory = Object.entries(categorySummary).reduce(
      (max, [category, amount]) =>
        amount > max.amount ? { category, amount } : max,
      { category: "", amount: 0 }
    );

    return {
      totalAmount,
      totalExpenses: expenses.length,
      topCategory,
      categorySummary,
    };
  }, [expenses]);

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
      category: "",
      employeeName: "",
      paymentMode: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
    setShowFilters(false);
  }, []);

  const handleView = useCallback((expense) => {
    setViewModal({ open: true, expense });
  }, []);

  const handleEdit = useCallback((expense) => {
    setEditFormData({
      amount: expense.amount || "",
      category: expense.category || "",
      description: expense.description || "",
      employeeName: expense.employeeName || "",
      paymentMode: expense.paymentMode || "",
      receiptNumber: expense.receiptNumber || "",
      notes: expense.notes || "",
      date: expense.date
        ? new Date(expense.date).toISOString().split("T")[0]
        : "",
    });
    setEditModal({ open: true, expense });
    setEditErrors({});
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.expense) return;

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

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    try {
      setEditLoading(true);
      await expenseAPI.updateExpense(editModal.expense._id, editFormData);

      setEditModal({ open: false, expense: null });
      setEditFormData({});
      setEditErrors({});
      fetchData();
    } catch (error) {
      console.error("Failed to update expense:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update expense",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = useCallback((expense) => {
    setDeleteModal({ open: true, expense });
  }, []);

  const confirmDelete = async () => {
    if (!deleteModal.expense) return;

    try {
      setDeleteLoading(true);
      await expenseAPI.deleteExpense(deleteModal.expense._id);
      setDeleteModal({ open: false, expense: null });
      fetchData();
    } catch (error) {
      console.error("Failed to delete expense:", error);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportData = useCallback(() => {
    const csvData = expenses.map((expense) => ({
      Amount: expense.amount,
      Category: expense.category,
      Description: expense.description,
      Employee: expense.employeeName,
      PaymentMode: expense.paymentMode,
      ReceiptNumber: expense.receiptNumber,
      Date: new Date(expense.date).toLocaleDateString(),
      CreatedBy: expense.createdBy?.username,
    }));
  }, [expenses]);

  const canEdit = ["superadmin"].includes(user?.role);
  const canDelete = ["superadmin"].includes(user?.role);

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Reports"
          subheader="Comprehensive expense reports and analytics"
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
          header="Expense Reports"
          subheader="Comprehensive expense reports and analytics"
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
          header="Expense Reports"
          subheader="Comprehensive expense reports and analytics"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="w-4 h-4" />
            <span>Expense Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Reports</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/expense/dashboard")}
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
              onClick={() => navigate("/admin/expense/add")}
              className="btn-success btn-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
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
            title="Total Expenses"
            value={`₹${calculations.totalAmount?.toLocaleString() || 0}`}
            icon={CreditCard}
            color="red"
            subtitle="Total amount spent"
          />
          <StatCard
            title="Total Records"
            value={calculations.totalExpenses || 0}
            icon={Receipt}
            color="blue"
            subtitle="Number of expenses"
          />
          <StatCard
            title="Top Category"
            value={calculations.topCategory?.category || "N/A"}
            icon={FileText}
            color="green"
            subtitle={`₹${
              calculations.topCategory?.amount?.toLocaleString() || 0
            }`}
          />
          <StatCard
            title="Categories"
            value={Object.keys(calculations.categorySummary || {}).length}
            icon={Building}
            color="purple"
            subtitle="Active categories"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Filter Expenses
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
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
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
              <button onClick={clearFilters} className="btn-secondary btn-sm">
                <X className="w-4 h-4" />
                Clear Filters
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                Showing {expenses.length} of {pagination.totalItems || 0}{" "}
                results
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Expense Records
                  </h3>
                  <p className="text-sm text-gray-600">
                    All expense transactions
                  </p>
                </div>
              </div>
              <div className="text-sm text-orange-600">
                {pagination.totalItems || 0} total expenses
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
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Employee
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
                  {expenses.length > 0 ? (
                    expenses.map((expense) => (
                      <tr
                        key={expense._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full text-nowrap">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 text-sm">
                            {expense.description}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-red-600 text-sm">
                            ₹{expense.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 text-sm">
                            {expense.employeeName || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 text-sm">
                            {expense.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600 text-sm">
                            {formatDate(expense.date)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(expense)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleEdit(expense)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => handleDelete(expense)}
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
                        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No expenses found
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
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-500">
                            Category
                          </span>
                          <div className="mt-1">
                            <span className="font-medium text-gray-900">
                              {expense.category}
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
                              {expense.description}
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
                            <span className="font-bold text-red-600">
                              ₹{expense.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleView(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleEdit(expense)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => handleDelete(expense)}
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
                  <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No expenses found</p>
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
        onClose={() => setViewModal({ open: false, expense: null })}
        title="Expense Details"
        subtitle="Complete expense information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="lg"
      >
        {viewModal.expense && (
          <div className="space-y-6">
            {/* Expense Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Expense Overview
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.expense.category}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Amount
                  </label>
                  <div className="text-xl font-bold text-red-600">
                    ₹{viewModal.expense.amount.toLocaleString()}
                  </div>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.expense.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Payment Mode
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.expense.paymentMode}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.expense.date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            {viewModal.expense.employeeName && (
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
                    {viewModal.expense.employeeName}
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
                {viewModal.expense.receiptNumber && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Receipt Number
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.expense.receiptNumber}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.expense.createdBy?.username || "System"}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Created Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.expense.createdAt)}
                  </div>
                </div>

                {viewModal.expense.notes && (
                  <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Notes
                    </label>
                    <div className="text-gray-900 bg-white p-3 rounded-lg border">
                      {viewModal.expense.notes}
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
        onClose={() => setEditModal({ open: false, expense: null })}
        title="Edit Expense"
        subtitle="Update expense details"
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
                <option value="Card">Card</option>
                <option value="Online">Online</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="flex gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => setEditModal({ open: false, expense: null })}
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
                  Update Expense
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, expense: null })}
        title="Delete Expense"
        subtitle="This action cannot be undone"
        headerIcon={<AlertCircle />}
        headerColor="red"
        size="sm"
      >
        {deleteModal.expense && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this expense?
                </h4>
                <p className="text-sm text-red-700">
                  {deleteModal.expense.category} - ₹
                  {deleteModal.expense.amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setDeleteModal({ open: false, expense: null })}
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
                {deleteLoading ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ExpenseReport;
