import React, { useState, useEffect } from "react";
import {
  Calendar,
  User,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  ArrowLeft,
  Eye,
  X,
  Users,
  Activity,
  IndianRupee,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";

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
        const rawData = response.data.data.sheetData || [];
        const correctedData = rawData.map((emp) => {
          const workingDays = emp.employee.workingDays || 26;
          const workingHours = emp.employee.workingHours || 9;

          if (emp.employee.paymentType === "hourly") {
            const hourlyRate = emp.employee.hourlyRate;
            const grossSalary = emp.totalHours * hourlyRate;
            const netSalary = grossSalary - emp.totalAdvances;
            const pendingAmount = netSalary - emp.totalSalaryPaid;

            return {
              ...emp,
              expectedHours: 0,
              hourlyRate,
              overtimeHours: 0,
              undertimeHours: 0,
              grossSalary: Math.round(grossSalary),
              netSalary: Math.round(netSalary),
              pendingAmount: Math.round(pendingAmount),
            };
          } else {
            const expectedHours = emp.totalPresent * workingHours;
            const hourlyRate =
              emp.employee.basicSalary / (workingDays * workingHours);
            const baseSalary = emp.totalHours * hourlyRate;
            const overtimeHours = Math.max(0, emp.totalHours - expectedHours);
            const undertimeHours = Math.max(0, expectedHours - emp.totalHours);
            const overtimePay = overtimeHours * hourlyRate * 1.5;
            const undertimeDeduction = undertimeHours * hourlyRate;
            const grossSalary = baseSalary + overtimePay - undertimeDeduction;
            const netSalary = grossSalary - emp.totalAdvances;
            const pendingAmount = netSalary - emp.totalSalaryPaid;

            return {
              ...emp,
              expectedHours,
              hourlyRate: Math.round(hourlyRate),
              overtimeHours,
              undertimeHours,
              grossSalary: Math.round(grossSalary),
              netSalary: Math.round(netSalary),
              pendingAmount: Math.round(pendingAmount),
            };
          }
        });

        setSheetData(correctedData);
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

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "Employee ID",
      "Payment Type",
      "Phone",
      "Present Days",
      "Total Hours",
      "Attendance %",
      "Hourly Rate",
      "Gross Salary",
      "Advances",
      "Salary Paid",
      "Pending Amount",
      "Status",
    ];

    const csvData = filteredSheetData.map((emp) => {
      const attendancePercentage = (
        (emp.totalPresent / (monthInfo.totalDays || 30)) *
        100
      ).toFixed(1);
      const status =
        emp.pendingAmount > 0
          ? "DUE"
          : emp.pendingAmount < 0
          ? "EXCESS PAID"
          : "CLEARED";

      return [
        emp.employee.name,
        emp.employee.employeeId,
        emp.employee.paymentType,
        emp.employee.phone || "",
        emp.totalPresent,
        emp.totalHours,
        `${attendancePercentage}%`,
        emp.employee.paymentType === "fixed"
          ? emp.hourlyRate
          : emp.employee.hourlyRate,
        emp.grossSalary,
        emp.totalAdvances,
        emp.totalSalaryPaid,
        Math.abs(emp.pendingAmount),
        status,
      ];
    });

    // Add summary row
    csvData.unshift([""]); // Empty row
    csvData.unshift([
      "SUMMARY",
      `Total Employees: ${stats.totalEmployees}`,
      `Avg Attendance: ${stats.avgAttendancePercentage}%`,
      `Total Payroll: ₹${stats.totalGrossSalary.toLocaleString()}`,
      `Total Advances: ₹${stats.totalAdvances.toLocaleString()}`,
      `Pending: ₹${Math.abs(stats.totalPendingAmount).toLocaleString()}`,
      `Generated: ${new Date().toLocaleString()}`,
    ]);
    csvData.unshift([""]); // Empty row

    const csvContent = [
      `"${getMonthName(selectedMonth)} ${selectedYear} - Attendance Sheet"`,
      "",
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      "",
      headers.join(","),
      ...filteredSheetData.map((emp) => {
        const attendancePercentage = (
          (emp.totalPresent / (monthInfo.totalDays || 30)) *
          100
        ).toFixed(1);
        const status =
          emp.pendingAmount > 0
            ? "DUE"
            : emp.pendingAmount < 0
            ? "EXCESS PAID"
            : "CLEARED";

        return [
          emp.employee.name,
          emp.employee.employeeId,
          emp.employee.paymentType,
          emp.employee.phone || "",
          emp.totalPresent,
          emp.totalHours,
          `${attendancePercentage}%`,
          emp.employee.paymentType === "fixed"
            ? emp.hourlyRate
            : emp.employee.hourlyRate,
          emp.grossSalary,
          emp.totalAdvances,
          emp.totalSalaryPaid,
          Math.abs(emp.pendingAmount),
          status,
        ]
          .map((cell) => `"${cell}"`)
          .join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    const avgAttendancePercentage =
      filteredSheetData.length > 0
        ? (
            filteredSheetData.reduce(
              (sum, emp) =>
                sum + (emp.totalPresent / monthInfo.totalDays) * 100,
              0
            ) / filteredSheetData.length
          ).toFixed(1)
        : 0;

    return {
      totalEmployees: filteredSheetData.length,
      totalGrossSalary,
      totalAdvances,
      totalPendingAmount,
      avgAttendancePercentage,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Attendance Sheet"
          subheader="Monthly attendance register with salary calculations"
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
          header="Attendance Sheet"
          subheader="Monthly attendance register with salary calculations"
          onRefresh={fetchAttendanceSheet}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={fetchAttendanceSheet}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        header="Attendance & Payroll"
        subheader={`${getMonthName(
          selectedMonth
        )} ${selectedYear} - Monthly attendance register with salary management`}
        onRefresh={fetchAttendanceSheet}
        loading={loading}
      />

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Attendance</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Details & Sheet</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Attendance
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredSheetData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          subtitle={`${stats.avgAttendancePercentage}% avg attendance`}
        />
        <StatCard
          title="Gross Payroll"
          value={`₹${stats.totalGrossSalary.toLocaleString()}`}
          icon={IndianRupee}
          color="green"
          subtitle="Total earnings"
        />
        <StatCard
          title="Advances Given"
          value={`₹${stats.totalAdvances.toLocaleString()}`}
          icon={Target}
          color="orange"
          subtitle="Total advances"
        />
        <StatCard
          title="Pending Payments"
          value={`₹${Math.abs(stats.totalPendingAmount).toLocaleString()}`}
          icon={Activity}
          color={stats.totalPendingAmount > 0 ? "red" : "green"}
          subtitle={stats.totalPendingAmount > 0 ? "Amount due" : "All cleared"}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Employees</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name} ({employee.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getMonthName(selectedMonth)} {selectedYear} - Employee
                  Payroll
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredSheetData.length} employees
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm">
                  Employee Details
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Attendance
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Working Hours
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">
                  Gross Salary
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">
                  Net Amount
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSheetData.map((emp, index) => {
                const attendancePercentage = (
                  (emp.totalPresent / monthInfo.totalDays) *
                  100
                ).toFixed(1);

                return (
                  <tr
                    key={emp.employee._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {emp.employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {emp.employee.employeeId} •{" "}
                            {emp.employee.paymentType}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div
                        className={`text-lg font-bold ${
                          attendancePercentage >= 90
                            ? "text-green-600"
                            : attendancePercentage >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {attendancePercentage}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {emp.totalPresent}/{monthInfo.totalDays} days
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {emp.totalHours}h
                      </div>
                      {emp.employee.paymentType === "fixed" &&
                        emp.expectedHours > 0 && (
                          <div className="text-sm text-gray-500">
                            Expected: {emp.expectedHours}h
                          </div>
                        )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="text-lg font-semibold text-green-600">
                        ₹{emp.grossSalary.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Rate: ₹
                        {emp.employee.paymentType === "fixed"
                          ? emp.hourlyRate
                          : emp.employee.hourlyRate}
                        /hr
                      </div>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">
                          Advances: ₹{emp.totalAdvances.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: ₹{emp.totalSalaryPaid.toLocaleString()}
                        </div>
                        <div
                          className={`text-base font-bold ${
                            emp.pendingAmount > 0
                              ? "text-red-600"
                              : emp.pendingAmount < 0
                              ? "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          {emp.pendingAmount > 0
                            ? "Due: "
                            : emp.pendingAmount < 0
                            ? "Excess: "
                            : "Cleared: "}
                          ₹{Math.abs(emp.pendingAmount).toLocaleString()}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => setSelectedEmployeeDetail(emp)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredSheetData.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No attendance data found
              </h3>
              <p className="text-gray-600 mb-4">
                No attendance records found for the selected criteria.
              </p>
              <button
                onClick={fetchAttendanceSheet}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Refresh Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      <Modal
        isOpen={!!selectedEmployeeDetail}
        onClose={() => setSelectedEmployeeDetail(null)}
        title={selectedEmployeeDetail?.employee.name}
        subtitle={`${
          selectedEmployeeDetail?.employee.employeeId
        } • ${getMonthName(selectedMonth)} ${selectedYear}`}
        headerIcon={<User />}
        headerColor="blue"
        size="md"
      >
        {selectedEmployeeDetail && (
          <div className="space-y-6">
            {/* Daily Attendance Grid */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Daily Attendance - {getMonthName(selectedMonth)} {selectedYear}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-7 gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-600 py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                  {Array.from({ length: monthInfo.totalDays }, (_, i) => {
                    const day = i + 1;
                    const attendance =
                      selectedEmployeeDetail.dailyAttendance[day];
                    const isPastDate = day <= monthInfo.currentDate;

                    return (
                      <div
                        key={day}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
                          attendance?.isPresent
                            ? "bg-green-100 border-green-300 text-green-800"
                            : attendance && !attendance.isPresent
                            ? "bg-red-100 border-red-300 text-red-800"
                            : isPastDate
                            ? "bg-gray-100 border-gray-200 text-gray-400"
                            : "bg-gray-50 border-gray-100 text-gray-300"
                        }`}
                        title={
                          attendance?.isPresent
                            ? `Day ${day}: Present (${attendance.hoursWorked}h)`
                            : attendance && !attendance.isPresent
                            ? `Day ${day}: Absent`
                            : `Day ${day}: No data`
                        }
                      >
                        {attendance?.isPresent
                          ? day
                          : attendance && !attendance.isPresent
                          ? "A"
                          : isPastDate
                          ? "-"
                          : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Employee Info and Work Summary */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Employee Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span>{selectedEmployeeDetail.employee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Join Date:</span>
                    <span>
                      {new Date(
                        selectedEmployeeDetail.employee.joinDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="capitalize">
                      {selectedEmployeeDetail.employee.paymentType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Work Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attendance:</span>
                    <span>
                      {selectedEmployeeDetail.totalPresent}/
                      {monthInfo.totalDays} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hours Worked:</span>
                    <span>{selectedEmployeeDetail.totalHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate:</span>
                    <span>
                      ₹
                      {selectedEmployeeDetail.employee.paymentType === "fixed"
                        ? selectedEmployeeDetail.hourlyRate
                        : selectedEmployeeDetail.employee.hourlyRate}
                      /hour
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Salary Summary */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Salary Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Gross Salary:</span>
                  <span>
                    ₹{selectedEmployeeDetail.grossSalary.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Advances Taken:</span>
                  <span>
                    -₹
                    {selectedEmployeeDetail.totalAdvances.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Already Paid:</span>
                  <span>
                    -₹
                    {selectedEmployeeDetail.totalSalaryPaid.toLocaleString()}
                  </span>
                </div>
                <hr />
                <div
                  className={`flex justify-between font-bold text-lg ${
                    selectedEmployeeDetail.pendingAmount > 0
                      ? "text-red-600"
                      : selectedEmployeeDetail.pendingAmount < 0
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  <span>
                    {selectedEmployeeDetail.pendingAmount > 0
                      ? "Amount Due:"
                      : selectedEmployeeDetail.pendingAmount < 0
                      ? "Excess Paid:"
                      : "Fully Paid:"}
                  </span>
                  <span>
                    ₹
                    {Math.abs(
                      selectedEmployeeDetail.pendingAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceSheet;
