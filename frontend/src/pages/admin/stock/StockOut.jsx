import React, { useState, useEffect, useCallback } from "react";
import {
  Minus,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calculator,
  ArrowLeft,
  Eye,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Info,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI, clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import CustomInput2 from "../../../components/ui/CustomInput2";
import AddClientModal from "../../../components/modals/AddClientModal";
import { formatDate } from "../../../utils/dateUtils";

const StockOut = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    quantity: "",
    unit: "kg",
    rate: "",
    clientName: "",
    clientId: "",
    invoiceNo: "",
    notes: "",
    weightPerBag: 40,
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [stockBalance, setStockBalance] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [createClientModal, setCreateClientModal] = useState(false);

  // Fetch stock balance, recent transactions, and clients
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [productsResponse, transactionsResponse, clientsResponse] =
        await Promise.all([
          stockAPI.getProducts(),
          stockAPI.getTransactions({ limit: 5, type: "OUT" }),
          clientAPI.getClients({ limit: 100 }),
        ]);

      // Handle products data
      if (productsResponse.data?.success) {
        setStockBalance(
          Array.isArray(productsResponse.data.data)
            ? productsResponse.data.data
            : []
        );
      } else {
        setStockBalance([]);
      }

      // Handle recent transactions
      if (transactionsResponse.data?.success) {
        setRecentTransactions(
          Array.isArray(transactionsResponse.data.data?.transactions)
            ? transactionsResponse.data.data.transactions
            : []
        );
      }

      // Handle clients data
      if (clientsResponse.data?.success) {
        setClients(
          Array.isArray(clientsResponse.data.data?.clients)
            ? clientsResponse.data.data.clients
            : []
        );
      }
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
      setStockBalance([]);
      setRecentTransactions([]);
      setClients([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If product name is changed, find the product in stock balance
    if (name === "productName") {
      const product = stockBalance.find((p) => p._id === value);
      setSelectedProduct(product || null);
    }

    // If client is changed, update client name
    if (name === "clientId") {
      const selectedClient = clients.find((client) => client._id === value);
      setFormData((prev) => ({
        ...prev,
        clientName: selectedClient ? selectedClient.name : "",
        clientId: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required";
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (!formData.rate || formData.rate <= 0) {
      newErrors.rate = "Valid rate is required";
    }

    if (!formData.clientId) {
      newErrors.clientId = "Client is required";
    }

    // Check if sufficient stock is available
    if (selectedProduct && selectedProduct.currentStock !== undefined) {
      const quantityInKg =
        formData.unit === "bag"
          ? formData.quantity * (parseFloat(formData.weightPerBag) || 0)
          : parseFloat(formData.quantity) || 0;

      if (quantityInKg > selectedProduct.currentStock) {
        newErrors.quantity = `Insufficient stock. Available: ${selectedProduct.currentStock.toFixed(
          2
        )} kg`;
      }
    } else if (formData.productName && !selectedProduct) {
      newErrors.productName = "Product not found in stock";
    }

    // Additional validation for weight per bag
    if (
      formData.unit === "bag" &&
      (!formData.weightPerBag || formData.weightPerBag <= 0)
    ) {
      newErrors.weightPerBag = "Valid weight per bag is required";
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
      const response = await stockAPI.addStockOut({
        ...formData,
        quantity: Math.round(formData.quantity),
        rate: Math.round(formData.rate),
        weightPerBag: Math.round(formData.weightPerBag),
      });

      if (response.data.success) {
        setSuccessMessage("Stock out recorded successfully!");

        setFormData({
          productName: "",
          quantity: "",
          unit: "kg",
          rate: "",
          clientName: "",
          clientId: "",
          invoiceNo: "",
          notes: "",
          weightPerBag: 40,
          date: new Date().toISOString().split("T")[0],
        });

        setSelectedProduct(null);

        // Refresh data
        fetchData();

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to record stock out",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = () => {
    if (formData.quantity && formData.rate) {
      let quantityInKg = parseFloat(formData.quantity) || 0;
      if (formData.unit === "bag") {
        quantityInKg = quantityInKg * (parseFloat(formData.weightPerBag) || 0);
      }
      return quantityInKg * (parseFloat(formData.rate) || 0);
    }
    return 0;
  };

  const getQuantityInKg = () => {
    const qty = parseFloat(formData.quantity) || 0;
    if (formData.unit === "bag") {
      return qty * (parseFloat(formData.weightPerBag) || 0);
    }
    return qty;
  };

  const isStockSufficient = () => {
    if (!selectedProduct || !formData.quantity) return true;
    return getQuantityInKg() <= selectedProduct.currentStock;
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto pace-y-8">
          <HeaderComponent
            header="Stock Out"
            subheader="Record outgoing inventory and update stock levels"
          />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading stock data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto space-y-8">
          <HeaderComponent
            header="Stock Out"
            subheader="Record outgoing inventory and update stock levels"
            onRefresh={fetchData}
            loading={dataLoading}
          />

          {/* Navigation & Quick Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gradient-to-r from-red-100 to-red-200 rounded-xl">
                <Package className="w-5 h-5 text-red-700" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Stock Management</span>
                <span>/</span>
                <span className="text-gray-900 font-semibold">Stock Out</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/admin/stock/dashboard")}
                className="btn-secondary btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/stock/in")}
                className="btn-success btn-sm"
              >
                <Package className="w-4 h-4" />
                Stock In
              </button>
              <button
                onClick={() => navigate("/admin/stock/report")}
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
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white text-red-600 bg-opacity-20 rounded-xl">
                      <Minus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Stock Out Details</h2>
                      <p className="text-red-100 text-sm">
                        Record outgoing inventory transactions
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

                  {/* Insufficient Stock Warning */}
                  {selectedProduct &&
                    formData.quantity &&
                    !isStockSufficient() && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-red-800 font-semibold">
                            Insufficient Stock!
                          </p>
                          <p className="text-red-700 text-sm">
                            You're trying to remove{" "}
                            {getQuantityInKg().toFixed(2)} kg but only{" "}
                            {selectedProduct.currentStock.toFixed(2)} kg is
                            available.
                          </p>
                        </div>
                      </div>
                    )}

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Product Selection Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-red-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Product Selection
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Select product and customer details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="productName"
                            value={formData.productName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-medium"
                          >
                            <option value="">Select Product</option>
                            {stockBalance.length > 0 ? (
                              stockBalance.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product._id} (
                                  {(product.currentStock || 0).toFixed(1)} kg
                                  available)
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                No products available
                              </option>
                            )}
                          </select>
                          {errors.productName && (
                            <p className="text-red-600 text-sm flex items-center gap-1 font-medium">
                              <AlertCircle className="w-4 h-4" />
                              {errors.productName}
                            </p>
                          )}
                        </div>

                        {/* Client Selection */}
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Customer/Client{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <select
                                name="clientId"
                                value={formData.clientId}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-medium"
                              >
                                <option value="">Select Client</option>
                                {clients.map((client) => (
                                  <option key={client._id} value={client._id}>
                                    {client.name} ({client.type}) -{" "}
                                    {client.phone}
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
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Stock Availability Alert */}
                      {selectedProduct && (
                        <div
                          className={`p-4 rounded-xl border-2 ${
                            selectedProduct.currentStock < 100
                              ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300"
                              : selectedProduct.currentStock < 500
                              ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300"
                              : "bg-gradient-to-r from-green-50 to-green-100 border-green-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Package
                              className={`w-6 h-6 mt-0.5 ${
                                selectedProduct.currentStock < 100
                                  ? "text-red-600"
                                  : selectedProduct.currentStock < 500
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p
                                  className={`font-bold text-lg ${
                                    selectedProduct.currentStock < 100
                                      ? "text-red-900"
                                      : selectedProduct.currentStock < 500
                                      ? "text-yellow-900"
                                      : "text-green-900"
                                  }`}
                                >
                                  Available Stock:{" "}
                                  {(selectedProduct.currentStock || 0).toFixed(
                                    2
                                  )}{" "}
                                  kg
                                </p>
                                {selectedProduct.currentStock < 100 && (
                                  <span className="px-2 py-1 text-xs font-bold text-red-800 bg-red-200 rounded-full">
                                    CRITICAL
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <p
                                  className={`${
                                    selectedProduct.currentStock < 100
                                      ? "text-red-700"
                                      : selectedProduct.currentStock < 500
                                      ? "text-yellow-700"
                                      : "text-green-700"
                                  }`}
                                >
                                  Equivalent Bags:{" "}
                                  <span className="font-semibold">
                                    {(
                                      (selectedProduct.currentStock || 0) /
                                      (parseFloat(formData.weightPerBag) || 1)
                                    ).toFixed(2)}
                                  </span>
                                </p>
                                <p
                                  className={`${
                                    selectedProduct.currentStock < 100
                                      ? "text-red-700"
                                      : selectedProduct.currentStock < 500
                                      ? "text-yellow-700"
                                      : "text-green-700"
                                  }`}
                                >
                                  Last Updated:{" "}
                                  <span className="font-semibold">
                                    {selectedProduct.lastTransactionDate
                                      ? new Date(
                                          selectedProduct.lastTransactionDate
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </span>
                                </p>
                              </div>
                              {selectedProduct.currentStock < 100 && (
                                <div className="mt-2 p-2 bg-red-100 rounded-lg">
                                  <p className="text-red-800 text-sm font-medium">
                                    ⚠️ Critical stock level! Consider restocking
                                    this item soon.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantity & Pricing Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Quantity & Pricing
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Specify quantity and selling price
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CustomInput2
                          icon={Package}
                          name="quantity"
                          type="number"
                          step="0.01"
                          value={formData.quantity}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          label="Quantity"
                          required
                          error={errors.quantity}
                        />

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Unit <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium"
                          >
                            <option value="kg">Kilogram (kg)</option>
                            <option value="bag">Bag</option>
                          </select>
                        </div>

                        <CustomInput2
                          icon={Calculator}
                          name="rate"
                          type="number"
                          step="0.01"
                          value={formData.rate}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          label="Rate per kg (₹)"
                          required
                          error={errors.rate}
                        />
                      </div>

                      {/* Weight per Bag input */}
                      {formData.unit === "bag" && (
                        <CustomInput2
                          icon={Package}
                          name="weightPerBag"
                          type="number"
                          step="0.01"
                          value={formData.weightPerBag}
                          onChange={handleInputChange}
                          placeholder="Weight per Bag"
                          label="Weight per Bag (kg)"
                          required
                          error={errors.weightPerBag}
                        />
                      )}
                    </div>

                    {/* Additional Information Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-orange-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Additional Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Add reference numbers, date, and notes
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CustomInput2
                          icon={Package}
                          name="invoiceNo"
                          value={formData.invoiceNo}
                          onChange={handleInputChange}
                          placeholder="Invoice/Bill Number"
                          label="Invoice Number"
                        />

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
                              className="w-full px-4 py-3 pl-12 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium"
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
                          placeholder="Additional notes about the stock out..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 font-medium resize-none"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => navigate("/admin/stock/dashboard")}
                        className="btn-secondary flex-1 justify-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !isStockSufficient()}
                        className="btn-danger flex-1 justify-center btn-disabled"
                        style={
                          loading || !isStockSufficient()
                            ? {}
                            : { opacity: 1, cursor: "pointer" }
                        }
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recording...
                          </>
                        ) : (
                          <>
                            <Minus className="w-4 h-4" />
                            Record Stock Out
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
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-red-900 mb-3">
                      Stock Out Calculation
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-red-700 font-medium">
                          Quantity:
                        </span>
                        <span className="font-medium text-red-900 text-base">
                          {formData.quantity || 0} {formData.unit}
                        </span>
                      </div>

                      {formData.unit === "bag" && (
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Weight per Bag:</span>
                          <span className="font-medium text-red-900">
                            {formData.weightPerBag} kg
                          </span>
                        </div>
                      )}

                      {formData.unit === "bag" && (
                        <div className="flex justify-between items-center">
                          <span className="text-red-700">Total Weight:</span>
                          <span className="font-medium text-red-900 text-base">
                            {getQuantityInKg().toFixed(2)} kg
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-red-700">Rate per kg:</span>
                        <span className="font-medium text-red-900">
                          ₹{formData.rate || 0}
                        </span>
                      </div>

                      <div className="border-t border-red-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-red-700 font-semibold text-base">
                            Total Amount:
                          </span>
                          <span className="font-bold text-red-900 text-xl">
                            ₹
                            {calculateAmount().toLocaleString("en-IN", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProduct && (
                    <div
                      className={`p-4 rounded-xl ${
                        isStockSufficient()
                          ? "bg-gradient-to-r from-orange-50 to-orange-100"
                          : "bg-gradient-to-r from-red-50 to-red-100"
                      }`}
                    >
                      <h4
                        className={`font-semibold mb-3 flex items-center gap-2 ${
                          isStockSufficient()
                            ? "text-orange-900"
                            : "text-red-900"
                        }`}
                      >
                        <Package className="w-4 h-4" />
                        Stock Impact
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span
                            className={
                              isStockSufficient()
                                ? "text-orange-700"
                                : "text-red-700"
                            }
                          >
                            Current Stock:
                          </span>
                          <span
                            className={`font-medium ${
                              isStockSufficient()
                                ? "text-orange-900"
                                : "text-red-900"
                            }`}
                          >
                            {(selectedProduct.currentStock || 0).toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              isStockSufficient()
                                ? "text-orange-700"
                                : "text-red-700"
                            }
                          >
                            Removing:
                          </span>
                          <span
                            className={`font-medium ${
                              isStockSufficient()
                                ? "text-orange-900"
                                : "text-red-900"
                            }`}
                          >
                            -{getQuantityInKg().toFixed(2)} kg
                          </span>
                        </div>
                        <div
                          className={`border-t pt-2 mt-2 ${
                            isStockSufficient()
                              ? "border-orange-200"
                              : "border-red-200"
                          }`}
                        >
                          <div className="flex justify-between">
                            <span
                              className={`font-medium ${
                                isStockSufficient()
                                  ? "text-orange-700"
                                  : "text-red-700"
                              }`}
                            >
                              Remaining Stock:
                            </span>
                            <span
                              className={`font-bold text-base ${
                                !isStockSufficient()
                                  ? "text-red-600"
                                  : (selectedProduct.currentStock || 0) -
                                      getQuantityInKg() <
                                    100
                                  ? "text-yellow-600"
                                  : isStockSufficient()
                                  ? "text-orange-900"
                                  : "text-red-600"
                              }`}
                            >
                              {Math.max(
                                0,
                                (selectedProduct.currentStock || 0) -
                                  getQuantityInKg()
                              ).toFixed(2)}{" "}
                              kg
                            </span>
                          </div>
                        </div>
                        {!isStockSufficient() && (
                          <div className="mt-2 p-2 bg-red-200 rounded-lg">
                            <p className="text-red-800 text-xs font-medium">
                              ⚠️ Insufficient stock for this transaction!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Stock Levels */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <h3 className="font-bold">Current Stock Levels</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stockBalance.length > 0 ? (
                      stockBalance.map((product) => (
                        <div
                          key={product._id}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedProduct?._id === product._id
                              ? "bg-blue-50 border-blue-300 shadow-md"
                              : product.currentStock < 100
                              ? "bg-red-50 border-red-200 hover:bg-red-100"
                              : product.currentStock < 500
                              ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              productName: product._id,
                            }));
                            setSelectedProduct(product);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {product._id}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(
                                  (product.currentStock || 0) /
                                  (parseFloat(formData.weightPerBag) || 1)
                                ).toFixed(1)}{" "}
                                bags
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-bold text-sm ${
                                  (product.currentStock || 0) < 100
                                    ? "text-red-600"
                                    : (product.currentStock || 0) < 500
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                }`}
                              >
                                {(product.currentStock || 0).toFixed(1)} kg
                              </p>
                              {(product.currentStock || 0) < 100 && (
                                <span className="text-xs text-red-600 font-bold bg-red-100 px-1 rounded">
                                  CRITICAL
                                </span>
                              )}
                              {(product.currentStock || 0) >= 100 &&
                                (product.currentStock || 0) < 500 && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    Low Stock
                                  </span>
                                )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No stock available
                        </p>
                        <p className="text-gray-400 text-sm">
                          Add some stock first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Stock Out Activities */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    <h3 className="font-bold">Recent Stock Out</h3>
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
                                {transaction.productName}
                              </h4>
                              <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-1 rounded">
                                -{transaction.quantity} kg
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600 truncate">
                                {transaction.clientName || "No client"}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ₹{transaction.amount?.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{formatDate(transaction.date)}</span>
                              {transaction.invoiceNo && (
                                <span>Invoice: {transaction.invoiceNo}</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <TrendingDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">
                            No recent activities
                          </p>
                          <p className="text-gray-400 text-sm">
                            Activities will appear here
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
        }}
        defaultType="Customer"
      />
    </>
  );
};

export default StockOut;
