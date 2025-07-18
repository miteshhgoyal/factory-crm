import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  MapPin,
  MoreVertical,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const ClientList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState(
    searchParams.get("filter") || ""
  );
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchClients();
  }, [searchTerm, typeFilter, balanceFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: typeFilter,
        page: 1,
        limit: 20,
      };

      const response = await clientAPI.getClients(params);
      let clientsData = Array.isArray(response.data?.clients)
        ? response.data.clients
        : [];

      // Apply balance filter on frontend
      if (balanceFilter === "debtors") {
        clientsData = clientsData.filter((client) => client.currentBalance > 0);
      } else if (balanceFilter === "creditors") {
        clientsData = clientsData.filter((client) => client.currentBalance < 0);
      }

      setClients(clientsData);
      setPagination(response.data?.pagination || {});
      setError(null);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setError("Failed to fetch clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await clientAPI.deleteClient(clientId);
        fetchClients();
      } catch (error) {
        console.error("Failed to delete client:", error);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setBalanceFilter("");
  };

  const getClientStats = () => {
    const totalClients = clients.length;
    const customers = clients.filter(
      (client) => client.type === "Customer"
    ).length;
    const suppliers = clients.filter(
      (client) => client.type === "Supplier"
    ).length;
    const debtors = clients.filter(
      (client) => client.currentBalance > 0
    ).length;

    return { totalClients, customers, suppliers, debtors };
  };

  const stats = getClientStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Client List"
          subheader="Manage your clients and their information"
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
      <div className="space-y-6">
        <HeaderComponent
          header="Client List"
          subheader="Manage your clients and their information"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchClients}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Client List"
        subheader="Manage your customers and suppliers"
        onRefresh={fetchClients}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Client Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Client List</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/clients/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/clients/add")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="blue"
          change="All clients"
        />
        <StatCard
          title="Customers"
          value={stats.customers}
          icon={UserCheck}
          color="green"
          change="Buy from you"
        />
        <StatCard
          title="Suppliers"
          value={stats.suppliers}
          icon={UserX}
          color="purple"
          change="Sell to you"
        />
        <StatCard
          title="Debtors"
          value={stats.debtors}
          icon={Users}
          color="orange"
          change="Owe you money"
        />
      </div>

      {/* Client List */}
      <SectionCard title="Client Directory" icon={Users} headerColor="blue">
        {/* Search and Filters */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Search Clients
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Client Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="Customer">Customer</option>
                <option value="Supplier">Supplier</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Balance Filter
              </label>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Balances</option>
                <option value="debtors">Debtors (Positive)</option>
                <option value="creditors">Creditors (Negative)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client._id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      client.type === "Customer"
                        ? "bg-gradient-to-br from-blue-100 to-blue-200"
                        : "bg-gradient-to-br from-green-100 to-green-200"
                    }`}
                  >
                    {client.type === "Customer" ? (
                      <UserCheck
                        className={`w-6 h-6 ${
                          client.type === "Customer"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      />
                    ) : (
                      <Users className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-600">{client.type}</p>
                  </div>
                </div>

                <div className="relative group">
                  <button className="p-1 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="p-1">
                      <button
                        onClick={() => navigate(`/admin/clients/${client._id}`)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/clients/${client._id}/ledger`)
                        }
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Ledger
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/admin/clients/edit/${client._id}`)
                        }
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Client
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client._id)}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>

                {client.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Current Balance:
                  </span>
                  <span
                    className={`font-bold ${
                      client.currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{Math.abs(client.currentBalance).toLocaleString()}
                    {client.currentBalance < 0 && " (CR)"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    navigate(`/admin/clients/${client._id}/ledger`)
                  }
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Ledger
                </button>
                <button
                  onClick={() => navigate(`/admin/clients/${client._id}`)}
                  className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter || balanceFilter
                ? "Try adjusting your search filters."
                : "Get started by adding your first client."}
            </p>
            {!searchTerm && !typeFilter && !balanceFilter && (
              <button
                onClick={() => navigate("/admin/clients/add")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Client
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ClientList;
