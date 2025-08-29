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
  User,
  Phone,
  MapPin,
  Info,
  Factory,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI, clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";
import Modal from "../../../components/ui/Modal";
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

  // Production Report states
  const [lastCreatedTransactionId, setLastCreatedTransactionId] =
    useState(null);
  const [showProductionReportModal, setShowProductionReportModal] =
    useState(false);
  const [addReportAfterSubmit, setAddReportAfterSubmit] = useState(false);

  // Modal states
  const [createClientModal, setCreateClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    name: "",
    phone: "",
    address: "",
    type: "Supplier",
  });
  const [clientFormLoading, setClientFormLoading] = useState(false);

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
      const submitData = {
        ...clientFormData,
      };

      const response = await clientAPI.createClient(submitData);

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

        // Close modal and reset form
        setCreateClientModal(false);
        setClientFormData({
          name: "",
          phone: "",
          address: "",
          type: "Supplier",
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
        newErrors.clientName = "Client is required for purchased stock";
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
      <div className="space-y-6">
        <HeaderComponent
          header="Add Stock In"
          subheader="Record incoming inventory and update stock levels"
          onRefresh={fetchData}
          loading={dataLoading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>Stock Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Stock In</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/stock/dashboard")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={() => navigate("/admin/stock/out")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Stock Out</span>
              <span className="sm:hidden">Out</span>
            </button>
            <button
              onClick={() => navigate("/admin/reports/production-account")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Production Reports</span>
              <span className="sm:hidden">Reports</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-3">
            <SectionCard
              title="Stock In Details"
              icon={Plus}
              headerColor="green"
            >
              {/* Stock Source Toggle */}
              <div className="mb-6">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => handleStockSourceChange("PURCHASED")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      stockSource === "PURCHASED"
                        ? "bg-white text-blue-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Purchased Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStockSourceChange("MANUFACTURED")}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      stockSource === "MANUFACTURED"
                        ? "bg-white text-green-600 shadow-md"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Factory className="w-4 h-4" />
                    Manufactured Stock
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
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
                      <h4 className="font-medium text-green-900 mb-2">
                        Production Report
                      </h4>
                      <p className="text-sm text-green-700 mb-3">
                        Create a comprehensive production report with quality
                        tests, process parameters, raw materials, and compliance
                        data for this manufactured batch.
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
                          Add detailed production report after creating stock
                          entry
                        </span>
                      </label>
                      {addReportAfterSubmit && (
                        <div className="mt-2 p-2 bg-green-100 rounded-lg">
                          <p className="text-xs text-green-700">
                            ✓ Production report form will open automatically
                            after stock creation
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                {/* Product Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Product Information
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Product Name *
                      </label>
                      <div className="relative">
                        <select
                          name="productName"
                          value={
                            isNewProduct ? "__NEW__" : formData.productName
                          }
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                        >
                          <option value="">Select Product</option>
                          {currentProducts.length > 0 ? (
                            currentProducts.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product._id} (Current Stock:{" "}
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
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.productName}
                          </p>
                        )}
                      </div>

                      {/* Show text input if "Enter New Product Name" is selected */}
                      {isNewProduct && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={formData.productName}
                            onChange={handleNewProductChange}
                            placeholder="Enter new product name"
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200"
                          />
                          <p className="text-xs text-green-600 mt-1">
                            💡 This will create a new product in your inventory
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Client Selection - Only for purchased stock */}
                    {stockSource === "PURCHASED" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Supplier/Client *
                        </label>
                        <div className="flex gap-2">
                          <select
                            name="clientId"
                            value={formData.clientId}
                            onChange={handleInputChange}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200 w-full"
                          >
                            <option value="">Select Client</option>
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
                        {errors.clientName && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.clientName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Product Information Alert */}
                  {selectedProduct && !isNewProduct && (
                    <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300">
                      <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-lg text-blue-900">
                              Existing Product: {selectedProduct._id}
                            </p>
                            <span className="px-2 py-1 text-xs font-bold text-blue-800 bg-blue-200 rounded-full">
                              IN STOCK
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-blue-700">
                                Current Stock:{" "}
                                <span className="font-semibold">
                                  {(selectedProduct.currentStock || 0).toFixed(
                                    2
                                  )}{" "}
                                  kg
                                </span>
                              </p>
                            </div>
                            <div>
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
                          <div className="mt-2 p-2 bg-blue-100 rounded-lg">
                            <p className="text-blue-800 text-sm font-medium">
                              📦 Adding {stockSource.toLowerCase()} stock to
                              existing product. New total will be:{" "}
                              {(
                                (selectedProduct.currentStock || 0) +
                                getQuantityInKg()
                              ).toFixed(2)}{" "}
                              kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* New Product Alert */}
                  {isNewProduct && formData.productName && (
                    <div className="p-4 rounded-xl border-2 bg-gradient-to-r from-green-50 to-green-100 border-green-300">
                      <div className="flex items-start gap-3">
                        <Plus className="w-6 h-6 mt-0.5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-bold text-lg text-green-900 mb-2">
                            New Product: {formData.productName}
                          </p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-green-700">
                                Starting Stock:{" "}
                                <span className="font-semibold">
                                  {getQuantityInKg().toFixed(2)} kg
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-green-700">
                                Stock Type:{" "}
                                <span className="font-semibold">
                                  {stockSource}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-green-100 rounded-lg">
                            <p className="text-green-800 text-sm font-medium">
                              🆕 Creating new {stockSource.toLowerCase()}{" "}
                              product in inventory with initial stock of{" "}
                              {getQuantityInKg().toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quantity & Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Quantity {stockSource === "PURCHASED" && "& Pricing"}
                  </h3>

                  <div
                    className={`grid grid-cols-1 ${
                      stockSource === "PURCHASED"
                        ? "md:grid-cols-3"
                        : "md:grid-cols-2"
                    } gap-4`}
                  >
                    <FormInput
                      icon={Package}
                      name="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      label="Quantity *"
                      error={errors.quantity}
                      theme="white"
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Unit *
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                      >
                        <option value="kg">Kilogram (kg)</option>
                        <option value="bag">Bag</option>
                      </select>
                    </div>

                    {stockSource === "PURCHASED" && (
                      <FormInput
                        icon={Calculator}
                        name="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        label="Rate per kg (₹) *"
                        error={errors.rate}
                        theme="white"
                      />
                    )}
                  </div>

                  {/* Weight per Bag input */}
                  {formData.unit === "bag" && (
                    <FormInput
                      icon={Package}
                      name="weightPerBag"
                      type="number"
                      step="0.01"
                      value={formData.weightPerBag}
                      onChange={handleInputChange}
                      placeholder="Weight per Bag"
                      label="Weight per Bag (kg) *"
                      error={errors.weightPerBag}
                      theme="white"
                    />
                  )}
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Additional Information
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {stockSource === "PURCHASED" ? (
                      <FormInput
                        icon={Package}
                        name="invoiceNo"
                        value={formData.invoiceNo}
                        onChange={handleInputChange}
                        placeholder="Invoice/Bill Number"
                        label="Invoice Number"
                        theme="white"
                      />
                    ) : (
                      <FormInput
                        icon={Package}
                        name="invoiceNo"
                        value={formData.invoiceNo}
                        onChange={handleInputChange}
                        placeholder="Batch/Production Number"
                        label="Batch Number"
                        theme="white"
                      />
                    )}

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
                      placeholder={`Additional notes about the ${stockSource.toLowerCase()} stock...`}
                      rows={3}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/stock/dashboard")}
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
            </SectionCard>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-2 space-y-6">
            {/* Calculation Summary */}
            <SectionCard title="Summary" icon={Calculator} headerColor="blue">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
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
                        <span className="text-green-700">Weight per Bag:</span>
                        <span className="font-medium text-green-900">
                          {formData.weightPerBag} kg
                        </span>
                      </div>
                    )}

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

                    {stockSource === "MANUFACTURED" && (
                      <div className="border-t border-green-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-semibold text-base">
                            Manufacturing Cost:
                          </span>
                          <span className="font-bold text-green-900 text-base">
                            Not Tracked
                          </span>
                        </div>
                        {addReportAfterSubmit && (
                          <div className="mt-2 p-2 bg-green-200 rounded-lg">
                            <span className="text-green-800 text-xs font-medium">
                              📋 Production report will be created
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Stock Impact
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Adding to Stock:</span>
                      <span className="font-medium text-blue-900">
                        +{getQuantityInKg().toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Stock Type:</span>
                      <span className="font-medium text-blue-900">
                        {stockSource}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Product:</span>
                      <span className="font-medium text-blue-900 truncate">
                        {isNewProduct && formData.productName
                          ? "New Product"
                          : formData.productName || "Not specified"}
                      </span>
                    </div>
                    {selectedProduct && !isNewProduct && (
                      <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                        <span className="text-blue-700 font-medium">
                          New Total:
                        </span>
                        <span className="font-bold text-blue-900">
                          {(
                            (selectedProduct.currentStock || 0) +
                            getQuantityInKg()
                          ).toFixed(2)}{" "}
                          kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Unit Conversion
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">1 Bag:</span>
                      <span className="font-medium text-gray-900">
                        {formData.weightPerBag} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Current Unit:</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {formData.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Current Stock Products */}
            <SectionCard
              title="Current Stock Products"
              icon={Package}
              headerColor="gray"
            >
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
                    <p className="text-gray-400 text-sm">
                      Start by adding your first product
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Recent Stock In Activities */}
            <SectionCard
              title="Recent Stock In"
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
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 truncate">
                            {transaction.clientName || "No client"}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {transaction.amount
                              ? `₹${transaction.amount?.toLocaleString(
                                  "en-IN"
                                )}`
                              : "No cost"}
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
                      <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        No recent stock in activities
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

      {/* Create Client Modal - Only show for purchased stock */}
      {stockSource === "PURCHASED" && (
        <Modal
          isOpen={createClientModal}
          onClose={() => setCreateClientModal(false)}
          title="Create New Client"
          subtitle="Add a new supplier or customer"
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
                <option value="Supplier">Supplier</option>
                <option value="Customer">Customer</option>
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
          console.log("Production report created:", report);
          setSuccessMessage("Production report created successfully!");
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </>
  );
};

export default StockIn;
