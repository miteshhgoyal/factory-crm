import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  UserCheck,
  UserX,
  BarChart3,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";
import { formatDate } from "../../../utils/dateUtils";

const ClientDashboard = () => {
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
      const response = await clientAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Client dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Client Management"
          subheader="Manage customers and suppliers"
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
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
        header="Client Management"
        subheader="Manage customers and suppliers with their accounts"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/clients/add"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
        <Link
          to="/admin/clients/list"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Users className="w-4 h-4" />
          Client List
        </Link>
        <Link
          to="/admin/clients/ledger"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          Client Ledger
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={dashboardData?.clientStats?.Customer?.count || 0}
          icon={UserCheck}
          color="blue"
          change="Active customers"
        />
        <StatCard
          title="Total Suppliers"
          value={dashboardData?.clientStats?.Supplier?.count || 0}
          icon={Users}
          color="green"
          change="Active suppliers"
        />
        <StatCard
          title="Total Receivables"
          value={`₹${
            dashboardData?.balanceStats?.totalReceivables?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="orange"
          change="Money to receive"
        />
        <StatCard
          title="Total Payables"
          value={`₹${
            dashboardData?.balanceStats?.totalPayables?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change="Money to pay"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Summary */}
        <SectionCard title="Client Summary" icon={Users} headerColor="blue">
          <div className="space-y-4">
            <DataRow
              label="Total Clients"
              value={dashboardData?.balanceStats?.totalClients || 0}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Customers"
              value={dashboardData?.clientStats?.Customer?.count || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Suppliers"
              value={dashboardData?.clientStats?.Supplier?.count || 0}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Positive Balances"
              value={dashboardData?.balanceStats?.positiveBalances || 0}
              valueColor="text-orange-600"
            />
            <DataRow
              label="Negative Balances"
              value={dashboardData?.balanceStats?.negativeBalances || 0}
              valueColor="text-red-600"
            />
          </div>
        </SectionCard>

        {/* Top Debtors */}
        <SectionCard
          title="Top Debtors"
          icon={TrendingUp}
          headerColor="orange"
          actions={
            <Link
              to="/admin/clients/list?filter=debtors"
              className="text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-3">
            {dashboardData?.topDebtors?.slice(0, 5).map((client, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-orange-600">
                    ₹{client.currentBalance?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!dashboardData?.topDebtors?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No debtors found
              </p>
            )}
          </div>
        </SectionCard>

        {/* Top Creditors */}
        <SectionCard
          title="Top Creditors"
          icon={TrendingDown}
          headerColor="red"
          actions={
            <Link
              to="/admin/clients/list?filter=creditors"
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              View All
            </Link>
          }
        >
          <div className="space-y-3">
            {dashboardData?.topCreditors?.slice(0, 5).map((client, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">
                    ₹{Math.abs(client.currentBalance)?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!dashboardData?.topCreditors?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No creditors found
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Clients */}
      <SectionCard
        title="Recently Added Clients"
        icon={Users}
        headerColor="gray"
        actions={
          <Link
            to="/admin/clients/list"
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </Link>
        }
      >
        <div className="space-y-3">
          {dashboardData?.recentClients?.map((client, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    client.type === "Customer"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {client.type === "Customer" ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    {client.type} • {client.phone}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    client.currentBalance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ₹{Math.abs(client.currentBalance)?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(client.createdAt)}
                </p>
              </div>
            </div>
          ))}
          {!dashboardData?.recentClients?.length && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent clients
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default ClientDashboard;
