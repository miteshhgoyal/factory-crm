import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  IndianRupee,
  Clock,
  ArrowLeft,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";

const DailyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDailyReport({ date: selectedDate });
      setReportData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch daily report");
      console.error("Daily report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Daily Report"
          subheader={`Business summary for ${formatDate(selectedDate)}`}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Daily Report"
        subheader={`Business summary for ${formatDate(selectedDate)}`}
        onRefresh={fetchDailyReport}
        loading={loading}
      />

      {/* Date Navigation & Actions */}
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
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              setSelectedDate(new Date().toISOString().split("T")[0])
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => console.log("Export daily report")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Income"
          value={`₹${
            reportData?.summary?.cashFlow?.totalIncome?.toLocaleString() || 0
          }`}
          icon={TrendingUp}
          color="green"
          change={`${
            reportData?.summary?.cashFlow?.incomeCount || 0
          } transactions`}
        />
        <StatCard
          title="Total Expenses"
          value={`₹${
            (
              reportData?.summary?.cashFlow?.totalExpense +
              reportData?.summary?.expenses?.totalAmount
            )?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change={`${
            (reportData?.summary?.cashFlow?.expenseCount || 0) +
            (reportData?.summary?.expenses?.count || 0)
          } transactions`}
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${
            reportData?.summary?.cashFlow?.netFlow?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color={reportData?.summary?.cashFlow?.netFlow >= 0 ? "green" : "red"}
          change="Net position"
        />
        <StatCard
          title="Attendance"
          value={`${reportData?.summary?.attendance?.presentCount || 0}/${
            reportData?.summary?.attendance?.totalMarked || 0
          }`}
          icon={Users}
          color="blue"
          change={`${reportData?.summary?.attendance?.totalHours || 0}h worked`}
        />
      </div>

      {/* Detailed Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Transactions */}
        <SectionCard
          title="Cash Flow Transactions"
          icon={IndianRupee}
          headerColor="green"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reportData?.transactions?.cashFlow?.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === "IN"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {transaction.type === "IN" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transaction.category} • {transaction.paymentMode}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      transaction.type === "IN"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "IN" ? "+" : "-"}₹
                    {transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {!reportData?.transactions?.cashFlow?.length && (
              <p className="text-gray-500 text-sm text-center py-8">
                No cash flow transactions for this date
              </p>
            )}
          </div>
        </SectionCard>

        {/* Attendance Records */}
        <SectionCard title="Attendance Records" icon={Users} headerColor="blue">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reportData?.transactions?.attendance?.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      record.isPresent
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.employeeId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.employeeId?.employeeId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      record.isPresent ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {record.isPresent ? "Present" : "Absent"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.hoursWorked || 0}h worked
                  </p>
                </div>
              </div>
            ))}
            {!reportData?.transactions?.attendance?.length && (
              <p className="text-gray-500 text-sm text-center py-8">
                No attendance records for this date
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Expenses */}
      <SectionCard title="Expense Records" icon={Package} headerColor="red">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Category
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Description
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Employee
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData?.transactions?.expenses?.map((expense, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-900">{expense.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-red-600">
                      ₹{expense.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">
                      {expense.employeeName || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(expense.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!reportData?.transactions?.expenses?.length && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No expenses recorded for this date
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default DailyReport;
