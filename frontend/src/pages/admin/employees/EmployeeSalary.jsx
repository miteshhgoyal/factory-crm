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
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import jsPDF from "jspdf";

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

      const employeesResponse = await employeeAPI.getEmployees();
      const employeesData = employeesResponse.data?.data?.employees || [];
      setEmployees(employeesData);

      const salaryParams = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedEmployee !== "all") {
        salaryParams.employeeId = selectedEmployee;
      }

      const salaryResponse = await employeeAPI.getSalarySummary(salaryParams);
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

  const downloadPayslipPDF = (salaryRecord) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PAYSLIP", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${getMonthName(selectedMonth)} ${selectedYear}`, 105, 30, {
      align: "center",
    });

    // Company details (you can customize this)
    doc.setFontSize(10);
    doc.text("Company Name", 20, 45);
    doc.text("Company Address", 20, 52);

    // Employee details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE DETAILS", 20, 70);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${salaryRecord.employee?.name}`, 20, 80);
    doc.text(`Employee ID: ${salaryRecord.employee?.employeeId}`, 20, 87);
    doc.text(`Payment Type: ${salaryRecord.employee?.paymentType}`, 20, 94);
    doc.text(`Phone: ${salaryRecord.employee?.phone || "N/A"}`, 120, 80);

    // Attendance details
    doc.setFont("helvetica", "bold");
    doc.text("ATTENDANCE DETAILS", 20, 110);

    doc.setFont("helvetica", "normal");
    doc.text(`Present Days: ${salaryRecord.presentDays}`, 20, 120);
    doc.text(`Total Days: ${salaryRecord.totalDays}`, 120, 120);
    doc.text(`Total Hours: ${salaryRecord.totalHours || 0}`, 20, 127);
    doc.text(`Overtime Hours: ${salaryRecord.overtimeHours || 0}`, 120, 127);

    // Salary breakdown
    doc.setFont("helvetica", "bold");
    doc.text("SALARY BREAKDOWN", 20, 145);

    // Table headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Description", 20, 155);
    doc.text("Amount (₹)", 150, 155);

    // Table content
    doc.setFont("helvetica", "normal");
    let yPos = 165;

    doc.text("Gross Amount", 20, yPos);
    doc.text((salaryRecord.grossAmount || 0).toLocaleString(), 150, yPos);
    yPos += 7;

    doc.text("Advance Deducted", 20, yPos);
    doc.text(
      `-${(salaryRecord.advanceDeducted || 0).toLocaleString()}`,
      150,
      yPos
    );
    yPos += 7;

    doc.text("Other Deductions", 20, yPos);
    doc.text(
      `-${(salaryRecord.otherDeductions || 0).toLocaleString()}`,
      150,
      yPos
    );
    yPos += 10;

    // Net amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("NET AMOUNT", 20, yPos);
    doc.text(`₹${(salaryRecord.netAmount || 0).toLocaleString()}`, 150, yPos);

    // Payment status
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Status: ${salaryRecord.isPaid ? "PAID" : "PENDING"}`, 20, yPos);

    if (salaryRecord.isPaid && salaryRecord.paidDate) {
      yPos += 7;
      doc.text(
        `Paid Date: ${new Date(salaryRecord.paidDate).toLocaleDateString(
          "en-IN"
        )}`,
        20,
        yPos
      );
    }

    // Footer
    doc.setFontSize(8);
    doc.text("This is a computer generated payslip.", 105, 280, {
      align: "center",
    });

    doc.save(
      `payslip_${salaryRecord.employee?.name}_${getMonthName(
        selectedMonth
      )}_${selectedYear}.pdf`
    );
  };

  const exportSalaryReportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY REPORT", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${getMonthName(selectedMonth)} ${selectedYear}`, 105, 30, {
      align: "center",
    });
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-IN")}`,
      105,
      37,
      { align: "center" }
    );

    // Summary
    const stats = getSalaryStats();
    doc.setFontSize(10);
    doc.text(`Total Employees: ${salaryData.length}`, 20, 50);
    doc.text(`Total Payroll: ₹${stats.totalSalary.toLocaleString()}`, 120, 50);
    doc.text(`Paid: ${stats.paidSalaries}`, 20, 57);
    doc.text(`Pending: ${stats.pendingSalaries}`, 120, 57);

    // Table headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    let yPos = 75;
    doc.text("Employee", 20, yPos);
    doc.text("ID", 60, yPos);
    doc.text("Days", 85, yPos);
    doc.text("Gross", 105, yPos);
    doc.text("Deductions", 130, yPos);
    doc.text("Net", 160, yPos);
    doc.text("Status", 185, yPos);

    // Table data
    doc.setFont("helvetica", "normal");
    yPos += 10;

    salaryData.forEach((record, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.text(record.employee?.name?.substring(0, 12) || "Unknown", 20, yPos);
      doc.text(record.employee?.employeeId || "N/A", 60, yPos);
      doc.text(`${record.presentDays}/${record.totalDays}`, 85, yPos);
      doc.text(`₹${(record.grossAmount || 0).toLocaleString()}`, 105, yPos);
      doc.text(
        `₹${(
          (record.advanceDeducted || 0) + (record.otherDeductions || 0)
        ).toLocaleString()}`,
        130,
        yPos
      );
      doc.text(`₹${(record.netAmount || 0).toLocaleString()}`, 160, yPos);
      doc.text(record.isPaid ? "Paid" : "Pending", 185, yPos);

      yPos += 7;
    });

    doc.save(
      `salary_report_${getMonthName(selectedMonth)}_${selectedYear}.pdf`
    );
  };

  const exportSalaryReport = () => {
    const csvData = salaryData.map((record) => ({
      "Employee Name": record.employee?.name || "Unknown",
      "Employee ID": record.employee?.employeeId || "N/A",
      "Payment Type": record.employee?.paymentType || "N/A",
      "Present Days": record.presentDays,
      "Total Days": record.totalDays,
      "Gross Amount": record.grossAmount || 0,
      "Advance Deducted": record.advanceDeducted || 0,
      "Other Deductions": record.otherDeductions || 0,
      "Net Amount": record.netAmount || 0,
      Status: record.isPaid ? "Paid" : "Pending",
      "Paid Date":
        record.isPaid && record.paidDate
          ? new Date(record.paidDate).toLocaleDateString("en-IN")
          : "",
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary_report_${getMonthName(
      selectedMonth
    )}_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      setPaymentFormData({
        amount: "",
        paymentMode: "Cash",
        description: "",
      });
      await fetchData();
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
    setPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
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
    const totalPaid = salaryData
      .filter((record) => record.isPaid)
      .reduce((sum, record) => sum + (record.netAmount || 0), 0);

    return {
      totalSalary,
      paidSalaries,
      pendingSalaries,
      totalAdvances,
      totalGross,
      totalPending,
      totalPaid,
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
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent
          header="Salary Management"
          subheader="Manage employee salaries and payroll"
          loading={loading}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
            {[...Array(6)].map((_, i) => (
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
        header="Salary Management"
        subheader={`Manage payroll for ${getMonthName(
          selectedMonth
        )} ${selectedYear} - ${salaryData.length} employees`}
        onRefresh={fetchData}
        loading={loading}
      />

      <div className="space-y-6">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Payroll"
            value={`₹${stats.totalSalary.toLocaleString()}`}
            icon={Wallet}
            color="blue"
            change={`${salaryData.length} employees`}
          />
          <StatCard
            title="Paid Amount"
            value={`₹${stats.totalPaid.toLocaleString()}`}
            icon={CheckCircle}
            color="green"
            change={`${stats.paidSalaries} payments`}
          />
          <StatCard
            title="Pending Amount"
            value={`₹${stats.totalPending.toLocaleString()}`}
            icon={Clock}
            color="orange"
            change={`${stats.pendingSalaries} pending`}
          />
          <StatCard
            title="Gross Total"
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

        {/* Enhanced Filters and Actions */}
        <SectionCard>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
              {/* Enhanced Month/Year Selectors */}
              <div className="flex gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none min-w-[200px]"
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

            {/* Enhanced Action Buttons */}
            <div className="flex gap-2 w-full lg:w-auto">
              <button
                onClick={exportSalaryReport}
                disabled={salaryData.length === 0}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </button>

              <button
                onClick={exportSalaryReportPDF}
                disabled={salaryData.length === 0}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </button>

              <button
                onClick={() => setShowCalculateModal(true)}
                className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>
                Viewing {getMonthName(selectedMonth)} {selectedYear}
              </span>
              {selectedEmployee !== "all" && (
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Employee:{" "}
                  {employees.find((emp) => emp._id === selectedEmployee)
                    ?.name || "Unknown"}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-800 rounded-full">
                {salaryData.length} records
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Salary Data */}
        <SectionCard>
          {salaryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Employee
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Attendance
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Gross
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Deductions
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Net Amount
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salaryData.map((record) => (
                    <tr
                      key={record._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              record.isPaid
                                ? "bg-green-100 text-green-600"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {record.employee?.name || "Unknown Employee"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.employee?.employeeId || "N/A"}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {record.employee?.paymentType || "N/A"} Pay
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {record.presentDays}/{record.totalDays} days
                          </div>
                          {record.totalHours > 0 && (
                            <div className="text-gray-500">
                              {record.totalHours}h total
                            </div>
                          )}
                          {record.overtimeHours > 0 && (
                            <div className="text-orange-600">
                              {record.overtimeHours}h overtime
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-semibold text-gray-900">
                          ₹{(record.grossAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ₹
                            {(
                              (record.advanceDeducted || 0) +
                              (record.otherDeductions || 0)
                            ).toLocaleString()}
                          </div>
                          {(record.advanceDeducted || 0) > 0 && (
                            <div className="text-xs text-red-600">
                              Advance: ₹
                              {record.advanceDeducted.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-lg text-gray-900">
                          ₹{(record.netAmount || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              record.isPaid
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {record.isPaid ? "Paid" : "Pending"}
                          </span>
                          {record.isPaid && record.paidDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(record.paidDate).toLocaleDateString(
                                "en-IN"
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generatePayslip(record)}
                            disabled={actionLoading === record._id}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Payslip"
                          >
                            {actionLoading === record._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => downloadPayslipPDF(record)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Download PDF Payslip"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {!record.isPaid && (
                            <button
                              onClick={() => handleMarkAsPaidClick(record)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
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
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Calculator className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No salary calculated
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
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
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <Calculator className="h-5 w-5 mr-2" />
                Calculate Salary
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Calculate Salary
                </h2>
              </div>
              <button
                onClick={() => setShowCalculateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Calculate salary for{" "}
                  <span className="font-semibold">
                    {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                  {selectedEmployee !== "all" && (
                    <span>
                      {" "}
                      for{" "}
                      <span className="font-semibold">
                        {employees.find((emp) => emp._id === selectedEmployee)
                          ?.name || "selected employee"}
                      </span>
                    </span>
                  )}
                </p>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      This will calculate salary based on attendance records for
                      the selected period.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCalculateModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={calculateSalaryForMonth}
                  disabled={calculating}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSalaryRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Record Payment
                </h2>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {paymentErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">
                    {paymentErrors.submit}
                  </span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {selectedSalaryRecord.employee?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedSalaryRecord.employee?.employeeId}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    name="amount"
                    value={paymentFormData.amount}
                    onChange={handlePaymentInputChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      paymentErrors.amount
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {paymentErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {paymentErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  name="paymentMode"
                  value={paymentFormData.paymentMode}
                  onChange={handlePaymentInputChange}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    paymentErrors.paymentMode
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online</option>
                </select>
                {paymentErrors.paymentMode && (
                  <p className="mt-1 text-sm text-red-600">
                    {paymentErrors.paymentMode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={paymentFormData.description}
                  onChange={handlePaymentInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={markSalaryAsPaid}
                  disabled={paymentLoading}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedSalaryRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Payslip - {getMonthName(selectedMonth)} {selectedYear}
                </h2>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Employee Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name
                    </label>
                    <div className="font-semibold text-gray-900">
                      {selectedSalaryRecord.employee?.name}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID
                    </label>
                    <div className="text-gray-900">
                      {selectedSalaryRecord.employee?.employeeId}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type
                    </label>
                    <div className="text-gray-900 capitalize">
                      {selectedSalaryRecord.employee?.paymentType}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Rate
                    </label>
                    <div className="text-gray-900">
                      ₹
                      {selectedSalaryRecord.employee?.paymentType === "fixed"
                        ? selectedSalaryRecord.employee?.basicSalary?.toLocaleString()
                        : selectedSalaryRecord.employee?.hourlyRate}
                      {selectedSalaryRecord.employee?.paymentType === "fixed"
                        ? "/month"
                        : "/hour"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Attendance Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Present Days
                    </label>
                    <div className="text-xl font-bold text-blue-900">
                      {selectedSalaryRecord.presentDays}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Days
                    </label>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedSalaryRecord.totalDays}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      Total Hours
                    </label>
                    <div className="text-xl font-bold text-green-900">
                      {selectedSalaryRecord.totalHours || 0}h
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3">
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Overtime Hours
                    </label>
                    <div className="text-xl font-bold text-orange-900">
                      {selectedSalaryRecord.overtimeHours || 0}h
                    </div>
                  </div>
                </div>
              </div>

              {/* Salary Breakdown */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Salary Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-700">
                      Gross Amount
                    </span>
                    <span className="font-semibold text-green-900">
                      ₹
                      {(selectedSalaryRecord.grossAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">Advance Deducted</span>
                    <span className="font-semibold text-red-900">
                      -₹
                      {(
                        selectedSalaryRecord.advanceDeducted || 0
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">Other Deductions</span>
                    <span className="font-semibold text-red-900">
                      -₹
                      {(
                        selectedSalaryRecord.otherDeductions || 0
                      ).toLocaleString()}
                    </span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <span className="text-lg font-bold text-blue-900">
                      Net Amount
                    </span>
                    <span className="text-2xl font-bold text-blue-900">
                      ₹{(selectedSalaryRecord.netAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Status
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span
                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                      selectedSalaryRecord.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {selectedSalaryRecord.isPaid ? "Paid" : "Pending"}
                  </span>

                  {selectedSalaryRecord.isPaid &&
                    selectedSalaryRecord.paidDate && (
                      <div className="text-sm text-gray-600">
                        Paid on{" "}
                        {new Date(
                          selectedSalaryRecord.paidDate
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-6 flex justify-end gap-3">
                <button
                  onClick={() => downloadPayslipPDF(selectedSalaryRecord)}
                  className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalary;
