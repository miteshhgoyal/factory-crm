import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
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
import { reportsAPI, clientAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
// import AccountReportFilter from "../../../components/reports/AccountReportFilter";
import { formatDate } from "../../../utils/dateUtils";

const PurchaseAccountReport = () => {
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

      const response = await reportsAPI.getPurchaseAccountReport(filters);

      if (response.data?.success) {
        setReportData(response.data.data);
      } else {
        setReportData(null);
        setError("Failed to load report data");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch purchase account report. Please try again.");
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
    if (!reportData?.purchases) return;

    const csvData = reportData.purchases.map((p) => ({
      Product: p.productName,
      Quantity: p.quantity,
      Unit: p.unit,
      Rate: p.rate,
      Amount: p.amount,
      Client: p.clientName,
      Invoice: p.invoiceNo,
      Date: formatDate(p.date),
      CreatedBy: p.createdBy?.username || "System",
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
    link.download = `purchase-account-report-${
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
          header="Purchase Account Report"
          subheader="Comprehensive purchase analysis and inventory transactions"
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
          header="Purchase Account Report"
          subheader="Comprehensive purchase analysis and inventory transactions"
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
          header="Purchase Account Report"
          subheader="Comprehensive purchase analysis and inventory transactions"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>Reports</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Purchase Account</span>
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
              reportType="purchase"
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
            title="Total Purchase Amount"
            value={`₹${summary.totalAmount?.toLocaleString() || 0}`}
            icon={Package}
            color="blue"
            subtitle="Total spent on purchases"
          />
          <StatCard
            title="Total Quantity"
            value={`${summary.totalQuantity?.toLocaleString() || 0} kg`}
            icon={TrendingUp}
            color="green"
            subtitle="Total quantity purchased"
          />
          <StatCard
            title="Total Transactions"
            value={summary.totalTransactions || 0}
            icon={BarChart3}
            color="purple"
            subtitle="Number of purchase orders"
          />
          <StatCard
            title="Average Rate"
            value={`₹${Math.round(summary.avgRate || 0)}/kg`}
            icon={Calendar}
            color="orange"
            subtitle="Average purchase rate"
          />
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Suppliers */}
          <SectionCard title="Top Suppliers" icon={Building} headerColor="blue">
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
                    <p className="font-bold text-blue-600">
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
                  No supplier data available
                </p>
              )}
            </div>
          </SectionCard>

          {/* Top Products */}
          <SectionCard title="Top Products" icon={Package} headerColor="green">
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
                      <p className="font-bold text-green-600">
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

        {/* Purchase Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Purchase Transactions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Detailed purchase records
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {reportData?.pagination?.totalItems || 0} total purchases
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
                      Supplier
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
                  {reportData?.purchases?.length > 0 ? (
                    reportData.purchases.map((purchase) => (
                      <tr
                        key={purchase._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {purchase.productName}
                            </p>
                            {purchase.invoiceNo && (
                              <p className="text-sm text-gray-500">
                                Invoice: {purchase.invoiceNo}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {purchase.clientName}
                          </p>
                          {purchase.clientId?.phone && (
                            <p className="text-sm text-gray-500">
                              {purchase.clientId.phone}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {purchase.quantity} {purchase.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900">
                            ₹{purchase.rate}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-600">
                            ₹{(purchase.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600 text-sm">
                            {formatDate(purchase.date)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(purchase)}
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
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No purchases found
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
              {reportData?.purchases?.length > 0 ? (
                reportData.purchases.map((purchase) => (
                  <div
                    key={purchase._id}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {purchase.productName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {purchase.clientName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleView(purchase)}
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
                            {purchase.quantity} {purchase.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Rate</p>
                          <p className="font-medium text-gray-900">
                            ₹{purchase.rate}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="font-bold text-blue-600">
                            ₹{(purchase.amount || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {formatDate(purchase.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No purchases found
                  </p>
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
        title="Purchase Transaction Details"
        subtitle="Complete purchase information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="lg"
      >
        {viewModal.transaction && (
          <div className="space-y-6">
            {/* Purchase Overview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Purchase Overview
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
                  <div className="text-xl font-bold text-blue-600">
                    ₹{(viewModal.transaction.amount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Purchase Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {formatDate(viewModal.transaction.date)}
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

            {/* Supplier Information */}
            {viewModal.transaction.clientId && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Supplier Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Supplier Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {viewModal.transaction.clientId.name ||
                        viewModal.transaction.clientName}
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
                    <div className="col-span-2 space-y-1">
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

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Stock Source
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {viewModal.transaction.stockSource || "PURCHASED"}
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

export default PurchaseAccountReport;
