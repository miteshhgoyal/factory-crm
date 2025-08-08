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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import jsPDF from "jspdf";

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

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Employee List Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 20, 30);
    doc.text(`Total Employees: ${filteredEmployees.length}`, 20, 40);

    // Table headers
    let yPosition = 60;
    doc.setFontSize(10);
    doc.text("Name", 20, yPosition);
    doc.text("ID", 60, yPosition);
    doc.text("Phone", 90, yPosition);
    doc.text("Type", 130, yPosition);
    doc.text("Salary", 160, yPosition);
    doc.text("Status", 190, yPosition);

    // Table data
    yPosition += 10;
    filteredEmployees.forEach((emp, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.text(emp.name.substring(0, 15), 20, yPosition);
      doc.text(emp.employeeId, 60, yPosition);
      doc.text(emp.phone, 90, yPosition);
      doc.text(emp.paymentType, 130, yPosition);
      doc.text(
        emp.paymentType === "fixed"
          ? `₹${emp.basicSalary?.toLocaleString() || 0}`
          : `₹${emp.hourlyRate || 0}/hr`,
        160,
        yPosition
      );
      doc.text(emp.isActive ? "Active" : "Inactive", 190, yPosition);

      yPosition += 10;
    });

    doc.save(`employee_list_${new Date().toISOString().split("T")[0]}.pdf`);
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
                onClick={exportToPDF}
                disabled={filteredEmployees.length === 0}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
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
                            onClick={() => handleDeleteEmployee(employee._id)}
                            disabled={actionLoading === employee._id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            {actionLoading === employee._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Employee Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedEmployee.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedEmployee.employeeId}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {selectedEmployee.phone}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedEmployee.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedEmployee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Address */}
              {selectedEmployee.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <div className="flex items-start text-sm text-gray-900">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                    {selectedEmployee.address}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type
                    </label>
                    <div className="text-sm text-gray-900 capitalize">
                      {selectedEmployee.paymentType}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedEmployee.paymentType === "fixed"
                        ? "Basic Salary"
                        : "Hourly Rate"}
                    </label>
                    <div className="flex items-center text-sm text-gray-900">
                      <IndianRupee className="h-4 w-4 mr-1 text-gray-400" />₹
                      {selectedEmployee.paymentType === "fixed"
                        ? selectedEmployee.basicSalary?.toLocaleString()
                        : selectedEmployee.hourlyRate}
                      {selectedEmployee.paymentType === "fixed"
                        ? "/month"
                        : "/hour"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {(selectedEmployee.aadharNo || selectedEmployee.panNo) && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEmployee.aadharNo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhar Number
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedEmployee.aadharNo}
                        </div>
                      </div>
                    )}

                    {selectedEmployee.panNo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN Number
                        </label>
                        <div className="text-sm text-gray-900">
                          {selectedEmployee.panNo}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Details */}
              {selectedEmployee.bankAccount && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedEmployee.bankAccount.accountNo}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedEmployee.bankAccount.ifsc}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedEmployee.bankAccount.bankName}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <div className="text-sm text-gray-900">
                        {selectedEmployee.bankAccount.branch}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Date */}
              {selectedEmployee.joinDate && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Employee
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-6">
              {editErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{editErrors.submit}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.name ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {editErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {editErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={editFormData.employeeId}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.employeeId
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                  {editErrors.employeeId && (
                    <p className="mt-1 text-sm text-red-600">
                      {editErrors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      editErrors.phone ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {editErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {editErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <input
                    type="date"
                    name="joinDate"
                    value={editFormData.joinDate}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type
                    </label>
                    <select
                      name="paymentType"
                      value={editFormData.paymentType}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>

                  {editFormData.paymentType === "fixed" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Basic Salary *
                      </label>
                      <input
                        type="number"
                        name="basicSalary"
                        value={editFormData.basicSalary}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editErrors.basicSalary
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {editErrors.basicSalary && (
                        <p className="mt-1 text-sm text-red-600">
                          {editErrors.basicSalary}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate *
                      </label>
                      <input
                        type="number"
                        name="hourlyRate"
                        value={editFormData.hourlyRate}
                        onChange={handleEditInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          editErrors.hourlyRate
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      />
                      {editErrors.hourlyRate && (
                        <p className="mt-1 text-sm text-red-600">
                          {editErrors.hourlyRate}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="aadharNo"
                      value={editFormData.aadharNo}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.aadharNo
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    {editErrors.aadharNo && (
                      <p className="mt-1 text-sm text-red-600">
                        {editErrors.aadharNo}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      name="panNo"
                      value={editFormData.panNo}
                      onChange={handleEditInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        editErrors.panNo ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {editErrors.panNo && (
                      <p className="mt-1 text-sm text-red-600">
                        {editErrors.panNo}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bank Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="bankAccount.accountNo"
                      value={editFormData.bankAccount?.accountNo}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      name="bankAccount.ifsc"
                      value={editFormData.bankAccount?.ifsc}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankAccount.bankName"
                      value={editFormData.bankAccount?.bankName}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      name="bankAccount.branch"
                      value={editFormData.bankAccount?.branch}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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
