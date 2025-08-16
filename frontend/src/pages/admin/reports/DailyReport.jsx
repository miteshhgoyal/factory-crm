// frontend/src/pages/admin/reports/DailyReport.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  IndianRupee,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import { formatDate } from "../../../utils/dateUtils";

const DailyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
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

      {/* Date Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/reports/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-2 px-4 bg-gray-50 border border-gray-300 rounded-lg">
              {formatDate(selectedDate)}
            </div>

            <button
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <button
          onClick={() =>
            setSelectedDate(new Date().toISOString().split("T")[0])
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
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
          value={`₹${(
            (reportData?.summary?.cashFlow?.totalExpense || 0) +
            (reportData?.summary?.expenses?.totalAmount || 0)
          ).toLocaleString()}`}
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
          value={`${reportData?.summary?.attendance?.attendanceRate || 0}%`}
          icon={Users}
          color="blue"
          change={`${reportData?.summary?.attendance?.presentCount || 0}/${
            reportData?.summary?.attendance?.totalMarked || 0
          } present`}
        />
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Stock Transactions"
          value={reportData?.summary?.stock?.count || 0}
          icon={Package}
          color="purple"
          change="Total transactions"
        />
        <StatCard
          title="Stock Value"
          value={`₹${
            reportData?.summary?.stock?.totalValue?.toLocaleString() || 0
          }`}
          icon={Activity}
          color="orange"
          change="Transaction value"
        />
        <StatCard
          title="Stock In"
          value={`${
            reportData?.summary?.stock?.inQuantity?.toLocaleString() || 0
          } kg`}
          icon={TrendingUp}
          color="green"
          change="Received"
        />
        <StatCard
          title="Stock Out"
          value={`${
            reportData?.summary?.stock?.outQuantity?.toLocaleString() || 0
          } kg`}
          icon={TrendingDown}
          color="red"
          change="Dispatched"
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
                    {formatDate(transaction.date)}
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

      {/* Expenses & Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses */}
        <SectionCard
          title="Expense Records"
          icon={TrendingDown}
          headerColor="red"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reportData?.transactions?.expenses?.map((expense, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {expense.description}
                  </p>
                  <p className="text-sm text-gray-500">{expense.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">
                    ₹{expense.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(expense.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {!reportData?.transactions?.expenses?.length && (
              <p className="text-gray-500 text-sm text-center py-8">
                No expenses recorded for this date
              </p>
            )}
          </div>
        </SectionCard>

        {/* Stock Transactions */}
        <SectionCard
          title="Stock Transactions"
          icon={Package}
          headerColor="purple"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {reportData?.transactions?.stock?.map((stock, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stock.type === "IN"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {stock.productName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stock.clientName || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      stock.type === "IN" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stock.type === "IN" ? "+" : "-"}
                    {stock.quantity} {stock.unit}
                  </p>
                  <p className="text-sm text-gray-500">
                    ₹{stock.amount?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {!reportData?.transactions?.stock?.length && (
              <p className="text-gray-500 text-sm text-center py-8">
                No stock transactions for this date
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DailyReport;
