import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Receipt,
  Plus,
  TrendingUp,
  IndianRupee,
  Calendar,
  BarChart3,
  PieChart,
  AlertCircle,
  User,
  Building,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";
import ExpenseActivityCard from "../../../components/cards/ExpenseActivityCard";

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimized fetch function with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await expenseAPI.getDashboardStats();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch expense dashboard data");
      console.error("Expense dashboard error:", err);
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
      avgDailyExpense:
        dashboardData.monthly?.count > 0
          ? Math.round(dashboardData.monthly.totalAmount / 30)
          : 0,
      avgTransactionAmount:
        dashboardData.monthly?.count > 0
          ? Math.round(
              dashboardData.monthly.totalAmount / dashboardData.monthly.count
            )
          : 0,
      totalCategories: dashboardData.categoryBreakdown?.length || 0,
      topCategoryAmount: dashboardData.topCategories?.[0]?.totalAmount || 0,
      expenseGrowth:
        (((dashboardData.monthly?.totalAmount || 0) -
          (dashboardData.yearly?.totalAmount -
            dashboardData.monthly?.totalAmount || 0)) /
          (dashboardData.yearly?.totalAmount -
            dashboardData.monthly?.totalAmount || 1)) *
        100,
    };
  }, [dashboardData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Management"
          subheader="Monitor and control business expenses"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
          header="Expense Management"
          subheader="Monitor and control business expenses"
          onRefresh={fetchDashboardData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to load expense data
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
        header="Expense Management"
        subheader="Monitor and control business expenses"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Link
          to="/admin/expenses/add"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </Link>
        <Link
          to="/admin/expenses/report"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">View Reports</span>
          <span className="sm:hidden">Reports</span>
        </Link>
        <button
          onClick={() => navigate("/admin/expenses/categories")}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
        >
          <PieChart className="w-4 h-4" />
          <span className="hidden sm:inline">Categories</span>
          <span className="sm:hidden">Categories</span>
        </button>
      </div>

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Expenses"
          value={`₹${dashboardData?.today?.totalAmount?.toLocaleString() || 0}`}
          icon={Receipt}
          color="red"
          subtitle={`${dashboardData?.today?.count || 0} transactions`}
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${
            dashboardData?.monthly?.totalAmount?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color="orange"
          subtitle={`${dashboardData?.monthly?.count || 0} transactions`}
        />
        <StatCard
          title="Yearly Expenses"
          value={`₹${
            dashboardData?.yearly?.totalAmount?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="purple"
          subtitle={`${dashboardData?.yearly?.count || 0} transactions`}
        />
        <StatCard
          title="Active Categories"
          value={calculations.totalCategories || 0}
          icon={BarChart3}
          color="blue"
          subtitle="Expense categories"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Top Spending Categories */}
        <SectionCard
          title="Top Spending Categories"
          icon={PieChart}
          headerColor="purple"
          actions={
            <Link
              to="/admin/expenses/categories"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Last 30 Days</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {dashboardData?.topCategories
                  ?.slice(0, 6)
                  .map((category, index) => (
                    <DataRow
                      key={index}
                      label={category._id}
                      value={`₹${category.totalAmount?.toLocaleString()}`}
                      valueColor="text-purple-600"
                      className="text-sm"
                    />
                  ))}
              </div>
            </div>

            {!dashboardData?.topCategories?.length && (
              <div className="text-center py-8">
                <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No expense categories
                </p>
                <p className="text-gray-400 text-sm">
                  Categories will appear here
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Monthly Analysis */}
        <SectionCard
          title="Monthly Analysis"
          icon={Calendar}
          headerColor="blue"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Month</h4>
              <DataRow
                label="Total Expenses"
                value={`₹${
                  dashboardData?.monthly?.totalAmount?.toLocaleString() || 0
                }`}
                valueColor="text-red-600"
              />
              <DataRow
                label="Total Transactions"
                value={dashboardData?.monthly?.count || 0}
                valueColor="text-blue-600"
              />
              <div className="border-t border-blue-200 mt-2 pt-2">
                <DataRow
                  label="Average per Transaction"
                  value={`₹${
                    calculations.avgTransactionAmount?.toLocaleString() || 0
                  }`}
                  valueColor="text-blue-600"
                  bold={true}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
              <DataRow
                label="Average Daily Spend"
                value={`₹${
                  calculations.avgDailyExpense?.toLocaleString() || 0
                }`}
                valueColor="text-gray-600"
              />
              <DataRow
                label="Categories Used"
                value={calculations.totalCategories || 0}
                valueColor="text-gray-600"
              />
              <DataRow
                label="Top Category Amount"
                value={`₹${
                  calculations.topCategoryAmount?.toLocaleString() || 0
                }`}
                valueColor="text-gray-600"
              />
            </div>
          </div>
        </SectionCard>

        {/* Expense Trends */}
        <SectionCard
          title="Expense Insights"
          icon={BarChart3}
          headerColor="green"
        >
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Spending Pattern
              </h4>
              <DataRow
                label="Today vs Daily Avg"
                value={`${(
                  (dashboardData?.today?.totalAmount || 0) /
                  (calculations.avgDailyExpense || 1)
                ).toFixed(1)}x`}
                valueColor="text-green-600"
              />
              <DataRow
                label="This Month vs Yearly Avg"
                value={`${(
                  (dashboardData?.monthly?.totalAmount || 0) /
                  ((dashboardData?.yearly?.totalAmount || 0) / 12)
                ).toFixed(1)}x`}
                valueColor="text-green-600"
              />
            </div>

            <div className="space-y-2">
              <DataRow
                label="Largest Category"
                value={dashboardData?.topCategories?.[0]?._id || "N/A"}
                valueColor="text-green-600"
              />
              <DataRow
                label="Most Active Period"
                value="Month Analysis"
                valueColor="text-green-600"
              />
              <DataRow
                label="Budget Status"
                value="Setup Required"
                valueColor="text-orange-600"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Expense Activities */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Recent Expense Activities
                </h3>
                <p className="text-sm text-gray-600">
                  Latest business expenses
                </p>
              </div>
            </div>
            <Link
              to="/admin/expenses/report"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {dashboardData?.recentExpenses?.length > 0 ? (
              dashboardData.recentExpenses
                .slice(0, 6)
                .map((expense, index) => (
                  <ExpenseActivityCard
                    key={`expense-activity-${index}`}
                    activity={expense}
                  />
                ))
            ) : (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">
                  No recent expense activities
                </p>
                <p className="text-gray-400 text-sm">
                  Expenses will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;
