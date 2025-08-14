import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  ArrowLeft,
  AlertCircle,
  Eye,
  Search,
  UserCheck,
  Phone,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import DataRow from "../../../components/cards/DataRow";

const ClientLedger = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(clientId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchLedgerData();
    }
  }, [selectedClient, filters]);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 100 });
      setClients(response.data.data.clients);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    }
  };

  const fetchLedgerData = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      const response = await clientAPI.getClientLedger(selectedClient, filters);
      setClient(response.data.data.client);
      setLedgerEntries(
        Array.isArray(response.data.data.entries)
          ? response.data.data.entries
          : []
      );
      setSummary(response.data.summary || {});
      setPagination(response.data.pagination || {});
      setError(null);
    } catch (error) {
      console.error("Failed to fetch ledger data:", error);
      setError("Failed to fetch ledger data");
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    });
  };

  const handleClientSelect = (clientId) => {
    setSelectedClient(clientId);
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Client Ledger"
          subheader="View client account statements and transaction history"
          removeRefresh={true}
        />

        <SectionCard title="Select Client" icon={Users} headerColor="blue">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clients by name or phone..."
                className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client._id)}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      client.type === "Customer"
                        ? "bg-gradient-to-br from-blue-100 to-blue-200"
                        : "bg-gradient-to-br from-green-100 to-green-200"
                    }`}
                  >
                    {client.type === "Customer" ? (
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Users className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{client.phone}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          client.type === "Customer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {client.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold ${
                      client.currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{Math.abs(client.currentBalance).toLocaleString()}
                    {client.currentBalance < 0 && " (CR)"}
                  </div>
                  <div className="text-xs text-gray-500">Current Balance</div>
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm
                    ? "No clients found matching your search."
                    : "No clients available."}
                </p>
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => navigate("/admin/clients/dashboard")}
              className="w-full px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Dashboard
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Client Ledger"
          subheader={
            client ? `${client.name} - Account Statement` : "Loading..."
          }
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
          header="Client Ledger"
          subheader="Account statement and transaction history"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchLedgerData}
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
        header="Client Ledger"
        subheader={`${client?.name} - Account Statement & Transaction History`}
        onRefresh={fetchLedgerData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BarChart3 className="w-4 h-4" />
          <span>Client Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Client Ledger</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedClient("")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Client
          </button>
          <button
            onClick={() => navigate("/admin/clients/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Client Info & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SectionCard
            title="Client Information"
            icon={Users}
            headerColor="blue"
          >
            <div className="space-y-3">
              <DataRow label="Name" value={client?.name || "N/A"} />
              <DataRow label="Type" value={client?.type || "N/A"} />
              <DataRow label="Phone" value={client?.phone || "N/A"} />
              <DataRow
                label="Current Balance"
                value={`₹${Math.abs(
                  client?.currentBalance || 0
                ).toLocaleString()}`}
                valueColor={
                  client?.currentBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                bold={true}
                className="pt-2 border-t"
              />
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Debit"
              value={`₹${summary?.totalDebit?.toLocaleString() || 0}`}
              icon={TrendingUp}
              color="green"
              change="Money received"
            />
            <StatCard
              title="Total Credit"
              value={`₹${summary?.totalCredit?.toLocaleString() || 0}`}
              icon={TrendingDown}
              color="red"
              change="Money paid"
            />
            <StatCard
              title="Total Weight"
              value={`${summary?.totalWeight?.toLocaleString() || 0} kg`}
              icon={BarChart3}
              color="blue"
              change={`${summary?.totalBags || 0} bags`}
            />
          </div>
        </div>
      </div>

      {/* Filters & Ledger */}
      <SectionCard
        title="Transaction History"
        icon={BarChart3}
        headerColor="purple"
      >
        {/* Filters */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Selected Client
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{client?.name}</span>
                <span
                  className={`ml-auto px-2 py-0.5 rounded text-xs ${
                    client?.type === "Customer"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {client?.type}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Particulars
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Bags
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Weight (kg)
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Rate
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Debit
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Credit
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{entry.particulars}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{entry.bags || "-"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{entry.weight || "-"}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {entry.rate ? `₹${entry.rate}` : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-green-600 font-medium">
                      {entry.debitAmount
                        ? `₹${entry.debitAmount.toLocaleString()}`
                        : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-red-600 font-medium">
                      {entry.creditAmount
                        ? `₹${entry.creditAmount.toLocaleString()}`
                        : "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        entry.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{Math.abs(entry.balance).toLocaleString()}
                      {entry.balance < 0 && " (CR)"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ledgerEntries.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No ledger entries found
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.startDate || filters.endDate
                  ? "Try adjusting your date filters."
                  : "No transactions recorded for this client yet."}
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default ClientLedger;
