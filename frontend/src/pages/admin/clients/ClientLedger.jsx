// frontend/src/pages/admin/clients/ClientLedger.jsx
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowLeft,
  AlertCircle,
  Eye,
  Search,
  UserCheck,
  Phone,
  Edit,
  Trash2,
  X,
  Loader2,
  IndianRupee,
  Save,
  FilterX,
  Receipt,
  Tag,
  Info,
  Package,
  FileText,
  Activity,
  ShoppingCart,
  ShoppingBag,
  MapPin,
  Building,
  CreditCard,
  Hash,
  Weight,
  Calculator,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDate } from "../../../utils/dateUtils";

const ClientLedger = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(clientId || "");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    transactionType: "all",
    page: 1,
    limit: 20,
  });

  // Modal states
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Edit form states
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

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
      setSummary(response.data.data.summary || {});
      setPagination(response.data.data.pagination || {});
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
      transactionType: "all",
      page: 1,
      limit: 20,
    });
  };

  const handleClientSelect = (clientId) => {
    setSelectedClient(clientId);
    navigate(`/admin/clients/${clientId}/ledger`);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchTerm ||
      filters.transactionType !== "all" ||
      filters.startDate ||
      filters.endDate
    );
  };

  const handleEditEntry = async (entry) => {
    try {
      const response = await clientAPI.getLedgerEntryById(entry._id);
      const entryDetails = response.data.data;

      setSelectedEntry(entryDetails);

      // Set form data based on original unit
      const isOriginallyBags = entryDetails.originalUnit === "bag";

      if (isOriginallyBags) {
        setEditFormData({
          productName: entryDetails.productName || "",
          type: entryDetails.type || "IN",
          bagCount: entryDetails.bags?.count || "",
          bagWeight: entryDetails.bags?.weight || "",
          rate: entryDetails.rate || "",
          invoiceNo: entryDetails.invoiceNo || "",
          notes: entryDetails.notes || "",
          date: entryDetails.date
            ? new Date(entryDetails.date).toISOString().split("T")[0]
            : "",
          originalUnit: "bag",
        });
      } else {
        setEditFormData({
          productName: entryDetails.productName || "",
          type: entryDetails.type || "IN",
          quantity: entryDetails.quantity || "",
          rate: entryDetails.rate || "",
          invoiceNo: entryDetails.invoiceNo || "",
          notes: entryDetails.notes || "",
          date: entryDetails.date
            ? new Date(entryDetails.date).toISOString().split("T")[0]
            : "",
          originalUnit: "kg",
        });
      }

      setEditErrors({});
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.productName?.trim()) {
      errors.productName = "Product name is required";
    }

    if (editFormData.originalUnit === "bag") {
      if (!editFormData.bagCount || editFormData.bagCount <= 0) {
        errors.bagCount = "Valid bag count is required";
      }
      if (!editFormData.bagWeight || editFormData.bagWeight <= 0) {
        errors.bagWeight = "Valid bag weight is required";
      }
    } else {
      if (!editFormData.quantity || editFormData.quantity <= 0) {
        errors.quantity = "Valid quantity is required";
      }
    }

    if (!editFormData.rate || editFormData.rate <= 0) {
      errors.rate = "Valid rate is required";
    }

    if (!editFormData.date) {
      errors.date = "Date is required";
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setEditLoading(true);

      let updateData = {
        productName: editFormData.productName,
        type: editFormData.type,
        rate: editFormData.rate,
        invoiceNo: editFormData.invoiceNo,
        notes: editFormData.notes,
        date: editFormData.date,
      };

      if (editFormData.originalUnit === "bag") {
        updateData.bags = {
          count: parseInt(editFormData.bagCount),
          weight: parseFloat(editFormData.bagWeight),
        };
        updateData.quantity = updateData.bags.count * updateData.bags.weight;
      } else {
        updateData.quantity = parseFloat(editFormData.quantity);
      }

      await clientAPI.updateLedgerEntry(selectedEntry._id, updateData);

      setShowEditModal(false);
      setSelectedEntry(null);
      setEditFormData({});
      setEditErrors({});
      fetchLedgerData();
    } catch (error) {
      console.error("Failed to update entry:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update entry",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      setActionLoading(entryToDelete._id);
      await clientAPI.deleteLedgerEntry(entryToDelete._id);
      fetchLedgerData();
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirmation = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleViewDetails = async (entry) => {
    try {
      const response = await clientAPI.getLedgerEntryById(entry._id);
      setSelectedEntry(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  // Filter ledger entries based on search term
  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Calculate amount for display in edit form
  const calculateAmount = () => {
    if (editFormData.originalUnit === "bag") {
      if (
        editFormData.bagCount &&
        editFormData.bagWeight &&
        editFormData.rate
      ) {
        return (
          editFormData.bagCount * editFormData.bagWeight * editFormData.rate
        );
      }
    } else {
      if (editFormData.quantity && editFormData.rate) {
        return editFormData.quantity * editFormData.rate;
      }
    }
    return 0;
  };

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
                    {client.currentBalance < 0 && "-"}₹
                    {Math.abs(client.currentBalance || 0).toLocaleString()}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
        header={`Client Ledger - ${client.name}`}
        subheader={`${client.type} (${client.phone})`}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Purchases"
          value={`₹${summary?.totalCredit?.toLocaleString() || 0}`}
          icon={ShoppingCart}
          color="blue"
          change={`${summary?.purchaseCount || 0} transactions`}
        />
        <StatCard
          title="Total Sales"
          value={`₹${summary?.totalDebit?.toLocaleString() || 0}`}
          icon={ShoppingBag}
          color="green"
          change={`${summary?.saleCount || 0} transactions`}
        />
        <StatCard
          title="Current Balance"
          value={`₹${Math.abs(client.currentBalance || 0).toLocaleString()}`}
          icon={IndianRupee}
          color={client.currentBalance >= 0 ? "green" : "red"}
          change={client.currentBalance >= 0 ? "Receivable" : "Payable"}
        />
        <StatCard
          title="Total Weight"
          value={`${summary?.totalWeight?.toLocaleString() || 0} kg`}
          icon={Package}
          color="purple"
          change={`${summary?.totalBags || 0} bags`}
        />
        <StatCard
          title="Net Position"
          value={`₹${Math.abs(
            (summary?.totalDebit || 0) - (summary?.totalCredit || 0)
          ).toLocaleString()}`}
          icon={TrendingUp}
          color="indigo"
          change="Net balance"
        />
      </div>

      {/* Enhanced Filters */}
      <SectionCard>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 items-end justify-between">
            <div className="flex flex-wrap flex-col md:flex-row gap-3 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by product, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3">
                <select
                  name="transactionType"
                  value={filters.transactionType}
                  onChange={handleFilterChange}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="all">All Transactions</option>
                  <option value="in">Purchases (IN)</option>
                  <option value="out">Sales (OUT)</option>
                </select>

                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  placeholder="End date"
                />
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto">
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Filter Summary */}
          {hasActiveFilters() && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  Showing {filteredEntries.length} of {ledgerEntries.length}{" "}
                  entries
                </span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                    <Search className="h-3 w-3 mr-1" />"{searchTerm}"
                  </span>
                )}
                {filters.transactionType !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                    <Tag className="h-3 w-3 mr-1" />
                    {filters.transactionType.toUpperCase()}
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    From: {formatDate(filters.startDate)}
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-800 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    To: {formatDate(filters.endDate)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Ledger Table */}
      <SectionCard>
        {filteredEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Particulars
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Bags
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Weight (kg)
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Rate
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Debit
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Credit
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-900">
                    Balance
                  </th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-nowrap text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(entry.date)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-medium text-gray-900">
                          {entry.particulars}
                        </span>
                        {entry.invoiceNo && (
                          <div className="text-sm text-gray-500">
                            Invoice: {entry.invoiceNo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.transactionType === "IN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {entry.transactionType === "IN" ? "Purchase" : "Sale"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900">{entry.bags || "-"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900">
                        {entry.weight || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-900">
                        {entry.rate ? `₹${entry.rate}` : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-600 font-medium">
                        {entry.debitAmount
                          ? `₹${entry.debitAmount.toLocaleString()}`
                          : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-red-600 font-medium">
                        {entry.creditAmount
                          ? `₹${entry.creditAmount.toLocaleString()}`
                          : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`font-bold ${
                          entry.balance >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.balance < 0 && "-"}₹
                        {Math.abs(entry.balance).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {(user.role === "superadmin" ||
                          user.role === "admin") && (
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {user.role === "superadmin" && (
                          <button
                            onClick={() => showDeleteConfirmation(entry)}
                            disabled={actionLoading === entry._id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            {actionLoading === entry._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No ledger entries found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {hasActiveFilters()
                ? "Try adjusting your search filters to find what you're looking for."
                : "No transactions recorded for this client yet."}
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FilterX className="h-4 w-4 mr-2" />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* Enhanced Details Modal with Client Information */}
      {showDetailsModal && selectedEntry && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Transaction Details"
          subtitle="Complete transaction and client information"
          headerIcon={<Receipt />}
          headerColor="blue"
          size="md"
        >
          <div className="space-y-6">
            {/* Client Information Card */}
            {selectedEntry.client && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Client Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Account holder details and current status
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Client Name
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedEntry.client.name}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Client Type
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedEntry.client.type === "Customer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedEntry.client.type}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center text-lg text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedEntry.client.phone}
                    </div>
                  </div>

                  {selectedEntry.client.address && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Address
                      </label>
                      <div className="flex items-start text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        {selectedEntry.client.address}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Current Balance
                    </label>
                    <div
                      className={`text-lg font-bold ${
                        selectedEntry.client.currentBalance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedEntry.client.currentBalance < 0 && "-"}₹
                      {Math.abs(
                        selectedEntry.client.currentBalance || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Overview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedEntry.productName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Transaction ID: #
                      {selectedEntry._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-8 w-8 mr-1" />
                    {selectedEntry.amount.toLocaleString()}
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                      selectedEntry.type === "IN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedEntry.type === "IN" ? "Purchase" : "Sale"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Transaction Date
                    </label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedEntry.date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedEntry.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Weight className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Quantity
                    </label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedEntry.quantity} kg
                  </div>
                  {selectedEntry.originalUnit === "bag" &&
                    selectedEntry.bags && (
                      <div className="text-xs text-gray-500 mt-1">
                        ({selectedEntry.bags.count} bags ×{" "}
                        {selectedEntry.bags.weight} kg/bag)
                      </div>
                    )}
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <IndianRupee className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Rate
                    </label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{selectedEntry.rate}/kg
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {(selectedEntry.invoiceNo || selectedEntry.notes) && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Additional Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedEntry.invoiceNo && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Invoice Number
                      </label>
                      <div className="text-lg font-semibold text-gray-900 font-mono flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedEntry.invoiceNo}
                      </div>
                    </div>
                  )}

                  {selectedEntry.notes && (
                    <div
                      className={`bg-white rounded-lg p-4 border border-gray-200 ${
                        selectedEntry.invoiceNo
                          ? "md:col-span-1"
                          : "md:col-span-2"
                      }`}
                    >
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Notes
                      </label>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedEntry.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transaction Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Transaction Summary
                </h3>
              </div>

              <div className="bg-white rounded-lg p-6 border border-green-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.productName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Transaction Type:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.type === "IN" ? "Purchase" : "Sale"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.quantity} kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Rate:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{selectedEntry.rate}/kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                    <span className="font-semibold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="font-bold text-green-600 text-lg">
                      ₹{selectedEntry.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal with Unit-Specific Fields */}
      {showEditModal && selectedEntry && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Transaction"
          subtitle={`Update transaction information (Original unit: ${editFormData.originalUnit})`}
          headerIcon={<Edit />}
          headerColor="green"
          size="md"
        >
          <form onSubmit={handleUpdateEntry} className="space-y-6">
            {editErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">{editErrors.submit}</span>
              </div>
            )}

            {/* Unit Information Banner */}
            <div
              className={`border rounded-lg p-3 ${
                editFormData.originalUnit === "bag"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  This transaction was originally entered in{" "}
                  {editFormData.originalUnit}s.
                  {editFormData.originalUnit === "bag"
                    ? " You can edit bag count and weight."
                    : " You can edit the quantity in kg."}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editFormData.productName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      productName: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.productName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Enter product name"
                />
                {editErrors.productName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.productName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="IN">Purchase (IN)</option>
                  <option value="OUT">Sale (OUT)</option>
                </select>
              </div>

              {/* Conditional Quantity Fields based on Original Unit */}
              {editFormData.originalUnit === "bag" ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bag Count *
                    </label>
                    <input
                      type="number"
                      value={editFormData.bagCount}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          bagCount: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        editErrors.bagCount
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Number of bags"
                    />
                    {editErrors.bagCount && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editErrors.bagCount}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Weight per Bag (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.bagWeight}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          bagWeight: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        editErrors.bagWeight
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Weight per bag in kg"
                    />
                    {editErrors.bagWeight && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editErrors.bagWeight}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.quantity}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        quantity: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.quantity
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter quantity in kg"
                  />
                  {editErrors.quantity && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.quantity}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rate (₹/kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.rate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, rate: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.rate
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Enter rate per kg"
                />
                {editErrors.rate && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.rate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.date
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {editErrors.date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={editFormData.invoiceNo}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      invoiceNo: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter invoice number"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>

            {/* Calculated Amount Display */}
            {calculateAmount() > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Calculated Amount:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    ₹{calculateAmount().toLocaleString()}
                  </span>
                </div>
                {editFormData.originalUnit === "bag" &&
                  editFormData.bagCount &&
                  editFormData.bagWeight && (
                    <div className="text-xs text-gray-600 mt-1">
                      {editFormData.bagCount} bags × {editFormData.bagWeight}{" "}
                      kg/bag × ₹{editFormData.rate}/kg
                    </div>
                  )}
              </div>
            )}

            {/* Form Actions */}
            <div className="border-t pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && entryToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Transaction"
          subtitle="This action cannot be undone"
          headerIcon={<Trash2 />}
          headerColor="red"
          size="sm"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this transaction?
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-left">
                <div className="flex gap-2 flex-wrap justify-between">
                  <div className="font-semibold text-gray-900">
                    {entryToDelete.productName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(entryToDelete.date)}
                  </div>
                </div>
                <div className="text-sm mt-1 text-gray-600 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      entryToDelete.transactionType === "IN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {entryToDelete.transactionType === "IN"
                      ? "Purchase"
                      : "Sale"}
                  </span>
                  <span>
                    ₹
                    {(
                      entryToDelete.debitAmount || entryToDelete.creditAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              This will permanently remove the transaction record from the
              system and recalculate the client balance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setEntryToDelete(null);
              }}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEntry}
              disabled={actionLoading === entryToDelete._id}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
            >
              {actionLoading === entryToDelete._id ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientLedger;
