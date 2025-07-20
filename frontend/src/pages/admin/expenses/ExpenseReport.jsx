import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Receipt,
  Filter,
  Download,
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  User,
  Calendar,
  Building,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import ExpenseActivityCard from "../../../components/cards/ExpenseActivityCard";

const ExpenseReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [expensesResponse, categoriesResponse] = await Promise.all([
        expenseAPI.getExpenses(filters),
        expenseAPI.getCategories(),
      ]);

      // Handle expenses data
      if (expensesResponse.data?.success) {
        setExpenses(
          Array.isArray(expensesResponse.data.data?.expenses)
            ? expensesResponse.data.data.expenses
            : []
        );
        setPagination(expensesResponse.data.data?.pagination || {});
      } else {
        setExpenses([]);
        setPagination({});
      }

      // Handle categories data
      if (categoriesResponse.data?.success) {
        setCategories(
          Array.isArray(categoriesResponse.data.data)
            ? categoriesResponse.data.data
            : []
        );
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch expense data:", error);
      setError("Failed to fetch expense data. Please try again.");
      setExpenses([]);
      setCategories([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized calculations
  const calculations = useMemo(() => {
    if (!Array.isArray(expenses)) return {};

    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const categoryCounts = {};
    expenses.forEach((expense) => {
      categoryCounts[expense.category] =
        (categoryCounts[expense.category] || 0) + 1;
    });
    const mostUsedCategory = Object.keys(categoryCounts).reduce(
      (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
      ""
    );

    return {
      totalAmount,
      totalCount: expenses.length,
      mostUsedCategory,
      avgAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
      categoryCounts,
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
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
    setShowFilters(false);
  }, []);

  const handleDeleteExpense = useCallback(
    async (expenseId) => {
      if (window.confirm("Are you sure you want to delete this expense?")) {
        try {
          await expenseAPI.deleteExpense(expenseId);
          fetchData(); // Refresh list
        } catch (error) {
          console.error("Failed to delete expense:", error);
          alert("Failed to delete expense. Please try again.");
        }
      }
    },
    [fetchData]
  );

  const exportData = useCallback(() => {
    const csvData = expenses.map((e) => ({
      Date: new Date(e.date).toLocaleDateString(),
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      Employee: e.employeeName || "N/A",
      BillNo: e.billNo || "N/A",
      CreatedBy: e.createdBy?.username,
    }));

    console.log("Exporting expense data:", csvData);
    // Add actual CSV export logic here
  }, [expenses]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Reports"
          subheader="Detailed expense tracking and analysis"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Reports"
          subheader="Detailed expense tracking and analysis"
          onRefresh={fetchData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load report data
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Expense Reports"
        subheader="Detailed expense tracking and analysis"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Receipt className="w-4 h-4" />
          <span>Expense Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/expenses/dashboard")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </button>
          <button
            onClick={() => navigate("/admin/expenses/add")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
          >
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Amount"
          value={`₹${calculations.totalAmount?.toLocaleString() || 0}`}
          icon={Receipt}
          color="red"
          subtitle="In selected period"
        />
        <StatCard
          title="Total Expenses"
          value={calculations.totalCount || 0}
          icon={TrendingUp}
          color="blue"
          subtitle="Number of records"
        />
        <StatCard
          title="Average Amount"
          value={`₹${Math.round(calculations.avgAmount || 0).toLocaleString()}`}
          icon={Calendar}
          color="green"
          subtitle="Per transaction"
        />
        <StatCard
          title="Top Category"
          value={calculations.mostUsedCategory || "N/A"}
          icon={Building}
          color="purple"
          subtitle="Most used category"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Name
              </label>
              <input
                type="text"
                name="employeeName"
                value={filters.employeeName}
                onChange={handleFilterChange}
                placeholder="Search employee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {expenses.length} of {pagination.totalItems || 0} results
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Expense List */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Expense Transactions
                    </h3>
                    <p className="text-sm text-gray-600">
                      All business expenses
                    </p>
                  </div>
                </div>
                <div className="text-sm text-purple-600">
                  {pagination.totalItems || 0} total expenses
                </div>
              </div>
            </div>

            <div className="p-4">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Date
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
                        Employee
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(expenses) && expenses.length > 0 ? (
                      expenses.map((expense) => (
                        <tr
                          key={expense._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <span className="text-gray-900 text-sm">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {expense.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {expense.description}
                              </p>
                              {expense.billNo && (
                                <p className="text-xs text-gray-500">
                                  Bill: {expense.billNo}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-red-600 text-sm">
                              -₹{expense.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {expense.employeeName ? (
                                <>
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-900 text-sm truncate">
                                    {expense.employeeName}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  console.log("View expense:", expense._id)
                                }
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {(user.role === "superadmin" ||
                                (expense.canEdit &&
                                  expense.createdBy._id === user.userId)) && (
                                <>
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/admin/expenses/edit/${expense._id}`
                                      )
                                    }
                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                    title="Edit Expense"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteExpense(expense._id)
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete Expense"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {Array.isArray(expenses) && expenses.length > 0 ? (
                  expenses.map((expense, index) => (
                    <ExpenseActivityCard
                      key={`mobile-expense-${index}`}
                      activity={expense}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No expenses found
                    </p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 gap-4">
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
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories Sidebar */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Categories</h3>
                  <p className="text-sm text-gray-600">Expense breakdown</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {categories.length > 0 ? (
                  categories.slice(0, 8).map((category) => (
                    <div
                      key={category._id}
                      className="@container p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {category._id}
                        </h4>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                          {category.count} txns
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold text-red-600">
                            ₹{category.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        {category.lastUsed && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Last used:</span>
                            <span className="text-gray-600">
                              {new Date(category.lastUsed).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No categories found
                    </p>
                    <p className="text-gray-400 text-sm">
                      Categories will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReport;
