import React, { useState } from "react";
import {
  Plus,
  User,
  Phone,
  MapPin,
  Users,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";

const AddClient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    type: "Customer",
    currentBalance: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.type) {
      newErrors.type = "Client type is required";
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
        currentBalance: formData.currentBalance
          ? parseFloat(formData.currentBalance)
          : 0,
      };

      const response = await clientAPI.createClient(submitData);

      setSuccessMessage("Client added successfully!");

      // Reset form
      setFormData({
        name: "",
        phone: "",
        address: "",
        type: "Customer",
        currentBalance: "",
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Add client error:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to add client",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Add Client"
        subheader="Add new customer or supplier"
        removeRefresh={true}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Client Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Add Client</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/clients/dashboard")}
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
          <SectionCard
            title="Client Information"
            icon={Plus}
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
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={User}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Client Name"
                    label="Client Name"
                    error={errors.name}
                    theme="white"
                  />

                  <FormInput
                    icon={Phone}
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone Number"
                    label="Phone Number"
                    error={errors.phone}
                    theme="white"
                  />
                </div>

                <FormInput
                  icon={MapPin}
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address (Optional)"
                  label="Address"
                  theme="white"
                />
              </div>

              {/* Client Type & Balance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Client Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Type
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    >
                      <option value="Customer">Customer</option>
                      <option value="Supplier">Supplier</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.type}
                      </p>
                    )}
                  </div>

                  <FormInput
                    icon={IndianRupee}
                    name="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    label="Opening Balance (₹)"
                    theme="white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/admin/clients/dashboard")}
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
                      Adding Client...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <SectionCard title="Client Summary" icon={User} headerColor="blue">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">
                  Client Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Name:</span>
                    <span className="font-medium text-blue-900">
                      {formData.name || "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Phone:</span>
                    <span className="font-medium text-blue-900">
                      {formData.phone || "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Type:</span>
                    <span className="font-medium text-blue-900">
                      {formData.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Opening Balance:</span>
                    <span className="font-bold text-blue-900">
                      ₹
                      {formData.currentBalance
                        ? parseFloat(formData.currentBalance).toLocaleString()
                        : "0"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3">
                  Client Types
                </h4>
                <div className="space-y-2 text-sm text-green-800">
                  <p>
                    <strong>Customer:</strong> Buys products/services from you
                  </p>
                  <p>
                    <strong>Supplier:</strong> Provides products/services to you
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                <h4 className="font-semibold text-orange-900 mb-3">
                  Opening Balance
                </h4>
                <div className="space-y-2 text-sm text-orange-800">
                  <p>• Positive: Client owes you money</p>
                  <p>• Negative: You owe client money</p>
                  <p>• Zero: No outstanding balance</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AddClient;
