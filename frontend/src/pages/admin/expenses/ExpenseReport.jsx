import React, { useState, useEffect } from "react";
import {
  Receipt,
  Filter,
  Download,
  Search,
  Calendar,
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  AlertCircle,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const ExpenseReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getExpenses(filters);
      setExpenses(
        Array.isArray(response.data?.expenses) ? response.data.expenses : []
      );
      setPagination(response.data?.pagination || {});
      setError(null);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setError("Failed to fetch expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      employeeName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await expenseAPI.deleteExpense(expenseId);
        fetchExpenses(); // Refresh list
      } catch (error) {
        console.error("Failed to delete expense:", error);
      }
    }
  };

  const getExpenseStats = () => {
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
    };
  };

  const stats = getExpenseStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Reports"
          subheader="Detailed expense tracking and analysis"
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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
          subheader="Detailed expense tracking and analysis"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchExpenses}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retry
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
        onRefresh={fetchExpenses}
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/expenses/add")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Receipt className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => console.log("Export expenses")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Amount"
          value={`₹${stats.totalAmount.toLocaleString()}`}
          icon={Receipt}
          color="red"
          change="Current filter"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalCount}
          icon={TrendingUp}
          color="blue"
          change="Number of records"
        />
        <StatCard
          title="Average Amount"
          value={`₹${Math.round(stats.avgAmount).toLocaleString()}`}
          icon={Calendar}
          color="green"
          change="Per transaction"
        />
        <StatCard
          title="Top Category"
          value={stats.mostUsedCategory || "N/A"}
          icon={Receipt}
          color="purple"
          change="Most used"
        />
      </div>

      {/* Expense List */}
      <SectionCard
        title="Expense Transactions"
        icon={Receipt}
        headerColor="blue"
      >
        {/* Filters */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="Search category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Employee Name
              </label>
              <input
                type="text"
                name="employeeName"
                value={filters.employeeName}
                onChange={handleFilterChange}
                placeholder="Search employee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Expense Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Employee
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {expense.description}
                      </p>
                      {expense.billNo && (
                        <p className="text-sm text-gray-500">
                          Bill: {expense.billNo}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {expense.employeeName ? (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {expense.employeeName}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative group">
                      <button className="p-1 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="p-1">
                          <button
                            onClick={() =>
                              console.log("View expense:", expense._id)
                            }
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
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
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Expense
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No expenses found
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.category ||
                filters.employeeName ||
                filters.startDate ||
                filters.endDate
                  ? "Try adjusting your search filters."
                  : "Get started by adding your first expense."}
              </p>
              {!filters.category &&
                !filters.employeeName &&
                !filters.startDate &&
                !filters.endDate && (
                  <button
                    onClick={() => navigate("/admin/expenses/add")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add First Expense
                  </button>
                )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * filters.limit,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ExpenseReport;
