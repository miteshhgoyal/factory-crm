import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Search,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import StockActivityCard from "../../../components/cards/StockActivityCard";

const StockReport = () => {
  const navigate = useNavigate();
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

  // Optimized fetch function with useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsResponse, balanceResponse] = await Promise.all([
        stockAPI.getTransactions(filters),
        stockAPI.getBalance(),
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

      // Handle balance data
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

  // Memoized calculations
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

  const exportData = useCallback(() => {
    // Implementation for export functionality
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

    console.log("Exporting data:", csvData);
    // Add actual CSV export logic here
  }, [transactions]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 animate-pulse">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  <Icon
                                    className={`w-4 h-4 ${
                                      transaction.type === "IN"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  />
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
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12">
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <StockActivityCard
                      key={`mobile-transaction-${index}`}
                      activity={transaction}
                    />
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

        {/* Stock Balance Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Current Stock</h3>
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
                      className="@container p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
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
                            {((product.currentStock || 0) / 40).toFixed(1)}
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
  );
};

export default StockReport;
