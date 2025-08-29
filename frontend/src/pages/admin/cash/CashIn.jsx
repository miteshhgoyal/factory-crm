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
  Info,
  CreditCard,
  Calendar,
  Subscript,
  ReplyIcon,
  Plus,
  ReceiptEuro,
  ReplyAllIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cashFlowAPI, clientAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import CustomInput2 from "../../../components/ui/CustomInput2";
import AddClientModal from "../../../components/modals/AddClientModal";
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
    date: new Date().toISOString().split("T")[0],
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
  const [createClientModal, setCreateClientModal] = useState(false);

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

    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
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
          date: new Date().toISOString().split("T")[0],
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto space-y-8">
          <HeaderComponent
            header="Add Cash In"
            subheader="Record cash inflow transactions from clients and other sources"
            onRefresh={fetchData}
            loading={dataLoading}
          />

          {/* Navigation & Quick Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                <IndianRupee className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Cash Flow Management</span>
                <span>/</span>
                <span className="text-gray-900 font-semibold">Cash In</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/cash/dashboard")}
                className="btn-secondary btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/cash/out")}
                className="btn-danger btn-sm"
              >
                <IndianRupee className="w-4 h-4" />
                Cash Out
              </button>
              <button
                onClick={() => navigate("/admin/cash/report")}
                className="btn-primary btn-sm"
              >
                <Eye className="w-4 h-4" />
                Reports
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Form - Left Column */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-green-600 bg-opacity-20 rounded-xl">
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Cash In Details</h2>
                      <p className="text-green-100 text-sm">
                        Record incoming cash transactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Success Message */}
                  {successMessage && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-800 font-medium">
                        {successMessage}
                      </span>
                    </div>
                  )}

                  {/* Error Message */}
                  {errors.submit && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800 font-medium">
                        {errors.submit}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Transaction Details Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Transaction Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Enter the basic transaction details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CustomInput2
                          icon={IndianRupee}
                          name="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          label="Amount (₹)"
                          required
                          error={errors.amount}
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="category"
                            value={
                              isNewCategory ? "__NEW__" : formData.category
                            }
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium"
                          >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                            <option value="__NEW__">
                              + Enter New Category
                            </option>
                          </select>
                          {errors.category && (
                            <p className="text-red-600 text-sm flex items-center gap-1 font-medium">
                              <AlertCircle className="w-4 h-4" />
                              {errors.category}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* New Category Input */}
                      {isNewCategory && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <CustomInput2
                            icon={Plus}
                            name="category"
                            value={formData.category}
                            onChange={handleNewCategoryChange}
                            placeholder="Enter new category name"
                            label="New Category Name"
                          />
                          <p className="text-green-600 text-sm mt-2">
                            💡 This will create a new category for future use
                          </p>
                        </div>
                      )}

                      <CustomInput2
                        icon={ReplyAllIcon}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Description of the cash inflow"
                        label="Description"
                        required
                        error={errors.description}
                      />
                    </div>

                    {/* Client Selection Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Client Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Select the source client for this transaction
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Source Client{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="clientId"
                              value={formData.clientId}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                            >
                              <option value="">Select Client</option>
                              {clients.map((client) => (
                                <option key={client._id} value={client._id}>
                                  {client.name} ({client.type}) - {client.phone}
                                </option>
                              ))}
                            </select>
                            {errors.clientId && (
                              <p className="text-red-600 text-sm mt-1 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-4 h-4" />
                                {errors.clientId}
                              </p>
                            )}
                          </div>
                          <div className="pt-8">
                            <button
                              type="button"
                              onClick={() => setCreateClientModal(true)}
                              className="btn-success h-12 w-12 rounded-xl justify-center"
                              title="Add New Client"
                            >
                              <PlusCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Client Info Display */}
                        {selectedClient && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <div className="flex items-start gap-3">
                              <Info className="w-6 h-6 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-blue-900">
                                    {selectedClient.name}
                                  </h4>
                                  <span className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-200 rounded-full">
                                    {selectedClient.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <p className="text-blue-700">
                                    Phone:{" "}
                                    <span className="font-semibold">
                                      {selectedClient.phone}
                                    </span>
                                  </p>
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
                      </div>
                    </div>

                    {/* Payment Information Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Payment Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Specify payment method and additional details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Payment Mode <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                          >
                            {paymentModes.map((mode) => (
                              <option key={mode} value={mode}>
                                {mode}
                              </option>
                            ))}
                          </select>
                        </div>

                        {formData.paymentMode !== "Cash" && (
                          <CustomInput2
                            icon={CreditCard}
                            name="transactionId"
                            value={formData.transactionId}
                            onChange={handleInputChange}
                            placeholder="Transaction/Reference ID"
                            label="Transaction ID"
                            required
                            error={errors.transactionId}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Date <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="date"
                              name="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 pl-12 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                            />
                          </div>
                          <p className="text-gray-500 text-sm">
                            Selected:{" "}
                            {new Date(formData.date).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Additional notes about the cash inflow..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium resize-none"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => navigate("/admin/cash/dashboard")}
                        className="btn-secondary flex-1 justify-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-success flex-1 justify-center btn-disabled"
                        style={loading ? {} : { opacity: 1, cursor: "pointer" }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recording...
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
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    <h3 className="font-bold">Transaction Summary</h3>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium">
                          Amount:
                        </span>
                        <span className="font-bold text-green-900 text-lg">
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
                          {formData.clientName || "Not selected"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold">Recent Cash In</h3>
                  </div>
                </div>
                <div className="p-4">
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
                            className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
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
                            No recent activities
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={createClientModal}
        onClose={() => setCreateClientModal(false)}
        onClientCreated={(newClient) => {
          setClients([...clients, newClient]);
          setFormData((prev) => ({
            ...prev,
            clientId: newClient._id,
            clientName: newClient.name,
          }));
          setSelectedClient(newClient);
        }}
        defaultType="Customer"
      />
    </>
  );
};

export default CashIn;
