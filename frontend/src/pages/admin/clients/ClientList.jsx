import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Phone,
  MapPin,
  ArrowLeft,
  AlertCircle,
  X,
  Save,
  Filter,
  Download,
  FileText,
  FileImage,
  Upload,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import DataRow from "../../../components/cards/DataRow";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDate } from "../../../utils/dateUtils";

const ClientList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State management
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState(
    searchParams.get("filter") || ""
  );
  const [statusFilter, setStatusFilter] = useState("active");

  // Modal states
  const [viewModal, setViewModal] = useState({ open: false, client: null });
  const [editModal, setEditModal] = useState({ open: false, client: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Form states
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Image editing states
  const [editAadharFile, setEditAadharFile] = useState(null);
  const [editPanFile, setEditPanFile] = useState(null);
  const [editAadharPreview, setEditAadharPreview] = useState(null);
  const [editPanPreview, setEditPanPreview] = useState(null);

  // Initialize component
  useEffect(() => {
    fetchClients();
  }, [searchTerm, typeFilter, balanceFilter, statusFilter]);

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: searchTerm,
        type: typeFilter,
        isActive:
          statusFilter === "active"
            ? "true"
            : statusFilter === "inactive"
            ? "false"
            : undefined,
        page: 1,
        limit: 50,
        sortBy: "name",
        sortOrder: "asc",
      };

      // Remove undefined values
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === "") {
          delete params[key];
        }
      });

      const response = await clientAPI.getClients(params);
      let clientsData = response.data.data.clients;

      // Apply balance filter on frontend if needed
      if (balanceFilter === "debtors") {
        clientsData = clientsData.filter((client) => client.currentBalance > 0);
      } else if (balanceFilter === "creditors") {
        clientsData = clientsData.filter((client) => client.currentBalance < 0);
      } else if (balanceFilter === "zero") {
        clientsData = clientsData.filter(
          (client) => client.currentBalance === 0
        );
      }

      setClients(clientsData);
      setPagination(response.data.data?.pagination || {});
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setError(error.response?.data?.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Client actions
  const handleViewClient = (client) => {
    setViewModal({ open: true, client });
  };

  const handleEditClient = (client) => {
    setFormData({
      name: client.name,
      phone: client.phone,
      address: client.address || "",
      type: client.type,
      aadharNo: client.aadharNo || "",
      panNo: client.panNo || "",
      aadharCardImage: client.aadharCardImage || "",
      panCardImage: client.panCardImage || "",
      aadharCardImagePublicId: client.aadharCardImagePublicId || "",
      panCardImagePublicId: client.panCardImagePublicId || "",
    });
    setFormErrors({});

    // Reset image editing states
    setEditAadharFile(null);
    setEditPanFile(null);
    if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
    if (editPanPreview) URL.revokeObjectURL(editPanPreview);
    setEditAadharPreview(null);
    setEditPanPreview(null);

    setEditModal({ open: true, client });
  };

  const handleDeleteClient = (client) => {
    setDeleteModal({ open: true, client });
  };

  // Image handling functions
  const handleEditAadharFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          editAadharFile: "File size should be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          editAadharFile: "Please select a valid image file",
        }));
        return;
      }

      setEditAadharFile(file);
      if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
      setEditAadharPreview(URL.createObjectURL(file));
      if (formErrors.editAadharFile) {
        setFormErrors((prev) => ({ ...prev, editAadharFile: "" }));
      }
    }
  };

  const handleEditPanFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          editPanFile: "File size should be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          editPanFile: "Please select a valid image file",
        }));
        return;
      }

      setEditPanFile(file);
      if (editPanPreview) URL.revokeObjectURL(editPanPreview);
      setEditPanPreview(URL.createObjectURL(file));
      if (formErrors.editPanFile) {
        setFormErrors((prev) => ({ ...prev, editPanFile: "" }));
      }
    }
  };

  const removeEditAadharFile = () => {
    setEditAadharFile(null);
    if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
    setEditAadharPreview(null);
    setFormData((prev) => ({
      ...prev,
      aadharCardImage: "",
      aadharCardImagePublicId: "",
    }));
  };

  const removeEditPanFile = () => {
    setEditPanFile(null);
    if (editPanPreview) URL.revokeObjectURL(editPanPreview);
    setEditPanPreview(null);
    setFormData((prev) => ({
      ...prev,
      panCardImage: "",
      panCardImagePublicId: "",
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.type) {
      errors.type = "Client type is required";
    } else if (!["Customer", "Supplier"].includes(formData.type)) {
      errors.type = "Type must be either Customer or Supplier";
    }

    // Validate Aadhaar number if provided
    if (
      formData.aadharNo &&
      !/^\d{12}$/.test(formData.aadharNo.replace(/\D/g, ""))
    ) {
      errors.aadharNo = "Aadhaar number should be 12 digits";
    }

    // Validate PAN number if provided
    if (
      formData.panNo &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.toUpperCase())
    ) {
      errors.panNo = "Please enter a valid PAN number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateClient = async () => {
    if (!editModal.client || !validateForm()) return;

    try {
      setFormLoading(true);

      // Create FormData for multipart/form-data submission
      const submitFormData = new FormData();

      // Add all text fields to FormData
      submitFormData.append("name", formData.name);
      submitFormData.append("phone", formData.phone);
      submitFormData.append("address", formData.address || "");
      submitFormData.append("type", formData.type);
      submitFormData.append("aadharNo", formData.aadharNo || "");
      submitFormData.append("panNo", formData.panNo || "");

      // Add image files if selected
      if (editAadharFile) {
        submitFormData.append("aadharCard", editAadharFile);
      }
      if (editPanFile) {
        submitFormData.append("panCard", editPanFile);
      }

      // Use the existing API service instead of custom fetch
      await clientAPI.updateClient(editModal.client._id, submitFormData);

      setEditModal({ open: false, client: null });
      setFormData({});
      setFormErrors({});

      // Reset image editing states
      setEditAadharFile(null);
      setEditPanFile(null);
      if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
      if (editPanPreview) URL.revokeObjectURL(editPanPreview);
      setEditAadharPreview(null);
      setEditPanPreview(null);

      fetchClients();
    } catch (error) {
      console.error("Failed to update client:", error);
      setFormErrors({
        submit: error.response?.data?.message || "Failed to update client",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete client
  const confirmDeleteClient = async () => {
    if (!deleteModal.client) return;

    try {
      setFormLoading(true);
      await clientAPI.deleteClient(deleteModal.client._id);
      setDeleteModal({ open: false, client: null });
      fetchClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
      setFormErrors({
        submit: error.response?.data?.message || "Failed to delete client",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Utility functions
  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setBalanceFilter("");
    setStatusFilter("active");
  };

  const exportToCSV = () => {
    const csvData = clients.map((client) => ({
      Name: client.name,
      Phone: client.phone,
      Type: client.type,
      Address: client.address || "N/A",
      "Current Balance": client.currentBalance,
      Status: client.isActive ? "Active" : "Inactive",
      "Aadhaar Number": client.aadharNo || "N/A",
      "PAN Number": client.panNo || "N/A",
      "Created Date": formatDate(client.createdAt),
    }));

    const headers = Object.keys(csvData[0] || {});
    if (headers.length === 0) return;

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
    const creditors = clients.filter(
      (client) => client.currentBalance < 0
    ).length;
    const totalReceivables = clients
      .filter((client) => client.currentBalance > 0)
      .reduce((sum, client) => sum + client.currentBalance, 0);
    const totalPayables = clients
      .filter((client) => client.currentBalance < 0)
      .reduce((sum, client) => sum + Math.abs(client.currentBalance), 0);

    return {
      totalClients,
      customers,
      suppliers,
      debtors,
      creditors,
      totalReceivables,
      totalPayables,
    };
  };

  const stats = getClientStats();

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Loading state
  if (loading && clients.length === 0) {
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
        <SectionCard>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Error state
  if (error && clients.length === 0) {
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
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={fetchClients}
              className="px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
              onClick={exportToCSV}
              disabled={clients.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => navigate("/admin/clients/add")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
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
            change={`${stats.customers + stats.suppliers} total`}
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
            title="Receivables"
            value={`₹${stats.totalReceivables.toLocaleString()}`}
            icon={Users}
            color="orange"
            change={`${stats.debtors} debtors`}
          />
        </div>

        {/* Client List Table */}
        <SectionCard title="Client Directory" icon={Users} headerColor="blue">
          {/* Search and Filters */}
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
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
                  <option value="zero">Zero Balance</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Actions
                </label>
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchTerm ||
              typeFilter ||
              balanceFilter ||
              statusFilter !== "active") && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Showing {clients.length} clients</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {typeFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                      Type: {typeFilter}
                    </span>
                  )}
                  {balanceFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
                      Balance: {balanceFilter}
                    </span>
                  )}
                  {statusFilter !== "active" && statusFilter && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                      Status: {statusFilter}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clients Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Client Details
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Current Balance
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
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
                          {client.address && (
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {client.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.type === "Customer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {client.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{client.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
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
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {client.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* View Documents Button */}
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDocumentsModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                          title="View Documents"
                        >
                          <FileImage className="w-4 h-4" />
                        </button>

                        {(user.role === "superadmin" ||
                          user.role === "admin") && (
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit Client"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {user.role === "superadmin" && (
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Client"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            navigate(`/admin/clients/${client._id}/ledger`)
                          }
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {clients.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No clients found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ||
                  typeFilter ||
                  balanceFilter ||
                  statusFilter !== "active"
                    ? "Try adjusting your search filters."
                    : "Get started by adding your first client."}
                </p>
                {!searchTerm &&
                  !typeFilter &&
                  !balanceFilter &&
                  statusFilter === "active" && (
                    <button
                      onClick={() => navigate("/admin/clients/add")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add First Client
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {clients.length} of {pagination.totalItems} clients
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                  {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && selectedClient && (
        <Modal
          isOpen={showDocumentsModal}
          onClose={() => setShowDocumentsModal(false)}
          title={`${selectedClient?.name} - Documents`}
          subtitle="Client Document Information & Images"
          headerIcon={<FileImage />}
          headerColor="purple"
          size="lg"
        >
          <div className="space-y-6">
            {/* Document Numbers Section */}
            {(selectedClient.aadharNo || selectedClient.panNo) && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Document Numbers
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedClient.aadharNo && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Aadhaar Number
                      </label>
                      <div className="text-lg font-mono font-semibold text-gray-900">
                        {selectedClient.aadharNo.replace(
                          /(\d{4})(\d{4})(\d{4})/,
                          "$1 $2 $3"
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Government ID
                      </div>
                    </div>
                  )}

                  {selectedClient.panNo && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        PAN Number
                      </label>
                      <div className="text-lg font-mono font-semibold text-gray-900">
                        {selectedClient.panNo}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tax identification
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Images Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileImage className="h-6 w-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Document Images
                </h3>
              </div>

              {selectedClient.aadharCardImage || selectedClient.panCardImage ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedClient.aadharCardImage && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-500 mb-3">
                        Aadhaar Card Image
                      </label>
                      <div className="relative group">
                        <img
                          src={selectedClient.aadharCardImage}
                          alt="Aadhaar Card"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:shadow-lg transition-all"
                          onClick={() =>
                            window.open(
                              selectedClient.aadharCardImage,
                              "_blank"
                            )
                          }
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        Click to view full size
                      </div>
                    </div>
                  )}

                  {selectedClient.panCardImage && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-500 mb-3">
                        PAN Card Image
                      </label>
                      <div className="relative group">
                        <img
                          src={selectedClient.panCardImage}
                          alt="PAN Card"
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:shadow-lg transition-all"
                          onClick={() =>
                            window.open(selectedClient.panCardImage, "_blank")
                          }
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-2 text-center">
                        Click to view full size
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileImage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-500 mb-2">
                    No Document Images
                  </h4>
                  <p className="text-gray-400 mb-4">
                    No document images have been uploaded for this client yet.
                  </p>
                  {(user.role === "superadmin" || user.role === "admin") && (
                    <button
                      onClick={() => {
                        setShowDocumentsModal(false);
                        handleEditClient(selectedClient);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              {(user.role === "superadmin" || user.role === "admin") && (
                <button
                  onClick={() => {
                    setShowDocumentsModal(false);
                    handleEditClient(selectedClient);
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Client
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* View Client Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, client: null })}
        title="Client Details"
        headerIcon={<Eye />}
        headerColor="blue"
        size="default"
      >
        {viewModal.client && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  viewModal.client.type === "Customer"
                    ? "bg-gradient-to-br from-blue-100 to-blue-200"
                    : "bg-gradient-to-br from-green-100 to-green-200"
                }`}
              >
                {viewModal.client.type === "Customer" ? (
                  <UserCheck className="w-8 h-8 text-blue-600" />
                ) : (
                  <Users className="w-8 h-8 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewModal.client.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    viewModal.client.type === "Customer"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {viewModal.client.type}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <DataRow label="Name" value={viewModal.client.name} />
              <DataRow label="Phone" value={viewModal.client.phone} />
              <DataRow label="Type" value={viewModal.client.type} />
              <DataRow
                label="Address"
                value={viewModal.client.address || "Not provided"}
              />
              {viewModal.client.aadharNo && (
                <DataRow
                  label="Aadhaar Number"
                  value={viewModal.client.aadharNo}
                />
              )}
              {viewModal.client.panNo && (
                <DataRow label="PAN Number" value={viewModal.client.panNo} />
              )}
              <DataRow
                label="Status"
                value={viewModal.client.isActive ? "Active" : "Inactive"}
                valueColor={
                  viewModal.client.isActive ? "text-green-600" : "text-red-600"
                }
              />
              <DataRow
                label="Current Balance"
                value={`₹${Math.abs(
                  viewModal.client.currentBalance
                ).toLocaleString()}${
                  viewModal.client.currentBalance < 0 ? " (CR)" : ""
                }`}
                valueColor={
                  viewModal.client.currentBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                bold={true}
                className="pt-3 border-t"
              />
              <DataRow
                label="Created"
                value={formatDate(viewModal.client.createdAt)}
              />
              <DataRow
                label="Created By"
                value={viewModal.client.createdBy?.username || "N/A"}
              />
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <button
                onClick={() =>
                  navigate(`/admin/clients/${viewModal.client._id}/ledger`)
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                View Ledger
              </button>
              {(user.role === "superadmin" || user.role === "admin") && (
                <button
                  onClick={() => {
                    setViewModal({ open: false, client: null });
                    handleEditClient(viewModal.client);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Edit Client
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Edit Client Modal with Document Upload */}
      <Modal
        isOpen={editModal.open}
        onClose={() => {
          setEditModal({ open: false, client: null });
          setFormData({});
          setFormErrors({});
          // Reset image editing states
          setEditAadharFile(null);
          setEditPanFile(null);
          if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
          if (editPanPreview) URL.revokeObjectURL(editPanPreview);
          setEditAadharPreview(null);
          setEditPanPreview(null);
        }}
        title="Edit Client"
        subtitle="Update client information"
        headerIcon={<Edit />}
        headerColor="orange"
        size="lg"
      >
        <div className="space-y-6">
          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formErrors.submit}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter client name"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.phone ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter phone number"
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.type ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Supplier">Supplier</option>
                </select>
                {formErrors.type && (
                  <p className="text-sm text-red-600">{formErrors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.address ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter address"
                />
                {formErrors.address && (
                  <p className="text-sm text-red-600">{formErrors.address}</p>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <span className="text-sm text-gray-500">(Optional)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  name="aadharNo"
                  value={formData.aadharNo || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    formErrors.aadharNo ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter 12-digit Aadhaar number"
                />
                {formErrors.aadharNo && (
                  <p className="text-sm text-red-600">{formErrors.aadharNo}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNo"
                  value={formData.panNo || ""}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    formErrors.panNo ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Enter PAN number (e.g., ABCDE1234F)"
                />
                {formErrors.panNo && (
                  <p className="text-sm text-red-600">{formErrors.panNo}</p>
                )}
              </div>
            </div>

            {/* Document Images Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aadhaar Card Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Aadhaar Card Image
                </label>

                {/* Show current image if exists and no new file selected */}
                {!editAadharPreview && formData.aadharCardImage && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Current Image:</p>
                    <div className="relative">
                      <img
                        src={formData.aadharCardImage}
                        alt="Current Aadhaar"
                        className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          window.open(formData.aadharCardImage, "_blank")
                        }
                        className="absolute bottom-1 right-1 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {editAadharPreview ? (
                  <div className="relative">
                    <p className="text-xs text-green-600 mb-2">New Image:</p>
                    <img
                      src={editAadharPreview}
                      alt="Aadhaar preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeEditAadharFile}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(editAadharPreview, "_blank")}
                      className="absolute bottom-2 right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <FileImage className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label
                        htmlFor="edit-aadhar-upload"
                        className="cursor-pointer"
                      >
                        <span className="text-sm text-gray-600">
                          {formData.aadharCardImage
                            ? "Replace Aadhaar image"
                            : "Upload Aadhaar card image"}
                        </span>
                        <input
                          id="edit-aadhar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleEditAadharFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                )}

                {formErrors.editAadharFile && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.editAadharFile}
                  </p>
                )}
              </div>

              {/* PAN Card Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  PAN Card Image
                </label>

                {/* Show current image if exists and no new file selected */}
                {!editPanPreview && formData.panCardImage && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Current Image:</p>
                    <div className="relative">
                      <img
                        src={formData.panCardImage}
                        alt="Current PAN"
                        className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          window.open(formData.panCardImage, "_blank")
                        }
                        className="absolute bottom-1 right-1 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {editPanPreview ? (
                  <div className="relative">
                    <p className="text-xs text-green-600 mb-2">New Image:</p>
                    <img
                      src={editPanPreview}
                      alt="PAN preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeEditPanFile}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(editPanPreview, "_blank")}
                      className="absolute bottom-2 right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <FileImage className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label
                        htmlFor="edit-pan-upload"
                        className="cursor-pointer"
                      >
                        <span className="text-sm text-gray-600">
                          {formData.panCardImage
                            ? "Replace PAN image"
                            : "Upload PAN card image"}
                        </span>
                        <input
                          id="edit-pan-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleEditPanFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, JPEG up to 5MB
                    </p>
                  </div>
                )}

                {formErrors.editPanFile && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.editPanFile}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={() => {
                setEditModal({ open: false, client: null });
                setFormData({});
                setFormErrors({});
                // Reset image editing states
                setEditAadharFile(null);
                setEditPanFile(null);
                if (editAadharPreview) URL.revokeObjectURL(editAadharPreview);
                if (editPanPreview) URL.revokeObjectURL(editPanPreview);
                setEditAadharPreview(null);
                setEditPanPreview(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateClient}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        title="Delete Client"
        subtitle="This action cannot be undone"
        headerIcon={<Trash2 />}
        headerColor="red"
        size="sm"
      >
        {deleteModal.client && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this client?
                </h4>
                <p className="text-sm text-red-700">
                  Client: <strong>{deleteModal.client.name}</strong>
                </p>
              </div>
            </div>

            <p className="text-gray-600">
              This action will deactivate the client and they will no longer
              appear in your client list. This action can be reversed by a
              superadmin.
            </p>

            {formErrors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formErrors.submit}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setDeleteModal({ open: false, client: null })}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteClient}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete Client"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientList;
