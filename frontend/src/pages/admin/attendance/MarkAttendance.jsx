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
  Search,
  Save,
  Users,
  Filter,
  X,
  Eye,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { attendanceAPI } from "../../../services/api";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]); // Track existing attendance
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, present, absent, unmarked, marked
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchExistingAttendance();
    }
  }, [employees, selectedDate]);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await employeeAPI.getEmployees({ limit: 100 });
      setEmployees(response.data.data.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // In MarkAttendance.jsx, update the fetchExistingAttendance function:
  const fetchExistingAttendance = async () => {
    try {
      setLoading(true);

      // Check if attendanceAPI.getAttendanceByDate exists
      if (!attendanceAPI.getAttendanceByDate) {
        console.warn("getAttendanceByDate API method not available");
        initializeAttendanceData();
        return;
      }

      const response = await attendanceAPI.getAttendanceByDate(selectedDate);
      const existingRecords = response.data?.data || [];

      console.log(
        "Existing attendance records for",
        selectedDate,
        ":",
        existingRecords
      );
      setExistingAttendance(existingRecords);

      // Create a map of employeeId to attendance record for quick lookup
      const attendanceMap = {};
      existingRecords.forEach((record) => {
        const empId = record.employeeId?._id || record.employeeId;
        if (empId) {
          attendanceMap[empId] = record;
        }
      });

      // Initialize attendance data with existing records
      const data = employees.map((employee) => {
        const existingRecord = attendanceMap[employee._id];

        if (existingRecord) {
          return {
            employeeId: employee._id,
            employee: employee,
            isPresent: existingRecord.isPresent,
            hoursWorked: existingRecord.hoursWorked?.toString() || "0",
            notes: existingRecord.notes || "",
            isMarked: true, // Already marked
            isSubmitting: false,
            existingRecordId: existingRecord._id,
          };
        } else {
          return {
            employeeId: employee._id,
            employee: employee,
            isPresent: null,
            hoursWorked: "8",
            notes: "",
            isMarked: false,
            isSubmitting: false,
            existingRecordId: null,
          };
        }
      });

      setAttendanceData(data);
    } catch (error) {
      console.error("Failed to fetch existing attendance:", error);

      // If it's a 404 or similar error, just initialize with empty data
      if (error.response?.status === 404 || error.code === "ERR_NETWORK") {
        console.log(
          "No existing attendance found or API not available, initializing empty data"
        );
      }

      // Initialize with empty attendance if fetch fails
      initializeAttendanceData();
    } finally {
      setLoading(false);
    }
  };

  const initializeAttendanceData = () => {
    const data = employees.map((employee) => ({
      employeeId: employee._id,
      employee: employee,
      isPresent: null,
      hoursWorked: "8",
      notes: "",
      isMarked: false,
      isSubmitting: false,
      existingRecordId: null,
    }));
    setAttendanceData(data);
  };

  const updateAttendance = (employeeId, field, value) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId
          ? {
              ...item,
              [field]: value,
              isMarked:
                field === "isPresent" && !item.existingRecordId
                  ? false
                  : item.isMarked,
            }
          : item
      )
    );
  };

  const markSingleAttendance = async (employeeId) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    // Prevent marking if already marked
    if (attendanceItem.existingRecordId) {
      alert("Attendance already marked for this employee on this date");
      return;
    }

    if (attendanceItem.isPresent === null) {
      alert("Please select attendance status first");
      return;
    }

    try {
      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId
            ? { ...item, isSubmitting: true }
            : item
        )
      );

      const submitData = {
        employeeId: employeeId,
        date: selectedDate,
        isPresent: attendanceItem.isPresent,
        hoursWorked: attendanceItem.isPresent
          ? parseFloat(attendanceItem.hoursWorked)
          : 0,
        notes: attendanceItem.notes,
      };

      const response = await attendanceAPI.markAttendance(submitData);

      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId
            ? {
                ...item,
                isSubmitting: false,
                isMarked: true,
                existingRecordId: response.data.data._id,
              }
            : item
        )
      );

      setSuccessMessage(
        `Attendance marked for ${attendanceItem.employee.name}!`
      );
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      console.error("Mark attendance error:", error);
      setErrors({
        [employeeId]:
          error.response?.data?.message || "Failed to mark attendance",
      });

      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId
            ? { ...item, isSubmitting: false }
            : item
        )
      );
    }
  };

  const markAllPresent = () => {
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : true, // Don't change if already marked
        isMarked: item.existingRecordId ? item.isMarked : false,
      }))
    );
  };

  const resetUnmarked = () => {
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : null, // Don't change if already marked
        hoursWorked: item.existingRecordId ? item.hoursWorked : "8",
        notes: item.existingRecordId ? item.notes : "",
        isMarked: item.existingRecordId ? item.isMarked : false,
      }))
    );
  };

  // Filter and search logic
  const filteredAttendanceData = attendanceData.filter((item) => {
    const matchesSearch =
      item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filterStatus) {
        case "present":
          return item.isPresent === true;
        case "absent":
          return item.isPresent === false;
        case "unmarked":
          return item.isPresent === null && !item.existingRecordId;
        case "marked":
          return item.existingRecordId !== null;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    return attendanceData.reduce(
      (acc, item) => {
        if (item.existingRecordId) acc.marked++;
        else if (item.isPresent === true) acc.present++;
        else if (item.isPresent === false) acc.absent++;
        else acc.unmarked++;
        return acc;
      },
      { present: 0, absent: 0, unmarked: 0, marked: 0 }
    );
  };

  const statusCounts = getStatusCounts();

  if (employeesLoading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Mark Attendance"
          subheader="Record employee attendance in bulk"
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Mark Attendance"
        subheader="Record employee attendance in bulk - Excel-like interface"
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

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-emerald-800 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Controls Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Search Employee
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Name or Employee ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Filter Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({attendanceData.length})</option>
              <option value="marked">
                Already Marked ({statusCounts.marked})
              </option>
              <option value="present">Present ({statusCounts.present})</option>
              <option value="absent">Absent ({statusCounts.absent})</option>
              <option value="unmarked">
                Unmarked ({statusCounts.unmarked})
              </option>
            </select>
          </div>

          {/* Bulk Actions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bulk Actions
            </label>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                All Present
              </button>
              <button
                onClick={resetUnmarked}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Employee Attendance -{" "}
                  {new Date(selectedDate).toLocaleDateString()}
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {filteredAttendanceData.length} of{" "}
                  {attendanceData.length} employees
                </p>
              </div>
            </div>
            <div className="text-sm text-blue-600">
              Marked: {statusCounts.marked} | Present: {statusCounts.present} |
              Absent: {statusCounts.absent} | Unmarked: {statusCounts.unmarked}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[200px]">
                  Employee
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                  Employee ID
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[100px]">
                  Hours
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[200px]">
                  Notes
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendanceData.map((item, index) => (
                <tr
                  key={item.employeeId}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    item.existingRecordId
                      ? "bg-blue-50"
                      : item.isMarked
                      ? "bg-green-50"
                      : ""
                  }`}
                >
                  {/* Employee Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.employee.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.employee.paymentType} • {item.employee.phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Employee ID */}
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900 text-sm">
                      {item.employee.employeeId}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {item.existingRecordId ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.isPresent
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.isPresent ? "Present" : "Absent"} ✓
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateAttendance(item.employeeId, "isPresent", true)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isPresent === true
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-green-100"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => {
                            updateAttendance(
                              item.employeeId,
                              "isPresent",
                              false
                            );
                            updateAttendance(
                              item.employeeId,
                              "hoursWorked",
                              "0"
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.isPresent === false
                              ? "bg-red-600 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-red-100"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={item.hoursWorked}
                      onChange={(e) =>
                        updateAttendance(
                          item.employeeId,
                          "hoursWorked",
                          e.target.value
                        )
                      }
                      disabled={
                        item.isPresent === false || item.existingRecordId
                      }
                      step="0.5"
                      min="0"
                      max="24"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) =>
                        updateAttendance(
                          item.employeeId,
                          "notes",
                          e.target.value
                        )
                      }
                      disabled={item.existingRecordId}
                      placeholder="Add notes..."
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4">
                    {item.existingRecordId ? (
                      <button
                        onClick={() => navigate(`/admin/attendance/report`)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    ) : (
                      <button
                        onClick={() => markSingleAttendance(item.employeeId)}
                        disabled={item.isSubmitting || item.isPresent === null}
                        className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          item.isSubmitting
                            ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                            : item.isPresent === null
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {item.isSubmitting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            Mark
                          </>
                        )}
                      </button>
                    )}
                    {errors[item.employeeId] && (
                      <p className="text-red-600 text-xs mt-1">
                        {errors[item.employeeId]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAttendanceData.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No employees found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
