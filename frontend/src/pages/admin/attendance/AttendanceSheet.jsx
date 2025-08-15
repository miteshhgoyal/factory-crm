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
  CreditCard,
  Plus,
  Save,
  Loader2,
  CheckCircle,
  Phone,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  Building,
  Calculator,
  Award,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { attendanceAPI, employeeAPI, cashFlowAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/dateUtils";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "Cash",
    description: "",
    notes: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentType, setPaymentType] = useState("salary");
  const [successMessage, setSuccessMessage] = useState("");

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

  const handlePaymentClick = (employee, type) => {
    const empData = sheetData.find((emp) => emp.employee._id === employee._id);
    const suggestedAmount =
      type === "salary" && empData?.pendingAmount > 0
        ? empData.pendingAmount.toString()
        : "";

    setPaymentType(type);
    setPaymentForm({
      amount: suggestedAmount,
      paymentMode: "Cash",
      description: `${type === "salary" ? "Salary" : "Advance"} payment for ${
        employee.name
      }`,
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      setPaymentLoading(true);

      await cashFlowAPI.addCashOut({
        amount: parseFloat(paymentForm.amount),
        category: paymentType === "salary" ? "Salary" : "Advance",
        description: paymentForm.description,
        employeeName:
          selectedEmployeeDetail?.employee?.name ||
          selectedEmployeeDetail?.name,
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes,
      });

      //  amount: parseFloat(paymentForm.amount),
      // category: paymentType === "salary" ? "Salary" : "Advance",
      // description: paymentForm.description,
      // employeeName: selectedEmployee.name,
      // paymentMode: paymentForm.paymentMode,
      // notes: paymentForm.notes,

      setSuccessMessage(
        `${
          paymentType === "salary" ? "Salary" : "Advance"
        } payment recorded successfully!`
      );
      setShowPaymentModal(false);
      fetchAttendanceSheet();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setPaymentLoading(false);
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
      "Basic Rate",
      "Hourly Rate",
      "Expected Hours",
      "Overtime Hours",
      "Undertime Hours",
      "Base Salary",
      "Overtime Pay",
      "Undertime Deduction",
      "Gross Salary",
      "Advances",
      "Salary Paid",
      "Net Salary",
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

      const calc = emp.calculations?.salary || {};

      return [
        emp.employee.name,
        emp.employee.employeeId,
        emp.employee.paymentType,
        emp.employee.phone || "",
        emp.totalPresent,
        emp.totalHours,
        `${attendancePercentage}%`,
        emp.employee.paymentType === "fixed"
          ? emp.employee.basicSalary
          : emp.employee.hourlyRate,
        calc.hourlyRate || emp.employee.hourlyRate || 0,
        calc.expectedHours || 0,
        calc.overtimeHours || 0,
        calc.undertimeHours || 0,
        calc.baseSalary || 0,
        calc.overtimePay || 0,
        calc.undertimeDeduction || 0,
        emp.grossSalary,
        emp.totalAdvances,
        emp.totalSalaryPaid,
        emp.netSalary,
        Math.abs(emp.pendingAmount),
        status,
      ];
    });

    const csvContent = [
      `"Complete Payroll Report - ${getMonthName(
        selectedMonth
      )} ${selectedYear}"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      "",
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complete_payroll_${getMonthName(
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
          header="Complete Payroll Management"
          subheader="Comprehensive workforce management system"
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
          header="Complete Payroll Management"
          subheader="Comprehensive workforce management system"
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
        header="Complete Payroll Management"
        subheader={`${getMonthName(
          selectedMonth
        )} ${selectedYear} - Attendance, Salary & Payment Tracking`}
        onRefresh={fetchAttendanceSheet}
        loading={loading}
      />

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Payroll Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Complete System</span>
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
            onClick={() => navigate("/admin/attendance/mark")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredSheetData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export Complete Report
          </button>
        </div>
      </div>

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
          subtitle="Total earnings this month"
        />
        <StatCard
          title="Advances Given"
          value={`₹${stats.totalAdvances.toLocaleString()}`}
          icon={Target}
          color="orange"
          subtitle="Total advance payments"
        />
        <StatCard
          title="Payment Balance"
          value={`₹${Math.abs(stats.totalPendingAmount).toLocaleString()}`}
          icon={Activity}
          color={stats.totalPendingAmount > 0 ? "red" : "green"}
          subtitle={stats.totalPendingAmount > 0 ? "Amount due" : "All cleared"}
        />
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getMonthName(selectedMonth)} {selectedYear} - Complete
                  Payroll Management
                </h3>
                <p className="text-sm text-gray-600">
                  {filteredSheetData.length} employees • Attendance, Salary
                  Calculation & Payments
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
                  Employee
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Payment Type
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Attendance
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Hours & Salary
                </th>
                <th className="text-right py-4 px-6 font-semibold text-gray-900 text-sm">
                  Payment Status
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSheetData.map((emp) => {
                const attendancePercentage = (
                  (emp.totalPresent / monthInfo.totalDays) *
                  100
                ).toFixed(1);

                return (
                  <tr
                    key={emp.employee._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Employee Basic Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {emp.employee.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {emp.employee.employeeId}
                          </div>
                          {emp.employee.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {emp.employee.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Payment Type */}
                    <td className="py-4 px-6 text-center">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            emp.employee.paymentType === "fixed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {emp.employee.paymentType}
                        </span>
                        <div className="text-sm font-semibold text-gray-900">
                          {emp.employee.paymentType === "fixed"
                            ? `₹${emp.employee.basicSalary?.toLocaleString()}/month`
                            : `₹${emp.employee.hourlyRate}/hour`}
                        </div>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-4 px-6 text-center">
                      <div className="space-y-1">
                        <div
                          className={`text-2xl font-bold ${
                            attendancePercentage >= 90
                              ? "text-green-600"
                              : attendancePercentage >= 70
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {attendancePercentage}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {emp.totalPresent}/{monthInfo.totalDays} days
                        </div>
                        {attendancePercentage >= 95 && (
                          <Award className="w-4 h-4 text-yellow-500 mx-auto" />
                        )}
                      </div>
                    </td>

                    {/* Hours & Salary */}
                    <td className="py-4 px-6 text-center">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-gray-900">
                          {emp.totalHours}h worked
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{emp.grossSalary.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Gross salary earned
                        </div>
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="py-4 px-6 text-right">
                      <div className="space-y-2">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Advances:</span>
                            <span className="text-orange-600">
                              ₹{emp.totalAdvances.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Paid:</span>
                            <span className="text-blue-600">
                              ₹{emp.totalSalaryPaid.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`text-base font-bold px-3 py-2 rounded-lg text-center ${
                            emp.pendingAmount > 0
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : emp.pendingAmount < 0
                              ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              : "bg-green-100 text-green-700 border border-green-200"
                          }`}
                        >
                          <div className="text-xs opacity-90">
                            {emp.pendingAmount > 0
                              ? "Balance Due"
                              : emp.pendingAmount < 0
                              ? "Excess Paid"
                              : "Fully Settled"}
                          </div>
                          ₹{Math.abs(emp.pendingAmount).toLocaleString()}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedEmployeeDetail(emp)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                          title="View Complete Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handlePaymentClick(emp.employee, "advance")
                          }
                          className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all"
                          title="Give Advance"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handlePaymentClick(emp.employee, "salary")
                          }
                          disabled={emp.pendingAmount <= 0}
                          className={`p-2 rounded-lg transition-all ${
                            emp.pendingAmount <= 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          }`}
                          title="Pay Salary"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      </div>
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
                No employees found
              </h3>
              <p className="text-gray-600 mb-4">
                No employees match your current search criteria.
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

      {/* Enhanced Employee Detail Modal */}
      <Modal
        isOpen={!!selectedEmployeeDetail}
        onClose={() => setSelectedEmployeeDetail(null)}
        title={
          selectedEmployeeDetail?.employee?.name || selectedEmployeeDetail?.name
        }
        subtitle={`${
          selectedEmployeeDetail?.employee?.employeeId ||
          selectedEmployeeDetail?.employeeId
        } • ${getMonthName(selectedMonth)} ${selectedYear} Complete Analysis`}
        headerIcon={<User />}
        headerColor="blue"
        size="lg"
      >
        {selectedEmployeeDetail && (
          <div className="space-y-6">
            {(() => {
              const emp = selectedEmployeeDetail.employee
                ? selectedEmployeeDetail
                : sheetData.find(
                    (e) => e.employee._id === selectedEmployeeDetail._id
                  );

              if (!emp) return <div>No data available</div>;

              const employee = emp.employee || selectedEmployeeDetail;
              const calculations = emp.calculations;

              return (
                <div className="space-y-6">
                  {/* Employee Basic Information */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Employee Information
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Full Name
                          </label>
                          <div className="text-lg font-semibold text-gray-900">
                            {employee.name}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Employee ID
                          </label>
                          <div className="text-lg font-semibold text-gray-900">
                            {employee.employeeId}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Phone
                          </label>
                          <div className="text-lg font-semibold text-gray-900">
                            {employee.phone}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Payment Type
                          </label>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              employee.paymentType === "fixed"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {employee.paymentType}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Join Date
                          </label>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatDate(employee.joinDate)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">
                            Status
                          </label>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        {employee.address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">
                              Address
                            </label>
                            <div className="text-sm text-gray-700">
                              {employee.address}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Complete Salary Structure */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <DollarSign className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Complete Salary Structure
                      </h3>
                    </div>

                    {employee.paymentType === "fixed" ? (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Monthly Basic Salary
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{employee.basicSalary?.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Fixed monthly amount
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Daily Rate
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{calculations?.salary?.dailyRate}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Per working day
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Hourly Rate
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{calculations?.salary?.hourlyRate}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Per working hour
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Hourly Rate
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{employee.hourlyRate}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Per hour worked
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Daily Equivalent
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹{calculations?.salary?.dailyEquivalent}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {employee.workingHours || 9}h standard day
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Monthly Potential
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ₹
                            {calculations?.salary?.monthlyEquivalent?.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Full month estimate
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-sm text-gray-600">
                            Expected Hours/Day
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {employee.workingHours || 9}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Standard working hours
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Performance Analysis */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {getMonthName(selectedMonth)} {selectedYear} Performance
                        Analysis
                      </h3>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Attendance Record - Common for both */}
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="text-sm text-gray-600">
                          Attendance Record
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {emp.totalPresent}/{monthInfo.totalDays}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {(
                            (emp.totalPresent / monthInfo.totalDays) *
                            100
                          ).toFixed(1)}
                          % attendance
                        </div>
                        {emp.totalPresent / monthInfo.totalDays >= 0.95 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-yellow-700">
                              Excellent
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Total Hours Worked - Common for both */}
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="text-sm text-gray-600">
                          Total Hours Worked
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {emp.totalHours}h
                        </div>
                        {calculations?.salary?.expectedHours && (
                          <div className="text-sm text-gray-500 mt-1">
                            Expected: {calculations.salary.expectedHours}h
                          </div>
                        )}
                        {employee.paymentType === "hourly" && (
                          <div className="text-xs text-gray-500 mt-1">
                            @ ₹{employee.hourlyRate}/hour
                          </div>
                        )}
                      </div>

                      {/* Fixed Employee specific cards */}
                      {employee.paymentType === "fixed" &&
                        calculations?.salary && (
                          <>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <div className="text-sm text-gray-600">
                                Overtime Performance
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                {calculations.salary.overtimeHours || 0}h
                              </div>
                              {calculations.salary.overtimePay > 0 && (
                                <div className="text-sm text-green-600 mt-1">
                                  +₹
                                  {calculations.salary.overtimePay.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <div className="text-sm text-gray-600">
                                Undertime Hours
                              </div>
                              <div className="text-2xl font-bold text-red-600">
                                {calculations.salary.undertimeHours || 0}h
                              </div>
                              {calculations.salary.undertimeDeduction > 0 && (
                                <div className="text-sm text-red-600 mt-1">
                                  -₹
                                  {calculations.salary.undertimeDeduction.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                      {/* Hourly Employee specific cards */}
                      {employee.paymentType === "hourly" && (
                        <>
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <div className="text-sm text-gray-600">
                              Gross Earnings
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                              ₹{emp.grossSalary.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Total earned this month
                            </div>
                            {emp.totalHours > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Avg: ₹
                                {Math.round(emp.grossSalary / emp.totalHours)}
                                /hour
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-purple-200">
                            <div className="text-sm text-gray-600">
                              Payment Status
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                emp.pendingAmount > 0
                                  ? "text-red-600"
                                  : emp.pendingAmount < 0
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {emp.pendingAmount > 0
                                ? "DUE"
                                : emp.pendingAmount < 0
                                ? "EXCESS"
                                : "SETTLED"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {emp.pendingAmount > 0
                                ? `₹${emp.pendingAmount.toLocaleString()} pending`
                                : emp.pendingAmount < 0
                                ? `₹${Math.abs(
                                    emp.pendingAmount
                                  ).toLocaleString()} overpaid`
                                : "All payments cleared"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Performance Metrics for Hourly Employees */}
                    {employee.paymentType === "hourly" && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          Hourly Performance Breakdown
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-gray-600">
                              Average Hours/Day
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {emp.totalPresent > 0
                                ? (emp.totalHours / emp.totalPresent).toFixed(1)
                                : 0}
                              h
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-gray-600">
                              Daily Earnings Avg
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              ₹
                              {emp.totalPresent > 0
                                ? Math.round(
                                    emp.grossSalary / emp.totalPresent
                                  ).toLocaleString()
                                : 0}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-gray-600">
                              Monthly Potential
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              ₹
                              {(
                                employee.hourlyRate *
                                (employee.workingHours || 9) *
                                (employee.workingDays || 30)
                              ).toLocaleString()}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="text-xs text-gray-600">
                              Achievement Rate
                            </div>
                            <div className="text-lg font-bold text-orange-600">
                              {(
                                (emp.grossSalary /
                                  (employee.hourlyRate *
                                    (employee.workingHours || 9) *
                                    (employee.workingDays || 30))) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daily Attendance Calendar */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-6 h-6 text-gray-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Daily Attendance Calendar
                      </h3>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center text-sm font-medium text-gray-600 py-2"
                          >
                            {day}
                          </div>
                        )
                      )}
                      {Array.from({ length: monthInfo.totalDays }, (_, i) => {
                        const day = i + 1;
                        const attendance = emp.dailyAttendance?.[day];
                        const isPastDate = day <= monthInfo.currentDate;

                        return (
                          <div
                            key={day}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all hover:scale-105 ${
                              attendance?.isPresent
                                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                                : attendance && !attendance.isPresent
                                ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                                : isPastDate
                                ? "bg-gray-100 border-gray-200 text-gray-400"
                                : "bg-gray-50 border-gray-100 text-gray-300"
                            }`}
                            title={
                              attendance?.isPresent
                                ? `Day ${day}: Present (${
                                    attendance.hoursWorked
                                  }h) ${
                                    attendance.notes
                                      ? "- " + attendance.notes
                                      : ""
                                  }`
                                : attendance && !attendance.isPresent
                                ? `Day ${day}: Absent ${
                                    attendance.notes
                                      ? "- " + attendance.notes
                                      : ""
                                  }`
                                : `Day ${day}: No attendance data`
                            }
                          >
                            {attendance?.isPresent
                              ? day
                              : attendance && !attendance.isPresent
                              ? "A"
                              : isPastDate
                              ? "-"
                              : day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete Financial Summary */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <IndianRupee className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Complete Financial Summary
                      </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-sm text-gray-600">
                          Gross Salary Earned
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{emp.grossSalary.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total earnings this month
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-sm text-gray-600">
                          Advances Taken
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          ₹{emp.totalAdvances.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {emp.advances.length} advance payments
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-sm text-gray-600">
                          Salary Already Paid
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          ₹{emp.totalSalaryPaid.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {emp.salaryPayments.length} salary payments
                        </div>
                      </div>
                      <div
                        className={`rounded-lg p-4 border-2 ${
                          emp.pendingAmount > 0
                            ? "bg-red-600 text-white border-red-700"
                            : emp.pendingAmount < 0
                            ? "bg-yellow-500 text-white border-yellow-600"
                            : "bg-green-600 text-white border-green-700"
                        }`}
                      >
                        <div className="text-sm opacity-90">
                          {emp.pendingAmount > 0
                            ? "Amount Due"
                            : emp.pendingAmount < 0
                            ? "Excess Paid"
                            : "Fully Settled"}
                        </div>
                        <div className="text-2xl font-bold">
                          ₹{Math.abs(emp.pendingAmount).toLocaleString()}
                        </div>
                        <div className="text-xs opacity-80 mt-1">
                          {emp.pendingAmount > 0
                            ? "To be paid"
                            : emp.pendingAmount < 0
                            ? "Overpayment"
                            : "Balance zero"}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Salary Calculation */}
                    {employee.paymentType === "fixed" &&
                      calculations?.salary && (
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Detailed Salary Calculation
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                              <span className="text-gray-700">
                                Base Salary ({emp.totalPresent} days × ₹
                                {calculations.salary.dailyRate})
                              </span>
                              <span className="font-semibold">
                                ₹
                                {calculations.salary.baseSalary?.toLocaleString()}
                              </span>
                            </div>
                            {calculations.salary.overtimePay > 0 && (
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 text-green-600">
                                <span>
                                  Overtime Pay (
                                  {calculations.salary.overtimeHours}h × ₹
                                  {calculations.salary.hourlyRate} × 1.5)
                                </span>
                                <span className="font-semibold">
                                  +₹
                                  {calculations.salary.overtimePay.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {calculations.salary.undertimeDeduction > 0 && (
                              <div className="flex justify-between items-center py-2 border-b border-gray-200 text-red-600">
                                <span>
                                  Undertime Deduction (
                                  {calculations.salary.undertimeHours}h × ₹
                                  {calculations.salary.hourlyRate})
                                </span>
                                <span className="font-semibold">
                                  -₹
                                  {calculations.salary.undertimeDeduction.toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-3 bg-gray-50 rounded px-3">
                              <span className="font-semibold text-gray-900 text-lg">
                                Total Gross Salary
                              </span>
                              <span className="font-bold text-xl text-green-600">
                                ₹{emp.grossSalary.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Payment History */}
                  {(emp.advances.length > 0 ||
                    emp.salaryPayments.length > 0) && (
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          Complete Payment History
                        </h3>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {emp.advances.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4 text-orange-500" />
                              Advance Payments ({emp.advances.length})
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {emp.advances.map((advance, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white rounded-lg p-3 border border-orange-200 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-orange-600">
                                        ₹{advance.amount.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {formatDate(advance.date)}
                                      </div>
                                      {advance.description && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {advance.description}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                      {advance.paymentMode || "Cash"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex justify-between font-semibold text-orange-700">
                                <span>Total Advances:</span>
                                <span>
                                  ₹{emp.totalAdvances.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {emp.salaryPayments.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-green-500" />
                              Salary Payments ({emp.salaryPayments.length})
                            </h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {emp.salaryPayments.map((payment, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white rounded-lg p-3 border border-green-200 hover:shadow-sm transition-shadow"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium text-green-600">
                                        ₹{payment.amount.toLocaleString()}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {formatDate(payment.date)}
                                      </div>
                                      {payment.description && (
                                        <div className="text-xs text-gray-600 mt-1">
                                          {payment.description}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      {payment.paymentMode || "Cash"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex justify-between font-semibold text-green-700">
                                <span>Total Salary Paid:</span>
                                <span>
                                  ₹{emp.totalSalaryPaid.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`${paymentType === "salary" ? "Salary" : "Advance"} Payment`}
        subtitle={
          selectedEmployeeDetail
            ? `${selectedEmployeeDetail.name} (${selectedEmployeeDetail.employeeId})`
            : ""
        }
        headerIcon={paymentType === "salary" ? <CreditCard /> : <Plus />}
        headerColor={paymentType === "salary" ? "green" : "orange"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹) *
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode *
            </label>
            <select
              value={paymentForm.paymentMode}
              onChange={(e) =>
                setPaymentForm((prev) => ({
                  ...prev,
                  paymentMode: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <input
              type="text"
              value={paymentForm.description}
              onChange={(e) =>
                setPaymentForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePaymentSubmit}
              disabled={paymentLoading}
              className={`flex items-center px-4 py-2 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all ${
                paymentType === "salary"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceSheet;
