import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PlusCircle,
  MinusCircle,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cashFlowAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";
import CashFlowActivityCard from "../../../components/cards/CashFlowActivityCard";

const CashFlowDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimized fetch function with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cashFlowAPI.getDashboardStats();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch cash flow dashboard data");
      console.error("Cash flow dashboard error:", err);
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
      todayNetCash:
        (dashboardData.today?.IN?.amount || 0) -
        (dashboardData.today?.OUT?.amount || 0),
      monthlyNetCash:
        (dashboardData.monthly?.IN?.amount || 0) -
        (dashboardData.monthly?.OUT?.amount || 0),
      yearlyNetCash:
        (dashboardData.yearly?.IN?.amount || 0) -
        (dashboardData.yearly?.OUT?.amount || 0),
      totalMonthlyTransactions:
        (dashboardData.monthly?.IN?.count || 0) +
        (dashboardData.monthly?.OUT?.count || 0),
      cashFlowTrend:
        dashboardData.monthly?.netCash >= 0 ? "positive" : "negative",
    };
  }, [dashboardData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Flow Management"
          subheader="Monitor and manage cash inflows and outflows"
          onRefresh={fetchDashboardData}
          loading={loading}
        />

        {/* Quick Actions Skeleton */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-10 w-28 sm:w-36 bg-gray-200 rounded-xl animate-pulse"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Flow Management"
          subheader="Monitor and manage cash inflows and outflows"
          onRefresh={fetchDashboardData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load cash flow data
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderComponent
        header="Cash Flow Management"
        subheader="Monitor and manage cash inflows and outflows"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Link
          to="/admin/cash/in"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Cash In</span>
          <span className="sm:hidden">Cash In</span>
        </Link>
        <Link
          to="/admin/cash/out"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <MinusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Cash Out</span>
          <span className="sm:hidden">Cash Out</span>
        </Link>
        <button
          onClick={() => navigate("/admin/cash/report")}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">View Reports</span>
          <span className="sm:hidden">Reports</span>
        </button>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Cash In"
          value={`₹${dashboardData?.today?.IN?.amount?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          subtitle={`${dashboardData?.today?.IN?.count || 0} transactions`}
        />
        <StatCard
          title="Today's Cash Out"
          value={`₹${dashboardData?.today?.OUT?.amount?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
          subtitle={`${dashboardData?.today?.OUT?.count || 0} transactions`}
        />
        <StatCard
          title="Net Cash Flow (Today)"
          value={`₹${calculations.todayNetCash?.toLocaleString() || 0}`}
          icon={DollarSign}
          color={calculations.todayNetCash >= 0 ? "green" : "red"}
          subtitle="Today's net position"
        />
        <StatCard
          title="Monthly Net Cash"
          value={`₹${calculations.monthlyNetCash?.toLocaleString() || 0}`}
          icon={Wallet}
          color={calculations.monthlyNetCash >= 0 ? "blue" : "orange"}
          subtitle="This month's position"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Monthly Summary */}
        <SectionCard
          title="Monthly Summary"
          icon={BarChart3}
          headerColor="blue"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Cash Flow Overview
              </h4>
              <DataRow
                label="Total Cash In"
                value={`₹${
                  dashboardData?.monthly?.IN?.amount?.toLocaleString() || 0
                }`}
                valueColor="text-green-600"
              />
              <DataRow
                label="Total Cash Out"
                value={`₹${
                  dashboardData?.monthly?.OUT?.amount?.toLocaleString() || 0
                }`}
                valueColor="text-red-600"
              />
              <div className="border-t border-blue-200 mt-2 pt-2">
                <DataRow
                  label="Net Cash Flow"
                  value={`₹${
                    calculations.monthlyNetCash?.toLocaleString() || 0
                  }`}
                  valueColor={
                    calculations.monthlyNetCash >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                  bold={true}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Transaction Count
              </h4>
              <DataRow
                label="Cash In Transactions"
                value={dashboardData?.monthly?.IN?.count || 0}
                valueColor="text-green-600"
              />
              <DataRow
                label="Cash Out Transactions"
                value={dashboardData?.monthly?.OUT?.count || 0}
                valueColor="text-red-600"
              />
              <DataRow
                label="Total Transactions"
                value={calculations.totalMonthlyTransactions || 0}
                bold={true}
                className="pt-2 border-t border-gray-200"
              />
            </div>
          </div>
        </SectionCard>

        {/* Payment Mode Breakdown */}
        <SectionCard
          title="Payment Mode Breakdown"
          icon={CreditCard}
          headerColor="purple"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                Monthly Breakdown
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {dashboardData?.paymentModeBreakdown
                  ?.slice(0, 8)
                  .map((mode, index) => (
                    <DataRow
                      key={index}
                      label={mode._id}
                      value={`₹${mode.totalAmount?.toLocaleString()}`}
                      valueColor="text-purple-600"
                      className="text-sm"
                    />
                  ))}
              </div>
            </div>

            {!dashboardData?.paymentModeBreakdown?.length && (
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
        </SectionCard>

        {/* Category Breakdown */}
        <SectionCard
          title="Category Breakdown"
          icon={Wallet}
          headerColor="orange"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">
                Top Categories (30 days)
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {dashboardData?.categoryBreakdown
                  ?.slice(0, 6)
                  .map((category, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {category._id.category}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {category._id.type} • {category.count} txns
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p
                          className={`font-medium ${
                            category._id.type === "IN"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {category._id.type === "IN" ? "+" : "-"}₹
                          {category.totalAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {!dashboardData?.categoryBreakdown?.length && (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No category data</p>
                <p className="text-gray-400 text-sm">
                  Categories will appear here
                </p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Cash Flow Activities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Recent Cash Flow Activities
                </h3>
                <p className="text-sm text-gray-600">
                  Latest money transactions
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/cash/report")}
              className="text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {dashboardData?.recentTransactions?.length > 0 ? (
              dashboardData.recentTransactions
                .slice(0, 6)
                .map((transaction, index) => (
                  <CashFlowActivityCard
                    key={`cashflow-activity-${index}`}
                    activity={transaction}
                  />
                ))
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No recent cash flow activities
                </p>
                <p className="text-gray-400 text-sm">
                  Transactions will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowDashboard;
