import React, { useState } from "react";
import {
  UserPlus,
  User,
  Phone,
  MapPin,
  CreditCard,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Clock,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";

const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    phone: "",
    address: "",
    aadharNo: "",
    panNo: "",
    paymentType: "fixed",
    basicSalary: "",
    hourlyRate: "",
    workingDays: "26",
    workingHours: "9",
    bankAccount: {
      accountNo: "",
      ifsc: "",
      bankName: "",
      branch: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("bankAccount.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (formData.paymentType === "fixed") {
      if (!formData.basicSalary || formData.basicSalary <= 0) {
        newErrors.basicSalary =
          "Basic salary is required for fixed payment type";
      }
    } else if (formData.paymentType === "hourly") {
      if (!formData.hourlyRate || formData.hourlyRate <= 0) {
        newErrors.hourlyRate =
          "Hourly rate is required for hourly payment type";
      }
    }

    if (
      formData.aadharNo &&
      !/^\d{12}$/.test(formData.aadharNo.replace(/\D/g, ""))
    ) {
      newErrors.aadharNo = "Aadhar number should be 12 digits";
    }

    if (
      formData.panNo &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNo.toUpperCase())
    ) {
      newErrors.panNo = "Please enter a valid PAN number";
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
      // Clean up bank account data if empty
      const submitData = { ...formData };
      if (!submitData.bankAccount.accountNo && !submitData.bankAccount.ifsc) {
        delete submitData.bankAccount;
      }

      const response = await employeeAPI.createEmployee(submitData);

      setSuccessMessage("Employee added successfully!");

      // Reset form
      setFormData({
        name: "",
        employeeId: "",
        phone: "",
        address: "",
        aadharNo: "",
        panNo: "",
        paymentType: "fixed",
        basicSalary: "",
        hourlyRate: "",
        workingDays: "26",
        workingHours: "9",
        bankAccount: {
          accountNo: "",
          ifsc: "",
          bankName: "",
          branch: "",
        },
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to add employee",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateEmployeeId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const generatedId = `EMP${year}${month}${random}`;
    setFormData((prev) => ({ ...prev, employeeId: generatedId }));
  };

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Add Employee"
        subheader="Add new employee to the system"
        removeRefresh={true}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>Employee Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Add Employee</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/employees/dashboard")}
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
            title="Employee Information"
            icon={UserPlus}
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
                    placeholder="Full Name"
                    label="Full Name"
                    error={errors.name}
                    theme="white"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Employee ID
                    </label>
                    <div className="flex gap-2">
                      <FormInput
                        icon={CreditCard}
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        placeholder="Employee ID"
                        error={errors.employeeId}
                        theme="white"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={generateEmployeeId}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <FormInput
                    icon={MapPin}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                    label="Address"
                    theme="white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={CreditCard}
                    name="aadharNo"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    placeholder="Aadhar Number (Optional)"
                    label="Aadhar Number"
                    error={errors.aadharNo}
                    theme="white"
                  />

                  <FormInput
                    icon={CreditCard}
                    name="panNo"
                    value={formData.panNo}
                    onChange={handleInputChange}
                    placeholder="PAN Number (Optional)"
                    label="PAN Number"
                    error={errors.panNo}
                    theme="white"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Type
                    </label>
                    <select
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                  </div>

                  {formData.paymentType === "fixed" ? (
                    <FormInput
                      icon={IndianRupee}
                      name="basicSalary"
                      type="number"
                      value={formData.basicSalary}
                      onChange={handleInputChange}
                      placeholder="Monthly Salary"
                      label="Basic Salary (₹/month)"
                      error={errors.basicSalary}
                      theme="white"
                    />
                  ) : (
                    <FormInput
                      icon={IndianRupee}
                      name="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="Hourly Rate"
                      label="Hourly Rate (₹/hour)"
                      error={errors.hourlyRate}
                      theme="white"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    icon={Calendar}
                    name="workingDays"
                    type="number"
                    value={formData.workingDays}
                    onChange={handleInputChange}
                    placeholder="26"
                    label="Working Days/Month"
                    theme="white"
                  />

                  <FormInput
                    icon={Clock}
                    name="workingHours"
                    type="number"
                    value={formData.workingHours}
                    onChange={handleInputChange}
                    placeholder="8"
                    label="Working Hours/Day"
                    theme="white"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Bank Details (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={CreditCard}
                    name="bankAccount.accountNo"
                    value={formData.bankAccount.accountNo}
                    onChange={handleInputChange}
                    placeholder="Account Number"
                    label="Account Number"
                    theme="white"
                  />

                  <FormInput
                    icon={CreditCard}
                    name="bankAccount.ifsc"
                    value={formData.bankAccount.ifsc}
                    onChange={handleInputChange}
                    placeholder="IFSC Code"
                    label="IFSC Code"
                    theme="white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    icon={CreditCard}
                    name="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={handleInputChange}
                    placeholder="Bank Name"
                    label="Bank Name"
                    theme="white"
                  />

                  <FormInput
                    icon={CreditCard}
                    name="bankAccount.branch"
                    value={formData.bankAccount.branch}
                    onChange={handleInputChange}
                    placeholder="Branch"
                    label="Branch"
                    theme="white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/admin/employees/dashboard")}
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Employee...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <SectionCard title="Employee Summary" icon={User} headerColor="blue">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-3">Basic Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Name:</span>
                    <span className="font-medium text-blue-900">
                      {formData.name || "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Employee ID:</span>
                    <span className="font-medium text-blue-900">
                      {formData.employeeId || "Not entered"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Phone:</span>
                    <span className="font-medium text-blue-900">
                      {formData.phone || "Not entered"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                <h4 className="font-semibold text-green-900 mb-3">
                  Payment Info
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Type:</span>
                    <span className="font-medium text-green-900 capitalize">
                      {formData.paymentType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Amount:</span>
                    <span className="font-medium text-green-900">
                      {formData.paymentType === "fixed"
                        ? `₹${formData.basicSalary || 0}/month`
                        : `₹${formData.hourlyRate || 0}/hour`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Working Days:</span>
                    <span className="font-medium text-green-900">
                      {formData.workingDays}/month
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                <h4 className="font-semibold text-orange-900 mb-3">
                  Guidelines
                </h4>
                <div className="space-y-2 text-sm text-orange-800">
                  <p>• Employee ID should be unique</p>
                  <p>• Phone number is required</p>
                  <p>• Choose payment type carefully</p>
                  <p>• Bank details are optional</p>
                  <p>• All data can be edited later by superadmin</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;
