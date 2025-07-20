import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  AlertCircle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cashFlowAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";
import CashFlowActivityCard from "../../../components/cards/CashFlowActivityCard";

const CashFlowReport = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
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

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsResponse, summaryResponse] = await Promise.all([
        cashFlowAPI.getTransactions(filters),
        cashFlowAPI.getSummary({
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: "day",
        }),
      ]);

      // Handle transactions data
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

      // Handle summary data
      if (summaryResponse.data?.success) {
        setSummaryData(summaryResponse.data.data || []);
      } else {
        setSummaryData([]);
      }
    } catch (error) {
      console.error("Failed to fetch cash flow data:", error);
      setError("Failed to fetch cash flow data. Please try again.");
      setTransactions([]);
      setSummaryData([]);
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
    if (!Array.isArray(transactions)) return {};

    const totalIn = transactions
      .filter((t) => t.type === "IN")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalOut = transactions
      .filter((t) => t.type === "OUT")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netCashFlow = totalIn - totalOut;

    const transactionsByMode = transactions.reduce((acc, t) => {
      acc[t.paymentMode] = (acc[t.paymentMode] || 0) + t.amount;
      return acc;
    }, {});

    return {
      totalIn,
      totalOut,
      netCashFlow,
      transactionsByMode,
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

  const exportData = useCallback(() => {
    const csvData = transactions.map((t) => ({
      Type: t.type,
      Amount: t.amount,
      Category: t.category,
      Description: t.description,
      PaymentMode: t.paymentMode,
      Employee: t.employeeName,
      Online: t.isOnline ? "Yes" : "No",
      TransactionId: t.transactionId || "N/A",
      Date: new Date(t.date).toLocaleDateString(),
      CreatedBy: t.createdBy?.username,
    }));

    console.log("Exporting cash flow data:", csvData);
    // Add actual CSV export logic here
  }, [transactions]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Flow Reports"
          subheader="Comprehensive cash flow reports and analytics"
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
        header="Cash Flow Reports"
        subheader="Comprehensive cash flow reports and analytics"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>Cash Flow Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/cash/dashboard")}
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
            onClick={exportData}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
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
          value={`₹${calculations.netCashFlow?.toLocaleString() || 0}`}
          icon={DollarSign}
          color={calculations.netCashFlow >= 0 ? "green" : "red"}
          subtitle={
            calculations.netCashFlow >= 0 ? "Positive flow" : "Negative flow"
          }
        />
        <StatCard
          title="Total Transactions"
          value={calculations.totalTransactions || 0}
          icon={Calendar}
          color="blue"
          subtitle="In selected period"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
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
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Cash Flow Transactions
                    </h3>
                    <p className="text-sm text-gray-600">
                      All money transactions
                    </p>
                  </div>
                </div>
                <div className="text-sm text-emerald-600">
                  {pagination.totalItems || 0} total transactions
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
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Category
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Payment Mode
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Employee
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(transactions) && transactions.length > 0 ? (
                      transactions.map((transaction) => {
                        const Icon =
                          transaction.type === "IN" ? TrendingUp : TrendingDown;
                        return (
                          <tr
                            key={transaction._id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    transaction.type === "IN"
                                      ? "bg-emerald-100"
                                      : "bg-orange-100"
                                  }`}
                                >
                                  <Icon
                                    className={`w-4 h-4 ${
                                      transaction.type === "IN"
                                        ? "text-emerald-600"
                                        : "text-orange-600"
                                    }`}
                                  />
                                </div>
                                <span
                                  className={`font-medium text-sm ${
                                    transaction.type === "IN"
                                      ? "text-emerald-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {transaction.type === "IN" ? "IN" : "OUT"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-medium text-sm ${
                                  transaction.type === "IN"
                                    ? "text-emerald-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {transaction.type === "IN" ? "+" : "-"}₹
                                {transaction.amount?.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {transaction.category}
                                </p>
                                <p
                                  className="text-xs text-gray-500 truncate"
                                  title={transaction.description}
                                >
                                  {transaction.description}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-900 text-sm">
                                  {transaction.paymentMode}
                                </span>
                                {transaction.isOnline && (
                                  <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                    Online
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-900 text-sm">
                                  {transaction.employeeName}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-600 text-sm">
                                {new Date(
                                  transaction.date
                                ).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
                          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <CashFlowActivityCard
                      key={`mobile-cashflow-${index}`}
                      activity={transaction}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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

        {/* Payment Mode Summary Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment Modes</h3>
                  <p className="text-sm text-gray-600">Transaction breakdown</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(calculations.transactionsByMode || {}).length >
                0 ? (
                  Object.entries(calculations.transactionsByMode)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([mode, amount]) => (
                      <div
                        key={mode}
                        className="@container p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {mode}
                            </h4>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              ₹{amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No payment mode data
                    </p>
                    <p className="text-gray-400 text-sm">
                      Payment methods will appear here
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

export default CashFlowReport;
