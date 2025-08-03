import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const AttendanceCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedEmployee]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getCalendarData({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        employeeId: selectedEmployee || undefined,
      });

      setCalendarData(response.data.data.calendarData || {});
      setSummary(response.data.data.summary || {});
      setError(null);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
      setError("Failed to fetch calendar data");
      setCalendarData({});
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(
        Array.isArray(response.data.data?.employees) ? response.data.data.employees : []
      );
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getAttendanceForDate = (day) => {
    if (!day) return [];

    const dateKey = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
      .toISOString()
      .split("T")[0];

    return calendarData[dateKey] || [];
  };

  const getDayStatus = (day) => {
    if (!day) return null;

    const attendance = getAttendanceForDate(day);
    if (attendance.length === 0) return "no-data";

    const presentCount = attendance.filter((record) => record.isPresent).length;
    const totalCount = attendance.length;

    if (presentCount === totalCount) return "all-present";
    if (presentCount === 0) return "all-absent";
    return "mixed";
  };

  const getDayStatusColor = (status) => {
    switch (status) {
      case "all-present":
        return "bg-green-100 text-green-800 border-green-200";
      case "all-absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "mixed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Attendance Calendar"
          subheader="Monthly attendance overview"
          loading={loading}
        />
        <div className="animate-pulse">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Attendance Calendar"
        subheader={`${
          monthNames[currentDate.getMonth()]
        } ${currentDate.getFullYear()} attendance overview`}
        onRefresh={fetchCalendarData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4" />
          <span>Attendance Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Calendar View</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/attendance/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Days"
          value={summary.totalDays || 0}
          icon={CalendarIcon}
          color="blue"
          change="Working days"
        />
        <StatCard
          title="Present Days"
          value={summary.presentDays || 0}
          icon={CheckCircle}
          color="green"
          change="Attended"
        />
        <StatCard
          title="Absent Days"
          value={summary.absentDays || 0}
          icon={XCircle}
          color="red"
          change="Not attended"
        />
        <StatCard
          title="Attendance Rate"
          value={`${
            summary.totalDays > 0
              ? Math.round((summary.presentDays / summary.totalDays) * 100)
              : 0
          }%`}
          icon={Users}
          color="purple"
          change="Overall rate"
        />
      </div>

      {/* Filters */}
      <SectionCard title="Filters" icon={Filter} headerColor="gray">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Employee Filter
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
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
              Current Selection
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg">
              <span className="text-gray-700">
                {selectedEmployee
                  ? employees.find((emp) => emp._id === selectedEmployee)
                      ?.name || "Unknown"
                  : "All Employees"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Actions
            </label>
            <button
              onClick={() => setSelectedEmployee("")}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Calendar */}
      <SectionCard
        title="Attendance Calendar"
        icon={CalendarIcon}
        headerColor="blue"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((day, index) => {
            const status = getDayStatus(day);
            const attendance = getAttendanceForDate(day);

            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border rounded-lg transition-all duration-200 ${
                  day ? "cursor-pointer hover:shadow-md" : ""
                } ${getDayStatusColor(status)}`}
                onClick={() =>
                  day &&
                  attendance.length > 0 &&
                  console.log("View day details:", day)
                }
              >
                {day && (
                  <>
                    <div className="font-medium text-center mb-1">{day}</div>
                    {attendance.length > 0 && (
                      <div className="space-y-1">
                        {!selectedEmployee ? (
                          <div className="text-center">
                            <div className="text-xs">
                              {attendance.filter((r) => r.isPresent).length}/
                              {attendance.length}
                            </div>
                            <div className="text-xs opacity-75">
                              {Math.round(
                                (attendance.filter((r) => r.isPresent).length /
                                  attendance.length) *
                                  100
                              )}
                              %
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            {attendance.map((record, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-center"
                              >
                                {record.isPresent ? (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            ))}
                            {attendance[0] && (
                              <div className="text-xs mt-1">
                                {attendance[0].hoursWorked || 0}h
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-600">All Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-600">All Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span className="text-gray-600">Mixed Attendance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-gray-600">No Data</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default AttendanceCalendar;
