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

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendanceRecords(filters);
      setAttendanceRecords(
        Array.isArray(response.data?.records) ? response.data.records : []
      );
      setPagination(response.data?.pagination || {});
      setError(null);
    } catch (error) {
      console.error("Failed to fetch attendance records:", error);
      setError("Failed to fetch attendance records");
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(
        Array.isArray(response.data?.employees) ? response.data.employees : []
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
      page: 1, // Reset to first page when filtering
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
        fetchData(); // Refresh data
      } catch (error) {
        console.error("Failed to delete attendance:", error);
      }
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
          header="Attendance Reports"
          subheader="Detailed attendance tracking and analysis"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchData}
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => console.log("Export attendance data")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={stats.totalRecords}
          icon={BarChart3}
          color="blue"
          change="Current filter"
        />
        <StatCard
          title="Present"
          value={stats.presentCount}
          icon={CheckCircle}
          color="green"
          change="Attended work"
        />
        <StatCard
          title="Absent"
          value={stats.absentCount}
          icon={XCircle}
          color="red"
          change="Did not attend"
        />
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours}h`}
          icon={Clock}
          color="purple"
          change={`${stats.attendanceRate}% rate`}
        />
      </div>

      {/* Attendance Records */}
      <SectionCard
        title="Attendance Records"
        icon={Calendar}
        headerColor="blue"
      >
        {/* Filters */}
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Employee
              </label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Employee
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Hours
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Notes
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Marked By
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr
                  key={record._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.employeeId?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.employeeId?.employeeId}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.isPresent
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {record.isPresent ? "Present" : "Absent"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {record.hoursWorked || 0}h
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 text-sm">
                      {record.notes || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 text-sm">
                      {record.markedBy?.username || "Unknown"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="relative group">
                      <button className="p-1 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="p-1">
                          <button
                            onClick={() =>
                              console.log("View attendance:", record._id)
                            }
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/attendance/edit/${record._id}`)
                            }
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Record
                          </button>
                          <button
                            onClick={() => handleDeleteAttendance(record._id)}
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
              ))}
            </tbody>
          </table>

          {attendanceRecords.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No attendance records found
              </h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some((f) => f && f !== 1 && f !== 10)
                  ? "Try adjusting your search filters."
                  : "Get started by marking attendance."}
              </p>
              {!Object.values(filters).some(
                (f) => f && f !== 1 && f !== 10
              ) && (
                <button
                  onClick={() => navigate("/admin/attendance/mark")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mark First Attendance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
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
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default AttendanceReport;
