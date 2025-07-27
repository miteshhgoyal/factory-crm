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

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employees first
      const employeesResponse = await employeeAPI.getEmployees();
      const employeesData = employeesResponse.data.data.employees;

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
      const salaryDataArray = Array.isArray(salaryResponse.data)
        ? salaryResponse.data
        : [];

      setSalaryData(salaryDataArray);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to fetch salary data");
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
      setError("Failed to calculate salary");
    } finally {
      setCalculating(false);
    }
  };

  const generatePayslip = async (salaryRecord) => {
    try {
      const response = await employeeAPI.generatePayslip(salaryRecord._id);
      // Handle payslip download
      console.log("Payslip generated:", response);
    } catch (error) {
      console.error("Failed to generate payslip:", error);
    }
  };

  const markSalaryAsPaid = async (salaryId) => {
    try {
      await employeeAPI.markSalaryPaid(salaryId);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to mark salary as paid:", error);
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

    return { totalSalary, paidSalaries, pendingSalaries, totalAdvances };
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700">
              Actions
            </label>
            <button
              onClick={() => {
                setSelectedMonth(new Date().getMonth() + 1);
                setSelectedYear(new Date().getFullYear());
                setSelectedEmployee("all");
              }}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </SectionCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Payroll"
          value={`₹${stats.totalSalary.toLocaleString()}`}
          icon={DollarSign}
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
          change="Awaiting payment"
        />
        <StatCard
          title="Total Advances"
          value={`₹${stats.totalAdvances.toLocaleString()}`}
          icon={TrendingDown}
          color="red"
          change="Advance deductions"
        />
      </div>

      {/* Salary Records */}
      <SectionCard
        title="Salary Records"
        icon={DollarSign}
        headerColor="blue"
        actions={
          <button
            onClick={() => console.log("Export payroll")}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Employee
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Basic Salary
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Present Days
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Gross Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Deductions
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Net Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((record) => (
                <tr
                  key={record._id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.employee?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {record.employee?.employeeId}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      ₹{record.basicSalary?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">
                      {record.presentDays}/{record.totalDays}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      ₹{record.grossAmount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-red-600">
                      ₹
                      {(
                        (record.advanceDeducted || 0) +
                        (record.otherDeductions || 0)
                      ).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-green-600">
                      ₹{record.netAmount?.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        record.isPaid
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {record.isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => generatePayslip(record)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg"
                        title="Generate Payslip"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!record.isPaid && (
                        <button
                          onClick={() => markSalaryAsPaid(record._id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded-lg"
                          title="Mark as Paid"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {salaryData.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No salary records found
              </h3>
              <p className="text-gray-600 mb-4">
                No salary has been calculated for {getMonthName(selectedMonth)}{" "}
                {selectedYear}.
              </p>
              <button
                onClick={() => setShowCalculateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Calculate Monthly Salary
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Calculate Salary Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Calculate Monthly Salary
              </h2>
              <button
                onClick={() => setShowCalculateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-6">
              <Calculator className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">
                Calculate salary for {getMonthName(selectedMonth)}{" "}
                {selectedYear}
                {selectedEmployee !== "all" && (
                  <span>
                    {" "}
                    for{" "}
                    {
                      employees.find((emp) => emp._id === selectedEmployee)
                        ?.name
                    }
                  </span>
                )}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">This will:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Calculate attendance-based salary</li>
                <li>• Apply advance deductions</li>
                <li>• Generate payroll records</li>
                <li>• Update salary status</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCalculateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={calculating}
              >
                Cancel
              </button>
              <button
                onClick={calculateSalaryForMonth}
                disabled={calculating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate Salary"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalary;
