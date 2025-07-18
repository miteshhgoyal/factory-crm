import React, { useState } from "react";
import {
  MinusCircle,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Eye,
  CreditCard,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cashFlowAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";

const CashOut = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: "",
    category: "Purchase",
    description: "",
    employeeName: "",
    paymentMode: "Cash",
    transactionId: "",
    isOnline: false,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const categories = [
    "Purchase",
    "Salary",
    "Utilities",
    "Rent",
    "Transportation",
    "Marketing",
    "Maintenance",
    "Professional Services",
    "Tax",
    "Loan Payment",
    "Miscellaneous",
  ];

  const paymentModes = ["Cash", "Bank Transfer", "Cheque", "Online", "UPI"];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.isOnline && user.role !== "superadmin") {
      newErrors.isOnline = "Only superadmin can create online transactions";
    }

    if (
      (formData.paymentMode === "Online" || formData.paymentMode === "UPI") &&
      !formData.transactionId.trim()
    ) {
      newErrors.transactionId =
        "Transaction ID is required for online payments";
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
      const response = await cashFlowAPI.addCashOut(formData);

      setSuccessMessage("Cash out recorded successfully!");

      setFormData({
        amount: "",
        category: "Purchase",
        description: "",
        employeeName: "",
        paymentMode: "Cash",
        transactionId: "",
        isOnline: false,
        notes: "",
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to record cash out",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Add Cash Out"
        subheader="Record cash outflow transactions"
        removeRefresh={true}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>Cash Flow Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Cash Out</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/cash/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/cash/in")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <DollarSign className="w-4 h-4" />
            Cash In
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Cash Out Details"
            icon={MinusCircle}
            headerColor="red"
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
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Transaction Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={DollarSign}
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    label="Amount (₹)"
                    error={errors.amount}
                    theme="white"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <FormInput
                  icon={DollarSign}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description of the cash outflow"
                  label="Description"
                  error={errors.description}
                  theme="white"
                />
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Mode
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

                  <FormInput
                    icon={CreditCard}
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    placeholder="Transaction/Reference ID"
                    label="Transaction ID"
                    error={errors.transactionId}
                    theme="white"
                  />
                </div>

                <FormInput
                  icon={User}
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  placeholder="Employee name (if applicable)"
                  label="Employee Name"
                  theme="white"
                />
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {user.role === "superadmin" && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isOnline"
                          checked={formData.isOnline}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Online Transaction
                        </span>
                      </label>
                      {errors.isOnline && (
                        <p className="text-red-600 text-sm">
                          {errors.isOnline}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording Cash Out...
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-4 h-4 mr-2" />
                      Record Cash Out
                    </>
                  )}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <SectionCard
            title="Transaction Summary"
            icon={DollarSign}
            headerColor="blue"
          >
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                <h4 className="font-semibold text-red-900 mb-3">
                  Cash Outflow
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Amount:</span>
                    <span className="font-bold text-red-900 text-lg">
                      ₹
                      {formData.amount
                        ? parseFloat(formData.amount).toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Category:</span>
                    <span className="font-medium text-red-900">
                      {formData.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Payment Mode:</span>
                    <span className="font-medium text-red-900">
                      {formData.paymentMode}
                    </span>
                  </div>
                  {formData.isOnline && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Type:</span>
                      <span className="font-medium text-blue-600">
                        Online Transaction
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                <h4 className="font-semibold text-orange-900 mb-3">
                  Guidelines
                </h4>
                <div className="space-y-2 text-sm text-orange-800">
                  <p>• Enter accurate amount and description</p>
                  <p>• Select appropriate expense category</p>
                  <p>• Provide transaction ID for online payments</p>
                  <p>• Include employee name if expense is for salary</p>
                  {user.role === "superadmin" && (
                    <p>• Only you can mark transactions as online</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default CashOut;
