import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Filter,
  Download,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
  X,
  Save,
  User,
  Phone,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const AttendanceReport = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    isPresent: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({});

  // Modal states
  const [modals, setModals] = useState({
    details: { isOpen: false, data: null },
    edit: { isOpen: false, data: null },
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    date: "",
    isPresent: false,
    hoursWorked: 0,
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching attendance with filters:", filters); // Debug

      const response = await attendanceAPI.getAttendanceRecords(filters);

      console.log("Attendance API Response:", response.data); // Debug

      if (response.data?.success) {
        const records = response.data.data?.records || response.data.data || [];
        console.log("Records found:", records.length); // Debug

        setAttendanceRecords(Array.isArray(records) ? records : []);
        setPagination(response.data.data?.pagination || {});
      } else {
        console.error("API returned unsuccessful response:", response.data);
        setAttendanceRecords([]);
        setPagination({});
      }
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      setError("Failed to fetch attendance records. Please try again.");
      setAttendanceRecords([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees({ limit: 100 });
      setEmployees(
        Array.isArray(response.data.data?.employees)
          ? response.data.data.employees
          : []
      );
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const clearFilters = () => {
    setFilters({
      employeeId: "",
      startDate: "",
      endDate: "",
      isPresent: "",
      page: 1,
      limit: 10,
    });
  };

  const handleDeleteAttendance = async (attendanceId) => {
    if (
      window.confirm("Are you sure you want to delete this attendance record?")
    ) {
      try {
        await attendanceAPI.deleteAttendance(attendanceId);
        fetchData();
      } catch (error) {
        console.error("Failed to delete attendance:", error);
      }
    }
  };

  // Modal handlers
  const openModal = (type, data = null) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: true, data },
    }));

    if (type === "edit" && data) {
      setEditForm({
        date: data.date.split("T")[0],
        isPresent: data.isPresent,
        hoursWorked: data.hoursWorked || 0,
        notes: data.notes || "",
      });
    }
  };

  const closeModal = (type) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: false, data: null },
    }));
  };

  const handleEditFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  };

  const handleUpdateAttendance = async () => {
    try {
      const attendanceId = modals.edit.data._id;
      await attendanceAPI.updateAttendance(attendanceId, editForm);
      closeModal("edit");
      fetchData();
    } catch (error) {
      console.error("Failed to update attendance:", error);
    }
  };

  const getAttendanceStats = () => {
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (record) => record.isPresent
    ).length;
    const absentCount = totalRecords - presentCount;
    const totalHours = attendanceRecords.reduce(
      (sum, record) => sum + (record.hoursWorked || 0),
      0
    );

    return {
      totalRecords,
      presentCount,
      absentCount,
      totalHours,
      attendanceRate:
        totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
    };
  };

  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Attendance Reports"
          subheader="Detailed attendance tracking and analysis"
          loading={loading}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          header="Attendance Reports"
          subheader="Detailed attendance tracking and analysis"
          onRefresh={fetchData}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
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
        header="Attendance Reports"
        subheader="Detailed attendance tracking and analysis"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Attendance Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/attendance/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => console.log("Export attendance data")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          icon={BarChart3}
          color="blue"
          subtitle="Current filter results"
        />
        <StatCard
          title="Present"
          value={stats.presentCount}
          icon={CheckCircle}
          color="green"
          subtitle="Attended work"
        />
        <StatCard
          title="Absent"
          value={stats.absentCount}
          icon={XCircle}
          color="red"
          subtitle="Did not attend"
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours}h`}
          icon={Clock}
          color="purple"
          subtitle={`${stats.attendanceRate}% attendance rate`}
        />
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Attendance Records
                </h3>
                <p className="text-sm text-gray-600">All attendance entries</p>
              </div>
            </div>
            <div className="text-sm text-blue-600">
              {attendanceRecords.length} records found
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Employee
              </label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="isPresent"
                value={filters.isPresent}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Present</option>
                <option value="false">Absent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Actions
              </label>
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Table Layout */}
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="min-w-full">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-48 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Employee
                  </th>
                  <th className="w-32 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Date
                  </th>
                  <th className="w-24 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Status
                  </th>
                  <th className="w-20 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Hours
                  </th>
                  <th className="w-40 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Notes
                  </th>
                  <th className="w-32 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Marked By
                  </th>
                  <th className="w-24 text-left py-4 px-4 font-semibold text-gray-900 text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Employee Info - Fixed Width */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {record.employeeId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {record.employeeId?.employeeId || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4">
                        <span className="text-gray-900 text-sm">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            record.isPresent
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.isPresent ? "Present" : "Absent"}
                        </span>
                      </td>

                      {/* Hours */}
                      <td className="py-4 px-4">
                        <span className="text-gray-900 text-sm">
                          {record.hoursWorked || 0}h
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-4">
                        <span className="text-gray-600 text-xs truncate block">
                          {record.notes || "-"}
                        </span>
                      </td>

                      {/* Marked By */}
                      <td className="py-4 px-4">
                        <span className="text-gray-600 text-xs truncate block">
                          {record.markedBy?.username || "Unknown"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                            <div className="p-1">
                              <button
                                onClick={() => openModal("details", record)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => openModal("edit", record)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Record
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteAttendance(record._id)
                                }
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No attendance records found
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {Object.values(filters).some(
                          (f) => f && f !== 1 && f !== 10
                        )
                          ? "Try adjusting your search filters."
                          : "Get started by marking attendance."}
                      </p>
                      {!Object.values(filters).some(
                        (f) => f && f !== 1 && f !== 10
                      ) && (
                        <button
                          onClick={() => navigate("/admin/attendance/mark")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Mark First Attendance
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-200 gap-4">
            <div className="text-sm text-gray-600">
              Showing {(pagination.currentPage - 1) * filters.limit + 1} to{" "}
              {Math.min(
                pagination.currentPage * filters.limit,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simplified Details Modal */}
      {modals.details.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Attendance Details
                  </h2>
                  <p className="text-gray-600">View attendance record</p>
                </div>
              </div>
              <button
                onClick={() => closeModal("details")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modals.details.data && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee Name
                        </label>
                        <p className="text-gray-900 font-semibold text-lg">
                          {modals.details.data.employeeId?.name}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Employee ID
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {modals.details.data.employeeId?.employeeId}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <p className="text-gray-900 font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(
                            modals.details.data.date
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full ${
                            modals.details.data.isPresent
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {modals.details.data.isPresent ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {modals.details.data.isPresent ? "Present" : "Absent"}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hours Worked
                        </label>
                        <p className="text-gray-900 font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {modals.details.data.hoursWorked || 0} hours
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Marked By
                        </label>
                        <p className="text-gray-900 font-semibold">
                          {modals.details.data.markedBy?.username || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {modals.details.data.notes && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <p className="text-gray-900 bg-white p-4 rounded-lg border">
                          {modals.details.data.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modals.edit.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Edit className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Attendance
                  </h2>
                  <p className="text-gray-600">Update attendance record</p>
                </div>
              </div>
              <button
                onClick={() => closeModal("edit")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {modals.edit.data && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateAttendance();
                  }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                    {/* Employee Info */}
                    <div className="mb-6 pb-6 border-b border-orange-200">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Employee
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {modals.edit.data.employeeId?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {modals.edit.data.employeeId?.employeeId}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hours Worked
                        </label>
                        <input
                          type="number"
                          name="hoursWorked"
                          value={editForm.hoursWorked}
                          onChange={handleEditFormChange}
                          min="0"
                          max="24"
                          step="0.5"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Status
                        </label>
                        <div className="flex items-center space-x-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="isPresent"
                              checked={editForm.isPresent === true}
                              onChange={() =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  isPresent: true,
                                }))
                              }
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Present
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="isPresent"
                              checked={editForm.isPresent === false}
                              onChange={() =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  isPresent: false,
                                }))
                              }
                              className="w-4 h-4 text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              Absent
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={editForm.notes}
                          onChange={handleEditFormChange}
                          rows="3"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Add any notes about this attendance record..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => closeModal("edit")}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Update Attendance
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
