import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Activity,
  BarChart3,
  Wallet,
  UserCheck,
  Clock,
} from "lucide-react";
import { dashboardAPI } from "../../services/api";
import HeaderComponent from "../../components/ui/HeaderComponent";
import StatCard from "../../components/cards/StatCard";
import SectionCard from "../../components/cards/SectionCard";
import DataRow from "../../components/cards/DataRow";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case "stock":
          return Package;
        case "cash":
          return DollarSign;
        case "expense":
          return Wallet;
        default:
          return Activity;
      }
    };

    const Icon = getActivityIcon(activity.type);

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {activity.type === "stock"
              ? activity.productName
              : activity.description}
          </p>
          <p className="text-xs text-gray-500">
            {activity.createdBy?.username} •{" "}
            {new Date(activity.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            ₹{activity.amount?.toLocaleString()}
          </p>
          {activity.type === "stock" && (
            <p className="text-xs text-gray-500">
              {activity.quantity} {activity.unit}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Dashboard"
          subheader="Factory CRM Overview & Analytics"
          onRefresh={fetchDashboardData}
          loading={loading}
        />

        {/* Loading StatCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>

        {/* Loading SectionCards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <SectionCard key={i} loading={true} />
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
      {/* Header Component */}
      <HeaderComponent
        header="Dashboard"
        subheader="Factory CRM Overview & Analytics"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Cash In"
          value={`₹${dashboardData?.cash?.todayIn?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Today's Cash Out"
          value={`₹${dashboardData?.cash?.todayOut?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Present Today"
          value={`${dashboardData?.employees?.presentToday || 0}/${
            dashboardData?.employees?.total || 0
          }`}
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Total Clients"
          value={dashboardData?.clients?.total || 0}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Overview */}
        <SectionCard title="Stock Overview" icon={Package} headerColor="blue">
          <div className="space-y-4">
            <DataRow
              label="Today's Stock In"
              value={`${dashboardData?.stock?.todayQuantityIn || 0} kg`}
            />
            <DataRow
              label="Today's Stock Out"
              value={`${dashboardData?.stock?.todayQuantityOut || 0} kg`}
            />
            <DataRow
              label="Total Products"
              value={dashboardData?.stock?.totalProducts || 0}
            />
            <DataRow
              label="Low Stock Alert"
              value={dashboardData?.stock?.lowStockProducts || 0}
              valueColor="text-red-600"
              labelColor="text-red-600"
            />
          </div>
        </SectionCard>

        {/* Cash Flow */}
        <SectionCard title="Cash Flow" icon={DollarSign} headerColor="green">
          <div className="space-y-4">
            <DataRow
              label="Monthly Cash In"
              value={`₹${
                dashboardData?.cash?.monthlyFlow?.IN?.toLocaleString() || 0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Monthly Cash Out"
              value={`₹${
                dashboardData?.cash?.monthlyFlow?.OUT?.toLocaleString() || 0
              }`}
              valueColor="text-red-600"
            />
            <DataRow
              label="Net Cash Flow"
              value={`₹${(
                (dashboardData?.cash?.monthlyFlow?.IN || 0) -
                (dashboardData?.cash?.monthlyFlow?.OUT || 0)
              ).toLocaleString()}`}
              valueColor={
                (dashboardData?.cash?.monthlyFlow?.IN || 0) -
                  (dashboardData?.cash?.monthlyFlow?.OUT || 0) >=
                0
                  ? "text-green-600"
                  : "text-red-600"
              }
              bold={true}
              className="pt-2 border-t"
            />
          </div>
        </SectionCard>

        {/* Expenses */}
        <SectionCard title="Expenses" icon={BarChart3} headerColor="purple">
          <div className="space-y-4">
            <DataRow
              label="Today's Expenses"
              value={`₹${
                dashboardData?.expenses?.todayTotal?.toLocaleString() || 0
              }`}
            />
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-900">
                Top Categories
              </span>
              {dashboardData?.expenses?.monthlyByCategory
                ?.slice(0, 3)
                .map((category, index) => (
                  <DataRow
                    key={index}
                    label={category._id}
                    value={`₹${category.total?.toLocaleString()}`}
                    labelColor="text-gray-600"
                    className="text-xs"
                  />
                ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Recent Activities */}
      <SectionCard title="Recent Activities" icon={Clock} headerColor="orange">
        <div className="space-y-1">
          {dashboardData?.recentActivities?.stock
            ?.slice(0, 5)
            .map((activity, index) => (
              <ActivityItem key={`stock-${index}`} activity={activity} />
            ))}
          {dashboardData?.recentActivities?.cashFlow
            ?.slice(0, 3)
            .map((activity, index) => (
              <ActivityItem key={`cash-${index}`} activity={activity} />
            ))}
          {!dashboardData?.recentActivities?.stock?.length &&
            !dashboardData?.recentActivities?.cashFlow?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent activities
              </p>
            )}
        </div>
      </SectionCard>
    </div>
  );
};

export default Dashboard;
