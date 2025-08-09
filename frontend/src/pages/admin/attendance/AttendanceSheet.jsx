import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Filter,
  Users,
  Calculator,
  Banknote,
  Timer,
  Activity,
  Search,
  ArrowLeft,
  Plus,
  Minus,
  Eye,
  X,
  Building,
  CreditCard,
  Target,
  Award,
  Zap,
  TrendingDown as Undertime,
  ArrowUp,
  ArrowDown,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";

const AttendanceSheet = () => {
  const navigate = useNavigate();
  const [sheetData, setSheetData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [monthInfo, setMonthInfo] = useState({});
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendanceSheet();
  }, [selectedMonth, selectedYear, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees({ limit: 100 });
      setEmployees(response.data?.data?.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
  };

  const fetchAttendanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedEmployee !== "all") {
        params.employeeId = selectedEmployee;
      }

      const response = await attendanceAPI.getAttendanceSheet(params);

      if (response.data?.success) {
        setSheetData(response.data.data.sheetData || []);
        setMonthInfo({
          month: response.data.data.month,
          year: response.data.data.year,
          totalDays: response.data.data.totalDays,
          currentDate: response.data.data.currentDate,
          isMonthComplete: response.data.data.isMonthComplete,
        });
      }
    } catch (error) {
      console.error("Failed to fetch attendance sheet:", error);
      setError("Failed to fetch attendance sheet data");
      setSheetData([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSalary = async (employeeId) => {
    if (
      !window.confirm(
        "Are you sure you want to clear salary for this employee?"
      )
    ) {
      return;
    }

    try {
      console.log("Clear salary for employee:", employeeId);
      await fetchAttendanceSheet();
    } catch (error) {
      console.error("Failed to clear salary:", error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Employee ID",
      "Payment Type",
      "Basic Salary",
      "Working Days",
      "Working Hours",
      ...Array.from({ length: monthInfo.totalDays }, (_, i) => `Day ${i + 1}`),
      "Total Present",
      "Total Absent",
      "Total Hours",
      "Expected Hours",
      "Overtime Hours",
      "Undertime Hours",
      "Hourly Rate",
      "Base Salary",
      "Overtime Pay",
      "Undertime Deduction",
      "Gross Salary",
      "Total Advances",
      "Salary Paid",
      "Net Salary",
      "Pending Amount",
    ];

    const csvData = sheetData.map((emp) => {
      const dailyData = Array.from({ length: monthInfo.totalDays }, (_, i) => {
        const day = i + 1;
        const attendance = emp.dailyAttendance[day];
        if (attendance) {
          return attendance.isPresent ? `P(${attendance.hoursWorked}h)` : "A";
        }
        return "-";
      });

      return [
        emp.employee.name,
        emp.employee.employeeId,
        emp.employee.paymentType,
        emp.employee.basicSalary || emp.employee.hourlyRate,
        emp.employee.workingDays,
        emp.employee.workingHours,
        ...dailyData,
        emp.totalPresent,
        emp.totalAbsent,
        emp.totalHours,
        emp.expectedHours,
        emp.overtimeHours,
        emp.undertimeHours,
        emp.hourlyRate,
        emp.salaryBreakdown?.baseSalary || 0,
        emp.salaryBreakdown?.overtimePay || 0,
        emp.salaryBreakdown?.undertimeDeduction || 0,
        emp.grossSalary,
        emp.totalAdvances,
        emp.totalSalaryPaid,
        emp.netSalary,
        emp.pendingAmount,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_sheet_${getMonthName(
      selectedMonth
    )}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getMonthName = (month) => {
    const months = [
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
    return months[month - 1];
  };

  const filteredSheetData = sheetData.filter(
    (emp) =>
      emp.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = () => {
    const totalGrossSalary = filteredSheetData.reduce(
      (sum, emp) => sum + emp.grossSalary,
      0
    );
    const totalAdvances = filteredSheetData.reduce(
      (sum, emp) => sum + emp.totalAdvances,
      0
    );
    const totalPendingAmount = filteredSheetData.reduce(
      (sum, emp) => sum + emp.pendingAmount,
      0
    );
    const totalHours = filteredSheetData.reduce(
      (sum, emp) => sum + emp.totalHours,
      0
    );
    const totalExpectedHours = filteredSheetData.reduce(
      (sum, emp) => sum + emp.expectedHours,
      0
    );
    const totalOvertimeHours = filteredSheetData.reduce(
      (sum, emp) => sum + emp.overtimeHours,
      0
    );
    const avgAttendance =
      filteredSheetData.length > 0
        ? (
            filteredSheetData.reduce((sum, emp) => sum + emp.totalPresent, 0) /
            filteredSheetData.length
          ).toFixed(1)
        : 0;

    return {
      totalEmployees: filteredSheetData.length,
      totalGrossSalary,
      totalAdvances,
      totalPendingAmount,
      totalHours,
      totalExpectedHours,
      totalOvertimeHours,
      avgAttendance,
      efficiencyRate:
        totalExpectedHours > 0
          ? ((totalHours / totalExpectedHours) * 100).toFixed(1)
          : 0,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Attendance Sheet"
          subheader="Monthly attendance register with comprehensive salary calculations"
          loading={loading}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
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
          header="Attendance Sheet"
          subheader="Monthly attendance register with comprehensive salary calculations"
          onRefresh={fetchAttendanceSheet}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchAttendanceSheet}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
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
        header="Attendance Sheet"
        subheader={`${getMonthName(
          selectedMonth
        )} ${selectedYear} - Complete monthly attendance register with salary calculations`}
        onRefresh={fetchAttendanceSheet}
        loading={loading}
      />

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Attendance Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Attendance Sheet</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredSheetData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          subtitle={`Avg: ${stats.avgAttendance} days present`}
        />
        <StatCard
          title="Gross Payroll"
          value={`₹${stats.totalGrossSalary.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          subtitle="Total earned amount"
        />
        <StatCard
          title="Work Efficiency"
          value={`${stats.efficiencyRate}%`}
          icon={Target}
          color="purple"
          subtitle={`${stats.totalHours}h / ${stats.totalExpectedHours}h`}
        />
        <StatCard
          title="Overtime Hours"
          value={stats.totalOvertimeHours}
          icon={Zap}
          color="orange"
          subtitle="Extra hours worked"
        />
        <StatCard
          title="Pending Amount"
          value={`₹${stats.totalPendingAmount.toLocaleString()}`}
          icon={Clock}
          color="red"
          subtitle="Amount to be paid"
        />
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Month */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Month
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Employee Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Employee
            </label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Attendance Sheet Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getMonthName(selectedMonth)} {selectedYear} Attendance &
                  Salary Sheet
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredSheetData.length} employees • {monthInfo.totalDays}{" "}
                  days
                  {monthInfo.isMonthComplete && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Month Complete
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                {/* Employee Info */}
                <th className="sticky left-0 bg-gray-50 text-left py-3 px-4 font-semibold text-gray-900 text-sm min-w-[200px] border-r">
                  Employee Info
                </th>

                {/* Work Setup */}
                <th className="bg-gray-50 text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[90px] border-r">
                  Work Setup
                </th>

                {/* Daily Attendance */}
                {Array.from({ length: monthInfo.totalDays }, (_, i) => (
                  <th
                    key={i + 1}
                    className="text-center py-3 px-2 font-semibold text-gray-900 text-xs min-w-[35px]"
                  >
                    {i + 1}
                  </th>
                ))}

                {/* Attendance Summary */}
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[70px] border-l bg-green-50">
                  Present
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[70px] bg-red-50">
                  Absent
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[80px] bg-blue-50">
                  Hours
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[80px] bg-blue-50">
                  Expected
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[90px] bg-orange-50">
                  Over/Under
                </th>

                {/* Salary Details */}
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[80px] border-l bg-purple-50">
                  Rate/Hr
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[100px] bg-purple-50">
                  Base Pay
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[90px] bg-yellow-50">
                  OT/Ded.
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[100px] bg-green-50">
                  Gross
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[90px] bg-orange-50">
                  Advances
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[100px] bg-blue-50">
                  Net Pay
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[100px] bg-red-50">
                  Pending
                </th>
                <th className="text-center py-3 px-3 font-semibold text-gray-900 text-xs min-w-[100px] border-l">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSheetData.map((emp, index) => (
                <tr
                  key={emp.employee._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Employee Info */}
                  <td className="sticky left-0 bg-white py-3 px-4 border-r">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {emp.employee.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {emp.employee.employeeId}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              emp.employee.paymentType === "fixed"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {emp.employee.paymentType === "fixed"
                              ? "Fixed"
                              : "Hourly"}
                          </span>
                          {emp.employee.paymentType === "fixed" && (
                            <span className="text-xs text-gray-500">
                              ₹{emp.employee.basicSalary?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Work Setup */}
                  <td className="py-3 px-3 border-r text-center">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span className="font-medium">
                          {emp.employee.workingDays || 26}d
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-green-500" />
                        <span className="font-medium">
                          {emp.employee.workingHours || 8}h
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Daily Attendance */}
                  {Array.from({ length: monthInfo.totalDays }, (_, i) => {
                    const day = i + 1;
                    const attendance = emp.dailyAttendance[day];
                    const isPastDate = day <= monthInfo.currentDate;

                    return (
                      <td key={day} className="text-center py-3 px-1">
                        {attendance ? (
                          <div className="flex flex-col items-center">
                            {attendance.isPresent ? (
                              <CheckCircle
                                className="w-4 h-4 text-green-600 mx-auto"
                                title={`Present - ${attendance.hoursWorked}h`}
                              />
                            ) : (
                              <XCircle
                                className="w-4 h-4 text-red-600 mx-auto"
                                title="Absent"
                              />
                            )}
                            {attendance.isPresent && (
                              <span className="text-xs text-gray-600 mt-0.5">
                                {attendance.hoursWorked}h
                              </span>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              isPastDate ? "text-gray-400" : "text-gray-300"
                            }`}
                          >
                            {isPastDate ? "-" : ""}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Attendance Summary */}
                  <td className="text-center py-3 px-3 border-l bg-green-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-green-700 text-sm">
                        {emp.totalPresent}
                      </span>
                      <span className="text-xs text-green-600">days</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-red-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-red-700 text-sm">
                        {emp.totalAbsent}
                      </span>
                      <span className="text-xs text-red-600">days</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-blue-700 text-sm">
                        {emp.totalHours}
                      </span>
                      <span className="text-xs text-blue-600">hrs</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-blue-600 text-sm">
                        {emp.expectedHours}
                      </span>
                      <span className="text-xs text-blue-500">hrs</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-orange-50">
                    {emp.overtimeHours > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-3 h-3 text-green-600" />
                          <span className="font-bold text-green-700 text-sm">
                            {emp.overtimeHours}
                          </span>
                        </div>
                        <span className="text-xs text-green-600">OT hrs</span>
                      </div>
                    ) : emp.undertimeHours > 0 ? (
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <ArrowDown className="w-3 h-3 text-red-600" />
                          <span className="font-bold text-red-700 text-sm">
                            {emp.undertimeHours}
                          </span>
                        </div>
                        <span className="text-xs text-red-600">short</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-600 text-sm">
                          0
                        </span>
                        <span className="text-xs text-gray-500">exact</span>
                      </div>
                    )}
                  </td>

                  {/* Salary Details */}
                  <td className="text-center py-3 px-3 border-l bg-purple-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-purple-700 text-sm">
                        ₹{emp.hourlyRate}
                      </span>
                      <span className="text-xs text-purple-600">/hour</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-purple-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-900 text-sm">
                        ₹
                        {emp.salaryBreakdown?.baseSalary?.toLocaleString() || 0}
                      </span>
                      <span className="text-xs text-gray-600">base</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-yellow-50">
                    {emp.salaryBreakdown?.overtimePay > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-green-700 text-sm">
                          +₹{emp.salaryBreakdown.overtimePay.toLocaleString()}
                        </span>
                        <span className="text-xs text-green-600">bonus</span>
                      </div>
                    ) : emp.salaryBreakdown?.undertimeDeduction > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-red-700 text-sm">
                          -₹
                          {emp.salaryBreakdown.undertimeDeduction.toLocaleString()}
                        </span>
                        <span className="text-xs text-red-600">deduct</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="font-medium text-gray-600 text-sm">
                          ₹0
                        </span>
                        <span className="text-xs text-gray-500">none</span>
                      </div>
                    )}
                  </td>

                  <td className="text-center py-3 px-3 bg-green-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-green-800 text-sm">
                        ₹{emp.grossSalary.toLocaleString()}
                      </span>
                      <span className="text-xs text-green-600">total</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-orange-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-orange-700 text-sm">
                        ₹{emp.totalAdvances.toLocaleString()}
                      </span>
                      <span className="text-xs text-orange-600">advance</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-blue-800 text-sm">
                        ₹{emp.netSalary.toLocaleString()}
                      </span>
                      <span className="text-xs text-blue-600">net</span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 bg-red-50">
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-bold text-sm ${
                          emp.pendingAmount > 0
                            ? "text-red-700"
                            : emp.pendingAmount < 0
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        ₹{Math.abs(emp.pendingAmount).toLocaleString()}
                      </span>
                      <span
                        className={`text-xs ${
                          emp.pendingAmount > 0
                            ? "text-red-600"
                            : emp.pendingAmount < 0
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {emp.pendingAmount > 0
                          ? "due"
                          : emp.pendingAmount < 0
                          ? "excess"
                          : "clear"}
                      </span>
                    </div>
                  </td>

                  <td className="text-center py-3 px-3 border-l">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setSelectedEmployeeDetail(emp)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-all"
                        title="View Details"
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => clearSalary(emp.employee._id)}
                        disabled={
                          !monthInfo.isMonthComplete || emp.pendingAmount <= 0
                        }
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        title={
                          !monthInfo.isMonthComplete
                            ? "Month not complete"
                            : emp.pendingAmount <= 0
                            ? "No pending amount"
                            : "Clear salary"
                        }
                      >
                        {emp.pendingAmount <= 0 ? "Paid" : "Pay"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedEmployeeDetail && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-xl">
                {/* Simplified Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedEmployeeDetail.employee.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedEmployeeDetail.employee.employeeId} •{" "}
                        {getMonthName(selectedMonth)} {selectedYear}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmployeeDetail(null)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)] space-y-4">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Employee Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Payment Type:</span>
                        <p className="font-medium capitalize">
                          {selectedEmployeeDetail.employee.paymentType}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {selectedEmployeeDetail.employee.paymentType ===
                          "fixed"
                            ? "Monthly:"
                            : "Hourly:"}
                        </span>
                        <p className="font-bold text-green-600">
                          ₹
                          {(selectedEmployeeDetail.employee.paymentType ===
                          "fixed"
                            ? selectedEmployeeDetail.employee.basicSalary
                            : selectedEmployeeDetail.employee.hourlyRate
                          )?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Working Hours:</span>
                        <p className="font-medium">
                          {selectedEmployeeDetail.employee.workingHours || 8}
                          h/day
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Working Days:</span>
                        <p className="font-medium">
                          {selectedEmployeeDetail.employee.workingDays || 26}
                          /month
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Summary */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Attendance
                    </h3>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {selectedEmployeeDetail.totalPresent}
                        </div>
                        <div className="text-xs text-gray-600">Present</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          {selectedEmployeeDetail.totalAbsent}
                        </div>
                        <div className="text-xs text-gray-600">Absent</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {selectedEmployeeDetail.totalHours}
                        </div>
                        <div className="text-xs text-gray-600">Hours</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {selectedEmployeeDetail.expectedHours}
                        </div>
                        <div className="text-xs text-gray-600">Expected</div>
                      </div>
                    </div>
                  </div>

                  {/* Time Analysis - Only show if there's overtime/undertime */}
                  {(selectedEmployeeDetail.overtimeHours > 0 ||
                    selectedEmployeeDetail.undertimeHours > 0) && (
                    <div className="bg-orange-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Time Analysis
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedEmployeeDetail.overtimeHours > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Overtime:
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-600">
                                +{selectedEmployeeDetail.overtimeHours}h
                              </div>
                              <div className="text-xs text-green-500">
                                +₹
                                {selectedEmployeeDetail.salaryBreakdown?.overtimePay?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedEmployeeDetail.undertimeHours > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Undertime:
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-red-600">
                                -{selectedEmployeeDetail.undertimeHours}h
                              </div>
                              <div className="text-xs text-red-500">
                                -₹
                                {selectedEmployeeDetail.salaryBreakdown?.undertimeDeduction?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Salary Calculation */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Salary Breakdown
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hourly Rate:</span>
                        <span className="font-medium">
                          ₹{selectedEmployeeDetail.hourlyRate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Base Pay ({selectedEmployeeDetail.expectedHours}h):
                        </span>
                        <span className="font-medium">
                          ₹
                          {selectedEmployeeDetail.salaryBreakdown?.baseSalary?.toLocaleString()}
                        </span>
                      </div>

                      {selectedEmployeeDetail.salaryBreakdown?.overtimePay >
                        0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Overtime Bonus:</span>
                          <span className="font-medium">
                            +₹
                            {selectedEmployeeDetail.salaryBreakdown.overtimePay.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {selectedEmployeeDetail.salaryBreakdown
                        ?.undertimeDeduction > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Undertime Deduction:</span>
                          <span className="font-medium">
                            -₹
                            {selectedEmployeeDetail.salaryBreakdown.undertimeDeduction.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <hr className="border-gray-200" />
                      <div className="flex justify-between text-base font-bold">
                        <span>Gross Salary:</span>
                        <span className="text-green-600">
                          ₹{selectedEmployeeDetail.grossSalary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-gray-900 rounded-xl p-4 text-white">
                    <h3 className="font-semibold mb-3">Payment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Gross Salary:</span>
                        <span>
                          ₹{selectedEmployeeDetail.grossSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Advances:</span>
                        <span className="text-red-300">
                          -₹
                          {selectedEmployeeDetail.totalAdvances.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Already Paid:</span>
                        <span>
                          ₹
                          {selectedEmployeeDetail.totalSalaryPaid.toLocaleString()}
                        </span>
                      </div>
                      <hr className="border-gray-600" />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Pending Amount:</span>
                        <span
                          className={
                            selectedEmployeeDetail.pendingAmount > 0
                              ? "text-red-300"
                              : selectedEmployeeDetail.pendingAmount < 0
                              ? "text-green-300"
                              : "text-gray-300"
                          }
                        >
                          ₹
                          {Math.abs(
                            selectedEmployeeDetail.pendingAmount
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 text-center mt-2">
                        {selectedEmployeeDetail.pendingAmount > 0
                          ? "Amount due to employee"
                          : selectedEmployeeDetail.pendingAmount < 0
                          ? "Excess amount paid"
                          : "Fully settled"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredSheetData.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No attendance data found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                No attendance records found for the selected criteria. Try
                adjusting your filters or check if attendance has been marked
                for this period.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceSheet;
