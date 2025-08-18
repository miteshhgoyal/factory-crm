import React, { useState, useEffect } from "react";
import {
  Plus,
  Receipt,
  IndianRupee,
  User,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { expenseAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";
import { formatDate } from "../../../utils/dateUtils";

const paymentModes = ["Cash", "Cheque", "Online"];

const AddExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    description: "",
    employeeName: "",
    billNo: "",
    date: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    transactionId: "",
  });

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

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

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
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
        amount: Math.round(formData.amount),
      };

      const response = await expenseAPI.addExpense(submitData);

      setSuccessMessage("Expense added successfully!");

      // Reset form
      setFormData({
        category: "",
        amount: "",
        description: "",
        employeeName: "",
        billNo: "",
        date: new Date().toISOString().split("T")[0],
        paymentMode: "Cash",
        transactionId: "",
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Add expense error:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to add expense",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Add Expense"
        subheader="Record new business expense"
        removeRefresh={true}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Receipt className="w-4 h-4" />
          <span>Expense Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Add Expense</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/expenses/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <SectionCard title="Expense Details" icon={Plus} headerColor="green">
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
                  Expense Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormInput
                      icon={IndianRupee}
                      name="category"
                      type="text"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Expense Category"
                      label="Category"
                      error={errors.category}
                      theme="white"
                    />
                  </div>

                  <FormInput
                    icon={IndianRupee}
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    label="Amount (₹)"
                    error={errors.amount}
                    theme="white"
                  />
                </div>

                <FormInput
                  icon={FileText}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description of the expense"
                  label="Description"
                  error={errors.description}
                  theme="white"
                />
              </div>

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

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={User}
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    placeholder="Employee name (optional)"
                    label="Employee Name"
                    theme="white"
                  />

                  <FormInput
                    icon={Receipt}
                    name="billNo"
                    value={formData.billNo}
                    onChange={handleInputChange}
                    placeholder="Bill/Invoice number (optional)"
                    label="Bill Number"
                    theme="white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={Calendar}
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    label="Expense Date"
                    error={errors.date}
                    theme="white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/admin/expenses/dashboard")}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:shadow-lg transition-all"
                  disabled={loading}
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Expense...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
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
            title="Expense Summary"
            icon={Receipt}
            headerColor="blue"
          >
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
                <h4 className="font-semibold text-red-900 mb-3">
                  Expense Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Amount:</span>
                    <span className="font-bold text-red-900 text-lg">
                      ₹
                      {formData.amount
                        ? parseFloat(formData.amount || 0).toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Category:</span>
                    <span className="font-medium text-red-900">
                      {formData.category || "Not Added Yet"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Date:</span>
                    <span className="font-medium text-red-900">
                      {formData.date ? formatDate(formData.date) : "Not set"}
                    </span>
                  </div>
                  {formData.employeeName && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Employee:</span>
                      <span className="font-medium text-red-900">
                        {formData.employeeName}
                      </span>
                    </div>
                  )}
                  {formData.billNo && (
                    <div className="flex justify-between">
                      <span className="text-red-700">Bill No:</span>
                      <span className="font-medium text-red-900">
                        {formData.billNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">Guidelines</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Add appropriate category for better tracking</p>
                  <p>• Enter accurate amount and description</p>
                  <p>• Include bill number if available</p>
                  <p>• Add employee name for reimbursements</p>
                  {user?.role === "superadmin" && (
                    <p>• Only you can set edit permissions</p>
                  )}
                </div>
              </div>

              {user?.role === "superadmin" && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-3">
                    Admin Features
                  </h4>
                  <div className="space-y-2 text-sm text-purple-800">
                    <p>• You can allow editing for specific expenses</p>
                    <p>• Edit permissions can be modified later</p>
                    <p>• Users can only edit their own expenses if allowed</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
