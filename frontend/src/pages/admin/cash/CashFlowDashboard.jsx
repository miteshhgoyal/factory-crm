import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PlusCircle,
  MinusCircle,
  ArrowLeft,
  BarChart3,
  Eye,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cashFlowAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const CashFlowDashboard = () => {
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
      const response = await cashFlowAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Cash flow dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Cash Flow Management"
          subheader="Track cash inflows and outflows"
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
          <DollarSign className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
        header="Cash Flow Management"
        subheader="Monitor and manage cash inflows and outflows"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/cash/in"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add Cash In
        </Link>
        <Link
          to="/admin/cash/out"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <MinusCircle className="w-4 h-4" />
          Add Cash Out
        </Link>
        <button
          onClick={() => navigate("/admin/cash/report")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Cash In"
          value={`₹${dashboardData?.today?.IN?.amount?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          change={`${dashboardData?.today?.IN?.count || 0} transactions`}
        />
        <StatCard
          title="Today's Cash Out"
          value={`₹${dashboardData?.today?.OUT?.amount?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
          change={`${dashboardData?.today?.OUT?.count || 0} transactions`}
        />
        <StatCard
          title="Net Cash Flow (Today)"
          value={`₹${dashboardData?.today?.netCash?.toLocaleString() || 0}`}
          icon={DollarSign}
          color={dashboardData?.today?.netCash >= 0 ? "green" : "red"}
          change="Today's net position"
        />
        <StatCard
          title="Monthly Net Cash"
          value={`₹${dashboardData?.monthly?.netCash?.toLocaleString() || 0}`}
          icon={Wallet}
          color={dashboardData?.monthly?.netCash >= 0 ? "blue" : "orange"}
          change="This month's position"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Summary */}
        <SectionCard
          title="Monthly Summary"
          icon={BarChart3}
          headerColor="blue"
        >
          <div className="space-y-4">
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
            <DataRow
              label="Net Cash Flow"
              value={`₹${
                dashboardData?.monthly?.netCash?.toLocaleString() || 0
              }`}
              valueColor={
                dashboardData?.monthly?.netCash >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
              bold={true}
              className="pt-2 border-t"
            />
            <DataRow
              label="Total Transactions"
              value={`${
                (dashboardData?.monthly?.IN?.count || 0) +
                (dashboardData?.monthly?.OUT?.count || 0)
              }`}
            />
          </div>
        </SectionCard>

        {/* Payment Mode Breakdown */}
        <SectionCard
          title="Payment Mode Breakdown"
          icon={CreditCard}
          headerColor="purple"
        >
          <div className="space-y-3">
            {dashboardData?.paymentModeBreakdown
              ?.slice(0, 5)
              .map((mode, index) => (
                <DataRow
                  key={index}
                  label={mode._id}
                  value={`₹${mode.totalAmount?.toLocaleString()}`}
                  valueColor="text-purple-600"
                />
              ))}
            {!dashboardData?.paymentModeBreakdown?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No payment mode data available
              </p>
            )}
          </div>
        </SectionCard>

        {/* Category Breakdown */}
        <SectionCard
          title="Category Breakdown"
          icon={Wallet}
          headerColor="orange"
        >
          <div className="space-y-3">
            {dashboardData?.categoryBreakdown
              ?.slice(0, 5)
              .map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {category._id.category}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {category._id.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        category._id.type === "IN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{category.totalAmount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.count} txns
                    </p>
                  </div>
                </div>
              ))}
            {!dashboardData?.categoryBreakdown?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No category data available
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Transactions */}
      <SectionCard
        title="Recent Transactions"
        icon={DollarSign}
        headerColor="gray"
        actions={
          <button
            onClick={() => navigate("/admin/cash/report")}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </button>
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
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.category} • {transaction.paymentMode}
                    {transaction.isOnline && (
                      <span className="ml-1 text-blue-600">(Online)</span>
                    )}
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
                  {new Date(transaction.date).toLocaleDateString()}
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

export default CashFlowDashboard;
