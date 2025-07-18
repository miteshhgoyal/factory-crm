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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getEmployees();
      setEmployees(Array.isArray(response.data) ? response.data : []);
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
      await employeeAPI.updateEmployee(employeeId, {
        isActive: !currentStatus,
      });
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error("Failed to update employee status:", error);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await employeeAPI.deleteEmployee(employeeId);
        fetchEmployees(); // Refresh the list
      } catch (error) {
        console.error("Failed to delete employee:", error);
      }
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
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Search Employees
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Type
              </label>
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="fixed">Fixed Salary</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div
              key={employee._id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {employee.employeeId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      employee.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {employee.isActive ? "Active" : "Inactive"}
                  </span>

                  <div className="relative group">
                    <button className="p-1 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="p-1">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowDetailsModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/employees/edit/${employee._id}`)
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Employee
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(employee._id, employee.isActive)
                          }
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                          {employee.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                          {employee.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="capitalize">{employee.paymentType} Pay</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium text-gray-900">
                    {employee.paymentType === "fixed"
                      ? `₹${employee.basicSalary?.toLocaleString()}/month`
                      : `₹${employee.hourlyRate}/hour`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined: {new Date(employee.joinDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() =>
                    navigate(`/admin/employees/salary?employee=${employee._id}`)
                  }
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salary Details
                </button>
                <button
                  onClick={() =>
                    navigate(`/admin/attendance/mark?employee=${employee._id}`)
                  }
                  className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No employees found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ||
              statusFilter !== "all" ||
              paymentTypeFilter !== "all"
                ? "Try adjusting your search filters."
                : "Get started by adding your first employee."}
            </p>
            {!searchTerm &&
              statusFilter === "all" &&
              paymentTypeFilter === "all" && (
                <button
                  onClick={() => navigate("/admin/employees/add")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Employee
                </button>
              )}
          </div>
        )}
      </SectionCard>

      {/* Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Employee Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEmployee.name}
                  </h3>
                  <p className="text-gray-600">{selectedEmployee.employeeId}</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedEmployee.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selectedEmployee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <p className="text-gray-900 capitalize">
                    {selectedEmployee.paymentType}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedEmployee.paymentType === "fixed"
                      ? "Monthly Salary"
                      : "Hourly Rate"}
                  </label>
                  <p className="text-gray-900 font-medium">
                    ₹
                    {selectedEmployee.paymentType === "fixed"
                      ? selectedEmployee.basicSalary?.toLocaleString()
                      : selectedEmployee.hourlyRate}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Join Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedEmployee.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedEmployee.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900">{selectedEmployee.address}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate(`/admin/employees/edit/${selectedEmployee._id}`);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate(
                      `/admin/employees/salary?employee=${selectedEmployee._id}`
                    );
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Salary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
