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
  UserCheck,
  UserX,
  RotateCcw,
  Check,
  Edit3,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { attendanceAPI } from "../../../services/api";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import { formatDate } from "../../../utils/dateUtils";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState({});

  // New states for bulk confirmation
  const [bulkAction, setBulkAction] = useState(null); // 'present', 'absent', or null
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);

  // New state for editing individual records
  const [isEditing, setIsEditing] = useState({}); // { employeeId: boolean }

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

  const fetchExistingAttendance = async () => {
    try {
      setLoading(true);

      if (!attendanceAPI.getAttendanceByDate) {
        console.warn("getAttendanceByDate API method not available");
        initializeAttendanceData();
        return;
      }

      const response = await attendanceAPI.getAttendanceByDate(selectedDate);
      const existingRecords = response.data?.data || [];

      setExistingAttendance(existingRecords);

      const attendanceMap = {};
      existingRecords.forEach((record) => {
        const empId = record.employeeId?._id || record.employeeId;
        if (empId) {
          attendanceMap[empId] = record;
        }
      });

      const data = employees.map((employee) => {
        const existingRecord = attendanceMap[employee._id];

        if (existingRecord) {
          return {
            employeeId: employee._id,
            employee: employee,
            isPresent: existingRecord.isPresent,
            hoursWorked: existingRecord.hoursWorked?.toString() || "0",
            notes: existingRecord.notes || "",
            isMarked: true,
            isSubmitting: false,
            existingRecordId: existingRecord._id,
          };
        } else {
          return {
            employeeId: employee._id,
            employee: employee,
            isPresent: null,
            hoursWorked: "9",
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

  // Refresh function for header
  const handleRefresh = async () => {
    await Promise.all([fetchEmployees(), fetchExistingAttendance()]);
    setIsEditing({}); // Reset editing states on refresh
  };

  // Toggle editing mode for a specific employee
  const toggleEditMode = (employeeId) => {
    setIsEditing((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  // Auto-save attendance when status is changed (for unmarked records)
  const updateAttendanceAndSave = async (employeeId, field, value) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    // If already marked and not in editing mode, don't allow changes
    if (attendanceItem.existingRecordId && !isEditing[employeeId]) {
      return;
    }

    // Update the state first
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId
          ? {
              ...item,
              [field]: value,
              hoursWorked:
                field === "isPresent" && value === false
                  ? "0"
                  : field === "isPresent" &&
                    value === true &&
                    item.hoursWorked === "0"
                  ? "8"
                  : item.hoursWorked,
            }
          : item
      )
    );

    // If updating isPresent status, auto-save to backend
    if (field === "isPresent" && value !== null) {
      if (attendanceItem.existingRecordId) {
        // Update existing record
        await updateExistingAttendance(employeeId, value);
      } else {
        // Create new record
        await autoSaveAttendance(employeeId, value);
      }
    }
  };

  // Update existing attendance record
  const updateExistingAttendance = async (employeeId, isPresent) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    if (!attendanceItem || !attendanceItem.existingRecordId) {
      return;
    }

    try {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: true }));

      const submitData = {
        isPresent: isPresent,
        hoursWorked: isPresent
          ? parseFloat(attendanceItem.hoursWorked || "8")
          : 0,
        notes: attendanceItem.notes || "",
      };

      // Assuming we have an updateAttendance API method
      const response = await attendanceAPI.updateAttendance(
        attendanceItem.existingRecordId,
        submitData
      );

      setSuccessMessage(
        `Attendance updated for ${attendanceItem.employee.name}!`
      );
      setTimeout(() => setSuccessMessage(""), 2000);

      // Exit editing mode after successful update
      setIsEditing((prev) => ({
        ...prev,
        [employeeId]: false,
      }));
    } catch (error) {
      console.error("Update attendance error:", error);
      setErrors({
        [employeeId]:
          error.response?.data?.message || "Failed to update attendance",
      });

      // Revert the status change on error
      const originalItem = existingAttendance.find(
        (record) => (record.employeeId?._id || record.employeeId) === employeeId
      );
      if (originalItem) {
        setAttendanceData((prev) =>
          prev.map((item) =>
            item.employeeId === employeeId
              ? { ...item, isPresent: originalItem.isPresent }
              : item
          )
        );
      }
    } finally {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  const autoSaveAttendance = async (employeeId, isPresent) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    if (!attendanceItem || attendanceItem.existingRecordId) {
      return;
    }

    try {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: true }));

      const submitData = {
        employeeId: employeeId,
        date: selectedDate,
        isPresent: isPresent,
        hoursWorked: isPresent
          ? parseFloat(attendanceItem.hoursWorked || "8")
          : 0,
        notes: attendanceItem.notes || "",
      };

      const response = await attendanceAPI.markAttendance(submitData);

      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId
            ? {
                ...item,
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
      console.error("Auto-save attendance error:", error);
      setErrors({
        [employeeId]:
          error.response?.data?.message || "Failed to mark attendance",
      });

      // Revert the status change on error
      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId ? { ...item, isPresent: null } : item
        )
      );
    } finally {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  // Update hours or notes and save to backend if record exists
  const updateFieldAndSave = async (employeeId, field, value) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    // Update the state first
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.employeeId === employeeId ? { ...item, [field]: value } : item
      )
    );

    // If it's an existing record and we're in editing mode, save to backend
    if (attendanceItem.existingRecordId && isEditing[employeeId]) {
      try {
        setAutoSaving((prev) => ({ ...prev, [employeeId]: true }));

        const submitData = {
          isPresent: attendanceItem.isPresent,
          hoursWorked:
            field === "hoursWorked"
              ? parseFloat(value) || 0
              : parseFloat(attendanceItem.hoursWorked || "8"),
          notes: field === "notes" ? value : attendanceItem.notes,
        };

        await attendanceAPI.updateAttendance(
          attendanceItem.existingRecordId,
          submitData
        );

        setSuccessMessage(
          `${field === "hoursWorked" ? "Hours" : "Notes"} updated for ${
            attendanceItem.employee.name
          }!`
        );
        setTimeout(() => setSuccessMessage(""), 2000);
      } catch (error) {
        console.error("Update field error:", error);
        setErrors({
          [employeeId]:
            error.response?.data?.message || `Failed to update ${field}`,
        });
      } finally {
        setAutoSaving((prev) => ({ ...prev, [employeeId]: false }));
      }
    }
  };

  // Set bulk action (UI only)
  const setBulkPresent = () => {
    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );

    if (unmarkedEmployees.length === 0) {
      alert("No employees to mark. All attendance is already recorded.");
      return;
    }

    setBulkAction("present");
    setShowBulkConfirmation(true);

    // Update UI first (without API call)
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : true,
        hoursWorked: item.existingRecordId ? item.hoursWorked : "8",
      }))
    );
  };

  const setBulkAbsent = () => {
    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );

    if (unmarkedEmployees.length === 0) {
      alert("No employees to mark. All attendance is already recorded.");
      return;
    }

    setBulkAction("absent");
    setShowBulkConfirmation(true);

    // Update UI first (without API call)
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : false,
        hoursWorked: item.existingRecordId ? item.hoursWorked : "0",
      }))
    );
  };

  // Confirm and execute bulk action
  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );

    try {
      // Save all to backend
      const savePromises = unmarkedEmployees.map(async (item) => {
        const submitData = {
          employeeId: item.employeeId,
          date: selectedDate,
          isPresent: bulkAction === "present",
          hoursWorked: bulkAction === "present" ? 8 : 0,
          notes: item.notes || "",
        };

        const response = await attendanceAPI.markAttendance(submitData);
        return {
          employeeId: item.employeeId,
          recordId: response.data.data._id,
        };
      });

      const results = await Promise.all(savePromises);

      // Update with record IDs
      setAttendanceData((prev) =>
        prev.map((item) => {
          const result = results.find((r) => r.employeeId === item.employeeId);
          return result
            ? { ...item, isMarked: true, existingRecordId: result.recordId }
            : item;
        })
      );

      setSuccessMessage(
        `Marked all ${unmarkedEmployees.length} employees as ${bulkAction}!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      // Reset bulk action state
      setBulkAction(null);
      setShowBulkConfirmation(false);
    } catch (error) {
      console.error("Bulk mark error:", error);
      setErrors({ bulk: `Failed to mark all as ${bulkAction}` });
    } finally {
      setBulkLoading(false);
    }
  };

  // Cancel bulk action
  const cancelBulkAction = () => {
    setBulkAction(null);
    setShowBulkConfirmation(false);

    // Revert UI changes
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : null,
        hoursWorked: item.existingRecordId ? item.hoursWorked : "8",
      }))
    );
  };

  const resetUnmarked = () => {
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : null,
        hoursWorked: item.existingRecordId ? item.hoursWorked : "8",
        notes: item.existingRecordId ? item.notes : "",
        isMarked: item.existingRecordId ? item.isMarked : false,
      }))
    );
    setErrors({});
    setBulkAction(null);
    setShowBulkConfirmation(false);
    setIsEditing({}); // Reset all editing states
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
          onRefresh={handleRefresh}
          loading={employeesLoading}
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
        subheader="Record employee attendance in bulk - Excel-like interface with auto-save & edit"
        onRefresh={handleRefresh}
        loading={loading}
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

      {errors.bulk && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{errors.bulk}</span>
        </div>
      )}

      {/* Bulk Confirmation Banner */}
      {showBulkConfirmation && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Ready to mark all unmarked employees as {bulkAction}?
                </p>
                <p className="text-yellow-700 text-sm">
                  This will save {statusCounts.unmarked} attendance records to
                  the database.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelBulkAction}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                disabled={bulkLoading}
                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                {bulkLoading ? "Saving..." : "Confirm & Save All"}
              </button>
            </div>
          </div>
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

          {/* Enhanced Bulk Actions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Bulk Actions
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={setBulkPresent}
                  disabled={bulkLoading || showBulkConfirmation}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3 h-3" />
                  All Present
                </button>
                <button
                  onClick={setBulkAbsent}
                  disabled={bulkLoading || showBulkConfirmation}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <UserX className="w-3 h-3" />
                  All Absent
                </button>
              </div>
              <button
                onClick={resetUnmarked}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Unmarked
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
                  Employee Attendance - {formatDate(selectedDate)}
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {filteredAttendanceData.length} of{" "}
                  {attendanceData.length} employees • Auto-save & edit enabled
                  {showBulkConfirmation &&
                    " • Bulk action pending confirmation"}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[150px]">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[100px]">
                  Hours
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[200px]">
                  Notes
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendanceData.map((item, index) => (
                <tr
                  key={item.employeeId}
                  className={`border-b border-gray-100 hover:bg-gray-50`}
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
                    {item.existingRecordId && !isEditing[item.employeeId] ? (
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
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() =>
                            updateAttendanceAndSave(
                              item.employeeId,
                              "isPresent",
                              true
                            )
                          }
                          disabled={
                            autoSaving[item.employeeId] || showBulkConfirmation
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            item.isPresent === true
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-green-100"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() =>
                            updateAttendanceAndSave(
                              item.employeeId,
                              "isPresent",
                              false
                            )
                          }
                          disabled={
                            autoSaving[item.employeeId] || showBulkConfirmation
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                            item.isPresent === false
                              ? "bg-red-600 text-white"
                              : "bg-gray-200 text-gray-600 hover:bg-red-100"
                          }`}
                        >
                          Absent
                        </button>
                        {autoSaving[item.employeeId] && (
                          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        )}
                      </div>
                    )}
                  </td>

                  {/* Hours */}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={item.hoursWorked}
                      onChange={(e) =>
                        updateFieldAndSave(
                          item.employeeId,
                          "hoursWorked",
                          e.target.value
                        )
                      }
                      disabled={
                        item.isPresent === false ||
                        (item.existingRecordId &&
                          !isEditing[item.employeeId]) ||
                        showBulkConfirmation
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
                        updateFieldAndSave(
                          item.employeeId,
                          "notes",
                          e.target.value
                        )
                      }
                      disabled={
                        (item.existingRecordId &&
                          !isEditing[item.employeeId]) ||
                        showBulkConfirmation
                      }
                      placeholder="Add notes..."
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {/* Edit Toggle Button */}
                      {item.existingRecordId && (
                        <button
                          onClick={() => toggleEditMode(item.employeeId)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                            isEditing[item.employeeId]
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                          title={
                            isEditing[item.employeeId]
                              ? "Cancel Edit"
                              : "Edit Attendance"
                          }
                        >
                          {isEditing[item.employeeId] ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </>
                          )}
                        </button>
                      )}

                      {/* Status Indicator */}
                      {item.existingRecordId ? (
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                            isEditing[item.employeeId]
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isEditing[item.employeeId] ? (
                            <>
                              <Edit3 className="w-3 h-3" />
                              Editing
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Saved
                            </>
                          )}
                        </span>
                      ) : autoSaving[item.employeeId] ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving...
                        </span>
                      ) : showBulkConfirmation && item.isPresent !== null ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-orange-100 text-orange-700">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      ) : item.isPresent !== null ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700">
                          <Clock className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
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
