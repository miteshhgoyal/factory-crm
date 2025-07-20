import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  AlertCircle,
  BarChart3,
  Wallet,
  UserCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Building,
  CreditCard,
  Receipt,
} from "lucide-react";
import { dashboardAPI } from "../../services/api";
import HeaderComponent from "../../components/ui/HeaderComponent";
import StatCard from "../../components/cards/StatCard";
import SectionCard from "../../components/cards/SectionCard";
import DataRow from "../../components/cards/DataRow";
import StockActivityCard from "../../components/cards/StockActivityCard";
import CashFlowActivityCard from "../../components/cards/CashFlowActivityCard";
import ExpenseActivityCard from "../../components/cards/ExpenseActivityCard";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimized fetch function with useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardAPI.getStats();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Dashboard error:", err);
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
      netCashFlow:
        (dashboardData.cash?.monthlyFlow?.IN || 0) -
        (dashboardData.cash?.monthlyFlow?.OUT || 0),
      attendanceRate: Math.round(
        ((dashboardData.employees?.presentToday || 0) /
          (dashboardData.employees?.total || 1)) *
          100
      ),
      totalStockInValue: dashboardData.stock?.todayIn || 0,
      totalStockOutValue: dashboardData.stock?.todayOut || 0,
    };
  }, [dashboardData]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Dashboard"
          subheader="Factory CRM Overview & Analytics"
          onRefresh={fetchDashboardData}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
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

  // Activity feed renderer component
  const ActivityFeed = ({
    title,
    subtitle,
    icon: Icon,
    activities,
    ActivityComponent,
    emptyMessage,
    gradientClass,
    iconBgClass,
    iconColorClass,
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className={`bg-gradient-to-r ${gradientClass} px-6 py-4 border-b border-gray-100`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${iconBgClass} rounded-xl flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 ${iconColorClass}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {activities?.length > 0 ? (
            activities
              .slice(0, 5)
              .map((activity, index) => (
                <ActivityComponent
                  key={`${title.toLowerCase()}-${index}`}
                  activity={activity}
                />
              ))
          ) : (
            <div className="text-center py-12">
              <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{emptyMessage}</p>
              <p className="text-gray-400 text-sm">
                Activities will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderComponent
        header="Dashboard"
        subheader="Factory CRM Overview & Analytics"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Cash Inflow"
          value={`₹${dashboardData?.cash?.todayIn?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          subtitle="Money received today"
        />
        <StatCard
          title="Today's Cash Outflow"
          value={`₹${dashboardData?.cash?.todayOut?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
          subtitle="Money spent today"
        />
        <StatCard
          title="Today's Stock In"
          value={`${dashboardData?.stock?.todayQuantityIn || 0} kg`}
          icon={ArrowUpCircle}
          color="blue"
          subtitle={`Worth ₹${
            calculations.totalStockInValue?.toLocaleString() || 0
          }`}
        />
        <StatCard
          title="Today's Stock Out"
          value={`${dashboardData?.stock?.todayQuantityOut || 0} kg`}
          icon={ArrowDownCircle}
          color="orange"
          subtitle={`Worth ₹${
            calculations.totalStockOutValue?.toLocaleString() || 0
          }`}
        />
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Employees Present"
          value={`${dashboardData?.employees?.presentToday || 0}/${
            dashboardData?.employees?.total || 0
          }`}
          icon={UserCheck}
          color="green"
          subtitle={`${
            dashboardData?.employees?.absentToday || 0
          } absent today`}
        />
        <StatCard
          title="Total Clients"
          value={dashboardData?.clients?.total || 0}
          icon={Building}
          color="purple"
          subtitle="Active business partners"
        />
        <StatCard
          title="Outstanding Amount"
          value={`₹${
            dashboardData?.clients?.totalOutstanding?.toLocaleString() || 0
          }`}
          icon={CreditCard}
          color="yellow"
          subtitle="From all clients"
        />
        <StatCard
          title="Today's Expenses"
          value={`₹${
            dashboardData?.expenses?.todayTotal?.toLocaleString() || 0
          }`}
          icon={Wallet}
          color="red"
          subtitle="Business expenses"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Analytics */}
        <SectionCard title="Stock Analytics" icon={Package} headerColor="blue">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Today's Movement
              </h4>
              <div className="grid grid-cols-1">
                <div>
                  <DataRow
                    label="Stock Received"
                    value={`${dashboardData?.stock?.todayQuantityIn || 0} kg`}
                    valueColor="text-green-600"
                  />
                  <DataRow
                    label="Value"
                    value={`₹${
                      calculations.totalStockInValue?.toLocaleString() || 0
                    }`}
                    labelColor="text-gray-600"
                    className="text-sm"
                  />
                </div>
                <div>
                  <DataRow
                    label="Stock Dispatched"
                    value={`${dashboardData?.stock?.todayQuantityOut || 0} kg`}
                    valueColor="text-red-600"
                  />
                  <DataRow
                    label="Value"
                    value={`₹${
                      calculations.totalStockOutValue?.toLocaleString() || 0
                    }`}
                    labelColor="text-gray-600"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="pt-2">
              <DataRow
                label="Total Product Categories"
                value={dashboardData?.stock?.totalProducts || 0}
              />
              <DataRow
                label="Low Stock Alerts"
                value={dashboardData?.stock?.lowStockProducts || 0}
                valueColor={
                  (dashboardData?.stock?.lowStockProducts || 0) > 0
                    ? "text-red-600"
                    : "text-green-600"
                }
              />
            </div>
          </div>
        </SectionCard>

        {/* Cash Flow Analytics */}
        <SectionCard
          title="Cash Flow Analytics"
          icon={DollarSign}
          headerColor="green"
        >
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">
                Monthly Summary
              </h4>
              <DataRow
                label="Total Cash Inflow"
                value={`₹${
                  dashboardData?.cash?.monthlyFlow?.IN?.toLocaleString() || 0
                }`}
                valueColor="text-green-600"
              />
              <DataRow
                label="Total Cash Outflow"
                value={`₹${
                  dashboardData?.cash?.monthlyFlow?.OUT?.toLocaleString() || 0
                }`}
                valueColor="text-red-600"
              />
              <div className="border-t border-green-200 mt-2 pt-2">
                <DataRow
                  label="Net Cash Flow"
                  value={`₹${calculations.netCashFlow?.toLocaleString() || 0}`}
                  valueColor={
                    calculations.netCashFlow >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                  bold={true}
                />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Today's Summary
              </h4>
              <DataRow
                label="Cash Received"
                value={`₹${
                  dashboardData?.cash?.todayIn?.toLocaleString() || 0
                }`}
                valueColor="text-green-600"
              />
              <DataRow
                label="Cash Spent"
                value={`₹${
                  dashboardData?.cash?.todayOut?.toLocaleString() || 0
                }`}
                valueColor="text-red-600"
              />
            </div>
          </div>
        </SectionCard>

        {/* Employee Analytics */}
        <SectionCard
          title="Employee Analytics"
          icon={Users}
          headerColor="purple"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                Today's Attendance
              </h4>
              <div className="space-y-2">
                <DataRow
                  label="Total Employees"
                  value={dashboardData?.employees?.total || 0}
                />
                <DataRow
                  label="Present Today"
                  value={dashboardData?.employees?.presentToday || 0}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Absent Today"
                  value={dashboardData?.employees?.absentToday || 0}
                  valueColor="text-red-600"
                />
                <DataRow
                  label="Attendance Rate"
                  value={`${calculations.attendanceRate || 0}%`}
                  valueColor={
                    calculations.attendanceRate >= 80
                      ? "text-green-600"
                      : "text-red-600"
                  }
                  bold={true}
                  className="pt-2 border-t border-purple-200"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Expense Analytics */}
        <SectionCard
          title="Expense Analytics"
          icon={BarChart3}
          headerColor="orange"
        >
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">
                Top Categories (Monthly)
              </h4>
              <div className="space-y-2">
                {dashboardData?.expenses?.monthlyByCategory
                  ?.slice(0, 5)
                  .map((category, index) => (
                    <DataRow
                      key={index}
                      label={category._id}
                      value={`₹${category.total?.toLocaleString()}`}
                      className="text-sm"
                    />
                  ))}
              </div>
            </div>
            <div className="pt-2">
              <DataRow
                label="Today's Total Expenses"
                value={`₹${
                  dashboardData?.expenses?.todayTotal?.toLocaleString() || 0
                }`}
                bold={true}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ActivityFeed
          title="Recent Stock Activities"
          subtitle="Latest inventory movements"
          icon={Package}
          activities={dashboardData?.recentActivities?.stock}
          ActivityComponent={StockActivityCard}
          emptyMessage="No recent stock activities"
          gradientClass="from-blue-50 to-indigo-50"
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-600"
        />

        <ActivityFeed
          title="Recent Cash Flow"
          subtitle="Latest money transactions"
          icon={DollarSign}
          activities={dashboardData?.recentActivities?.cashFlow}
          ActivityComponent={CashFlowActivityCard}
          emptyMessage="No recent cash flow"
          gradientClass="from-emerald-50 to-green-50"
          iconBgClass="bg-emerald-100"
          iconColorClass="text-emerald-600"
        />

        <ActivityFeed
          title="Recent Expenses"
          subtitle="Latest business expenses"
          icon={Receipt}
          activities={dashboardData?.recentActivities?.expenses}
          ActivityComponent={ExpenseActivityCard}
          emptyMessage="No recent expenses"
          gradientClass="from-purple-50 to-pink-50"
          iconBgClass="bg-purple-100"
          iconColorClass="text-purple-600"
        />
      </div>
    </div>
  );
};

export default Dashboard;
