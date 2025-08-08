import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  IndianRupee,
  BarChart3,
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const MonthlyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getMonthlyReport({
        month: selectedMonth,
        year: selectedYear,
      });

      setReportData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch monthly report");
      console.error("Monthly report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const getCurrentMonth = () => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
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

  // Process cash flow data
  const getCashFlowSummary = () => {
    if (!reportData?.cashFlow?.byType) return { IN: 0, OUT: 0 };

    return reportData.cashFlow.byType.reduce(
      (acc, item) => {
        acc[item._id] = item.totalAmount;
        return acc;
      },
      { IN: 0, OUT: 0 }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Monthly Report"
          subheader={`Comprehensive analysis for ${
            monthNames[selectedMonth - 1]
          } ${selectedYear}`}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  const cashFlowSummary = getCashFlowSummary();

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Monthly Report"
        subheader={`Comprehensive analysis for ${
          monthNames[selectedMonth - 1]
        } ${selectedYear}`}
        onRefresh={fetchMonthlyReport}
        loading={loading}
      />

      {/* Month Navigation & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/reports/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Reports Dashboard
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900 min-w-[150px] text-center">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={getCurrentMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Current Month
          </button>
          <button
            onClick={() => console.log("Export monthly report")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Income"
          value={`₹${cashFlowSummary.IN?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          change="Monthly income"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${
            (
              cashFlowSummary.OUT +
              (reportData?.expenses?.total?.[0]?.totalAmount || 0)
            )?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change="Monthly expenses"
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${
            (
              cashFlowSummary.IN -
              cashFlowSummary.OUT -
              (reportData?.expenses?.total?.[0]?.totalAmount || 0)
            )?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color={cashFlowSummary.IN > cashFlowSummary.OUT ? "green" : "red"}
          change="Net position"
        />
        <StatCard
          title="Attendance Rate"
          value={`${
            Math.round(
              (reportData?.attendance?.presentCount /
                reportData?.attendance?.totalMarked) *
                100
            ) || 0
          }%`}
          icon={Users}
          color="blue"
          change={`${reportData?.attendance?.totalHours || 0}h total`}
        />
        <StatCard
          title="Stock Value"
          value={`₹${
            reportData?.stock?.totalStockValue?.toLocaleString() || 0
          }`}
          icon={Package}
          color="purple"
          change={`${reportData?.stock?.totalProducts || 0} products`}
        />
        <StatCard
          title="Active Employees"
          value={
            reportData?.employees?.reduce((sum, emp) => sum + emp.count, 0) || 0
          }
          icon={Users}
          color="orange"
          change="Current workforce"
        />
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Breakdown */}
        <SectionCard
          title="Cash Flow by Category"
          icon={PieChart}
          headerColor="green"
        >
          <div className="space-y-3">
            {reportData?.cashFlow?.byCategory
              ?.slice(0, 8)
              .map((category, index) => (
                <DataRow
                  key={index}
                  label={category._id || "Unknown"}
                  value={`₹${category.totalAmount?.toLocaleString()}`}
                  valueColor="text-green-600"
                />
              ))}
            {!reportData?.cashFlow?.byCategory?.length && (
              <p className="text-gray-500 text-center py-4">
                No cash flow categories found
              </p>
            )}
          </div>
        </SectionCard>

        {/* Expense Breakdown */}
        <SectionCard
          title="Expenses by Category"
          icon={BarChart3}
          headerColor="red"
        >
          <div className="space-y-3">
            {reportData?.expenses?.byCategory
              ?.slice(0, 8)
              .map((category, index) => (
                <DataRow
                  key={index}
                  label={category._id}
                  value={`₹${category.totalAmount?.toLocaleString()}`}
                  valueColor="text-red-600"
                />
              ))}
            {!reportData?.expenses?.byCategory?.length && (
              <p className="text-gray-500 text-center py-4">
                No expense categories found
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Employee & Client Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Summary */}
        <SectionCard title="Employee Summary" icon={Users} headerColor="blue">
          <div className="space-y-4">
            <DataRow
              label="Total Employees"
              value={
                reportData?.employees?.reduce(
                  (sum, emp) => sum + emp.count,
                  0
                ) || 0
              }
              valueColor="text-blue-600"
            />
            <DataRow
              label="Attendance Rate"
              value={`${
                Math.round(
                  (reportData?.attendance?.presentCount /
                    reportData?.attendance?.totalMarked) *
                    100
                ) || 0
              }%`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Working Hours"
              value={`${reportData?.attendance?.totalHours || 0}h`}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Average Hours/Day"
              value={`${Math.round(reportData?.attendance?.avgHours || 0)}h`}
              valueColor="text-orange-600"
            />

            {reportData?.employees?.map((empType, index) => (
              <DataRow
                key={index}
                label={`${
                  empType._id === "fixed" ? "Fixed Salary" : "Hourly"
                } Employees`}
                value={empType.count}
                valueColor="text-gray-600"
              />
            ))}
          </div>
        </SectionCard>

        {/* Client Summary */}
        <SectionCard title="Client Summary" icon={Users} headerColor="purple">
          <div className="space-y-4">
            {reportData?.clients?.map((clientType, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-gray-900 border-b pb-1">
                  {clientType._id}s
                </h4>
                <DataRow
                  label="Total Count"
                  value={clientType.count}
                  valueColor="text-purple-600"
                />
                <DataRow
                  label="Total Balance"
                  value={`₹${Math.abs(
                    clientType.totalBalance
                  ).toLocaleString()}`}
                  valueColor={
                    clientType.totalBalance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
                <DataRow
                  label="Receivables"
                  value={`₹${
                    clientType.positiveBalance?.toLocaleString() || 0
                  }`}
                  valueColor="text-green-600"
                />
                <DataRow
                  label="Payables"
                  value={`₹${Math.abs(
                    clientType.negativeBalance || 0
                  ).toLocaleString()}`}
                  valueColor="text-red-600"
                />
              </div>
            ))}
            {!reportData?.clients?.length && (
              <p className="text-gray-500 text-center py-4">
                No client data found
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Payment Methods & Stock Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <SectionCard
          title="Payment Methods"
          icon={IndianRupee}
          headerColor="orange"
        >
          <div className="space-y-3">
            {reportData?.cashFlow?.byPaymentMode?.map((mode, index) => (
              <DataRow
                key={index}
                label={mode._id}
                value={`₹${mode.totalAmount?.toLocaleString()}`}
                valueColor="text-orange-600"
              />
            ))}
            {!reportData?.cashFlow?.byPaymentMode?.length && (
              <p className="text-gray-500 text-center py-4">
                No payment mode data found
              </p>
            )}
          </div>
        </SectionCard>

        {/* Stock Analysis */}
        <SectionCard title="Stock Analysis" icon={Package} headerColor="purple">
          <div className="space-y-4">
            <DataRow
              label="Total Products"
              value={reportData?.stock?.totalProducts || 0}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Total Stock Value"
              value={`₹${
                reportData?.stock?.totalStockValue?.toLocaleString() || 0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Quantity"
              value={`${
                reportData?.stock?.totalQuantity?.toLocaleString() || 0
              } kg`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Low Stock Items"
              value={reportData?.stock?.lowStockItems || 0}
              valueColor="text-red-600"
            />
            <DataRow
              label="Average Stock Value/Product"
              value={`₹${Math.round(
                (reportData?.stock?.totalStockValue || 0) /
                  (reportData?.stock?.totalProducts || 1)
              ).toLocaleString()}`}
              valueColor="text-orange-600"
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default MonthlyReport;
