import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Package,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calculator,
  ArrowLeft,
  Eye,
  TrendingUp,
  Info,
  Factory,
  ShoppingCart,
  ClipboardList,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI, clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import CustomInput2 from "../../../components/ui/CustomInput2";
import AddClientModal from "../../../components/modals/AddClientModal";
import ProductionReportModal from "../../../components/modals/ProductionReportModal";
import { formatDate } from "../../../utils/dateUtils";

const StockIn = () => {
  const navigate = useNavigate();
  const [stockSource, setStockSource] = useState("PURCHASED");
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
    stockSource: "PURCHASED",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [currentProducts, setCurrentProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [createClientModal, setCreateClientModal] = useState(false);

  // Production Report states
  const [lastCreatedTransactionId, setLastCreatedTransactionId] =
    useState(null);
  const [showProductionReportModal, setShowProductionReportModal] =
    useState(false);
  const [addReportAfterSubmit, setAddReportAfterSubmit] = useState(false);

  // Fetch current products, recent transactions, and clients
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [productsResponse, transactionsResponse, clientsResponse] =
        await Promise.all([
          stockAPI.getProducts(),
          stockAPI.getTransactions({ limit: 5, type: "IN" }),
          clientAPI.getClients({ limit: 100 }),
        ]);

      // Handle products data
      if (productsResponse.data?.success) {
        setCurrentProducts(
          Array.isArray(productsResponse.data.data)
            ? productsResponse.data.data
            : []
        );
      } else {
        setCurrentProducts([]);
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
      console.error("Failed to fetch data:", error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStockSourceChange = (source) => {
    setStockSource(source);
    setFormData((prev) => ({
      ...prev,
      stockSource: source,
      // Reset purchased-specific fields when switching to manufactured
      ...(source === "MANUFACTURED"
        ? {
            rate: "",
            clientName: "",
            clientId: "",
            invoiceNo: "",
          }
        : {}),
    }));
    setErrors({});
    // Reset production report checkbox when changing source
    if (source !== "MANUFACTURED") {
      setAddReportAfterSubmit(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "productName") {
      if (value === "__NEW__") {
        setIsNewProduct(true);
        setFormData((prev) => ({ ...prev, [name]: "" }));
        setSelectedProduct(null);
        return;
      } else if (value === "") {
        setIsNewProduct(false);
        setSelectedProduct(null);
      } else {
        setIsNewProduct(false);
        const product = currentProducts.find((p) => p._id === value);
        setSelectedProduct(product || null);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

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

  const handleNewProductChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, productName: value }));
    setSelectedProduct(null);

    if (errors.productName) {
      setErrors((prev) => ({ ...prev, productName: "" }));
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

    // Validation based on stock source
    if (stockSource === "PURCHASED") {
      if (!formData.rate || formData.rate <= 0) {
        newErrors.rate = "Valid rate is required for purchased stock";
      }
      if (!formData.clientId) {
        newErrors.clientId = "Client is required for purchased stock";
      }
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
      const submitData = {
        ...formData,
        quantity: Math.round(formData.quantity),
        weightPerBag: Math.round(formData.weightPerBag),
        stockSource,
      };

      // Only include rate for purchased stock
      if (stockSource === "PURCHASED") {
        submitData.rate = Math.round(formData.rate);
      }

      const response = await stockAPI.addStockIn(submitData);

      if (response.data.success) {
        const stockType =
          stockSource === "MANUFACTURED" ? "Manufactured" : "Purchased";
        setSuccessMessage(`${stockType} stock added successfully!`);

        // Store the created transaction for production report
        const createdTransaction = response.data.data;
        setLastCreatedTransactionId(createdTransaction._id);

        // Reset form
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
          stockSource,
          date: new Date().toISOString().split("T")[0],
        });
        setSelectedProduct(null);
        setIsNewProduct(false);

        // Show production report modal if manufactured and checkbox was checked
        if (stockSource === "MANUFACTURED" && addReportAfterSubmit) {
          setTimeout(() => {
            setShowProductionReportModal(true);
          }, 500);
        }

        // Refresh data
        fetchData();

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to add stock",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = () => {
    if (stockSource === "PURCHASED" && formData.quantity && formData.rate) {
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

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="mx-auto space-y-8">
          <HeaderComponent
            header="Add Stock In"
            subheader="Record incoming inventory and update stock levels"
            onRefresh={fetchData}
            loading={dataLoading}
          />

          {/* Navigation & Quick Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                <Package className="w-5 h-5 text-green-700" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Stock Management</span>
                <span>/</span>
                <span className="text-gray-900 font-semibold">Stock In</span>
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
                onClick={() => navigate("/admin/stock/out")}
                className="btn-danger btn-sm"
              >
                <Package className="w-4 h-4" />
                Stock Out
              </button>
              <button
                onClick={() => navigate("/admin/reports/production-account")}
                className="btn-primary btn-sm"
              >
                <Eye className="w-4 h-4" />
                Production Reports
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
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Stock In Details</h2>
                      <p className="text-green-100 text-sm">
                        Record incoming inventory transactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Stock Source Toggle */}
                  <div className="mb-8">
                    <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-2 shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleStockSourceChange("PURCHASED")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          stockSource === "PURCHASED"
                            ? "bg-white text-blue-600 shadow-md transform scale-105"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        Purchased Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockSourceChange("MANUFACTURED")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          stockSource === "MANUFACTURED"
                            ? "bg-white text-green-600 shadow-md transform scale-105"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Factory className="w-5 h-5" />
                        Manufactured Stock
                      </button>
                    </div>
                    <div className="mt-3 text-center text-sm text-gray-600">
                      {stockSource === "PURCHASED"
                        ? "Record stock purchased from suppliers with pricing details"
                        : "Record internally manufactured stock without pricing"}
                    </div>
                  </div>

                  {/* Production Report Option - Only for manufactured stock */}
                  {stockSource === "MANUFACTURED" && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <ClipboardList className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-2">
                            Production Report
                          </h4>
                          <p className="text-sm text-green-700 mb-3">
                            Create a comprehensive production report with
                            quality tests, process parameters, raw materials,
                            and compliance data for this manufactured batch.
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={addReportAfterSubmit}
                              onChange={(e) =>
                                setAddReportAfterSubmit(e.target.checked)
                              }
                              className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-green-800">
                              Add detailed production report after creating
                              stock entry
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {/* Product Information Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Product Information
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Select product and{" "}
                          {stockSource === "PURCHASED"
                            ? "supplier"
                            : "manufacturing"}{" "}
                          details
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Product Name <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="productName"
                            value={
                              isNewProduct ? "__NEW__" : formData.productName
                            }
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                          >
                            <option value="">Select Product</option>
                            {currentProducts.length > 0 ? (
                              currentProducts.map((product) => (
                                <option key={product._id} value={product._id}>
                                  {product._id} (Current:{" "}
                                  {(product.currentStock || 0).toFixed(1)} kg)
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>
                                No products available
                              </option>
                            )}
                            <option value="__NEW__">
                              + Enter New Product Name
                            </option>
                          </select>
                          {errors.productName && (
                            <p className="text-red-600 text-sm flex items-center gap-1 font-medium">
                              <AlertCircle className="w-4 h-4" />
                              {errors.productName}
                            </p>
                          )}
                        </div>

                        {/* Client Selection - Only for purchased stock */}
                        {stockSource === "PURCHASED" && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Supplier/Client{" "}
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
                        )}
                      </div>

                      {/* New Product Input */}
                      {isNewProduct && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <CustomInput2
                            name="productName"
                            value={formData.productName}
                            onChange={handleNewProductChange}
                            placeholder="Enter new product name"
                            label="New Product Name"
                          />
                          <p className="text-green-600 text-sm mt-2">
                            💡 This will create a new product in your inventory
                          </p>
                        </div>
                      )}

                      {/* Product Info Display */}
                      {selectedProduct && !isNewProduct && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <div className="flex items-start gap-3">
                            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-blue-900">
                                  {selectedProduct._id}
                                </h4>
                                <span className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-200 rounded-full">
                                  IN STOCK
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <p className="text-blue-700">
                                  Current Stock:{" "}
                                  <span className="font-semibold">
                                    {(
                                      selectedProduct.currentStock || 0
                                    ).toFixed(2)}{" "}
                                    kg
                                  </span>
                                </p>
                                <p className="text-blue-700">
                                  Equivalent Bags:{" "}
                                  <span className="font-semibold">
                                    {(
                                      (selectedProduct.currentStock || 0) /
                                      (parseFloat(formData.weightPerBag) || 1)
                                    ).toFixed(2)}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantity & Pricing Section */}
                    <div className="space-y-6">
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Quantity {stockSource === "PURCHASED" && "& Pricing"}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Specify quantity
                          {stockSource === "PURCHASED" ? " and cost" : ""}{" "}
                          details
                        </p>
                      </div>

                      <div
                        className={`grid grid-cols-1 ${
                          stockSource === "PURCHASED"
                            ? "md:grid-cols-3"
                            : "md:grid-cols-2"
                        } gap-6`}
                      >
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

                        {stockSource === "PURCHASED" && (
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
                        )}
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
                          placeholder={
                            stockSource === "PURCHASED"
                              ? "Invoice/Bill Number"
                              : "Batch/Production Number"
                          }
                          label={
                            stockSource === "PURCHASED"
                              ? "Invoice Number"
                              : "Batch Number"
                          }
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
                          placeholder={`Additional notes about the ${stockSource.toLowerCase()} stock...`}
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
                        disabled={loading}
                        className="btn-success flex-1 justify-center btn-disabled"
                        style={loading ? {} : { opacity: 1, cursor: "pointer" }}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding Stock...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add{" "}
                            {stockSource === "MANUFACTURED"
                              ? "Manufactured"
                              : "Purchased"}{" "}
                            Stock
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
                    <h3 className="font-bold">Stock Summary</h3>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-900 mb-3">
                      Stock In Summary ({stockSource})
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700">Quantity:</span>
                        <span className="font-medium text-green-900 text-base">
                          {formData.quantity || 0} {formData.unit}
                        </span>
                      </div>
                      {formData.unit === "bag" && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Total Weight:</span>
                          <span className="font-medium text-green-900 text-base">
                            {getQuantityInKg().toFixed(2)} kg
                          </span>
                        </div>
                      )}
                      {stockSource === "PURCHASED" && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-green-700">Rate per kg:</span>
                            <span className="font-medium text-green-900">
                              ₹{formData.rate || 0}
                            </span>
                          </div>
                          <div className="border-t border-green-200 pt-3 mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-green-700 font-semibold text-base">
                                Total Amount:
                              </span>
                              <span className="font-bold text-green-900 text-xl">
                                ₹
                                {calculateAmount().toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Products */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <h3 className="font-bold">Current Products</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentProducts.length > 0 ? (
                      currentProducts.map((product) => (
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
                            setIsNewProduct(false);
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
                                  LOW
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
                          No products in stock
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <h3 className="font-bold">Recent Stock In</h3>
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
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded">
                                  +{transaction.quantity} kg
                                </span>
                                {transaction.stockSource && (
                                  <span
                                    className={`text-xs font-bold px-2 py-1 rounded ${
                                      transaction.stockSource === "MANUFACTURED"
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-purple-100 text-purple-600"
                                    }`}
                                  >
                                    {transaction.stockSource === "MANUFACTURED"
                                      ? "MFG"
                                      : "PUR"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{formatDate(transaction.date)}</span>
                              <span className="font-semibold text-gray-900">
                                {transaction.amount
                                  ? `₹${transaction.amount?.toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "No cost"}
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

      {/* Add Client Modal - Only for purchased stock */}
      {stockSource === "PURCHASED" && (
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
          defaultType="Supplier"
        />
      )}

      {/* Production Report Modal */}
      <ProductionReportModal
        isOpen={showProductionReportModal}
        onClose={() => {
          setShowProductionReportModal(false);
          setLastCreatedTransactionId(null);
          setAddReportAfterSubmit(false);
        }}
        stockTransactionId={lastCreatedTransactionId}
        stockTransaction={
          lastCreatedTransactionId
            ? {
                _id: lastCreatedTransactionId,
                productName: formData.productName || "New Product",
                quantity: getQuantityInKg(),
                unit: "kg",
                stockSource: stockSource,
              }
            : null
        }
        onReportCreated={(report) => {
          setSuccessMessage("Production report created successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </>
  );
};

export default StockIn;
