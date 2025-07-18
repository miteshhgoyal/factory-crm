import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  ArrowLeft,
  Eye,
  PieChart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const ExpenseDashboard = () => {
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
      const response = await expenseAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Expense dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Expense Management"
          subheader="Track and manage business expenses"
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
          <Receipt className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
        header="Expense Management"
        subheader="Monitor and control business expenses"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/expenses/add"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Link>
        <Link
          to="/admin/expenses/report"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports
        </Link>
        <button
          onClick={() => navigate("/admin/expenses/categories")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <PieChart className="w-4 h-4" />
          Categories
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Expenses"
          value={`₹${dashboardData?.today?.totalAmount?.toLocaleString() || 0}`}
          icon={Receipt}
          color="red"
          change={`${dashboardData?.today?.count || 0} transactions`}
        />
        <StatCard
          title="Monthly Expenses"
          value={`₹${
            dashboardData?.monthly?.totalAmount?.toLocaleString() || 0
          }`}
          icon={DollarSign}
          color="orange"
          change={`${dashboardData?.monthly?.count || 0} transactions`}
        />
        <StatCard
          title="Yearly Expenses"
          value={`₹${
            dashboardData?.yearly?.totalAmount?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="purple"
          change={`${dashboardData?.yearly?.count || 0} transactions`}
        />
        <StatCard
          title="Categories"
          value={dashboardData?.categoryBreakdown?.length || 0}
          icon={BarChart3}
          color="blue"
          change="Active categories"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <SectionCard
          title="Top Spending Categories"
          icon={PieChart}
          headerColor="purple"
          actions={
            <Link
              to="/admin/expenses/categories"
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-4">
            {dashboardData?.topCategories
              ?.slice(0, 5)
              .map((category, index) => (
                <DataRow
                  key={index}
                  label={category._id}
                  value={`₹${category.totalAmount?.toLocaleString()}`}
                  valueColor="text-purple-600"
                />
              ))}
            {!dashboardData?.topCategories?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No expense categories found
              </p>
            )}
          </div>
        </SectionCard>

        {/* Monthly Summary */}
        <SectionCard
          title="Monthly Breakdown"
          icon={Calendar}
          headerColor="blue"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Expenses"
              value={`₹${
                dashboardData?.monthly?.totalAmount?.toLocaleString() || 0
              }`}
              valueColor="text-red-600"
            />
            <DataRow
              label="Number of Transactions"
              value={dashboardData?.monthly?.count || 0}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Average Transaction"
              value={`₹${
                dashboardData?.monthly?.count > 0
                  ? Math.round(
                      dashboardData.monthly.totalAmount /
                        dashboardData.monthly.count
                    ).toLocaleString()
                  : 0
              }`}
              valueColor="text-orange-600"
            />
            <DataRow
              label="Categories Used"
              value={dashboardData?.categoryBreakdown?.length || 0}
              valueColor="text-purple-600"
            />
          </div>
        </SectionCard>

        {/* Expense Analysis */}
        <SectionCard
          title="Expense Analysis"
          icon={BarChart3}
          headerColor="green"
        >
          <div className="space-y-4">
            <DataRow
              label="Today vs Yesterday"
              value="Analysis coming soon"
              valueColor="text-gray-500"
            />
            <DataRow
              label="This Month vs Last Month"
              value="Analysis coming soon"
              valueColor="text-gray-500"
            />
            <DataRow
              label="Budget Status"
              value="Budget tracking coming soon"
              valueColor="text-gray-500"
            />
            <DataRow
              label="Expense Trend"
              value="Trend analysis coming soon"
              valueColor="text-gray-500"
            />
          </div>
        </SectionCard>
      </div>

      {/* Recent Expenses */}
      <SectionCard
        title="Recent Expenses"
        icon={Receipt}
        headerColor="gray"
        actions={
          <Link
            to="/admin/expenses/report"
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </Link>
        }
      >
        <div className="space-y-3">
          {dashboardData?.recentExpenses?.map((expense, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {expense.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {expense.category}
                    {expense.employeeName && ` • ${expense.employeeName}`}
                    {expense.billNo && ` • Bill: ${expense.billNo}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600">
                  ₹{expense.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {!dashboardData?.recentExpenses?.length && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent expenses
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default ExpenseDashboard;
