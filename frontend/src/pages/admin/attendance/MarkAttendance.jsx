import React, { useState, useEffect, useCallback } from "react";
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
  Download,
  Building,
  FileText,
  Trash2,
  AlertTriangle,
  Edit,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { attendanceAPI } from "../../../services/api";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";
import { useAuth } from "../../../contexts/AuthContext";

const MarkAttendance = () => {
  const { user } = useAuth();
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: "",
    filterStatus: "all",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState({});

  // Modal states for details, edit, delete
  const [modals, setModals] = useState({
    details: { isOpen: false, data: null },
    edit: { isOpen: false, data: null },
    delete: { isOpen: false, data: null },
  });

  // Enhanced states for bulk operations
  const [bulkAction, setBulkAction] = useState(null);
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Edit form state for modal
  const [editForm, setEditForm] = useState({
    date: "",
    isPresent: null,
    hoursWorked: "0",
    notes: "",
  });

  // User role - You should get this from your auth context/state
  const userRole = user.role; // Replace with actual user role logic

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchExistingAttendance();
    }
  }, [employees, selectedDate]);

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

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
            date: existingRecord.date,
            markedBy: existingRecord.markedBy,
          };
        } else {
          return {
            employeeId: employee._id,
            employee: employee,
            isPresent: null,
            hoursWorked: employee.workingHours?.toString() || "9",
            notes: "",
            isMarked: false,
            isSubmitting: false,
            existingRecordId: null,
            date: selectedDate,
            markedBy: null,
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
      hoursWorked: employee.workingHours?.toString() || "9",
      notes: "",
      isMarked: false,
      isSubmitting: false,
      existingRecordId: null,
      date: selectedDate,
      markedBy: null,
    }));
    setAttendanceData(data);
  };

  // Refresh function
  const handleRefresh = async () => {
    await Promise.all([fetchEmployees(), fetchExistingAttendance()]);
    setSelectedEmployees(new Set());
    setSelectAll(false);
    setBulkAction(null);
    setShowBulkConfirmation(false);
  };

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      filterStatus: "all",
    });
    setShowFilters(false);
  }, []);

  // Modal handlers
  const openModal = (type, data = null) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: true, data },
    }));

    if (type === "edit" && data) {
      setEditForm({
        date: data.date ? data.date.split("T")[0] : selectedDate,
        isPresent: data.isPresent,
        hoursWorked: data.hoursWorked?.toString() || "0",
        notes: data.notes || "",
      });
    }
  };

  const closeModal = (type) => {
    setModals((prev) => ({
      ...prev,
      [type]: { isOpen: false, data: null },
    }));
    if (type === "edit") {
      setErrors({});
    }
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  };

  // Update attendance from modal
  const handleUpdateAttendance = async () => {
    try {
      const attendanceId = modals.edit.data.existingRecordId;

      const updateData = {
        isPresent: editForm.isPresent,
        hoursWorked: Math.round(parseFloat(editForm.hoursWorked) || 0),
        notes: editForm.notes,
        date: editForm.date,
      };

      await attendanceAPI.updateAttendance(attendanceId, updateData);

      // Update local state
      setAttendanceData((prev) =>
        prev.map((item) =>
          item.existingRecordId === attendanceId
            ? {
                ...item,
                isPresent: updateData.isPresent,
                hoursWorked: updateData.hoursWorked.toString(),
                notes: updateData.notes,
                date: updateData.date,
              }
            : item
        )
      );

      setSuccessMessage("Attendance updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      closeModal("edit");
    } catch (error) {
      console.error("Failed to update attendance:", error);
      setErrors({
        edit: error.response?.data?.message || "Failed to update attendance",
      });
    }
  };

  // Delete attendance record
  const handleDeleteAttendance = async () => {
    try {
      const attendanceId = modals.delete.data.existingRecordId;
      await attendanceAPI.deleteAttendance(attendanceId);

      // Reset item in local state to unmarked
      setAttendanceData((prev) =>
        prev.map((item) =>
          item.existingRecordId === attendanceId
            ? {
                ...item,
                isPresent: null,
                hoursWorked: item.employee.workingHours?.toString() || "9",
                notes: "",
                isMarked: false,
                existingRecordId: null,
                markedBy: null,
              }
            : item
        )
      );

      setSuccessMessage("Attendance record deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      closeModal("delete");
    } catch (error) {
      console.error("Failed to delete attendance:", error);
      setErrors({
        delete:
          error.response?.data?.message || "Failed to delete attendance record",
      });
    }
  };

  // Quick mark present/absent (inline)
  const updateAttendanceAndSave = async (employeeId, isPresent) => {
    const attendanceItem = attendanceData.find(
      (item) => item.employeeId === employeeId
    );

    if (!attendanceItem) return;

    try {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: true }));

      const submitData = {
        isPresent: isPresent,
        hoursWorked: isPresent
          ? Math.round(parseFloat(attendanceItem.hoursWorked || "9"))
          : 0,
        notes: attendanceItem.notes || "",
        employeeId: employeeId,
        date: selectedDate,
      };

      if (attendanceItem.existingRecordId) {
        await attendanceAPI.updateAttendance(attendanceItem.existingRecordId, {
          isPresent: submitData.isPresent,
          hoursWorked: submitData.hoursWorked,
          notes: submitData.notes,
        });
      } else {
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
      }

      setAttendanceData((prev) =>
        prev.map((item) =>
          item.employeeId === employeeId
            ? { ...item, isPresent: isPresent }
            : item
        )
      );

      setSuccessMessage(
        `Attendance ${
          attendanceItem.existingRecordId ? "updated" : "marked"
        } for ${attendanceItem.employee.name}!`
      );
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      console.error("Error saving attendance:", error);
      setErrors({
        [employeeId]:
          error.response?.data?.message || "Failed to mark attendance",
      });
    } finally {
      setAutoSaving((prev) => ({ ...prev, [employeeId]: false }));
    }
  };

  // Selection functions for bulk actions
  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }

      const unmarkedEmployees = attendanceData.filter(
        (item) => !item.existingRecordId
      );

      setSelectAll(
        newSet.size === unmarkedEmployees.length && unmarkedEmployees.length > 0
      );

      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );

    if (selectAll) {
      setSelectedEmployees(new Set());
      setSelectAll(false);
    } else {
      setSelectedEmployees(
        new Set(unmarkedEmployees.map((emp) => emp.employeeId))
      );
      setSelectAll(true);
    }
  };

  // Get counts for bulk actions
  const getBulkActionCounts = () => {
    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );
    const targetEmployees =
      selectedEmployees.size > 0
        ? unmarkedEmployees.filter((item) =>
            selectedEmployees.has(item.employeeId)
          )
        : unmarkedEmployees;

    return {
      totalUnmarked: unmarkedEmployees.length,
      targetCount: targetEmployees.length,
      hasSelection: selectedEmployees.size > 0,
    };
  };

  // Bulk actions
  const setBulkPresent = () => {
    const counts = getBulkActionCounts();
    if (counts.targetCount === 0) {
      alert(
        "No employees available to mark present. All attendance is already recorded."
      );
      return;
    }
    setBulkAction("present");
    setShowBulkConfirmation(true);
  };

  const setBulkAbsent = () => {
    const counts = getBulkActionCounts();
    if (counts.targetCount === 0) {
      alert(
        "No employees available to mark absent. All attendance is already recorded."
      );
      return;
    }
    setBulkAction("absent");
    setShowBulkConfirmation(true);
  };

  const confirmBulkAction = async () => {
    setBulkLoading(true);
    const counts = getBulkActionCounts();

    const unmarkedEmployees = attendanceData.filter(
      (item) => !item.existingRecordId
    );
    const targetEmployees =
      selectedEmployees.size > 0
        ? unmarkedEmployees.filter((item) =>
            selectedEmployees.has(item.employeeId)
          )
        : unmarkedEmployees;

    try {
      const savePromises = targetEmployees.map(async (item) => {
        const submitData = {
          employeeId: item.employeeId,
          date: selectedDate,
          isPresent: bulkAction === "present",
          hoursWorked: Math.round(parseFloat(item.hoursWorked || "9")),
          notes: item.notes || "",
        };

        const response = await attendanceAPI.markAttendance(submitData);
        return {
          employeeId: item.employeeId,
          recordId: response.data.data._id,
        };
      });

      const results = await Promise.all(savePromises);

      setAttendanceData((prev) =>
        prev.map((item) => {
          const result = results.find((r) => r.employeeId === item.employeeId);
          return result
            ? {
                ...item,
                isMarked: true,
                existingRecordId: result.recordId,
                isPresent: bulkAction === "present",
              }
            : item;
        })
      );

      setSuccessMessage(
        `Successfully marked ${targetEmployees.length} employees as ${bulkAction}!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      setBulkAction(null);
      setShowBulkConfirmation(false);
      setSelectedEmployees(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Bulk mark error:", error);
      setErrors({ bulk: `Failed to mark selected employees as ${bulkAction}` });
    } finally {
      setBulkLoading(false);
    }
  };

  const cancelBulkAction = () => {
    setBulkAction(null);
    setShowBulkConfirmation(false);
  };

  const resetUnmarked = () => {
    setAttendanceData((prev) =>
      prev.map((item) => ({
        ...item,
        isPresent: item.existingRecordId ? item.isPresent : null,
        hoursWorked: item.existingRecordId
          ? item.hoursWorked
          : item.employee.workingHours?.toString() || "9",
        notes: item.existingRecordId ? item.notes : "",
        isMarked: item.existingRecordId ? item.isMarked : false,
      }))
    );
    setErrors({});
    setBulkAction(null);
    setShowBulkConfirmation(false);
    setSelectedEmployees(new Set());
    setSelectAll(false);
  };

  // Filter and search logic
  const filteredAttendanceData = attendanceData.filter((item) => {
    const matchesSearch =
      item.employee.name
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase()) ||
      item.employee.employeeId
        .toLowerCase()
        .includes(filters.searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filters.filterStatus) {
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
  const bulkCounts = getBulkActionCounts();

  // Export function placeholder
  const exportData = useCallback(() => {
    const csvData = attendanceData.map((item) => ({
      Employee: item.employee.name,
      EmployeeID: item.employee.employeeId,
      Status:
        item.isPresent === null
          ? "Unmarked"
          : item.isPresent
          ? "Present"
          : "Absent",
      HoursWorked: item.hoursWorked,
      Notes: item.notes,
      Date: selectedDate,
    }));
  }, [attendanceData, selectedDate]);

  if (employeesLoading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Mark Attendance"
          subheader="Record employee attendance for the day"
          onRefresh={handleRefresh}
          loading={employeesLoading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (attendanceData.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Mark Attendance"
          subheader="Record employee attendance for the day"
          onRefresh={handleRefresh}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No employees found
            </h3>
            <p className="text-red-600 mb-4">
              No employees available to mark attendance for.
            </p>
            <button onClick={handleRefresh} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HeaderComponent
          header="Mark Attendance"
          subheader="Record employee attendance for the day"
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {/* Breadcrumb & Quick Actions with Date Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Attendance Management</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Mark Attendance</span>
            </div>

            {/* Date Navigation Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-5 h-5 text-blue-600" />
                </button>

                <div className="p-2 px-4 bg-white border border-blue-200 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {formatDate(selectedDate)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              <button
                onClick={() =>
                  setSelectedDate(new Date().toISOString().split("T")[0])
                }
                className="btn-primary btn-sm"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/attendance/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">
                {successMessage}
              </span>
            </div>
          </div>
        )}

        {errors.bulk && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{errors.bulk}</span>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Employees"
            value={attendanceData.length}
            icon={Users}
            color="blue"
            subtitle="Available today"
          />
          <StatCard
            title="Already Marked"
            value={statusCounts.marked}
            icon={CheckCircle}
            color="green"
            subtitle="Records saved"
          />
          <StatCard
            title="Present"
            value={
              statusCounts.present +
              attendanceData.filter(
                (item) => item.existingRecordId && item.isPresent
              ).length
            }
            icon={UserCheck}
            color="emerald"
            subtitle="Active employees"
          />
          <StatCard
            title="Absent"
            value={
              statusCounts.absent +
              attendanceData.filter(
                (item) => item.existingRecordId && !item.isPresent
              ).length
            }
            icon={UserX}
            color="red"
            subtitle="Away today"
          />
          <StatCard
            title="Selected"
            value={selectedEmployees.size}
            icon={Check}
            color="purple"
            subtitle="For bulk action"
          />
        </div>

        {/* Prominent Bulk Action Buttons */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Quick Bulk Actions
              </h3>
              <p className="text-sm text-gray-600">
                {bulkCounts.hasSelection
                  ? `${selectedEmployees.size} employees selected for bulk action`
                  : `${bulkCounts.totalUnmarked} unmarked employees available`}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleSelectAll}
                disabled={statusCounts.unmarked === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {selectAll ? "Unselect All" : "Select All Unmarked"}
              </button>

              <button
                onClick={setBulkPresent}
                disabled={
                  bulkLoading ||
                  showBulkConfirmation ||
                  bulkCounts.targetCount === 0
                }
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserCheck className="w-4 h-4" />
                Mark {bulkCounts.hasSelection ? "Selected" : "All"} Present
                <span className="ml-1 bg-white text-green-600 font-bold bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {bulkCounts.targetCount}
                </span>
              </button>

              <button
                onClick={setBulkAbsent}
                disabled={
                  bulkLoading ||
                  showBulkConfirmation ||
                  bulkCounts.targetCount === 0
                }
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserX className="w-4 h-4" />
                Mark {bulkCounts.hasSelection ? "Selected" : "All"} Absent
                <span className="ml-1 bg-white text-red-600 font-bold bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {bulkCounts.targetCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Confirmation Banner */}
        {showBulkConfirmation && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-900">
                    Confirm Bulk Action
                  </h3>
                  <p className="text-amber-800 mt-1">
                    Ready to mark{" "}
                    <span className="font-semibold">
                      {bulkCounts.targetCount}
                    </span>{" "}
                    employees as{" "}
                    <span className="font-semibold">{bulkAction}</span> with
                    their current data?
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelBulkAction}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={confirmBulkAction}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {bulkLoading ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Filter Attendance
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Employee
                </label>
                <input
                  type="text"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Name or Employee ID"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Filter
                </label>
                <select
                  name="filterStatus"
                  value={filters.filterStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All ({attendanceData.length})</option>
                  <option value="marked">Marked ({statusCounts.marked})</option>
                  <option value="present">
                    Present ({statusCounts.present})
                  </option>
                  <option value="absent">Absent ({statusCounts.absent})</option>
                  <option value="unmarked">
                    Unmarked ({statusCounts.unmarked})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quick Actions
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                  <button
                    onClick={resetUnmarked}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 flex items-center">
                Showing {filteredAttendanceData.length} of{" "}
                {attendanceData.length} employees
              </div>
              {selectedEmployees.size > 0 && (
                <div className="text-sm text-purple-600 flex items-center font-medium">
                  {selectedEmployees.size} selected for bulk action
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Employee Attendance
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedDate)} - Mark attendance for all
                    employees
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {filteredAttendanceData.length} employees
              </div>
            </div>
          </div>

          <div className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          disabled={statusCounts.unmarked === 0}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Employee
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Hours
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Notes
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceData.length > 0 ? (
                    filteredAttendanceData.map((item) => (
                      <tr
                        key={item.employeeId}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(item.employeeId)}
                              onChange={() =>
                                toggleEmployeeSelection(item.employeeId)
                              }
                              disabled={item.existingRecordId}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 text-sm">
                                {item.employee.name}
                              </span>
                              <div className="text-xs text-gray-500">
                                {item.employee.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            <Phone className="w-3 h-3 text-gray-500" />
                            {item.employee.phone}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={item.hoursWorked}
                              onChange={(e) =>
                                setAttendanceData((prev) =>
                                  prev.map((rec) =>
                                    rec.employeeId === item.employeeId
                                      ? { ...rec, hoursWorked: e.target.value }
                                      : rec
                                  )
                                )
                              }
                              step="0.5"
                              min="0"
                              max="24"
                              className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              disabled={showBulkConfirmation}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) =>
                              setAttendanceData((prev) =>
                                prev.map((rec) =>
                                  rec.employeeId === item.employeeId
                                    ? { ...rec, notes: e.target.value }
                                    : rec
                                )
                              )
                            }
                            disabled={showBulkConfirmation}
                            placeholder="Add notes..."
                            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-3 px-4">
                          {item.existingRecordId ? (
                            <span
                              className={`px-2 py-1 text-xs rounded-full text-nowrap ${
                                item.isPresent
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.isPresent ? "Present" : "Absent"}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full text-nowrap">
                              Unmarked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Details */}
                            <button
                              onClick={() => openModal("details", item)}
                              title="View Details"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete - only superadmin and existing records */}
                            {userRole === "superadmin" &&
                              item.existingRecordId && (
                                <>
                                  {/* Edit - only for existing records */}
                                  {item.existingRecordId && (
                                    <button
                                      onClick={() => openModal("edit", item)}
                                      title="Edit Attendance"
                                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openModal("delete", item)}
                                    title="Delete Attendance"
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                            {/* Quick Present/Absent for unmarked */}
                            {!item.existingRecordId && (
                              <>
                                <button
                                  onClick={() =>
                                    updateAttendanceAndSave(
                                      item.employeeId,
                                      true
                                    )
                                  }
                                  disabled={
                                    autoSaving[item.employeeId] ||
                                    showBulkConfirmation
                                  }
                                  title="Mark Present"
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateAttendanceAndSave(
                                      item.employeeId,
                                      false
                                    )
                                  }
                                  disabled={
                                    autoSaving[item.employeeId] ||
                                    showBulkConfirmation
                                  }
                                  title="Mark Absent"
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {autoSaving[item.employeeId] && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">
                          No employees found
                        </p>
                        <p className="text-gray-400 text-sm">
                          Try adjusting your filters
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredAttendanceData.length > 0 ? (
                filteredAttendanceData.map((item) => (
                  <div
                    key={item.employeeId}
                    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.has(item.employeeId)}
                            onChange={() =>
                              toggleEmployeeSelection(item.employeeId)
                            }
                            disabled={item.existingRecordId}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.employee.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.employee.employeeId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => openModal("details", item)}
                            title="View Details"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          {userRole === "superadmin" &&
                            item.existingRecordId && (
                              <>
                                {/* Edit */}
                                {item.existingRecordId && (
                                  <button
                                    onClick={() => openModal("edit", item)}
                                    title="Edit Attendance"
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => openModal("delete", item)}
                                  title="Delete Attendance"
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                          {/* Quick actions for unmarked */}
                          {!item.existingRecordId && (
                            <>
                              <button
                                onClick={() =>
                                  updateAttendanceAndSave(item.employeeId, true)
                                }
                                disabled={
                                  autoSaving[item.employeeId] ||
                                  showBulkConfirmation
                                }
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Mark Present"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  updateAttendanceAndSave(
                                    item.employeeId,
                                    false
                                  )
                                }
                                disabled={
                                  autoSaving[item.employeeId] ||
                                  showBulkConfirmation
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Mark Absent"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-500">Hours</label>
                          <input
                            type="number"
                            value={item.hoursWorked}
                            onChange={(e) =>
                              setAttendanceData((prev) =>
                                prev.map((rec) =>
                                  rec.employeeId === item.employeeId
                                    ? { ...rec, hoursWorked: e.target.value }
                                    : rec
                                )
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white mt-1"
                            step="0.5"
                            min="0"
                            max="24"
                            disabled={showBulkConfirmation}
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">
                            Status
                          </label>
                          <div className="mt-1">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                item.existingRecordId && item.isPresent
                                  ? "bg-green-100 text-green-800"
                                  : item.existingRecordId && !item.isPresent
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.existingRecordId
                                ? item.isPresent
                                  ? "Present"
                                  : "Absent"
                                : "Unmarked"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-gray-500">Notes</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) =>
                            setAttendanceData((prev) =>
                              prev.map((rec) =>
                                rec.employeeId === item.employeeId
                                  ? { ...rec, notes: e.target.value }
                                  : rec
                              )
                            )
                          }
                          placeholder="Add notes..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white mt-1"
                          disabled={showBulkConfirmation}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No employees found
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={modals.details.isOpen}
        onClose={() => closeModal("details")}
        title="Attendance Details"
        subtitle="View attendance record"
        headerIcon={<Eye />}
        headerColor="blue"
        size="md"
      >
        {modals.details.data && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Name
                  </label>
                  <p className="text-gray-900 font-semibold text-lg">
                    {modals.details.data.employee?.name}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {modals.details.data.employee?.employeeId}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <p className="text-gray-900 font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {formatDate(modals.details.data.date)}
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
                    Phone
                  </label>
                  <p className="text-gray-900 font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {modals.details.data.employee?.phone}
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
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modals.edit.isOpen}
        onClose={() => closeModal("edit")}
        title="Edit Attendance"
        subtitle="Update attendance record"
        headerIcon={<Edit />}
        headerColor="orange"
        size="md"
      >
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
                      {modals.edit.data.employee?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {modals.edit.data.employee?.employeeId}
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                          setEditForm((prev) => ({ ...prev, isPresent: true }))
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
                          setEditForm((prev) => ({ ...prev, isPresent: false }))
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    placeholder="Add any notes about this attendance record..."
                  />
                </div>
              </div>
            </div>

            {errors.edit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.edit}</p>
              </div>
            )}

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
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={modals.delete.isOpen}
        onClose={() => closeModal("delete")}
        title="Delete Attendance Record"
        subtitle="This action cannot be undone"
        headerIcon={<AlertTriangle />}
        headerColor="red"
        size="sm"
      >
        {modals.delete.data && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900 mb-2">
                    Confirm Deletion
                  </h4>
                  <p className="text-sm text-red-800">
                    You are about to delete the attendance record for:
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {modals.delete.data.employee?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {modals.delete.data.employee?.employeeId}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Date:</strong> {formatDate(modals.delete.data.date)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {modals.delete.data.isPresent ? "Present" : "Absent"}
                </p>
                <p>
                  <strong>Hours:</strong> {modals.delete.data.hoursWorked || 0}h
                </p>
              </div>
            </div>

            {errors.delete && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.delete}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => closeModal("delete")}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAttendance}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default MarkAttendance;
