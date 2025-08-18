import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Download,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  Eye,
  Building,
  FileText,
  User,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
// import AccountReportFilter from "../../../components/reports/AccountReportFilter";
import { formatDate } from "../../../utils/dateUtils";

const SalesAccountReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    filter: "this_month",
    clientId: "",
    productName: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
  });

  // Modal States
  const [viewModal, setViewModal] = useState({
    open: false,
    transaction: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await reportsAPI.getSalesAccountReport(filters);

      if (response.data?.success) {
        setReportData(response.data.data);
      } else {
        setReportData(null);
        setError("Failed to load report data");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch sales account report. Please try again.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      filter: "this_month",
      clientId: "",
      productName: "",
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

  const exportData = useCallback(() => {
    if (!reportData?.sales) return;

    const csvData = reportData.sales.map((s) => ({
      Product: s.productName,
      Quantity: s.quantity,
      Unit: s.unit,
      Rate: s.rate,
      Amount: s.amount,
      Client: s.clientName,
      Date: formatDate(s.date),
      CreatedBy: s.createdBy?.username || "System",
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-account-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [reportData]);

  const summary = reportData?.summary || {
    totalAmount: 0,
    totalQuantity: 0,
    totalTransactions: 0,
    avgRate: 0,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and revenue tracking"
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
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and revenue tracking"
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
          header="Sales Account Report"
          subheader="Comprehensive sales analysis and revenue tracking"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShoppingCart className="w-4 h-4" />
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

            {/* <AccountReportFilter
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              reportType="sales"
            /> */}

            <button onClick={exportData} className="btn-purple btn-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Sales Revenue"
            value={`₹${summary.totalAmount?.toLocaleString() || 0}`}
            icon={ShoppingCart}
            color="green"
            subtitle="Total revenue from sales"
          />
          <StatCard
            title="Total Quantity Sold"
            value={`${summary.totalQuantity?.toLocaleString() || 0} kg`}
            icon={TrendingUp}
            color="blue"
            subtitle="Total quantity sold"
          />
          <StatCard
            title="Total Sales Orders"
            value={summary.totalTransactions || 0}
            icon={BarChart3}
            color="purple"
            subtitle="Number of sales transactions"
          />
          <StatCard
            title="Average Selling Rate"
            value={`₹${Math.round(summary.avgRate || 0)}/kg`}
            icon={Calendar}
            color="orange"
            subtitle="Average sales rate"
          />
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers */}
          <SectionCard
            title="Top Customers"
            icon={Building}
            headerColor="green"
          >
            <div className="space-y-3">
              {reportData?.clientBreakdown?.slice(0, 5).map((client, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {client.clientName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {client.transactionCount} orders • Avg: ₹
                      {Math.round(client.avgRate)}/kg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ₹{client.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {client.totalQuantity.toLocaleString()} kg
                    </p>
                  </div>
                </div>
              ))}
              {!reportData?.clientBreakdown?.length && (
                <p className="text-gray-500 text-center py-4">
                  No customer data available
                </p>
              )}
            </div>
          </SectionCard>

          {/* Best Selling Products */}
          <SectionCard
            title="Best Selling Products"
            icon={ShoppingCart}
            headerColor="blue"
          >
            <div className="space-y-3">
              {reportData?.productBreakdown
                ?.slice(0, 5)
                .map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product._id}</p>
                      <p className="text-sm text-gray-500">
                        Rate: ₹{Math.round(product.minRate)} - ₹
                        {Math.round(product.maxRate)}/kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">
                        ₹{product.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.totalQuantity.toLocaleString()} kg
                      </p>
                    </div>
                  </div>
                ))}
              {!reportData?.productBreakdown?.length && (
                <p className="text-gray-500 text-center py-4">
                  No product data available
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Sales Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Sales Transactions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Detailed sales records
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-600">
                {reportData?.pagination?.totalItems || 0} total sales
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
                      Product
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Rate
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Revenue
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
                  {reportData?.sales?.length > 0 ? (
                    reportData.sales.map((sale) => (
                      <tr
                        key={sale._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {sale.productName}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {sale.clientName || "Walk-in Customer"}
                            </p>
                            {sale.clientId?.phone && (
                              <p className="text-sm text-gray-500">
                                {sale.clientId.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {sale.quantity} {sale.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">₹{sale.rate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-green-600">
                            ₹{(sale.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600 text-sm">
                            {formatDate(sale.date)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(sale)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-12">
                        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No sales found
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
              {reportData?.sales?.length > 0 ? (
                reportData.sales.map((sale) => (
                  <div
                    key={sale._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sale.productName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sale.clientName || "Walk-in Customer"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleView(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">
                            {sale.quantity} {sale.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rate</p>
                          <p className="font-medium text-gray-900">
                            ₹{sale.rate}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="font-bold text-green-600">
                            ₹{(sale.amount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(sale.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No sales found</p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {reportData?.pagination?.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  {(reportData.pagination.currentPage - 1) * filters.limit + 1}{" "}
                  to{" "}
                  {Math.min(
                    reportData.pagination.currentPage * filters.limit,
                    reportData.pagination.totalItems
                  )}{" "}
                  of {reportData.pagination.totalItems} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handlePageChange(reportData.pagination.currentPage - 1)
                    }
                    disabled={!reportData.pagination.hasPrev}
                    className="btn-secondary btn-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                    {reportData.pagination.currentPage} of{" "}
                    {reportData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      handlePageChange(reportData.pagination.currentPage + 1)
                    }
                    disabled={!reportData.pagination.hasNext}
                    className="btn-secondary btn-sm disabled:opacity-50"
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
        title="Sales Transaction Details"
        subtitle="Complete sales information"
        headerIcon={<Eye />}
        headerColor="green"
        size="lg"
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Sales Overview */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-green-600" />
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
                    Quantity Sold
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.quantity}{" "}
                    {viewModal.transaction.unit}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Selling Rate
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    ₹{viewModal.transaction.rate} per{" "}
                    {viewModal.transaction.unit}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Total Revenue
                  </label>
                  <div className="text-xl font-bold text-green-600">
                    ₹{(viewModal.transaction.amount || 0).toLocaleString()}
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
                    Transaction Type
                  </label>
                  <div className="text-lg font-medium text-green-600">
                    Stock Out (Sales)
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {viewModal.transaction.clientId && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Customer Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.clientId.name ||
                        viewModal.transaction.clientName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Customer Type
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.clientId.type || "Customer"}
                    </div>
                  </div>

                  {viewModal.transaction.clientId.phone && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-500">
                        Phone Number
                      </label>
                      <div className="text-lg font-medium text-gray-900">
                        {viewModal.transaction.clientId.phone}
                      </div>
                    </div>
                  )}

                  {viewModal.transaction.clientId.address && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-500">
                        Address
                      </label>
                      <div className="text-lg font-medium text-gray-900">
                        {viewModal.transaction.clientId.address}
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
                    {formatDate(viewModal.transaction.createdAt)}
                  </div>
                </div>

                {viewModal.transaction.bags && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Bags Info
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.bags.count} bags ×{" "}
                      {viewModal.transaction.bags.weight} kg
                    </div>
                  </div>
                )}

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
    </>
  );
};

export default SalesAccountReport;
