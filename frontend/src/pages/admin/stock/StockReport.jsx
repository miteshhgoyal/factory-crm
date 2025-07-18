import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Search,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const StockReport = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stockBalance, setStockBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [transactionsResponse, balanceResponse] = await Promise.all([
        stockAPI.getTransactions(filters),
        stockAPI.getBalance(),
      ]);

      // Ensure we always set arrays
      setTransactions(
        Array.isArray(transactionsResponse.data?.transactions)
          ? transactionsResponse.data.transactions
          : []
      );
      setPagination(transactionsResponse.data?.pagination || {});
      setStockBalance(
        Array.isArray(balanceResponse.data) ? balanceResponse.data : []
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch stock data");
      // Set empty arrays on error
      setTransactions([]);
      setStockBalance([]);
      setPagination({});
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
      type: "",
      productName: "",
      clientName: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
    });
  };

  const exportData = () => {
    // Implementation for export functionality
    console.log("Exporting data...");
  };

  const calculateTotalValue = () => {
    if (!Array.isArray(stockBalance)) return 0;
    return stockBalance.reduce((total, product) => {
      return total + (product.currentStock || 0) * (product.averageRate || 0);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    if (!Array.isArray(stockBalance)) return 0;
    return stockBalance.reduce(
      (total, product) => total + (product.currentStock || 0),
      0
    );
  };

  const getLowStockCount = () => {
    if (!Array.isArray(stockBalance)) return 0;
    return stockBalance.filter((p) => (p.currentStock || 0) < 100).length;
  };

  const getTransactionIcon = (type) => {
    return type === "IN" ? TrendingUp : TrendingDown;
  };

  const getTransactionColor = (type) => {
    return type === "IN" ? "text-green-600" : "text-red-600";
  };

  const getTransactionBgColor = (type) => {
    return type === "IN" ? "bg-green-100" : "bg-red-100";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
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
          header="Stock Reports"
          subheader="Comprehensive inventory reports and analytics"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchData}
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={exportData}
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
          title="Total Stock Value"
          value={`₹${calculateTotalValue().toLocaleString()}`}
          icon={Package}
          color="blue"
          change="Current valuation"
        />
        <StatCard
          title="Total Quantity"
          value={`${calculateTotalQuantity().toFixed(2)} kg`}
          icon={Package}
          color="green"
          change="Available stock"
        />
        <StatCard
          title="Total Products"
          value={stockBalance.length}
          icon={Package}
          color="purple"
          change="Active products"
        />
        <StatCard
          title="Low Stock Items"
          value={getLowStockCount()}
          icon={Package}
          color="red"
          change="Below 100 kg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Stock Transactions"
            icon={BarChart3}
            headerColor="blue"
          >
            {/* Filters */}
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Transaction Type
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="IN">Stock In</option>
                    <option value="OUT">Stock Out</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="productName"
                    value={filters.productName}
                    onChange={handleFilterChange}
                    placeholder="Search product..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={filters.clientName}
                    onChange={handleFilterChange}
                    placeholder="Search client..."
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

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(transactions) && transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const Icon = getTransactionIcon(transaction.type);
                      return (
                        <tr
                          key={transaction._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${getTransactionBgColor(
                                  transaction.type
                                )}`}
                              >
                                <Icon
                                  className={`w-4 h-4 ${getTransactionColor(
                                    transaction.type
                                  )}`}
                                />
                              </div>
                              <span
                                className={`font-medium ${getTransactionColor(
                                  transaction.type
                                )}`}
                              >
                                {transaction.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {transaction.productName}
                              </p>
                              {transaction.clientName && (
                                <p className="text-sm text-gray-500">
                                  {transaction.clientName}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {transaction.quantity} kg
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900">
                              ₹{transaction.rate}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              ₹{(transaction.amount || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">
                              {new Date(transaction.date).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No transactions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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

        {/* Stock Balance */}
        <div className="lg:col-span-1">
          <SectionCard
            title="Current Stock Balance"
            icon={Package}
            headerColor="green"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Array.isArray(stockBalance) && stockBalance.length > 0 ? (
                stockBalance.map((product) => (
                  <div
                    key={product._id}
                    className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {product._id}
                      </h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          (product.currentStock || 0) < 100
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {(product.currentStock || 0) < 100
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stock:</span>
                        <span className="font-medium text-gray-900">
                          {(product.currentStock || 0).toFixed(2)} kg
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bags:</span>
                        <span className="font-medium text-gray-900">
                          {((product.currentStock || 0) / 40).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="text-gray-700">
                          {product.lastTransactionDate
                            ? new Date(
                                product.lastTransactionDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No stock data available</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default StockReport;
