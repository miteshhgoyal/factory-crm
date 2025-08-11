import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Package,
  IndianRupee,
  AlertTriangle,
  Eye,
  Activity,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const ReportsDashboard = () => {
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
          subheader="Business analytics and insights"
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
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Reports Dashboard"
        subheader="Business analytics and performance insights"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/reports/daily"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Daily Report
        </Link>
        <Link
          to="/admin/reports/weekly"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Weekly Report
        </Link>
        <Link
          to="/admin/reports/monthly"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Monthly Report
        </Link>
        <Link
          to="/admin/reports/yearly"
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Activity className="w-4 h-4" />
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
          value={`₹${(
            (dashboardData?.cashFlow?.today?.OUT?.amount || 0) +
            (dashboardData?.expenses?.today?.totalAmount || 0)
          ).toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          change={`${
            (dashboardData?.cashFlow?.today?.OUT?.count || 0) +
            (dashboardData?.expenses?.today?.count || 0)
          } transactions`}
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${
            dashboardData?.cashFlow?.today?.netFlow?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color={dashboardData?.cashFlow?.today?.netFlow >= 0 ? "green" : "red"}
          change="Today's net position"
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardData?.attendance?.today?.attendanceRate || 0}%`}
          icon={Users}
          color="blue"
          change={`${dashboardData?.attendance?.today?.presentCount || 0}/${
            dashboardData?.attendance?.today?.totalMarked || 0
          } present`}
        />
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Income"
          value={`₹${
            dashboardData?.cashFlow?.monthly?.IN?.amount?.toLocaleString() || 0
          }`}
          icon={Wallet}
          color="green"
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
          value={dashboardData?.employees?.total || 0}
          icon={Users}
          color="blue"
          change="Active employees"
        />
        <StatCard
          title="Monthly Avg Hours"
          value={`${Math.round(
            dashboardData?.attendance?.monthly?.avgHours || 0
          )}h`}
          icon={Activity}
          color="orange"
          change="Per employee"
        />
      </div>

      {/* Main Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Summary */}
        <SectionCard
          title="Cash Flow Summary"
          icon={IndianRupee}
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
              label="Monthly Expenses"
              value={`₹${(
                (dashboardData?.cashFlow?.monthly?.OUT?.amount || 0) +
                (dashboardData?.expenses?.monthly?.totalAmount || 0)
              ).toLocaleString()}`}
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
              label="Stock Value"
              value={`₹${
                dashboardData?.stock?.totalStockValue?.toLocaleString() || 0
              }`}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Net Stock"
              value={`${
                dashboardData?.stock?.netStock?.toLocaleString() || 0
              } kg`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Client Receivables"
              value={`₹${
                dashboardData?.clients?.Customer?.receivables?.toLocaleString() ||
                0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Supplier Payables"
              value={`₹${
                dashboardData?.clients?.Supplier?.payables?.toLocaleString() ||
                0
              }`}
              valueColor="text-red-600"
            />
          </div>
        </SectionCard>

        {/* Quick Insights */}
        <SectionCard title="Quick Insights" icon={Eye} headerColor="orange">
          <div className="space-y-4">
            <DataRow
              label="Monthly Attendance"
              value={`${
                dashboardData?.attendance?.monthly?.attendanceRate || 0
              }%`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Total Customers"
              value={dashboardData?.clients?.Customer?.count || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Suppliers"
              value={dashboardData?.clients?.Supplier?.count || 0}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Salary Budget"
              value={`₹${
                dashboardData?.employees?.totalSalaryBudget?.toLocaleString() ||
                0
              }`}
              valueColor="text-orange-600"
            />
          </div>
        </SectionCard>
      </div>

      {/* Recent Transactions */}
      <SectionCard
        title="Today's Recent Transactions"
        icon={Activity}
        headerColor="purple"
      >
        <div className="space-y-3">
          {dashboardData?.cashFlow?.today?.transactions?.map(
            (transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      transaction.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "IN" ? "+" : "-"}₹
                    {transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.paymentMode}
                  </p>
                </div>
              </div>
            )
          )}
          {!dashboardData?.cashFlow?.today?.transactions?.length && (
            <p className="text-gray-500 text-center py-4">
              No transactions today
            </p>
          )}
        </div>
      </SectionCard>

      {/* Business Alerts */}
      <SectionCard
        title="Business Alerts"
        icon={AlertTriangle}
        headerColor="red"
      >
        <div className="space-y-3">
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
            </div>
          )}

          {dashboardData?.attendance?.today?.attendanceRate < 80 &&
            dashboardData?.attendance?.today?.totalMarked > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Low Attendance</p>
                  <p className="text-sm text-orange-700">
                    Today's attendance is{" "}
                    {dashboardData.attendance.today.attendanceRate}%
                  </p>
                </div>
              </div>
            )}

          {(!dashboardData?.cashFlow?.today?.netFlow ||
            dashboardData?.cashFlow?.today?.netFlow >= 0) &&
            (!dashboardData?.attendance?.today?.attendanceRate ||
              dashboardData?.attendance?.today?.attendanceRate >= 80) && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    All Systems Running Smoothly
                  </p>
                  <p className="text-sm text-green-700">
                    No critical alerts at this time.
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
