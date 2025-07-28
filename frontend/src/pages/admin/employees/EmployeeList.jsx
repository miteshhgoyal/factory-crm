import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  UserCheck,
  UserX,
  DollarSign,
  Phone,
  Calendar,
  MoreVertical,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  CreditCard,
  Building,
  Clock,
  FileText,
  Banknote,
  Save,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data.data.employees);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setError("Failed to fetch employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    try {
      setActionLoading(employeeId);
      await employeeAPI.toggleEmployeeStatus(employeeId);
      fetchEmployees();
    } catch (error) {
      console.error("Failed to update employee status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      try {
        setActionLoading(employeeId);
        await employeeAPI.deleteEmployee(employeeId);
        fetchEmployees();
      } catch (error) {
        console.error("Failed to delete employee:", error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      name: employee.name || "",
      employeeId: employee.employeeId || "",
      phone: employee.phone || "",
      address: employee.address || "",
      aadharNo: employee.aadharNo || "",
      panNo: employee.panNo || "",
      paymentType: employee.paymentType || "fixed",
      basicSalary: employee.basicSalary || "",
      hourlyRate: employee.hourlyRate || "",
      workingDays: employee.workingDays || 26,
      workingHours: employee.workingHours || 8,
      overtimeRate: employee.overtimeRate || 1.5,
      bankAccount: {
        accountNo: employee.bankAccount?.accountNo || "",
        ifsc: employee.bankAccount?.ifsc || "",
        bankName: employee.bankAccount?.bankName || "",
        branch: employee.bankAccount?.branch || "",
      },
      joinDate: employee.joinDate
        ? new Date(employee.joinDate).toISOString().split("T")[0]
        : "",
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.name?.trim()) {
      errors.name = "Name is required";
    }

    if (!editFormData.employeeId?.trim()) {
      errors.employeeId = "Employee ID is required";
    }

    if (!editFormData.phone?.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(editFormData.phone.replace(/\D/g, ""))) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (editFormData.paymentType === "fixed") {
      if (!editFormData.basicSalary || editFormData.basicSalary <= 0) {
        errors.basicSalary = "Basic salary is required for fixed payment type";
      }
    } else if (editFormData.paymentType === "hourly") {
      if (!editFormData.hourlyRate || editFormData.hourlyRate <= 0) {
        errors.hourlyRate = "Hourly rate is required for hourly payment type";
      }
    }

    if (
      editFormData.aadharNo &&
      !/^\d{12}$/.test(editFormData.aadharNo.replace(/\D/g, ""))
    ) {
      errors.aadharNo = "Aadhar number should be 12 digits";
    }

    if (
      editFormData.panNo &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editFormData.panNo.toUpperCase())
    ) {
      errors.panNo = "Please enter a valid PAN number";
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) return;

    try {
      setEditLoading(true);

      // Clean up bank account data if all fields are empty
      const submitData = { ...editFormData };
      if (
        !submitData.bankAccount.accountNo &&
        !submitData.bankAccount.ifsc &&
        !submitData.bankAccount.bankName &&
        !submitData.bankAccount.branch
      ) {
        delete submitData.bankAccount;
      }

      await employeeAPI.updateEmployee(selectedEmployee._id, submitData);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setEditFormData({});
      setEditErrors({});
      fetchEmployees();
    } catch (error) {
      console.error("Failed to update employee:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update employee",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("bankAccount.")) {
      const field = name.split(".")[1];
      setEditFormData((prev) => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value,
        },
      }));
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.isActive) ||
      (statusFilter === "inactive" && !employee.isActive);

    const matchesPaymentType =
      paymentTypeFilter === "all" || employee.paymentType === paymentTypeFilter;

    return matchesSearch && matchesStatus && matchesPaymentType;
  });

  const getEmployeeStats = () => {
    const total = employees.length;
    const active = employees.filter((emp) => emp.isActive).length;
    const inactive = total - active;
    const fixed = employees.filter((emp) => emp.paymentType === "fixed").length;
    const hourly = employees.filter(
      (emp) => emp.paymentType === "hourly"
    ).length;

    return { total, active, inactive, fixed, hourly };
  };

  const stats = getEmployeeStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Employee List"
          subheader="Manage your workforce"
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Employee List"
          subheader="Manage your workforce"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchEmployees}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Employee List"
        subheader="Manage your workforce and employee information"
        onRefresh={fetchEmployees}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Employee Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Employee List</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/employees/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/employees/add")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
          <button
            onClick={() => navigate("/admin/employees/salary")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <DollarSign className="w-4 h-4" />
            Salary Management
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.total}
          icon={Users}
          color="blue"
          change="All employees"
        />
        <StatCard
          title="Active Employees"
          value={stats.active}
          icon={UserCheck}
          color="green"
          change="Currently working"
        />
        <StatCard
          title="Fixed Salary"
          value={stats.fixed}
          icon={DollarSign}
          color="purple"
          change="Monthly fixed pay"
        />
        <StatCard
          title="Hourly Employees"
          value={stats.hourly}
          icon={Calendar}
          color="orange"
          change="Hourly based pay"
        />
      </div>

      {/* Employee List */}
      <SectionCard title="Employee Directory" icon={Users} headerColor="blue">
        {/* Search and Filters */}
        <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Search Employees
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, or phone..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Payment Type
              </label>
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed Salary</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full bg-white">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                  Employee
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                  Contact
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                  Payment Info
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                  Status
                </th>
                <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee._id}
                  className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {employee.name}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          {employee.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{employee.phone}</span>
                      </div>
                      {employee.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span className="truncate max-w-[150px]">
                            {employee.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize">
                        {employee.paymentType} Pay
                      </span>
                      <p className="text-sm font-bold text-gray-900">
                        {employee.paymentType === "fixed"
                          ? `₹${employee.basicSalary?.toLocaleString()}/month`
                          : `₹${employee.hourlyRate}/hour`}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        employee.isActive
                          ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800"
                          : "bg-gradient-to-r from-red-100 to-rose-200 text-red-800"
                      }`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-105"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Edit Employee"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          handleToggleStatus(employee._id, employee.isActive)
                        }
                        disabled={actionLoading === employee._id}
                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105"
                        title={employee.isActive ? "Deactivate" : "Activate"}
                      >
                        {actionLoading === employee._id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : employee.isActive ? (
                          <UserX className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        disabled={actionLoading === employee._id}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105"
                        title="Delete Employee"
                      >
                        {actionLoading === employee._id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white">
              <Users className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No employees found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm ||
                statusFilter !== "all" ||
                paymentTypeFilter !== "all"
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "Get started by adding your first employee to the system."}
              </p>
              {!searchTerm &&
                statusFilter === "all" &&
                paymentTypeFilter === "all" && (
                  <button
                    onClick={() => navigate("/admin/employees/add")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Add First Employee
                  </button>
                )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Enhanced Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Employee Details
                  </h2>
                  <p className="text-gray-600">Complete employee information</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Personal Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Personal Information
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">
                          {selectedEmployee.name}
                        </h4>
                        <p className="text-lg text-gray-600 font-medium mb-2">
                          {selectedEmployee.employeeId}
                        </p>
                        <span
                          className={`inline-block px-4 py-2 text-sm font-bold rounded-full ${
                            selectedEmployee.isActive
                              ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800"
                              : "bg-gradient-to-r from-red-100 to-rose-200 text-red-800"
                          }`}
                        >
                          {selectedEmployee.isActive
                            ? "Active Employee"
                            : "Inactive Employee"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-2 text-blue-500" />
                          Phone Number
                        </label>
                        <p className="text-lg font-semibold text-gray-900">
                          {selectedEmployee.phone}
                        </p>
                      </div>

                      {selectedEmployee.address && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2 text-green-500" />
                            Address
                          </label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedEmployee.address}
                          </p>
                        </div>
                      )}

                      {selectedEmployee.aadharNo && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <CreditCard className="w-4 h-4 inline mr-2 text-orange-500" />
                            Aadhar Number
                          </label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedEmployee.aadharNo}
                          </p>
                        </div>
                      )}

                      {selectedEmployee.panNo && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <FileText className="w-4 h-4 inline mr-2 text-purple-500" />
                            PAN Number
                          </label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedEmployee.panNo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Payment Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Payment Type
                      </label>
                      <span className="inline-block px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize">
                        {selectedEmployee.paymentType} Payment
                      </span>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {selectedEmployee.paymentType === "fixed"
                          ? "Monthly Salary"
                          : "Hourly Rate"}
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        ₹
                        {selectedEmployee.paymentType === "fixed"
                          ? selectedEmployee.basicSalary?.toLocaleString()
                          : selectedEmployee.hourlyRate}
                        <span className="text-sm text-gray-600 font-normal">
                          {selectedEmployee.paymentType === "fixed"
                            ? "/month"
                            : "/hour"}
                        </span>
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2 text-blue-500" />
                        Working Days
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.workingDays} days/month
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2 text-green-500" />
                        Working Hours
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.workingHours} hours/day
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2 text-orange-500" />
                        Overtime Rate Multiplier
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedEmployee.overtimeRate}x regular rate
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {selectedEmployee.bankAccount?.accountNo && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-6">
                      <Building className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Bank Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Account Number
                        </label>
                        <p className="text-lg font-semibold text-gray-900 font-mono">
                          {selectedEmployee.bankAccount.accountNo}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          IFSC Code
                        </label>
                        <p className="text-lg font-semibold text-gray-900 font-mono">
                          {selectedEmployee.bankAccount.ifsc}
                        </p>
                      </div>

                      {selectedEmployee.bankAccount.bankName && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Bank Name
                          </label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedEmployee.bankAccount.bankName}
                          </p>
                        </div>
                      )}

                      {selectedEmployee.bankAccount.branch && (
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Branch
                          </label>
                          <p className="text-lg font-semibold text-gray-900">
                            {selectedEmployee.bankAccount.branch}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Employee Metadata
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2 text-blue-500" />
                        Join Date
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(selectedEmployee.joinDate).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-2 text-green-500" />
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedEmployee.updatedAt
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2 text-purple-500" />
                        Record Created
                      </label>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedEmployee.createdAt
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Quick Actions
                  </h3>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleEditEmployee(selectedEmployee);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Edit className="w-4 h-4 inline mr-2" />
                      Edit Employee
                    </button>

                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        navigate(
                          `/admin/employees/salary?employee=${selectedEmployee._id}`
                        );
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Banknote className="w-4 h-4 inline mr-2" />
                      View Salary
                    </button>

                    <button
                      onClick={() =>
                        handleToggleStatus(
                          selectedEmployee._id,
                          selectedEmployee.isActive
                        )
                      }
                      className={`w-full px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-medium ${
                        selectedEmployee.isActive
                          ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
                          : "bg-gradient-to-r from-green-600 to-green-700 text-white"
                      }`}
                    >
                      {selectedEmployee.isActive ? (
                        <>
                          <UserX className="w-4 h-4 inline mr-2" />
                          Deactivate Employee
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 inline mr-2" />
                          Activate Employee
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Edit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Employee
                  </h2>
                  <p className="text-gray-600">Update employee information</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Error Messages */}
            {editErrors.submit && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  {editErrors.submit}
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                        editErrors.name ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Enter full name"
                    />
                    {editErrors.name && (
                      <p className="text-red-600 text-sm font-medium">
                        {editErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      name="employeeId"
                      value={editFormData.employeeId}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                        editErrors.employeeId
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter employee ID"
                    />
                    {editErrors.employeeId && (
                      <p className="text-red-600 text-sm font-medium">
                        {editErrors.employeeId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                        editErrors.phone ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Enter phone number"
                    />
                    {editErrors.phone && (
                      <p className="text-red-600 text-sm font-medium">
                        {editErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editFormData.address}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="aadharNo"
                      value={editFormData.aadharNo}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                        editErrors.aadharNo
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter 12-digit Aadhar number"
                    />
                    {editErrors.aadharNo && (
                      <p className="text-red-600 text-sm font-medium">
                        {editErrors.aadharNo}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNo"
                      value={editFormData.panNo}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white ${
                        editErrors.panNo ? "border-red-300" : "border-gray-200"
                      }`}
                      placeholder="Enter PAN number"
                    />
                    {editErrors.panNo && (
                      <p className="text-red-600 text-sm font-medium">
                        {editErrors.panNo}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      value={editFormData.joinDate}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Payment Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Payment Type *
                    </label>
                    <select
                      name="paymentType"
                      value={editFormData.paymentType}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                    >
                      <option value="fixed">Fixed Salary</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                  </div>

                  {editFormData.paymentType === "fixed" ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Basic Salary (₹/month) *
                      </label>
                      <input
                        type="number"
                        name="basicSalary"
                        value={editFormData.basicSalary}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white ${
                          editErrors.basicSalary
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Enter monthly salary"
                      />
                      {editErrors.basicSalary && (
                        <p className="text-red-600 text-sm font-medium">
                          {editErrors.basicSalary}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Hourly Rate (₹/hour) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="hourlyRate"
                        value={editFormData.hourlyRate}
                        onChange={handleEditInputChange}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white ${
                          editErrors.hourlyRate
                            ? "border-red-300"
                            : "border-gray-200"
                        }`}
                        placeholder="Enter hourly rate"
                      />
                      {editErrors.hourlyRate && (
                        <p className="text-red-600 text-sm font-medium">
                          {editErrors.hourlyRate}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Working Days/Month
                    </label>
                    <input
                      type="number"
                      name="workingDays"
                      min="1"
                      max="31"
                      value={editFormData.workingDays}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                      placeholder="26"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Working Hours/Day
                    </label>
                    <input
                      type="number"
                      name="workingHours"
                      min="1"
                      max="24"
                      value={editFormData.workingHours}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                      placeholder="8"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Overtime Rate Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="overtimeRate"
                      min="1"
                      value={editFormData.overtimeRate}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                      placeholder="1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-6">
                  <Building className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Bank Details (Optional)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccount.accountNo"
                      value={editFormData.bankAccount.accountNo}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="bankAccount.ifsc"
                      value={editFormData.bankAccount.ifsc}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white"
                      placeholder="Enter IFSC code"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankAccount.bankName"
                      value={editFormData.bankAccount.bankName}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="bankAccount.branch"
                      value={editFormData.bankAccount.branch}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-bold hover:shadow-lg transition-all duration-200"
                >
                  Cancel Changes
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating Employee...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Update Employee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
