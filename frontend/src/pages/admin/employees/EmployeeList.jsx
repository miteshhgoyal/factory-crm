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
  IndianRupee,
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
  Download,
  RefreshCw,
  TrendingUp,
  Calendar as CalendarIcon,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";

const EmployeeList = () => {
  const { user } = useAuth();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
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

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setActionLoading(employeeToDelete._id);
      await employeeAPI.deleteEmployee(employeeToDelete._id);
      fetchEmployees();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Failed to delete employee:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirmation = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
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
      workingHours: employee.workingHours || 9,
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
      !editFormData.workingDays ||
      editFormData.workingDays <= 0 ||
      editFormData.workingDays > 31
    ) {
      errors.workingDays = "Working days must be between 1 and 31";
    }
    if (
      !editFormData.workingHours ||
      editFormData.workingHours <= 0 ||
      editFormData.workingHours > 24
    ) {
      errors.workingHours = "Working hours must be between 1 and 24";
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
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const exportToCSV = () => {
    const csvData = filteredEmployees.map((emp) => ({
      Name: emp.name,
      "Employee ID": emp.employeeId,
      Phone: emp.phone,
      Address: emp.address,
      "Payment Type": emp.paymentType,
      "Basic Salary": emp.basicSalary || "-",
      "Hourly Rate": emp.hourlyRate || "-",
      "Working Days": emp.workingDays || "-",
      "Working Hours": emp.workingHours || "-",
      Status: emp.isActive ? "Active" : "Inactive",
      "Join Date": emp.joinDate
        ? new Date(emp.joinDate).toLocaleDateString()
        : "-",
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
    const avgSalary =
      employees.reduce((sum, emp) => {
        return (
          sum +
          (emp.paymentType === "fixed"
            ? emp.basicSalary || 0
            : (emp.hourlyRate || 0) * 160)
        );
      }, 0) / (total || 1);

    return { total, active, inactive, fixed, hourly, avgSalary };
  };

  const stats = getEmployeeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent
          header="Employee Management"
          subheader="Manage workforce and employee data"
          loading={loading}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {[...Array(5)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent
        header="Employee Management"
        subheader="Manage workforce, employee data, and track performance"
        onRefresh={fetchEmployees}
        loading={loading}
      />

      <div className="space-y-6">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Employees"
            value={stats.total}
            icon={Users}
            color="blue"
            change={`${stats.active} active`}
          />
          <StatCard
            title="Active Staff"
            value={stats.active}
            icon={UserCheck}
            color="green"
            change={`${((stats.active / stats.total) * 100 || 0).toFixed(
              1
            )}% of total`}
          />
          <StatCard
            title="Inactive Staff"
            value={stats.inactive}
            icon={UserX}
            color="red"
            change={stats.inactive > 0 ? "Need attention" : "All active"}
          />
          <StatCard
            title="Fixed Pay"
            value={stats.fixed}
            icon={IndianRupee}
            color="purple"
            change={`${((stats.fixed / stats.total) * 100 || 0).toFixed(
              1
            )}% of staff`}
          />
          <StatCard
            title="Hourly Pay"
            value={stats.hourly}
            icon={Clock}
            color="orange"
            change={`Avg: ₹${Math.round(stats.avgSalary).toLocaleString()}`}
          />
        </div>

        {/* Enhanced Action Bar */}
        <SectionCard>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1 w-full lg:w-auto">
              {/* Enhanced Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Enhanced Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="all">All Payment Types</option>
                  <option value="fixed">Fixed Salary</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={exportToCSV}
                disabled={filteredEmployees.length === 0}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </button>

              <button
                onClick={() => navigate("/employees/add")}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm ||
            statusFilter !== "all" ||
            paymentTypeFilter !== "all") && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {filteredEmployees.length} of {employees.length}{" "}
                  employees
                </span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Search: "{searchTerm}"
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                    Status: {statusFilter}
                  </span>
                )}
                {paymentTypeFilter !== "all" && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
                    Type: {paymentTypeFilter}
                  </span>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Employee List */}
        <SectionCard>
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Employee
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Contact
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Payment
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              employee.isActive
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {employee.phone}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 capitalize">
                            {employee.paymentType} Pay
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.paymentType === "fixed"
                              ? `₹${employee.basicSalary?.toLocaleString()}/month`
                              : `₹${employee.hourlyRate}/hour`}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            employee.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {employee.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {user.role == "superadmin" && (
                            <>
                              <button
                                onClick={() => handleEditEmployee(employee)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() =>
                                  handleToggleStatus(
                                    employee._id,
                                    employee.isActive
                                  )
                                }
                                disabled={actionLoading === employee._id}
                                className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                title={
                                  employee.isActive ? "Deactivate" : "Activate"
                                }
                              >
                                {actionLoading === employee._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : employee.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                onClick={() => showDeleteConfirmation(employee)}
                                disabled={actionLoading === employee._id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No employees found
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
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
                    onClick={() => navigate("/employees/add")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First Employee
                  </button>
                )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={selectedEmployee?.name}
          subtitle="Employee Details"
          headerIcon={<User />}
          headerColor="blue"
          size="lg"
        >
          <div className="space-y-6">
            {/* Basic Info Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {selectedEmployee.name}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Employee ID
                  </label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-medium text-gray-900">
                      {selectedEmployee.employeeId}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-lg font-medium text-gray-900">
                      {selectedEmployee.phone}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                      selectedEmployee.isActive
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {selectedEmployee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {selectedEmployee.address && (
                  <div className="col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Address
                    </label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <span className="text-gray-900">
                        {selectedEmployee.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Details Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Work Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Working Days
                  </label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.workingDays || 26} days/month
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Working Hours
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      {selectedEmployee.workingHours || 9} hours/day
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Payment Type
                  </label>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedEmployee.paymentType}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    {selectedEmployee.paymentType === "fixed"
                      ? "Monthly Salary"
                      : "Hourly Rate"}
                  </label>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-600">
                      ₹
                      {selectedEmployee.paymentType === "fixed"
                        ? selectedEmployee.basicSalary?.toLocaleString()
                        : selectedEmployee.hourlyRate}
                      {selectedEmployee.paymentType === "fixed"
                        ? "/month"
                        : "/hour"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {(selectedEmployee.aadharNo || selectedEmployee.panNo) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documents
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedEmployee.aadharNo && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-500">
                        Aadhar Number
                      </label>
                      <div className="text-lg font-medium text-gray-900 font-mono">
                        {selectedEmployee.aadharNo}
                      </div>
                    </div>
                  )}

                  {selectedEmployee.panNo && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-500">
                        PAN Number
                      </label>
                      <div className="text-lg font-medium text-gray-900 font-mono">
                        {selectedEmployee.panNo}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Details Section */}
            {selectedEmployee.bankAccount && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bank Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Account Number
                    </label>
                    <div className="text-lg font-medium text-gray-900 font-mono">
                      {selectedEmployee.bankAccount.accountNo}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      IFSC Code
                    </label>
                    <div className="text-lg font-medium text-gray-900 font-mono">
                      {selectedEmployee.bankAccount.ifsc}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Bank Name
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedEmployee.bankAccount.bankName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-500">
                      Branch
                    </label>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedEmployee.bankAccount.branch}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Join Date Section */}
            {selectedEmployee.joinDate && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Employment Information
                  </h3>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-500">
                    Join Date
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {new Date(selectedEmployee.joinDate).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Employee"
          subtitle="Update employee information"
          headerIcon={<Edit />}
          headerColor="green"
          size="lg"
        >
          <form onSubmit={handleUpdateEmployee} className="space-y-6">
            {editErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">{editErrors.submit}</span>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.name
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter full name"
                  />
                  {editErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={editFormData.employeeId}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.employeeId
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter employee ID"
                  />
                  {editErrors.employeeId && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.phone
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter phone number"
                  />
                  {editErrors.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Join Date
                  </label>
                  <input
                    type="date"
                    name="joinDate"
                    value={editFormData.joinDate}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={editFormData.address}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter full address"
                  />
                </div>
              </div>
            </div>

            {/* Work & Payment Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Work & Payment Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Working Days *
                  </label>
                  <input
                    type="number"
                    name="workingDays"
                    value={editFormData.workingDays}
                    onChange={handleEditInputChange}
                    min="1"
                    max="31"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.workingDays
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Days per month"
                  />
                  {editErrors.workingDays && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.workingDays}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Working Hours *
                  </label>
                  <input
                    type="number"
                    name="workingHours"
                    value={editFormData.workingHours}
                    onChange={handleEditInputChange}
                    min="1"
                    max="24"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      editErrors.workingHours
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Hours per day"
                  />
                  {editErrors.workingHours && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.workingHours}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    name="paymentType"
                    value={editFormData.paymentType}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="fixed">Fixed Salary</option>
                    <option value="hourly">Hourly Rate</option>
                  </select>
                </div>

                {editFormData.paymentType === "fixed" ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monthly Salary *
                    </label>
                    <input
                      type="number"
                      name="basicSalary"
                      value={editFormData.basicSalary}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        editErrors.basicSalary
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter monthly salary"
                    />
                    {editErrors.basicSalary && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editErrors.basicSalary}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hourly Rate *
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={editFormData.hourlyRate}
                      onChange={handleEditInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        editErrors.hourlyRate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter hourly rate"
                    />
                    {editErrors.hourlyRate && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editErrors.hourlyRate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    name="aadharNo"
                    value={editFormData.aadharNo}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      editErrors.aadharNo
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter 12-digit Aadhar number"
                  />
                  {editErrors.aadharNo && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.aadharNo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNo"
                    value={editFormData.panNo}
                    onChange={handleEditInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                      editErrors.panNo
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter PAN number (e.g., ABCDE1234F)"
                  />
                  {editErrors.panNo && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.panNo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Bank Details
                </h3>
                <span className="text-sm text-gray-500">(Optional)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="bankAccount.accountNo"
                    value={editFormData.bankAccount?.accountNo}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="bankAccount.ifsc"
                    value={editFormData.bankAccount?.ifsc}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter IFSC code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankAccount.bankName"
                    value={editFormData.bankAccount?.bankName}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter bank name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    name="bankAccount.branch"
                    value={editFormData.bankAccount?.branch}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Employee
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Employee"
          subtitle="This action cannot be undone"
          headerIcon={<Trash2 />}
          headerColor="red"
          size="sm"
        >
          {/* Modal Body */}

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this employee?
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">
                    {employeeToDelete.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {employeeToDelete.employeeId}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              This will permanently remove the employee and all associated data
              from the system.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setEmployeeToDelete(null);
              }}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEmployee}
              disabled={actionLoading === employeeToDelete._id}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
            >
              {actionLoading === employeeToDelete._id ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Employee
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeList;
