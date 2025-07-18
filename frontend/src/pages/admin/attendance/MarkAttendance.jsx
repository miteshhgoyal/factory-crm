import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { attendanceAPI } from "../../../services/api";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import FormInput from "../../../components/ui/FormInput";
import SectionCard from "../../../components/cards/SectionCard";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    employeeId: searchParams.get("employee") || "",
    date: new Date().toISOString().split("T")[0],
    isPresent: true,
    hoursWorked: "8",
    notes: "",
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeAPI.getEmployees();
      setEmployees(
        Array.isArray(response.data?.employees) ? response.data.employees : []
      );
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

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

    if (!formData.employeeId) {
      newErrors.employeeId = "Employee selection is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (
      formData.isPresent &&
      (!formData.hoursWorked || formData.hoursWorked < 0)
    ) {
      newErrors.hoursWorked =
        "Valid hours worked is required for present employees";
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
        hoursWorked: formData.isPresent ? parseFloat(formData.hoursWorked) : 0,
      };

      const response = await attendanceAPI.markAttendance(submitData);

      setSuccessMessage("Attendance marked successfully!");

      // Reset form
      setFormData({
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        isPresent: true,
        hoursWorked: "8",
        notes: "",
      });

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Mark attendance error:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to mark attendance",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(
    (emp) => emp._id === formData.employeeId
  );

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Mark Attendance"
        subheader="Record employee attendance and working hours"
        removeRefresh={true}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Attendance Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Mark Attendance</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/attendance/dashboard")}
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
            title="Attendance Details"
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
              {/* Employee Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Employee Selection
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Employee
                    </label>
                    <select
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                      disabled={employeesLoading}
                    >
                      <option value="">
                        {employeesLoading
                          ? "Loading employees..."
                          : "Select Employee"}
                      </option>
                      {employees.map((employee) => (
                        <option key={employee._id} value={employee._id}>
                          {employee.name} ({employee.employeeId})
                        </option>
                      ))}
                    </select>
                    {errors.employeeId && (
                      <p className="text-red-600 text-sm flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.employeeId}
                      </p>
                    )}
                  </div>

                  <FormInput
                    icon={Calendar}
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    label="Date"
                    error={errors.date}
                    theme="white"
                  />
                </div>
              </div>

              {/* Attendance Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Attendance Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Attendance Status
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="isPresent"
                          value={true}
                          checked={formData.isPresent === true}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isPresent: true,
                            }))
                          }
                          className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">Present</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="isPresent"
                          value={false}
                          checked={formData.isPresent === false}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              isPresent: false,
                            }))
                          }
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700">Absent</span>
                      </label>
                    </div>
                  </div>

                  {formData.isPresent && (
                    <FormInput
                      icon={Clock}
                      name="hoursWorked"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={formData.hoursWorked}
                      onChange={handleInputChange}
                      placeholder="8"
                      label="Hours Worked"
                      error={errors.hoursWorked}
                      theme="white"
                    />
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes about attendance..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/admin/attendance/dashboard")}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-medium hover:shadow-lg transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Marking Attendance...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Mark Attendance
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
            title="Attendance Summary"
            icon={Calendar}
            headerColor="blue"
          >
            <div className="space-y-4">
              {selectedEmployee && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Selected Employee
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Name:</span>
                      <span className="font-medium text-blue-900">
                        {selectedEmployee.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Employee ID:</span>
                      <span className="font-medium text-blue-900">
                        {selectedEmployee.employeeId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Status:</span>
                      <span className="font-medium text-blue-900">
                        {selectedEmployee.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={`bg-gradient-to-r p-4 rounded-xl ${
                  formData.isPresent
                    ? "from-green-50 to-green-100"
                    : "from-red-50 to-red-100"
                }`}
              >
                <h4
                  className={`font-semibold mb-3 ${
                    formData.isPresent ? "text-green-900" : "text-red-900"
                  }`}
                >
                  Attendance Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span
                      className={
                        formData.isPresent ? "text-green-700" : "text-red-700"
                      }
                    >
                      Status:
                    </span>
                    <span
                      className={`font-medium ${
                        formData.isPresent ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {formData.isPresent ? "Present" : "Absent"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className={
                        formData.isPresent ? "text-green-700" : "text-red-700"
                      }
                    >
                      Date:
                    </span>
                    <span
                      className={`font-medium ${
                        formData.isPresent ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {formData.date
                        ? new Date(formData.date).toLocaleDateString()
                        : "Not set"}
                    </span>
                  </div>
                  {formData.isPresent && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Hours:</span>
                      <span className="font-medium text-green-900">
                        {formData.hoursWorked || 0}h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Guidelines</h4>
                <div className="space-y-2 text-sm text-gray-800">
                  <p>• Select the correct employee and date</p>
                  <p>• Mark as present only if employee worked</p>
                  <p>• Enter actual hours worked</p>
                  <p>• Add notes for special cases</p>
                  <p>• Cannot mark duplicate attendance</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
