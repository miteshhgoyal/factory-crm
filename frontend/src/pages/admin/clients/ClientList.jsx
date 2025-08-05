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
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import DataRow from "../../../components/cards/DataRow";

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

  // Modal states
  const [viewModal, setViewModal] = useState({ open: false, client: null });
  const [editModal, setEditModal] = useState({ open: false, client: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

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
        limit: 50,
      };

      const response = await clientAPI.getClients(params);
      let clientsData = response.data.data.clients;

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

  const handleViewClient = (client) => {
    setViewModal({ open: true, client });
  };

  const handleEditClient = (client) => {
    setFormData({
      name: client.name,
      phone: client.phone,
      address: client.address || "",
      type: client.type,
    });
    setEditModal({ open: true, client });
  };

  const handleDeleteClient = (client) => {
    setDeleteModal({ open: true, client });
  };

  const confirmDeleteClient = async () => {
    if (!deleteModal.client) return;

    try {
      setFormLoading(true);
      await clientAPI.deleteClient(deleteModal.client._id);
      setDeleteModal({ open: false, client: null });
      fetchClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
      alert("Failed to delete client");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editModal.client) return;

    try {
      setFormLoading(true);
      await clientAPI.updateClient(editModal.client._id, formData);
      setEditModal({ open: false, client: null });
      setFormData({});
      fetchClients();
    } catch (error) {
      console.error("Failed to update client:", error);
      alert("Failed to update client");
    } finally {
      setFormLoading(false);
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

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`relative bg-white rounded-3xl shadow-2xl ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-hidden`}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    );
  };

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

        {/* Client List Table */}
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Edit Client"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/clients/${client._id}/ledger`)
                          }
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Ledger
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
          </div>
        </SectionCard>
      </div>

      {/* View Client Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, client: null })}
        title="Client Details"
        size="md"
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
                value={new Date(
                  viewModal.client.createdAt
                ).toLocaleDateString()}
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
              <button
                onClick={() => {
                  setViewModal({ open: false, client: null });
                  handleEditClient(viewModal.client);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Edit Client
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => {
          setEditModal({ open: false, client: null });
          setFormData({});
        }}
        title="Edit Client"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              value={formData.type || ""}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Type</option>
              <option value="Customer">Customer</option>
              <option value="Supplier">Supplier</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={() => {
                setEditModal({ open: false, client: null });
                setFormData({});
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        title="Delete Client"
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
