import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
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
  CreditCard,
  Hash,
  Weight,
  Calculator,
  Download,
  FileSpreadsheet,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDate } from "../../../utils/dateUtils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Sub-components
const ClientSelector = ({
  clients,
  selectedClient,
  onClientSelect,
  searchTerm,
  onSearchChange,
  onBack,
}) => {
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const [balanceFilter, setBalanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedAndFilteredClients = filteredClients
    .filter((client) => {
      if (balanceFilter === "positive") return client.currentBalance > 0;
      if (balanceFilter === "negative") return client.currentBalance < 0;
      if (balanceFilter === "zero") return client.currentBalance === 0;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "balance") {
        comparison = a.currentBalance - b.currentBalance;
      } else if (sortBy === "type") {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Client Ledger"
        subheader="Select a client to view their account statement and transaction history"
        removeRefresh={true}
      />

      <SectionCard title="Select Client" icon={Users} headerColor="blue">
        {/* Enhanced Filters */}
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search clients by name or phone..."
                className="input-primary pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">All Balances</option>
              <option value="positive">Positive Balance</option>
              <option value="negative">Negative Balance</option>
              <option value="zero">Zero Balance</option>
            </select>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-primary flex-1"
              >
                <option value="name">Sort by Name</option>
                <option value="balance">Sort by Balance</option>
                <option value="type">Sort by Type</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="btn-secondary btn-sm"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || balanceFilter !== "all") && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  Showing {sortedAndFilteredClients.length} of {clients.length}{" "}
                  clients
                </span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                    <Search className="h-3 w-3 mr-1" />"{searchTerm}"
                  </span>
                )}
                {balanceFilter !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                    <Tag className="h-3 w-3 mr-1" />
                    {balanceFilter.charAt(0).toUpperCase() +
                      balanceFilter.slice(1)}{" "}
                    Balance
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Client Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {sortedAndFilteredClients.map((client) => (
            <div
              key={client._id}
              onClick={() => onClientSelect(client._id)}
              className="flex flex-col p-4 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
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
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {client.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.type === "Customer"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {client.type}
                </span>
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
                  <div className="text-xs text-gray-500">Balance</div>
                </div>
              </div>
            </div>
          ))}

          {sortedAndFilteredClients.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm || balanceFilter !== "all"
                  ? "No clients found matching your criteria."
                  : "No clients available."}
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

const LedgerTable = ({
  entries,
  user,
  onViewDetails,
  onEditEntry,
  onDeleteEntry,
  actionLoading,
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No ledger entries found
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          No transactions recorded for this client yet.
        </p>
      </div>
    );
  }

  return (
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
              Bags
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-900">
              Weight (kg)
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-900">
              Rate
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-900">
              Debit (Outgoing)
            </th>
            <th className="text-left py-4 px-4 font-semibold text-gray-900">
              Credit (Incoming)
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
          {entries.map((entry, index) => (
            <tr
              key={`${entry._id}-${index}`}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="py-4 px-4">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center text-sm text-nowrap text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(entry.date)}
                  </div>
                  <span
                    className={`inline-flex text-nowrap items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      entry.transactionCategory === "stock"
                        ? entry.transactionType === "IN"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                        : entry.transactionType === "IN"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {entry.transactionCategory === "stock" ? (
                      <Package className="w-3 h-3" />
                    ) : (
                      <CreditCard className="w-3 h-3" />
                    )}
                    {entry.transactionType === "IN"
                      ? entry.transactionCategory === "stock"
                        ? "Purchase"
                        : "Cash In"
                      : entry.transactionCategory === "stock"
                      ? "Sale"
                      : "Paid"}
                  </span>
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
                  {entry.transactionCategory === "cash" && entry.category && (
                    <div className="text-sm text-gray-500">
                      Category: {entry.category}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-gray-900">
                  {entry.transactionCategory === "stock"
                    ? entry.bags || "-"
                    : "N/A"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-gray-900">
                  {entry.transactionCategory === "stock"
                    ? entry.weight || "-"
                    : "N/A"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-gray-900">
                  {entry.transactionCategory === "stock"
                    ? entry.rate
                      ? `₹${entry.rate}`
                      : "-"
                    : "N/A"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-red-600 font-medium">
                  {entry.debitAmount
                    ? `₹${entry.debitAmount.toLocaleString()}`
                    : "-"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-green-600 font-medium">
                  {entry.creditAmount
                    ? `₹${entry.creditAmount.toLocaleString()}`
                    : "-"}
                </span>
              </td>
              <td className="py-4 px-4">
                <span
                  className={`font-bold text-nowrap ${
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
                    onClick={() => onViewDetails(entry)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {user.role === "superadmin" && (
                    <>
                      <button
                        onClick={() => onEditEntry(entry)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title={`Edit ${
                          entry.transactionCategory === "stock"
                            ? "Stock"
                            : "Cash Flow"
                        } Transaction`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEntry(entry)}
                        disabled={actionLoading === entry._id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title={`Delete ${
                          entry.transactionCategory === "stock"
                            ? "Stock"
                            : "Cash Flow"
                        } Transaction`}
                      >
                        {actionLoading === entry._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Main Component
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

  const [editCashFlowModal, setEditCashFlowModal] = useState({
    open: false,
    entry: null,
  });
  const [editCashFlowFormData, setEditCashFlowFormData] = useState({});
  const [editCashFlowErrors, setEditCashFlowErrors] = useState({});
  const [editCashFlowLoading, setEditCashFlowLoading] = useState(false);

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

      setError(null);
    } catch (error) {
      console.error("Failed to fetch ledger data:", error);
      setError("Failed to fetch ledger data");
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Export Functions
  const exportToExcel = () => {
    try {
      const exportData = filteredEntries.map((entry, index) => ({
        "S.No": index + 1,
        Date: formatDate(entry.date),
        Category: entry.transactionCategory === "stock" ? "Stock" : "Cash Flow",
        Particulars: entry.particulars,
        Type:
          entry.transactionType === "IN"
            ? entry.transactionCategory === "stock"
              ? "Purchase"
              : "Cash In"
            : entry.transactionCategory === "stock"
            ? "Sale"
            : "Cash Out",
        Bags: entry.transactionCategory === "stock" ? entry.bags || 0 : "N/A",
        "Weight (kg)":
          entry.transactionCategory === "stock" ? entry.weight || 0 : "N/A",
        Rate:
          entry.transactionCategory === "stock"
            ? entry.rate
              ? `₹${entry.rate}`
              : "N/A"
            : "N/A",
        "Debit Amount": entry.debitAmount ? `₹${entry.debitAmount}` : "₹0",
        "Credit Amount": entry.creditAmount ? `₹${entry.creditAmount}` : "₹0",
        Balance: `₹${entry.balance}`,
        "Invoice No": entry.invoiceNo || "",
        "Payment Mode": entry.paymentMode || "",
        Notes: entry.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${client.name} - Ledger`);

      // Auto-width columns
      const colWidths = Object.keys(exportData[0] || {}).map(() => ({
        wch: 15,
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `${client.name}_Ledger_${new Date().toISOString().split("T")}.xlsx`
      );
    } catch (error) {
      console.error("Export to Excel failed:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      transactionType: "all",
      page: 1,
      limit: 20,
    });
    setSearchTerm("");
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
    if (entry.transactionCategory === "stock") {
      try {
        const response = await clientAPI.getLedgerEntryById(entry._id);
        const entryDetails = response.data.data;

        setSelectedEntry(entryDetails);

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
    } else if (entry.transactionCategory === "cash") {
      try {
        const response = await clientAPI.getCashFlowEntryById(entry._id);
        const entryDetails = response.data.data;

        setSelectedEntry(entryDetails);
        setEditCashFlowFormData({
          amount: entryDetails.amount || "",
          category: entryDetails.category || "",
          description: entryDetails.description || "",
          paymentMode: entryDetails.paymentMode || "",
          transactionId: entryDetails.transactionId || "",
          notes: entryDetails.notes || "",
          date: entryDetails.date
            ? new Date(entryDetails.date).toISOString().split("T")[0]
            : "",
        });

        setEditCashFlowErrors({});
        setEditCashFlowModal({ open: true, entry: entryDetails });
      } catch (error) {
        console.error("Failed to fetch cash flow entry details:", error);
      }
    }
  };

  const validateEditCashFlowForm = () => {
    const errors = {};

    if (!editCashFlowFormData.amount || editCashFlowFormData.amount <= 0) {
      errors.amount = "Valid amount is required";
    }

    if (!editCashFlowFormData.category?.trim()) {
      errors.category = "Category is required";
    }

    if (!editCashFlowFormData.description?.trim()) {
      errors.description = "Description is required";
    }

    if (!editCashFlowFormData.paymentMode) {
      errors.paymentMode = "Payment mode is required";
    }

    if (!editCashFlowFormData.date) {
      errors.date = "Date is required";
    }

    setEditCashFlowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCashFlowEntry = async (e) => {
    e.preventDefault();
    if (!validateEditCashFlowForm()) return;

    try {
      setEditCashFlowLoading(true);

      const updateData = {
        amount: Math.round(editCashFlowFormData.amount),
        category: editCashFlowFormData.category,
        description: editCashFlowFormData.description,
        paymentMode: editCashFlowFormData.paymentMode,
        transactionId: editCashFlowFormData.transactionId,
        notes: editCashFlowFormData.notes,
        date: editCashFlowFormData.date,
      };

      await clientAPI.updateCashFlowEntry(selectedEntry._id, updateData);

      // Refetch all data to maintain consistency
      await fetchLedgerData();

      setEditCashFlowModal({ open: false, entry: null });
      setSelectedEntry(null);
      setEditCashFlowFormData({});
      setEditCashFlowErrors({});
    } catch (error) {
      console.error("Failed to update cash flow entry:", error);
      setEditCashFlowErrors({
        submit:
          error.response?.data?.message || "Failed to update cash flow entry",
      });
    } finally {
      setEditCashFlowLoading(false);
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
          count: Math.round(editFormData.bagCount),
          weight: Math.round(editFormData.bagWeight),
        };
        updateData.quantity = updateData.bags.count * updateData.bags.weight;
      } else {
        updateData.quantity = Math.round(editFormData.quantity);
      }

      await clientAPI.updateLedgerEntry(selectedEntry._id, updateData);

      // Refetch all data to maintain consistency
      await fetchLedgerData();

      setShowEditModal(false);
      setSelectedEntry(null);
      setEditFormData({});
      setEditErrors({});
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

      if (entryToDelete.transactionCategory === "stock") {
        await clientAPI.deleteLedgerEntry(entryToDelete._id);
      } else if (entryToDelete.transactionCategory === "cash") {
        await clientAPI.deleteCashFlowEntry(entryToDelete._id);
      }

      await fetchLedgerData();
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirmation = (entry) => {
    if (user.role === "superadmin") {
      setEntryToDelete(entry);
      setShowDeleteModal(true);
    }
  };

  const handleViewDetails = async (entry) => {
    try {
      if (entry.transactionCategory === "stock") {
        const response = await clientAPI.getLedgerEntryById(entry._id);
        setSelectedEntry(response.data.data);
      } else {
        setSelectedEntry(entry);
      }
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  // Filter ledger entries based on search term
  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.particulars?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category?.toLowerCase().includes(searchTerm.toLowerCase());

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
      <ClientSelector
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={handleClientSelect}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBack={() => navigate("/admin/clients/dashboard")}
      />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
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
              className="btn-primary btn-sm mt-4"
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
            className="btn-secondary btn-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Client
          </button>
          <button
            onClick={() => navigate("/admin/clients/dashboard")}
            className="btn-secondary btn-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button onClick={exportToExcel} className="btn-success btn-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Stock Sales"
          value={`₹${summary?.stock?.totalDebit?.toLocaleString() || 0}`}
          icon={ShoppingBag}
          color="green"
          change={`${summary?.stock?.saleCount || 0} transactions`}
        />
        <StatCard
          title="Stock Purchases"
          value={`₹${summary?.stock?.totalCredit?.toLocaleString() || 0}`}
          icon={ShoppingCart}
          color="red"
          change={`${summary?.stock?.purchaseCount || 0} transactions`}
        />

        <StatCard
          title="Cash In"
          value={`₹${summary?.cashFlow?.totalCashIn?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          change={`${summary?.cashFlow?.cashInCount || 0} transactions`}
        />
        <StatCard
          title="Cash Out"
          value={`₹${summary?.cashFlow?.totalCashOut?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
          change={`${summary?.cashFlow?.cashOutCount || 0} transactions`}
        />
        <StatCard
          title="Current Balance"
          value={`₹${Math.abs(client.currentBalance || 0).toLocaleString()}`}
          icon={IndianRupee}
          color={client.currentBalance >= 0 ? "green" : "red"}
          change={client.currentBalance >= 0 ? "Receivable" : "Payable"}
        />
        <StatCard
          title="Total Transactions"
          value={summary?.totalTransactions || 0}
          icon={Activity}
          color="purple"
          change="All records"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Enhanced Ledger Table */}
      <SectionCard>
        {filteredEntries.length > 0 ? (
          <LedgerTable
            entries={filteredEntries}
            user={user}
            onViewDetails={handleViewDetails}
            onEditEntry={handleEditEntry}
            onDeleteEntry={showDeleteConfirmation}
            actionLoading={actionLoading}
          />
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
              <button onClick={clearFilters} className="btn-primary btn-sm">
                <FilterX className="h-4 w-4" />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* Enhanced Details Modal */}
      {showDetailsModal && selectedEntry && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${
            selectedEntry.transactionCategory === "stock"
              ? "Stock"
              : "Cash Flow"
          } Transaction Details`}
          subtitle="Complete transaction information"
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
                      {selectedEntry.client.name || client.name}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Client Type
                    </label>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        (selectedEntry.client.type || client.type) ===
                        "Customer"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedEntry.client.type || client.type}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center text-lg text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {selectedEntry.client.phone || client.phone}
                    </div>
                  </div>

                  {(selectedEntry.client.address || client.address) && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Address
                      </label>
                      <div className="flex items-start text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        {selectedEntry.client.address || client.address}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Current Balance
                    </label>
                    <div
                      className={`text-lg font-bold ${
                        client.currentBalance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {client.currentBalance < 0 && "-"}₹
                      {Math.abs(client.currentBalance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Overview Card */}
            <div
              className={`bg-gradient-to-br rounded-2xl p-6 border ${
                selectedEntry.transactionCategory === "stock"
                  ? "from-blue-50 to-indigo-50 border-blue-100"
                  : "from-orange-50 to-amber-50 border-orange-100"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedEntry.transactionCategory === "stock"
                        ? "bg-blue-100"
                        : "bg-orange-100"
                    }`}
                  >
                    {selectedEntry.transactionCategory === "stock" ? (
                      <Package className="h-6 w-6 text-blue-600" />
                    ) : (
                      <CreditCard className="h-6 w-6 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedEntry.productName || selectedEntry.particulars}
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
                    {selectedEntry.amount?.toLocaleString() ||
                      (
                        Math.abs(selectedEntry.debitAmount || 0) +
                        Math.abs(selectedEntry.creditAmount || 0)
                      ).toLocaleString()}
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                      selectedEntry.type === "IN"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {selectedEntry.type === "IN"
                      ? selectedEntry.transactionCategory === "stock"
                        ? "Purchase"
                        : "Cash In"
                      : selectedEntry.transactionCategory === "stock"
                      ? "Sale"
                      : "Cash Out"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className={`bg-white rounded-lg p-4 border ${
                    selectedEntry.transactionCategory === "stock"
                      ? "border-blue-200"
                      : "border-orange-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar
                      className={`h-4 w-4 ${
                        selectedEntry.transactionCategory === "stock"
                          ? "text-blue-500"
                          : "text-orange-500"
                      }`}
                    />
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

                {selectedEntry.transactionCategory === "stock" && (
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
                )}

                {selectedEntry.transactionCategory === "cash" && (
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-orange-500" />
                      <label className="text-sm font-medium text-gray-600">
                        Payment Mode
                      </label>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedEntry.paymentMode || "N/A"}
                    </div>
                  </div>
                )}

                {selectedEntry.transactionCategory === "stock" && (
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
                )}

                {selectedEntry.transactionCategory === "cash" &&
                  selectedEntry.category && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-orange-500" />
                        <label className="text-sm font-medium text-gray-600">
                          Category
                        </label>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEntry.category}
                      </div>
                    </div>
                  )}
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
                    <span className="text-gray-600">
                      {selectedEntry.transactionCategory === "stock"
                        ? "Product:"
                        : "Description:"}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.productName || selectedEntry.particulars}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Transaction Type:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.type === "IN"
                        ? selectedEntry.transactionCategory === "stock"
                          ? "Purchase"
                          : "Cash In"
                        : selectedEntry.transactionCategory === "stock"
                        ? "Sale"
                        : "Cash Out"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.transactionCategory === "stock"
                        ? "Stock Transaction"
                        : `Cash Flow (${selectedEntry.category || "General"})`}
                    </span>
                  </div>
                  {selectedEntry.transactionCategory === "stock" && (
                    <>
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
                    </>
                  )}
                  {selectedEntry.transactionCategory === "cash" &&
                    selectedEntry.paymentMode && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Payment Mode:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedEntry.paymentMode}
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                    <span className="font-semibold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="font-bold text-green-600 text-lg">
                      ₹
                      {(
                        selectedEntry.amount ||
                        Math.abs(selectedEntry.debitAmount || 0) +
                          Math.abs(selectedEntry.creditAmount || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal - Only for Stock Transactions */}
      {showEditModal && selectedEntry && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Stock Transaction"
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
                  className={`input-primary ${
                    editErrors.productName ? "input-error" : ""
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
                  className="input-primary"
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
                      className={`input-primary ${
                        editErrors.bagCount ? "input-error" : ""
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
                      className={`input-primary ${
                        editErrors.bagWeight ? "input-error" : ""
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
                    className={`input-primary ${
                      editErrors.quantity ? "input-error" : ""
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
                  className={`input-primary ${
                    editErrors.rate ? "input-error" : ""
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
                  className={`input-primary ${
                    editErrors.date ? "input-error" : ""
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
                  className="input-primary"
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
                  className="input-primary"
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
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className={`btn-primary btn-sm ${
                  editLoading ? "btn-disabled" : ""
                }`}
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Update Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Cash Flow Modal */}
      {editCashFlowModal.open && selectedEntry && (
        <Modal
          isOpen={editCashFlowModal.open}
          onClose={() => setEditCashFlowModal({ open: false, entry: null })}
          title="Edit Cash Flow Transaction"
          subtitle="Update cash flow transaction information"
          headerIcon={<Edit />}
          headerColor="green"
          size="md"
        >
          <form onSubmit={handleUpdateCashFlowEntry} className="space-y-6">
            {editCashFlowErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">
                  {editCashFlowErrors.submit}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editCashFlowFormData.amount}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      amount: e.target.value,
                    })
                  }
                  className={`input-primary ${
                    editCashFlowErrors.amount ? "input-error" : ""
                  }`}
                  placeholder="Enter amount"
                />
                {editCashFlowErrors.amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editCashFlowErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={editCashFlowFormData.category}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      category: e.target.value,
                    })
                  }
                  className={`input-primary ${
                    editCashFlowErrors.category ? "input-error" : ""
                  }`}
                  placeholder="Enter category"
                />
                {editCashFlowErrors.category && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editCashFlowErrors.category}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editCashFlowFormData.description}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className={`input-primary ${
                    editCashFlowErrors.description ? "input-error" : ""
                  }`}
                  placeholder="Enter description"
                />
                {editCashFlowErrors.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editCashFlowErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={editCashFlowFormData.paymentMode}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      paymentMode: e.target.value,
                    })
                  }
                  className={`input-primary ${
                    editCashFlowErrors.paymentMode ? "input-error" : ""
                  }`}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
                {editCashFlowErrors.paymentMode && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editCashFlowErrors.paymentMode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={editCashFlowFormData.date}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      date: e.target.value,
                    })
                  }
                  className={`input-primary ${
                    editCashFlowErrors.date ? "input-error" : ""
                  }`}
                />
                {editCashFlowErrors.date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editCashFlowErrors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={editCashFlowFormData.transactionId}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      transactionId: e.target.value,
                    })
                  }
                  className="input-primary"
                  placeholder="Enter transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editCashFlowFormData.notes}
                  onChange={(e) =>
                    setEditCashFlowFormData({
                      ...editCashFlowFormData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                  className="input-primary"
                  placeholder="Enter any additional notes"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() =>
                  setEditCashFlowModal({ open: false, entry: null })
                }
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editCashFlowLoading}
                className={`btn-primary btn-sm ${
                  editCashFlowLoading ? "btn-disabled" : ""
                }`}
              >
                {editCashFlowLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
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
          title={`Delete ${
            entryToDelete.transactionCategory === "stock"
              ? "Stock"
              : "Cash Flow"
          } Transaction`}
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
              Are you sure you want to delete this{" "}
              {entryToDelete.transactionCategory} transaction?
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-left">
                <div className="flex gap-2 flex-wrap justify-between">
                  <div className="font-semibold text-gray-900">
                    {entryToDelete.productName || entryToDelete.particulars}
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
                      ? entryToDelete.transactionCategory === "stock"
                        ? "Purchase"
                        : "Cash In"
                      : entryToDelete.transactionCategory === "stock"
                      ? "Sale"
                      : "Cash Out"}
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
              className="btn-secondary btn-sm flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEntry}
              disabled={actionLoading === entryToDelete._id}
              className={`btn-danger btn-sm flex-1 ${
                actionLoading === entryToDelete._id ? "btn-disabled" : ""
              }`}
            >
              {actionLoading === entryToDelete._id ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
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
