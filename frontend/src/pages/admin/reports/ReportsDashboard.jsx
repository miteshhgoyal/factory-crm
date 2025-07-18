import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  Eye,
  Download,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const ReportsDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Reports dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Reports Dashboard"
          subheader="Comprehensive business analytics and insights"
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
          <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
        header="Reports Dashboard"
        subheader="Comprehensive business analytics and performance insights"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/reports/daily"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Calendar className="w-4 h-4" />
          Daily Report
        </Link>
        <Link
          to="/admin/reports/weekly"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          Weekly Report
        </Link>
        <Link
          to="/admin/reports/monthly"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <TrendingUp className="w-4 h-4" />
          Monthly Report
        </Link>
        <Link
          to="/admin/reports/yearly"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          Yearly Report
        </Link>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Income"
          value={`₹${
            dashboardData?.cashFlow?.today?.IN?.amount?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="green"
          change={`${
            dashboardData?.cashFlow?.today?.IN?.count || 0
          } transactions`}
        />
        <StatCard
          title="Today's Expenses"
          value={`₹${
            (
              dashboardData?.cashFlow?.today?.OUT?.amount +
              dashboardData?.expenses?.today?.totalAmount
            )?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change={`${
            (dashboardData?.cashFlow?.today?.OUT?.count || 0) +
            (dashboardData?.expenses?.today?.count || 0)
          } transactions`}
        />
        <StatCard
          title="Today's Attendance"
          value={`${dashboardData?.attendance?.today?.presentCount || 0}/${
            dashboardData?.attendance?.today?.totalMarked || 0
          }`}
          icon={Users}
          color="blue"
          change={`${
            dashboardData?.attendance?.today?.totalHours || 0
          }h worked`}
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${
            dashboardData?.cashFlow?.today?.netFlow?.toLocaleString() || 0
          }`}
          icon={DollarSign}
          color={dashboardData?.cashFlow?.today?.netFlow >= 0 ? "green" : "red"}
          change="Today's net position"
        />
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Income"
          value={`₹${
            dashboardData?.cashFlow?.monthly?.IN?.amount?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="green"
          change="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${
            (
              dashboardData?.cashFlow?.monthly?.OUT?.amount +
              dashboardData?.expenses?.monthly?.totalAmount
            )?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change="This month"
        />
        <StatCard
          title="Stock Value"
          value={`₹${
            dashboardData?.stock?.totalStockValue?.toLocaleString() || 0
          }`}
          icon={Package}
          color="purple"
          change={`${dashboardData?.stock?.totalProducts || 0} products`}
        />
        <StatCard
          title="Total Employees"
          value={dashboardData?.employees?.totalEmployees || 0}
          icon={Users}
          color="blue"
          change="Active employees"
        />
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Summary */}
        <SectionCard
          title="Cash Flow Summary"
          icon={DollarSign}
          headerColor="green"
        >
          <div className="space-y-4">
            <DataRow
              label="Today's Net Flow"
              value={`₹${
                dashboardData?.cashFlow?.today?.netFlow?.toLocaleString() || 0
              }`}
              valueColor={
                dashboardData?.cashFlow?.today?.netFlow >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
              bold={true}
            />
            <DataRow
              label="Monthly Net Flow"
              value={`₹${
                dashboardData?.cashFlow?.monthly?.netFlow?.toLocaleString() || 0
              }`}
              valueColor={
                dashboardData?.cashFlow?.monthly?.netFlow >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
              bold={true}
            />
            <DataRow
              label="Monthly Income"
              value={`₹${
                dashboardData?.cashFlow?.monthly?.IN?.amount?.toLocaleString() ||
                0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Monthly Outflow"
              value={`₹${
                dashboardData?.cashFlow?.monthly?.OUT?.amount?.toLocaleString() ||
                0
              }`}
              valueColor="text-red-600"
            />
          </div>
        </SectionCard>

        {/* Business Health */}
        <SectionCard
          title="Business Health"
          icon={BarChart3}
          headerColor="blue"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Stock Value"
              value={`₹${
                dashboardData?.stock?.totalStockValue?.toLocaleString() || 0
              }`}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Low Stock Items"
              value={dashboardData?.stock?.lowStockItems || 0}
              valueColor="text-orange-600"
            />
            <DataRow
              label="Client Receivables"
              value={`₹${Math.max(
                0,
                dashboardData?.clients?.Customer?.balance || 0
              ).toLocaleString()}`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Supplier Payables"
              value={`₹${Math.abs(
                Math.min(0, dashboardData?.clients?.Supplier?.balance || 0)
              ).toLocaleString()}`}
              valueColor="text-red-600"
            />
          </div>
        </SectionCard>

        {/* Quick Insights */}
        <SectionCard title="Quick Insights" icon={Eye} headerColor="orange">
          <div className="space-y-4">
            <DataRow
              label="Attendance Rate (Monthly)"
              value={`${Math.round(
                ((dashboardData?.attendance?.monthly?.presentCount || 0) /
                  (dashboardData?.attendance?.monthly?.totalMarked || 1)) *
                  100
              )}%`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Avg Working Hours"
              value={`${Math.round(
                dashboardData?.attendance?.monthly?.totalHours /
                  dashboardData?.attendance?.monthly?.totalMarked || 0
              )}h`}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Total Customers"
              value={dashboardData?.clients?.Customer?.count || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Suppliers"
              value={dashboardData?.clients?.Supplier?.count || 0}
              valueColor="text-blue-600"
            />
          </div>
        </SectionCard>
      </div>

      {/* Alerts & Notifications */}
      <SectionCard
        title="Business Alerts"
        icon={AlertTriangle}
        headerColor="red"
      >
        <div className="space-y-3">
          {dashboardData?.stock?.lowStockItems > 0 && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Low Stock Alert</p>
                <p className="text-sm text-orange-700">
                  {dashboardData.stock.lowStockItems} products are running low
                  on stock
                </p>
              </div>
              <Link
                to="/admin/stock/dashboard"
                className="ml-auto px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
              >
                View Stock
              </Link>
            </div>
          )}

          {dashboardData?.cashFlow?.today?.netFlow < 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Negative Cash Flow</p>
                <p className="text-sm text-red-700">
                  Today's expenses exceed income by ₹
                  {Math.abs(
                    dashboardData.cashFlow.today.netFlow
                  ).toLocaleString()}
                </p>
              </div>
              <Link
                to="/admin/cash/dashboard"
                className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                View Cash Flow
              </Link>
            </div>
          )}

          {(!dashboardData?.stock?.lowStockItems ||
            dashboardData?.stock?.lowStockItems === 0) &&
            (!dashboardData?.cashFlow?.today?.netFlow ||
              dashboardData?.cashFlow?.today?.netFlow >= 0) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    All Systems Running Smoothly
                  </p>
                  <p className="text-sm text-green-700">
                    No critical alerts at this time. Business is operating
                    normally.
                  </p>
                </div>
              </div>
            )}
        </div>
      </SectionCard>
    </div>
  );
};

export default ReportsDashboard;
