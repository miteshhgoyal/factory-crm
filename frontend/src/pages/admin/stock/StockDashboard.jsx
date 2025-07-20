import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import StockActivityCard from "../../../components/cards/StockActivityCard";

const StockDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimized fetch function with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await stockAPI.getDashboardStats();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch stock dashboard data");
      console.error("Stock dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized calculations for better performance
  const calculations = useMemo(() => {
    if (!dashboardData) return {};

    return {
      todayNetQuantity:
        (dashboardData.today?.IN?.quantity || 0) -
        (dashboardData.today?.OUT?.quantity || 0),
      todayNetValue:
        (dashboardData.today?.IN?.amount || 0) -
        (dashboardData.today?.OUT?.amount || 0),
      monthlyNetQuantity:
        (dashboardData.monthly?.IN?.quantity || 0) -
        (dashboardData.monthly?.OUT?.quantity || 0),
      monthlyNetValue:
        (dashboardData.monthly?.IN?.amount || 0) -
        (dashboardData.monthly?.OUT?.amount || 0),
      totalTransactions:
        (dashboardData.monthly?.IN?.count || 0) +
        (dashboardData.monthly?.OUT?.count || 0),
      averageStockLevel:
        dashboardData.stockBalance?.length > 0
          ? Math.round(
              dashboardData.stockBalance.reduce(
                (sum, item) => sum + item.currentStock,
                0
              ) / dashboardData.stockBalance.length
            )
          : 0,
    };
  }, [dashboardData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Stock Management"
          subheader="Inventory Overview & Analytics"
          onRefresh={fetchDashboardData}
          loading={loading}
        />

        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"
            ></div>
          ))}
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="h-3 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Try Again
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
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Link
          to="/admin/stock/in"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Stock In</span>
          <span className="sm:hidden">Stock In</span>
        </Link>
        <Link
          to="/admin/stock/out"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Stock Out</span>
          <span className="sm:hidden">Stock Out</span>
        </Link>
        <Link
          to="/admin/stock/report"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">View Reports</span>
          <span className="sm:hidden">Reports</span>
        </Link>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Stock In"
          value={`${dashboardData?.today?.IN?.quantity || 0} kg`}
          icon={TrendingUp}
          color="green"
          subtitle={`Worth ₹${
            dashboardData?.today?.IN?.amount?.toLocaleString() || 0
          }`}
        />
        <StatCard
          title="Today's Stock Out"
          value={`${dashboardData?.today?.OUT?.quantity || 0} kg`}
          icon={TrendingDown}
          color="red"
          subtitle={`Worth ₹${
            dashboardData?.today?.OUT?.amount?.toLocaleString() || 0
          }`}
        />
        <StatCard
          title="Total Products"
          value={dashboardData?.totalProducts || 0}
          icon={Package}
          color="blue"
          subtitle="Active product categories"
        />
        <StatCard
          title="Low Stock Alert"
          value={dashboardData?.lowStockProducts || 0}
          icon={AlertCircle}
          color={dashboardData?.lowStockProducts > 0 ? "red" : "green"}
          subtitle={
            dashboardData?.lowStockProducts > 0
              ? "Products need attention"
              : "All products well stocked"
          }
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Stock Balance */}
        <SectionCard
          title="Current Stock Balance"
          icon={Package}
          headerColor="blue"
          actions={
            <Link
              to="/admin/stock/balance"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Stock Overview</h4>
              <DataRow
                label="Average Stock Level"
                value={`${calculations.averageStockLevel} kg`}
                valueColor="text-blue-600"
              />
              <DataRow
                label="Total Product Types"
                value={dashboardData?.stockBalance?.length || 0}
                valueColor="text-blue-600"
              />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dashboardData?.stockBalance?.slice(0, 8).map((item, index) => (
                <DataRow
                  key={index}
                  label={item._id}
                  value={`${item.currentStock.toFixed(0)} kg`}
                  valueColor={
                    item.currentStock < 100 ? "text-red-600" : "text-green-600"
                  }
                  className={
                    item.currentStock < 100 ? "bg-red-50 p-2 rounded" : ""
                  }
                />
              ))}
              {!dashboardData?.stockBalance?.length && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No stock data available
                  </p>
                  <p className="text-gray-400 text-sm">
                    Stock data will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Today's Summary */}
        <SectionCard
          title="Today's Summary"
          icon={BarChart3}
          headerColor="green"
        >
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Daily Movement
              </h4>
              <DataRow
                label="Stock Received"
                value={`${dashboardData?.today?.IN?.quantity || 0} kg`}
                valueColor="text-green-600"
              />
              <DataRow
                label="Stock Dispatched"
                value={`${dashboardData?.today?.OUT?.quantity || 0} kg`}
                valueColor="text-red-600"
              />
              <div className="border-t border-green-200 mt-2 pt-2">
                <DataRow
                  label="Net Movement"
                  value={`${calculations.todayNetQuantity >= 0 ? "+" : ""}${
                    calculations.todayNetQuantity
                  } kg`}
                  valueColor={
                    calculations.todayNetQuantity >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                  bold={true}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Value Summary</h4>
              <DataRow
                label="Inflow Value"
                value={`₹${
                  dashboardData?.today?.IN?.amount?.toLocaleString() || 0
                }`}
                valueColor="text-green-600"
              />
              <DataRow
                label="Outflow Value"
                value={`₹${
                  dashboardData?.today?.OUT?.amount?.toLocaleString() || 0
                }`}
                valueColor="text-red-600"
              />
              <DataRow
                label="Total Transactions"
                value={`${
                  (dashboardData?.today?.IN?.count || 0) +
                  (dashboardData?.today?.OUT?.count || 0)
                }`}
                bold={true}
                className="pt-2 border-t border-gray-200"
              />
            </div>
          </div>
        </SectionCard>

        {/* Monthly Analytics */}
        <SectionCard
          title="Monthly Analytics"
          icon={BarChart3}
          headerColor="purple"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                Quantity Summary
              </h4>
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
              <div className="border-t border-purple-200 mt-2 pt-2">
                <DataRow
                  label="Net Stock Change"
                  value={`${calculations.monthlyNetQuantity >= 0 ? "+" : ""}${
                    calculations.monthlyNetQuantity
                  } kg`}
                  valueColor={
                    calculations.monthlyNetQuantity >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                  bold={true}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Value Summary</h4>
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
                value={calculations.totalTransactions}
                bold={true}
                className="pt-2 border-t border-gray-200"
              />
            </div>
          </div>
        </SectionCard>

        {/* Stock Movement Trends */}
        <SectionCard
          title="Stock Insights"
          icon={AlertCircle}
          headerColor="orange"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">
                Today vs Monthly Avg
              </h4>
              <DataRow
                label="Today's In vs Avg"
                value={`${(
                  (dashboardData?.today?.IN?.quantity || 0) /
                  ((dashboardData?.monthly?.IN?.quantity || 0) / 30)
                ).toFixed(1)}x`}
                valueColor="text-orange-600"
              />
              <DataRow
                label="Today's Out vs Avg"
                value={`${(
                  (dashboardData?.today?.OUT?.quantity || 0) /
                  ((dashboardData?.monthly?.OUT?.quantity || 0) / 30)
                ).toFixed(1)}x`}
                valueColor="text-orange-600"
              />
            </div>

            <div className="space-y-2">
              <DataRow
                label="Low Stock Products"
                value={dashboardData?.lowStockProducts || 0}
                valueColor={
                  dashboardData?.lowStockProducts > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              />
              <DataRow
                label="Well Stocked Products"
                value={
                  (dashboardData?.totalProducts || 0) -
                  (dashboardData?.lowStockProducts || 0)
                }
                valueColor="text-green-600"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Stock Activities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Recent Stock Activities
                </h3>
                <p className="text-sm text-gray-600">
                  Latest inventory movements
                </p>
              </div>
            </div>
            <Link
              to="/admin/stock/report"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {dashboardData?.recentTransactions?.length > 0 ? (
              dashboardData.recentTransactions
                .slice(0, 6)
                .map((activity, index) => (
                  <StockActivityCard
                    key={`stock-activity-${index}`}
                    activity={activity}
                  />
                ))
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No recent stock activities
                </p>
                <p className="text-gray-400 text-sm">
                  Stock movements will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;
