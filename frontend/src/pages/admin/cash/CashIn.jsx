import React, { useState, useEffect, useCallback } from "react";
import {
  PlusCircle,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calculator,
  ArrowLeft,
  Eye,
  TrendingUp,
  User,
  Phone,
  MapPin,
  Info,
  Plus,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cashFlowAPI, clientAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";

const CashIn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    paymentMode: "Cash",
    transactionId: "",
    notes: "",
    clientId: "",
    clientName: "",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Modal states
  const [createClientModal, setCreateClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: "",
    phone: "",
    address: "",
    type: "Customer",
  });
  const [clientFormLoading, setClientFormLoading] = useState(false);

  const defaultCategories = [
    "Sales Revenue",
    "Service Income",
    "Investment Returns",
    "Loan Received",
    "Interest Received",
    "Refund",
    "Government Grant",
    "Insurance Claim",
    "Rental Income",
    "Commission Earned",
    "Miscellaneous Income",
  ];

  const paymentModes = ["Cash", "Cheque", "Online"];

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [clientsResponse, categoriesResponse, transactionsResponse] =
        await Promise.all([
          clientAPI.getClients({ limit: 100 }),
          cashFlowAPI.getCategories({ type: "IN" }),
          cashFlowAPI.getTransactions({ limit: 5, type: "IN" }),
        ]);

      // Handle clients data
      if (clientsResponse.data?.success) {
        setClients(
          Array.isArray(clientsResponse.data.data?.clients)
            ? clientsResponse.data.data.clients
            : []
        );
      }

      // Handle categories data
      if (categoriesResponse.data?.success) {
        const existingCategories = Array.isArray(categoriesResponse.data.data)
          ? categoriesResponse.data.data
          : [];

        // Merge with default categories and remove duplicates
        const allCategories = [
          ...new Set([...defaultCategories, ...existingCategories]),
        ];
        setCategories(allCategories);
      } else {
        setCategories(defaultCategories);
      }

      // Handle recent transactions
      if (transactionsResponse.data?.success) {
        setRecentTransactions(
          Array.isArray(transactionsResponse.data.data?.transactions)
            ? transactionsResponse.data.data.transactions
            : []
        );
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setCategories(defaultCategories);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      if (value === "__NEW__") {
        setIsNewCategory(true);
        setFormData((prev) => ({ ...prev, [name]: "" }));
        return;
      } else if (value === "") {
        setIsNewCategory(false);
      } else {
        setIsNewCategory(false);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // If client is changed, update client name
    if (name === "clientId") {
      const selectedClientData = clients.find((client) => client._id === value);
      setSelectedClient(selectedClientData || null);
      setFormData((prev) => ({
        ...prev,
        clientName: selectedClientData ? selectedClientData.name : "",
        clientId: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleNewCategoryChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, category: value }));

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!clientFormData.name.trim() || !clientFormData.phone.trim()) {
      alert("Name and phone are required");
      return;
    }

    try {
      setClientFormLoading(true);
      const response = await clientAPI.createClient(clientFormData);

      if (response.data.success) {
        // Refresh clients list
        const clientsResponse = await clientAPI.getClients({ limit: 100 });
        if (clientsResponse.data?.success) {
          setClients(clientsResponse.data.data.clients);
        }

        // Select the newly created client
        const newClient = response.data.data;
        setFormData((prev) => ({
          ...prev,
          clientId: newClient._id,
          clientName: newClient.name,
        }));
        setSelectedClient(newClient);

        // Close modal and reset form
        setCreateClientModal(false);
        setClientFormData({
          name: "",
          phone: "",
          address: "",
          type: "Customer",
        });
      }
    } catch (error) {
      console.error("Failed to create client:", error);
      alert("Failed to create client");
    } finally {
      setClientFormLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (
      (formData.paymentMode === "Online" ||
        formData.paymentMode === "Cheque") &&
      !formData.transactionId.trim()
    ) {
      newErrors.transactionId =
        "Transaction ID is required for online/cheque payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await cashFlowAPI.addCashIn({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      if (response.data.success) {
        setSuccessMessage("Cash in recorded successfully!");

        setFormData({
          amount: "",
          category: "",
          description: "",
          paymentMode: "Cash",
          transactionId: "",
          notes: "",
          clientId: "",
          clientName: "",
        });

        setSelectedClient(null);
        setIsNewCategory(false);

        // Refresh data to get updated categories and transactions
        fetchData();

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to record cash in",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <HeaderComponent
          header="Add Cash In"
          subheader="Record cash inflow transactions from clients and other sources"
          onRefresh={fetchData}
          loading={dataLoading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span>Cash Flow Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Cash In</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/cash/dashboard")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={() => navigate("/admin/cash/out")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <IndianRupee className="w-4 h-4" />
              <span className="hidden sm:inline">Cash Out</span>
              <span className="sm:hidden">Out</span>
            </button>
            <button
              onClick={() => navigate("/admin/cash/report")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">Reports</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <SectionCard
              title="Cash In Details"
              icon={PlusCircle}
              headerColor="green"
            >
              {/* Messages */}
              {successMessage && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-emerald-800 font-medium">
                    {successMessage}
                  </span>
                </div>
              )}

              {errors.submit && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {errors.submit}
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transaction Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Transaction Information
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormInput
                      icon={IndianRupee}
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      label="Amount (₹) *"
                      error={errors.amount}
                      theme="white"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category *
                      </label>
                      <div className="relative">
                        <select
                          name="category"
                          value={isNewCategory ? "__NEW__" : formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                        >
                          <option value="">Select Category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="__NEW__">+ Enter New Category</option>
                        </select>
                        {errors.category && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.category}
                          </p>
                        )}
                      </div>

                      {/* Show text input if "Enter New Category" is selected */}
                      {isNewCategory && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={formData.category}
                            onChange={handleNewCategoryChange}
                            placeholder="Enter new category name"
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200"
                          />
                          <p className="text-xs text-green-600 mt-1">
                            💡 This will create a new category for future use
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <FormInput
                    icon={IndianRupee}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description of the cash inflow"
                    label="Description *"
                    error={errors.description}
                    theme="white"
                  />

                  {/* Client Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Source Client (Optional)
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                      >
                        <option value="">Select Client (Optional)</option>
                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.name} ({client.type}) - {client.phone}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setCreateClientModal(true)}
                        className="px-3 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
                        title="Create New Client"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Client Information Alert */}
                  {selectedClient && (
                    <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
                      <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-lg text-blue-900">
                              Selected Client: {selectedClient.name}
                            </p>
                            <span className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-200 rounded-full">
                              {selectedClient.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-blue-700">
                                Phone:{" "}
                                <span className="font-semibold">
                                  {selectedClient.phone}
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-blue-700">
                                Balance:{" "}
                                <span className="font-semibold">
                                  ₹
                                  {(
                                    selectedClient.currentBalance || 0
                                  ).toLocaleString()}
                                </span>
                              </p>
                            </div>
                          </div>
                          {selectedClient.address && (
                            <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                              <p className="text-blue-800 text-sm">
                                📍 {selectedClient.address}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Category Alert */}
                  {isNewCategory && formData.category && (
                    <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-green-50 to-green-100 border-green-300">
                      <div className="flex items-start gap-3">
                        <Plus className="w-6 h-6 mt-0.5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-bold text-lg text-green-900 mb-2">
                            New Category: {formData.category}
                          </p>
                          <div className="mt-2 p-2 bg-green-100 rounded-lg">
                            <p className="text-green-800 text-sm font-medium">
                              🆕 Creating new income category: "
                              {formData.category}" for future transactions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Payment Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Payment Mode *
                      </label>
                      <select
                        name="paymentMode"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                      >
                        {paymentModes.map((mode) => (
                          <option key={mode} value={mode}>
                            {mode}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.paymentMode !== "Cash" && (
                      <FormInput
                        icon={CreditCard}
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleInputChange}
                        placeholder="Transaction/Reference ID"
                        label="Transaction ID *"
                        error={errors.transactionId}
                        theme="white"
                      />
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Additional Information
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
                        <span className="text-gray-900">
                          {formatDate(new Date())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about the cash inflow..."
                      rows={3}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/cash/dashboard")}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recording Cash In...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Record Cash In
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SectionCard>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-2 space-y-6">
            {/* Transaction Summary */}
            <SectionCard title="Summary" icon={Calculator} headerColor="blue">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Cash Inflow Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Amount:</span>
                      <span className="font-bold text-green-900 text-xl">
                        ₹
                        {formData.amount
                          ? parseFloat(formData.amount).toLocaleString()
                          : "0"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Category:</span>
                      <span className="font-medium text-green-900">
                        {formData.category || "Not selected"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Payment Mode:</span>
                      <span className="font-medium text-green-900">
                        {formData.paymentMode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-700">Source:</span>
                      <span className="font-medium text-green-900 truncate">
                        {formData.clientName || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Guidelines
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>• Enter accurate amount and description</p>
                    <p>• Select appropriate category or create new one</p>
                    <p>• Link to client for better tracking</p>
                    <p>• Provide transaction ID for non-cash payments</p>
                    {user.role === "superadmin" && (
                      <p>• Only you can edit transactions later</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Recent Cash In Activities */}
            <SectionCard
              title="Recent Cash In"
              icon={TrendingUp}
              headerColor="green"
            >
              {dataLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction._id}
                        className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {transaction.category}
                          </h4>
                          <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">
                            +₹{transaction.amount?.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 truncate">
                            {transaction.clientName || "No client"}
                          </span>
                          <span className="font-medium text-gray-900">
                            {transaction.paymentMode}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatDate(transaction.date)}</span>
                          <span className="truncate max-w-24">
                            {transaction.description}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        No recent cash in activities
                      </p>
                      <p className="text-gray-400 text-sm">
                        Activities will appear here
                      </p>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Create Client Modal */}
      <Modal
        isOpen={createClientModal}
        onClose={() => setCreateClientModal(false)}
        title="Create New Client"
        subtitle="Add a new customer or supplier"
        headerIcon={<Plus />}
        headerColor="green"
        size="default"
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Client Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="name"
                value={clientFormData.name}
                onChange={handleClientFormChange}
                placeholder="Client Name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={clientFormData.phone}
                onChange={handleClientFormChange}
                placeholder="Phone Number"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Client Type *
            </label>
            <select
              name="type"
              value={clientFormData.type}
              onChange={handleClientFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Customer">Customer</option>
              <option value="Supplier">Supplier</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                name="address"
                value={clientFormData.address}
                onChange={handleClientFormChange}
                placeholder="Address (Optional)"
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setCreateClientModal(false)}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              disabled={clientFormLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              disabled={clientFormLoading}
            >
              {clientFormLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {clientFormLoading ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CashIn;
