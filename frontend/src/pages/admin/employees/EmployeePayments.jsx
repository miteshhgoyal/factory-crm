import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Users,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Search,
  Eye,
  Plus,
  X,
  Save,
  DollarSign,
  Activity,
  RefreshCw,
  Filter,
  Calendar,
  Download,
  Receipt,
  FileText,
  User,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeAPI, cashFlowAPI, attendanceAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";

const EmployeePayments = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState("salary");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "Cash",
    description: "",
    notes: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, salaryResponse] = await Promise.all([
        employeeAPI.getEmployees({ limit: 100 }),
        employeeAPI.getSalarySummary({
          month: selectedMonth,
          year: selectedYear,
        }),
      ]);

      const employeesData = employeesResponse.data?.data?.employees || [];
      setEmployees(employeesData);

      let salaryDataArray = [];
      if (salaryResponse.data) {
        if (Array.isArray(salaryResponse.data)) {
          salaryDataArray = salaryResponse.data;
        } else if (
          salaryResponse.data.data &&
          Array.isArray(salaryResponse.data.data)
        ) {
          salaryDataArray = salaryResponse.data.data;
        }
      }
      setSalaryData(salaryDataArray);

      // Fetch attendance details for each employee
      const detailsPromises = employeesData.map(async (emp) => {
        try {
          const response = await attendanceAPI.getAttendanceSheet({
            month: selectedMonth,
            year: selectedYear,
            employeeId: emp._id,
          });

          if (
            response.data?.success &&
            response.data.data.sheetData.length > 0
          ) {
            const empData = response.data.data.sheetData[0];
            const workingDays = emp.workingDays || 26;
            const workingHours = emp.workingHours || 9;

            if (emp.paymentType === "hourly") {
              const grossSalary = empData.totalHours * emp.hourlyRate;
              const pendingAmount =
                grossSalary - empData.totalAdvances - empData.totalSalaryPaid;

              return {
                employeeId: emp._id,
                data: {
                  ...empData,
                  grossSalary: Math.round(grossSalary),
                  pendingAmount: Math.round(pendingAmount),
                  hourlyRate: emp.hourlyRate,
                },
              };
            } else {
              const expectedHours = empData.totalPresent * workingHours;
              const hourlyRate = emp.basicSalary / (workingDays * workingHours);
              const baseSalary = empData.totalHours * hourlyRate;
              const overtimeHours = Math.max(
                0,
                empData.totalHours - expectedHours
              );
              const undertimeHours = Math.max(
                0,
                expectedHours - empData.totalHours
              );
              const overtimePay = overtimeHours * hourlyRate * 1.5;
              const undertimeDeduction = undertimeHours * hourlyRate;
              const grossSalary = baseSalary + overtimePay - undertimeDeduction;
              const pendingAmount =
                grossSalary - empData.totalAdvances - empData.totalSalaryPaid;

              return {
                employeeId: emp._id,
                data: {
                  ...empData,
                  expectedHours,
                  hourlyRate: Math.round(hourlyRate),
                  overtimeHours,
                  undertimeHours,
                  grossSalary: Math.round(grossSalary),
                  pendingAmount: Math.round(pendingAmount),
                },
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch attendance for ${emp.name}:`, error);
        }
        return null;
      });

      const detailsResults = await Promise.all(detailsPromises);
      const detailsMap = {};
      detailsResults.forEach((result) => {
        if (result) {
          detailsMap[result.employeeId] = result.data;
        }
      });
      setEmployeeDetails(detailsMap);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "all") return true;

    const empDetail = employeeDetails[emp._id];
    if (!empDetail) return filterStatus === "cleared";

    if (filterStatus === "pending") return empDetail.pendingAmount > 0;
    if (filterStatus === "cleared") return empDetail.pendingAmount <= 0;

    return true;
  });

  const handlePaymentClick = (employee, type) => {
    setSelectedEmployee(employee);
    setPaymentType(type);

    const empDetail = employeeDetails[employee._id];
    const suggestedAmount =
      type === "salary" && empDetail?.pendingAmount > 0
        ? empDetail.pendingAmount.toString()
        : "";

    setPaymentForm({
      amount: suggestedAmount,
      paymentMode: "Cash",
      description: `${type === "salary" ? "Salary" : "Advance"} payment for ${
        employee.name
      }`,
      notes: "",
    });
    setErrors({});
    setShowPaymentModal(true);
  };

  const handleEmployeeDetailClick = (employee) => {
    setShowEmployeeDetail(employee);
  };

  const validatePayment = () => {
    const newErrors = {};
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    if (!paymentForm.description.trim()) {
      newErrors.description = "Description is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePayment()) return;

    try {
      setPaymentLoading(true);

      await cashFlowAPI.addCashOut({
        amount: parseFloat(paymentForm.amount),
        category: paymentType === "salary" ? "Salary" : "Advance",
        description: paymentForm.description,
        employeeName: selectedEmployee.name,
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes,
      });

      setSuccessMessage(
        `${
          paymentType === "salary" ? "Salary" : "Advance"
        } payment recorded successfully!`
      );
      setShowPaymentModal(false);
      setSelectedEmployee(null);
      fetchData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || "Failed to record payment",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const generatePayslip = async (employee) => {
    try {
      setActionLoading(employee._id);
      const salaryRecord = salaryData.find(
        (record) => record.employee?._id === employee._id
      );
      if (salaryRecord) {
        const response = await employeeAPI.generatePayslip(salaryRecord._id);
        setSelectedPayslip({
          ...salaryRecord,
          payslipData: response.data.data,
        });
        setShowPayslipModal(true);
      }
    } catch (error) {
      console.error("Failed to generate payslip:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getPaymentStats = () => {
    const totalPending = Object.values(employeeDetails).reduce(
      (sum, detail) =>
        sum + (detail?.pendingAmount > 0 ? detail.pendingAmount : 0),
      0
    );

    const totalGross = Object.values(employeeDetails).reduce(
      (sum, detail) => sum + (detail?.grossSalary || 0),
      0
    );

    const highPerformers = employees.filter((emp) => {
      const detail = employeeDetails[emp._id];
      return detail && (detail.totalPresent / 30) * 100 >= 90;
    }).length;

    const totalAdvances = Object.values(employeeDetails).reduce(
      (sum, detail) => sum + (detail?.totalAdvances || 0),
      0
    );

    return {
      totalPending,
      totalGross,
      highPerformers,
      totalAdvances,
      pendingEmployees: Object.values(employeeDetails).filter(
        (d) => d.pendingAmount > 0
      ).length,
    };
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

  const stats = getPaymentStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent
          header="Employee Payments"
          subheader="Payroll management system"
          loading={loading}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent
        header="Employee Payments"
        subheader={`Manage salary payments and advances - ${getMonthName(
          selectedMonth
        )} ${selectedYear}`}
        onRefresh={fetchData}
        loading={loading}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Employees</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              Advances & Salary
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin/employees")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => navigate("/admin/attendance/sheet")}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Receipt className="w-4 h-4" />
              Attendance
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            color="blue"
            subtitle={`${employees.filter((e) => e.isActive).length} active`}
          />
          <StatCard
            title="Total Payroll"
            value={`₹${stats.totalGross.toLocaleString()}`}
            icon={DollarSign}
            color="green"
            subtitle="Current month"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${stats.totalPending.toLocaleString()}`}
            icon={AlertCircle}
            color="red"
            subtitle={`${stats.pendingEmployees} employees`}
          />
          <StatCard
            title="Total Advances"
            value={`₹${stats.totalAdvances.toLocaleString()}`}
            icon={Target}
            color="orange"
            subtitle="Given this month"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
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
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Payment</option>
                <option value="cleared">Cleared</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Employee Payroll ({filteredEmployees.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Employee
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Type
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Attendance
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Hours
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Gross
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Advances
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Due
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => {
                  const empDetail = employeeDetails[employee._id];
                  const attendancePercentage = empDetail
                    ? ((empDetail.totalPresent / 30) * 100).toFixed(1)
                    : 0;

                  return (
                    <tr
                      key={employee._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.paymentType === "fixed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {employee.paymentType}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {empDetail ? (
                          <div>
                            <div
                              className={`font-semibold ${
                                attendancePercentage >= 90
                                  ? "text-green-600"
                                  : attendancePercentage >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {attendancePercentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {empDetail.totalPresent}/30
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {empDetail ? (
                          <div>
                            <div className="font-semibold text-gray-900">
                              {empDetail.totalHours}h
                            </div>
                            {empDetail.overtimeHours > 0 && (
                              <div className="text-xs text-green-600">
                                +{empDetail.overtimeHours}h OT
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {empDetail ? (
                          <div className="font-semibold text-green-600">
                            ₹{empDetail.grossSalary.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">₹--</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {empDetail ? (
                          <div className="font-semibold text-orange-600">
                            ₹{empDetail.totalAdvances.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">₹--</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {empDetail ? (
                          <div
                            className={`font-semibold ${
                              empDetail.pendingAmount > 0
                                ? "text-red-600"
                                : empDetail.pendingAmount < 0
                                ? "text-yellow-600"
                                : "text-green-600"
                            }`}
                          >
                            ₹
                            {Math.abs(empDetail.pendingAmount).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">₹--</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEmployeeDetailClick(employee)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handlePaymentClick(employee, "advance")
                            }
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Give Advance"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handlePaymentClick(employee, "salary")
                            }
                            disabled={
                              !empDetail || empDetail.pendingAmount <= 0
                            }
                            className={`p-2 rounded-lg transition-all ${
                              !empDetail || empDetail.pendingAmount <= 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title="Pay Salary"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No employees found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>

        {/* Employee Detail Modal */}
        {showEmployeeDetail && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
              <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">
                    {showEmployeeDetail.name}
                  </h2>
                  <p className="text-blue-100">
                    {showEmployeeDetail.employeeId}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmployeeDetail(null)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {(() => {
                  const empDetail = employeeDetails[showEmployeeDetail._id];
                  if (!empDetail) {
                    return (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No payroll data available
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Employee Info */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Basic Info
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Phone:</span>
                              <span>{showEmployeeDetail.phone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Join Date:</span>
                              <span>
                                {new Date(
                                  showEmployeeDetail.joinDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="capitalize">
                                {showEmployeeDetail.paymentType}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            This Month
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Present:</span>
                              <span>{empDetail.totalPresent} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hours:</span>
                              <span>{empDetail.totalHours} hours</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Attendance:</span>
                              <span className="font-semibold">
                                {((empDetail.totalPresent / 30) * 100).toFixed(
                                  1
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Salary Breakdown */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Salary Breakdown
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="bg-white rounded p-3">
                              <div className="text-sm text-gray-600">
                                Gross Salary
                              </div>
                              <div className="text-xl font-bold text-green-600">
                                ₹{empDetail.grossSalary.toLocaleString()}
                              </div>
                            </div>
                            <div className="bg-white rounded p-3">
                              <div className="text-sm text-gray-600">
                                Advances
                              </div>
                              <div className="text-lg font-semibold text-orange-600">
                                ₹{empDetail.totalAdvances.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-white rounded p-3">
                              <div className="text-sm text-gray-600">
                                Already Paid
                              </div>
                              <div className="text-lg font-semibold text-blue-600">
                                ₹{empDetail.totalSalaryPaid.toLocaleString()}
                              </div>
                            </div>
                            <div
                              className={`rounded p-3 ${
                                empDetail.pendingAmount > 0
                                  ? "bg-red-600 text-white"
                                  : empDetail.pendingAmount < 0
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-600 text-white"
                              }`}
                            >
                              <div className="text-sm opacity-90">
                                {empDetail.pendingAmount > 0
                                  ? "Due Amount"
                                  : empDetail.pendingAmount < 0
                                  ? "Excess Paid"
                                  : "Settled"}
                              </div>
                              <div className="text-lg font-bold">
                                ₹
                                {Math.abs(
                                  empDetail.pendingAmount
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {paymentType === "salary" ? "Salary" : "Advance"} Payment
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.name} ({selectedEmployee.employeeId})
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 text-sm">
                      {errors.submit}
                    </span>
                  </div>
                )}

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
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.amount ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
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
                    <option value="Bank Transfer">Bank Transfer</option>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description}
                    </p>
                  )}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayments;
