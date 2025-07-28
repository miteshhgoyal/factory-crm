import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Filter,
  ArrowLeft,
  Eye,
  Calculator,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Loader2,
  X,
  TrendingDown,
  FileText,
  CreditCard,
  IndianRupee,
  Building,
  Phone,
  MapPin,
  User,
  Banknote,
  Save,
  Receipt,
  CalendarCheck,
  Target,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const EmployeeSalary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(
    searchParams.get("employee") || "all"
  );
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentMode: "Cash",
    description: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees first
      const employeesResponse = await employeeAPI.getEmployees();
      const employeesData = employeesResponse.data?.data?.employees || [];
      setEmployees(employeesData);

      // Fetch salary data with proper parameters
      const salaryParams = {
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedEmployee !== "all") {
        salaryParams.employeeId = selectedEmployee;
      }

      const salaryResponse = await employeeAPI.getSalarySummary(salaryParams);
      // Handle different response structures
      let salaryDataArray = [];

      if (salaryResponse.data) {
        if (Array.isArray(salaryResponse.data)) {
          salaryDataArray = salaryResponse.data;
        } else if (
          salaryResponse.data.data &&
          Array.isArray(salaryResponse.data.data)
        ) {
          salaryDataArray = salaryResponse.data.data;
        } else if (
          salaryResponse.data.success &&
          Array.isArray(salaryResponse.data.data)
        ) {
          salaryDataArray = salaryResponse.data.data;
        }
      }

      setSalaryData(salaryDataArray);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError(error.response?.data?.message || "Failed to fetch salary data");
      setEmployees([]);
      setSalaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalaryForMonth = async () => {
    try {
      setCalculating(true);

      const requestData = {
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedEmployee !== "all") {
        requestData.employeeId = selectedEmployee;
      }

      await employeeAPI.calculateMonthlySalary(requestData);

      // Refresh data after calculation
      await fetchData();
      setShowCalculateModal(false);
    } catch (error) {
      console.error("Failed to calculate salary:", error);
      setError(error.response?.data?.message || "Failed to calculate salary");
    } finally {
      setCalculating(false);
    }
  };

  const generatePayslip = async (salaryRecord) => {
    try {
      setActionLoading(salaryRecord._id);
      const response = await employeeAPI.generatePayslip(salaryRecord._id);

      // Show the payslip modal with enhanced data
      setSelectedSalaryRecord({
        ...salaryRecord,
        payslipData: response.data.data,
      });
      setShowPayslipModal(true);
    } catch (error) {
      console.error("Failed to generate payslip:", error);
      setError("Failed to generate payslip");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaidClick = (salaryRecord) => {
    setSelectedSalaryRecord(salaryRecord);
    setPaymentFormData({
      amount: salaryRecord.netAmount.toString(),
      paymentMode: "Cash",
      description: `Salary payment for ${
        salaryRecord.employee?.name
      } - ${getMonthName(selectedMonth)} ${selectedYear}`,
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  const validatePaymentForm = () => {
    const errors = {};

    if (!paymentFormData.amount || parseFloat(paymentFormData.amount) <= 0) {
      errors.amount = "Valid payment amount is required";
    }

    if (!paymentFormData.paymentMode) {
      errors.paymentMode = "Payment mode is required";
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const markSalaryAsPaid = async () => {
    if (!validatePaymentForm()) return;

    try {
      setPaymentLoading(true);

      await employeeAPI.markSalaryPaid(selectedSalaryRecord._id, {
        amount: parseFloat(paymentFormData.amount),
        paymentMode: paymentFormData.paymentMode,
        description: paymentFormData.description,
      });

      setShowPaymentModal(false);
      setSelectedSalaryRecord(null);
      setPaymentFormData({ amount: "", paymentMode: "Cash", description: "" });
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to mark salary as paid:", error);
      setPaymentErrors({
        submit:
          error.response?.data?.message || "Failed to mark salary as paid",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getSalaryStats = () => {
    const totalSalary = salaryData.reduce(
      (sum, record) => sum + (record.netAmount || 0),
      0
    );
    const paidSalaries = salaryData.filter((record) => record.isPaid).length;
    const pendingSalaries = salaryData.length - paidSalaries;
    const totalAdvances = salaryData.reduce(
      (sum, record) => sum + (record.advanceDeducted || 0),
      0
    );
    const totalGross = salaryData.reduce(
      (sum, record) => sum + (record.grossAmount || 0),
      0
    );
    const totalPending = salaryData
      .filter((record) => !record.isPaid)
      .reduce((sum, record) => sum + (record.netAmount || 0), 0);

    return {
      totalSalary,
      paidSalaries,
      pendingSalaries,
      totalAdvances,
      totalGross,
      totalPending,
    };
  };

  const stats = getSalaryStats();

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

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Salary Management"
          subheader="Manage employee salaries and payroll"
          loading={loading}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading salary data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Salary Management"
          subheader="Manage employee salaries and payroll"
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
        header="Salary Management"
        subheader={`Payroll for ${getMonthName(selectedMonth)} ${selectedYear}`}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Employee Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Salary Management</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/employees/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setShowCalculateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Calculator className="w-4 h-4" />
            Calculate Salary
          </button>
          <button
            onClick={() => navigate("/admin/employees/list")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Users className="w-4 h-4" />
            Employee List
          </button>
        </div>
      </div>

      {/* Filters */}
      <SectionCard title="Payroll Filters" icon={Filter} headerColor="gray">
        <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-2xl p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-2 text-blue-500" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                <Calendar className="w-4 h-4 inline mr-2 text-green-500" />
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
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

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                <User className="w-4 h-4 inline mr-2 text-purple-500" />
                Employee
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white"
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Actions
              </label>
              <button
                onClick={() => {
                  setSelectedMonth(new Date().getMonth() + 1);
                  setSelectedYear(new Date().getFullYear());
                  setSelectedEmployee("all");
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Payroll"
          value={`₹${stats.totalSalary.toLocaleString()}`}
          icon={IndianRupee}
          color="blue"
          change={`${getMonthName(selectedMonth)} ${selectedYear}`}
        />
        <StatCard
          title="Paid Salaries"
          value={stats.paidSalaries}
          icon={CheckCircle}
          color="green"
          change="Completed payments"
        />
        <StatCard
          title="Pending Salaries"
          value={stats.pendingSalaries}
          icon={Clock}
          color="orange"
          change={`₹${stats.totalPending.toLocaleString()} pending`}
        />
        <StatCard
          title="Gross Amount"
          value={`₹${stats.totalGross.toLocaleString()}`}
          icon={TrendingUp}
          color="purple"
          change="Before deductions"
        />
        <StatCard
          title="Total Advances"
          value={`₹${stats.totalAdvances.toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          change="Deducted amount"
        />
      </div>

      {/* Salary Records */}
      <SectionCard
        title={`Salary Records - ${getMonthName(
          selectedMonth
        )} ${selectedYear}`}
        icon={DollarSign}
        headerColor="blue"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => console.log("Export payroll")}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowCalculateModal(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Calculator className="w-4 h-4" />
              Calculate
            </button>
          </div>
        }
      >
        {salaryData.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full bg-white">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Employee
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Payment Type
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Attendance
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Gross Amount
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Deductions
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Net Amount
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 font-bold text-gray-900 border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {salaryData.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {record.employee?.name || "Unknown Employee"}
                          </p>
                          <p className="text-sm text-gray-600 font-medium">
                            {record.employee?.employeeId || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize">
                          {record.employee?.paymentType || "N/A"} Pay
                        </span>
                        <p className="text-sm font-bold text-gray-900">
                          {record.employee?.paymentType === "fixed"
                            ? `₹${record.employee?.basicSalary?.toLocaleString()}/month`
                            : `₹${record.employee?.hourlyRate}/hour`}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-gray-900">
                            {record.presentDays || 0}/{record.totalDays || 0}{" "}
                            days
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {record.totalHours || 0}h worked
                          </span>
                        </div>
                        {(record.overtimeHours || 0) > 0 && (
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-600 font-medium">
                              +{record.overtimeHours}h overtime
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-green-600 text-lg">
                        ₹{(record.grossAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-red-600 font-bold">
                          ₹
                          {(
                            (record.advanceDeducted || 0) +
                            (record.otherDeductions || 0)
                          ).toLocaleString()}
                        </p>
                        {(record.advanceDeducted || 0) > 0 && (
                          <p className="text-xs text-red-500 font-medium">
                            Advance: ₹{record.advanceDeducted.toLocaleString()}
                          </p>
                        )}
                        {(record.otherDeductions || 0) > 0 && (
                          <p className="text-xs text-red-500 font-medium">
                            Other: ₹{record.otherDeductions.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-green-600 text-xl">
                        ₹{(record.netAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            record.isPaid
                              ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800"
                              : "bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-800"
                          }`}
                        >
                          {record.isPaid ? "✓ Paid" : "⏳ Pending"}
                        </span>
                        {record.isPaid && record.paidDate && (
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(record.paidDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => generatePayslip(record)}
                          disabled={actionLoading === record._id}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105"
                          title="View Payslip"
                        >
                          {actionLoading === record._id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </button>
                        {!record.isPaid && (
                          <button
                            onClick={() => handleMarkAsPaidClick(record)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Mark as Paid"
                          >
                            <Banknote className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-xl">
            <DollarSign className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No salary records found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No salary has been calculated for {getMonthName(selectedMonth)}{" "}
              {selectedYear}
              {selectedEmployee !== "all" && (
                <span>
                  {" "}
                  for{" "}
                  {employees.find((emp) => emp._id === selectedEmployee)
                    ?.name || "selected employee"}
                </span>
              )}
              .
            </p>
            <button
              onClick={() => setShowCalculateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
            >
              Calculate Monthly Salary
            </button>
          </div>
        )}
      </SectionCard>

      {/* Calculate Salary Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Calculate Monthly Salary
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Process payroll calculation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCalculateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-600">
                Calculate salary for{" "}
                <span className="font-bold text-gray-900">
                  {getMonthName(selectedMonth)} {selectedYear}
                </span>
                {selectedEmployee !== "all" && (
                  <span>
                    {" "}
                    for{" "}
                    <span className="font-bold text-gray-900">
                      {employees.find((emp) => emp._id === selectedEmployee)
                        ?.name || "selected employee"}
                    </span>
                  </span>
                )}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-2xl mb-6 border border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                This will:
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Calculate attendance-based salary
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Apply advance deductions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Generate payroll records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Update salary status
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:shadow-lg transition-all font-medium"
                disabled={calculating}
              >
                Cancel
              </button>
              <button
                onClick={calculateSalaryForMonth}
                disabled={calculating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Salary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSalaryRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Mark as Paid
                  </h2>
                  <p className="text-gray-600 text-sm">Record salary payment</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-2xl mb-6 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {selectedSalaryRecord.employee?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedSalaryRecord.employee?.employeeId}
                  </p>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {paymentErrors.submit && (
              <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  {paymentErrors.submit}
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <IndianRupee className="w-4 h-4 inline mr-2 text-green-500" />
                  Payment Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={paymentFormData.amount}
                  onChange={handlePaymentInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white ${
                    paymentErrors.amount ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder="Enter payment amount"
                />
                {paymentErrors.amount && (
                  <p className="text-red-600 text-sm font-medium">
                    {paymentErrors.amount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <CreditCard className="w-4 h-4 inline mr-2 text-blue-500" />
                  Payment Mode *
                </label>
                <select
                  name="paymentMode"
                  value={paymentFormData.paymentMode}
                  onChange={handlePaymentInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white ${
                    paymentErrors.paymentMode
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
                {paymentErrors.paymentMode && (
                  <p className="text-red-600 text-sm font-medium">
                    {paymentErrors.paymentMode}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <FileText className="w-4 h-4 inline mr-2 text-purple-500" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={paymentFormData.description}
                  onChange={handlePaymentInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all bg-white"
                  placeholder="Payment description..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t-2 border-gray-200">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:shadow-lg transition-all font-medium"
                disabled={paymentLoading}
              >
                Cancel
              </button>
              <button
                onClick={markSalaryAsPaid}
                disabled={paymentLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Payslip Modal */}
      {showPayslipModal && selectedSalaryRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Employee Payslip
                  </h2>
                  <p className="text-gray-600">Detailed salary breakdown</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Employee & Salary Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div className="text-center border-b-2 border-gray-200 pb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Salary Slip
                  </h3>
                  <p className="text-lg text-gray-600 font-medium">
                    {getMonthName(selectedSalaryRecord.month)}{" "}
                    {selectedSalaryRecord.year}
                  </p>
                </div>

                {/* Employee Information */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Employee Information
                  </h4>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Employee Name
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedSalaryRecord.employee?.name}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Employee ID
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedSalaryRecord.employee?.employeeId}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Payment Type
                      </label>
                      <span className="inline-block px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 capitalize">
                        {selectedSalaryRecord.employee?.paymentType} Payment
                      </span>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Basic Rate
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        ₹
                        {selectedSalaryRecord.employee?.paymentType === "fixed"
                          ? selectedSalaryRecord.employee?.basicSalary?.toLocaleString()
                          : selectedSalaryRecord.employee?.hourlyRate}
                        <span className="text-sm text-gray-600 font-normal">
                          {selectedSalaryRecord.employee?.paymentType ===
                          "fixed"
                            ? "/month"
                            : "/hour"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-green-600" />
                    Attendance Details
                  </h4>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Present Days
                      </label>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedSalaryRecord.presentDays}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Total Days
                      </label>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedSalaryRecord.totalDays}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Hours Worked
                      </label>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedSalaryRecord.totalHours || 0}h
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Overtime
                      </label>
                      <p className="text-2xl font-bold text-orange-600">
                        {selectedSalaryRecord.overtimeHours || 0}h
                      </p>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-purple-600" />
                    Salary Breakdown
                  </h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="font-bold text-gray-700">
                        Gross Amount:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{selectedSalaryRecord.grossAmount?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="font-bold text-gray-700">
                        Advance Deducted:
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        -₹
                        {selectedSalaryRecord.advanceDeducted?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="font-bold text-gray-700">
                        Other Deductions:
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        -₹
                        {selectedSalaryRecord.otherDeductions?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                      <span className="font-bold text-gray-700">Bonus:</span>
                      <span className="text-xl font-bold text-green-600">
                        +₹{selectedSalaryRecord.bonus?.toLocaleString()}
                      </span>
                    </div>

                    <div className="border-t-2 border-gray-300 pt-4">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-xl shadow-md">
                        <span className="text-xl font-bold text-gray-900">
                          Net Amount:
                        </span>
                        <span className="text-3xl font-bold text-green-700">
                          ₹{selectedSalaryRecord.netAmount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Status & Actions */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Payment Status
                  </h3>

                  <div className="space-y-4">
                    <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                      <span
                        className={`inline-block px-4 py-2 text-lg font-bold rounded-full ${
                          selectedSalaryRecord.isPaid
                            ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800"
                            : "bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-800"
                        }`}
                      >
                        {selectedSalaryRecord.isPaid ? "✓ Paid" : "⏳ Pending"}
                      </span>
                    </div>

                    {selectedSalaryRecord.isPaid &&
                      selectedSalaryRecord.paidDate && (
                        <div className="text-center">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Payment Date
                          </label>
                          <p className="text-lg font-bold text-gray-900">
                            {new Date(
                              selectedSalaryRecord.paidDate
                            ).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Actions
                  </h3>

                  <div className="space-y-3">
                    {!selectedSalaryRecord.isPaid && (
                      <button
                        onClick={() => {
                          setShowPayslipModal(false);
                          handleMarkAsPaidClick(selectedSalaryRecord);
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        <Banknote className="w-4 h-4 inline mr-2" />
                        Mark as Paid
                      </button>
                    )}

                    <button
                      onClick={() => console.log("Download payslip")}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Download PDF
                    </button>

                    <button
                      onClick={() => setShowPayslipModal(false)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl hover:shadow-lg transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalary;
