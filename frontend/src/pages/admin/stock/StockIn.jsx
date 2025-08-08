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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stockAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";

const StockIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    productName: "",
    quantity: "",
    unit: "kg",
    rate: "",
    clientName: "",
    invoiceNo: "",
    notes: "",
    weightPerBag: 40,
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [existingProducts, setExistingProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch existing products and recent transactions
  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [balanceResponse, transactionsResponse] = await Promise.all([
        stockAPI.getBalance(),
        stockAPI.getTransactions({ limit: 5, type: "IN" }),
      ]);

      // Handle balance data
      if (balanceResponse.data?.success) {
        setExistingProducts(
          Array.isArray(balanceResponse.data.data)
            ? balanceResponse.data.data
            : []
        );
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await stockAPI.addStockIn(formData);

      if (response.data.success) {
        setSuccessMessage("Stock added successfully!");

        setFormData({
          productName: "",
          quantity: "",
          unit: "kg",
          rate: "",
          clientName: "",
          invoiceNo: "",
          notes: "",
        });

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

  return (
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
            onClick={() => navigate("/admin/stock/report")}
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
          <SectionCard title="Stock In Details" icon={Plus} headerColor="green">
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
                      Product Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="productName"
                        value={formData.productName}
                        onChange={handleInputChange}
                        placeholder="e.g., PVC Compound Grade A"
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                        list="existing-products"
                      />
                      <datalist id="existing-products">
                        {existingProducts.map((product) => (
                          <option key={product._id} value={product._id} />
                        ))}
                      </datalist>
                      <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      {errors.productName && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.productName}
                        </p>
                      )}
                    </div>
                  </div>

                  <FormInput
                    icon={Package}
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Supplier/Client Name"
                    label="Supplier/Client Name"
                    theme="white"
                  />
                </div>
              </div>

              {/* Quantity & Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Quantity & Pricing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    icon={Package}
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    label="Quantity"
                    error={errors.quantity}
                    theme="white"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit
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

                  <FormInput
                    icon={Calculator}
                    name="rate"
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    label="Rate per kg (₹)"
                    error={errors.rate}
                    theme="white"
                  />
                </div>

                {/* Show only if unit is 'bag' */}
                {formData.unit === "bag" && (
                  <FormInput
                    icon={Package}
                    name="weightPerBag"
                    type="number"
                    step="0.01"
                    value={formData.weightPerBag}
                    onChange={handleInputChange}
                    placeholder="Weight per Bag"
                    label="Weight per Bag (kg)"
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
                  <FormInput
                    icon={Package}
                    name="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={handleInputChange}
                    placeholder="Invoice/Bill Number"
                    label="Invoice Number"
                    theme="white"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
                      <span className="text-gray-900">
                        {new Date().toLocaleDateString()}
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
                    placeholder="Additional notes about the stock..."
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
                      Add Stock In
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
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">
                  Calculation
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Quantity:</span>
                    <span className="font-medium text-blue-900">
                      {formData.quantity || 0} {formData.unit}
                    </span>
                  </div>

                  {formData.unit === "bag" && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">In Kg:</span>
                      <span className="font-medium text-blue-900">
                        {getQuantityInKg()} kg
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-blue-700">Rate per kg:</span>
                    <span className="font-medium text-blue-900">
                      ₹{formData.rate || 0}
                    </span>
                  </div>

                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">
                        Total Amount:
                      </span>
                      <span className="font-bold text-blue-900 text-lg">
                        ₹{calculateAmount().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3">
                  Stock Impact
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Adding to Stock:</span>
                    <span className="font-medium text-green-900">
                      +{getQuantityInKg()} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Product:</span>
                    <span className="font-medium text-green-900 truncate">
                      {formData.productName || "Not specified"}
                    </span>
                  </div>
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
                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {transaction.productName}
                        </h4>
                        <span className="text-xs text-green-600 font-medium">
                          +{transaction.quantity} kg
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 truncate">
                          {transaction.clientName || "No client"}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₹{transaction.amount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(transaction.date).toLocaleDateString()}
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
  );
};

export default StockIn;
