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
  Upload,
  X,
  Eye,
  FileImage,
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
    phone: "",
    address: "",
    aadharNo: "",
    panNo: "",
    paymentType: "fixed",
    basicSalary: "",
    hourlyRate: "",
    workingHours: "9",
    bankAccount: {
      accountNo: "",
      ifsc: "",
      bankName: "",
      branch: "",
    },
    aadharCardImage: "",
    panCardImage: "",
    aadharCardImagePublicId: "",
    panCardImagePublicId: "",
  });

  // Image states
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [aadharPreview, setAadharPreview] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

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

  // Image handling functions
  const handleAadharFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          aadharFile: "File size should be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          aadharFile: "Please select a valid image file",
        }));
        return;
      }

      setAadharFile(file);
      setAadharPreview(URL.createObjectURL(file));
      if (errors.aadharFile) {
        setErrors((prev) => ({ ...prev, aadharFile: "" }));
      }
    }
  };

  const handlePanFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors((prev) => ({
          ...prev,
          panFile: "File size should be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          panFile: "Please select a valid image file",
        }));
        return;
      }

      setPanFile(file);
      setPanPreview(URL.createObjectURL(file));
      if (errors.panFile) {
        setErrors((prev) => ({ ...prev, panFile: "" }));
      }
    }
  };

  const removeAadharFile = () => {
    setAadharFile(null);
    if (aadharPreview) URL.revokeObjectURL(aadharPreview);
    setAadharPreview(null);
    setFormData((prev) => ({
      ...prev,
      aadharCardImage: "",
      aadharCardImagePublicId: "",
    }));
  };

  const removePanFile = () => {
    setPanFile(null);
    if (panPreview) URL.revokeObjectURL(panPreview);
    setPanPreview(null);
    setFormData((prev) => ({
      ...prev,
      panCardImage: "",
      panCardImagePublicId: "",
    }));
  };

  const uploadImages = async () => {
    if (!aadharFile && !panFile) return true;

    setUploadingImages(true);
    try {
      const uploadFormData = new FormData();
      if (aadharFile) uploadFormData.append("aadharCard", aadharFile);
      if (panFile) uploadFormData.append("panCard", panFile);

      const response = await employeeAPI.uploadEmployeeImages(uploadFormData);

      if (response.data.success) {
        const { aadharCard, panCard } = response.data.data;

        setFormData((prev) => ({
          ...prev,
          aadharCardImage: aadharCard?.url || prev.aadharCardImage,
          aadharCardImagePublicId:
            aadharCard?.publicId || prev.aadharCardImagePublicId,
          panCardImage: panCard?.url || prev.panCardImage,
          panCardImagePublicId: panCard?.publicId || prev.panCardImagePublicId,
        }));

        return true;
      }
      return false;
    } catch (error) {
      console.error("Image upload failed:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to upload images",
      });
      return false;
    } finally {
      setUploadingImages(false);
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
      // Create FormData for multipart/form-data submission
      const submitFormData = new FormData();

      // Add all text fields to FormData
      submitFormData.append("name", formData.name);
      submitFormData.append("phone", formData.phone);
      submitFormData.append("address", formData.address || "");
      submitFormData.append("aadharNo", formData.aadharNo || "");
      submitFormData.append("panNo", formData.panNo || "");
      submitFormData.append("paymentType", formData.paymentType);
      submitFormData.append("workingHours", Math.round(formData.workingHours));

      // Handle payment type specific fields
      if (formData.paymentType === "fixed") {
        submitFormData.append("basicSalary", Math.round(formData.basicSalary));
      } else {
        submitFormData.append("hourlyRate", Math.round(formData.hourlyRate));
      }

      // Handle bank account - stringify the object
      if (formData.bankAccount.accountNo || formData.bankAccount.ifsc) {
        submitFormData.append(
          "bankAccount",
          JSON.stringify(formData.bankAccount)
        );
      }

      // Add image files if selected (this is the key part!)
      if (aadharFile) {
        submitFormData.append("aadharCard", aadharFile);
      }
      if (panFile) {
        submitFormData.append("panCard", panFile);
      }

      // Make the API call with FormData
      const response = await employeeAPI.createEmployee(submitFormData);

      setSuccessMessage("Employee added successfully!");

      // Reset form
      setFormData({
        name: "",
        phone: "",
        address: "",
        aadharNo: "",
        panNo: "",
        paymentType: "fixed",
        basicSalary: "",
        hourlyRate: "",
        workingHours: "9",
        bankAccount: {
          accountNo: "",
          ifsc: "",
          bankName: "",
          branch: "",
        },
        aadharCardImage: "",
        panCardImage: "",
        aadharCardImagePublicId: "",
        panCardImagePublicId: "",
      });

      // Reset image states
      removeAadharFile();
      removePanFile();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Employee creation failed:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to add employee",
      });
    } finally {
      setLoading(false);
    }
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

              {/* Document Images Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Document Images (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Card Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhaar Card Image
                    </label>

                    {aadharPreview ? (
                      <div className="relative">
                        <img
                          src={aadharPreview}
                          alt="Aadhaar preview"
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeAadharFile}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(aadharPreview, "_blank")}
                          className="absolute bottom-2 right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <FileImage className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label
                            htmlFor="aadhar-upload"
                            className="cursor-pointer"
                          >
                            <span className="text-sm text-gray-600">
                              Click to upload Aadhaar card image
                            </span>
                            <input
                              id="aadhar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAadharFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    )}

                    {errors.aadharFile && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.aadharFile}
                      </p>
                    )}
                  </div>

                  {/* PAN Card Image Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      PAN Card Image
                    </label>

                    {panPreview ? (
                      <div className="relative">
                        <img
                          src={panPreview}
                          alt="PAN preview"
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removePanFile}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(panPreview, "_blank")}
                          className="absolute bottom-2 right-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <FileImage className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="mt-2">
                          <label
                            htmlFor="pan-upload"
                            className="cursor-pointer"
                          >
                            <span className="text-sm text-gray-600">
                              Click to upload PAN card image
                            </span>
                            <input
                              id="pan-upload"
                              type="file"
                              accept="image/*"
                              onChange={handlePanFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, JPEG up to 5MB
                        </p>
                      </div>
                    )}

                    {errors.panFile && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.panFile}
                      </p>
                    )}
                  </div>
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
                  disabled={loading || uploadingImages}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 justify-center"
                >
                  {loading || uploadingImages ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadingImages
                        ? "Uploading Images..."
                        : "Adding Employee..."}
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
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                <h4 className="font-semibold text-purple-900 mb-3">
                  Document Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Aadhaar:</span>
                    <span className="font-medium text-purple-900">
                      {aadharFile ? "Uploaded" : "Not uploaded"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">PAN:</span>
                    <span className="font-medium text-purple-900">
                      {panFile ? "Uploaded" : "Not uploaded"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                <h4 className="font-semibold text-orange-900 mb-3">
                  Guidelines
                </h4>
                <div className="space-y-2 text-sm text-orange-800">
                  <p>• Phone number is required</p>
                  <p>• Choose payment type carefully</p>
                  <p>• Bank details are optional</p>
                  <p>• Document images are optional</p>
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
