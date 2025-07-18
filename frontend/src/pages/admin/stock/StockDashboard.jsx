import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const StockDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await stockAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Stock dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Stock Management"
          subheader="Inventory Overview & Analytics"
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderComponent
        header="Stock Management"
        subheader="Inventory Overview & Analytics"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/stock/in"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Stock In
        </Link>
        <Link
          to="/admin/stock/out"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Package className="w-4 h-4" />
          Stock Out
        </Link>
        <Link
          to="/admin/stock/report"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Stock In"
          value={`${dashboardData?.today?.IN?.quantity || 0} kg`}
          icon={TrendingUp}
          color="green"
          change={`₹${dashboardData?.today?.IN?.amount?.toLocaleString() || 0}`}
        />
        <StatCard
          title="Today's Stock Out"
          value={`${dashboardData?.today?.OUT?.quantity || 0} kg`}
          icon={TrendingDown}
          color="red"
          change={`₹${
            dashboardData?.today?.OUT?.amount?.toLocaleString() || 0
          }`}
        />
        <StatCard
          title="Total Products"
          value={dashboardData?.totalProducts || 0}
          icon={Package}
          color="blue"
          change="Active products"
        />
        <StatCard
          title="Low Stock Alert"
          value={dashboardData?.lowStockProducts || 0}
          icon={AlertCircle}
          color="orange"
          change="Products below 100kg"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stock Balance */}
        <SectionCard
          title="Current Stock Balance"
          icon={Package}
          headerColor="blue"
          actions={
            <Link
              to="/admin/stock/balance"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-3">
            {dashboardData?.stockBalance?.slice(0, 6).map((item, index) => (
              <DataRow
                key={index}
                label={item._id}
                value={`${item.currentStock.toFixed(2)} kg`}
                valueColor={
                  item.currentStock < 100 ? "text-red-600" : "text-green-600"
                }
              />
            ))}
            {!dashboardData?.stockBalance?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No stock data available
              </p>
            )}
          </div>
        </SectionCard>

        {/* Monthly Summary */}
        <SectionCard
          title="Monthly Summary"
          icon={BarChart3}
          headerColor="purple"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Stock In"
              value={`${dashboardData?.monthly?.IN?.quantity || 0} kg`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Stock Out"
              value={`${dashboardData?.monthly?.OUT?.quantity || 0} kg`}
              valueColor="text-red-600"
            />
            <DataRow
              label="Stock In Value"
              value={`₹${
                dashboardData?.monthly?.IN?.amount?.toLocaleString() || 0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Stock Out Value"
              value={`₹${
                dashboardData?.monthly?.OUT?.amount?.toLocaleString() || 0
              }`}
              valueColor="text-red-600"
            />
            <DataRow
              label="Total Transactions"
              value={`${
                (dashboardData?.monthly?.IN?.count || 0) +
                (dashboardData?.monthly?.OUT?.count || 0)
              }`}
              bold={true}
              className="pt-2 border-t"
            />
          </div>
        </SectionCard>
      </div>

      {/* Recent Transactions */}
      <SectionCard
        title="Recent Transactions"
        icon={Package}
        headerColor="gray"
        actions={
          <Link
            to="/admin/stock/report"
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </Link>
        }
      >
        <div className="space-y-3">
          {dashboardData?.recentTransactions?.map((transaction, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === "IN"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {transaction.type === "IN" ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.type} •{" "}
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {transaction.quantity} kg
                </p>
                <p className="text-sm text-gray-500">
                  ₹{transaction.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {!dashboardData?.recentTransactions?.length && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent transactions
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default StockDashboard;
