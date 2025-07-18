import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";

const WeeklyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    return startOfWeek;
  });

  useEffect(() => {
    fetchWeeklyReport();
  }, [currentWeek]);

  const fetchWeeklyReport = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentWeek);
      const endDate = new Date(currentWeek);
      endDate.setDate(endDate.getDate() + 6);

      const response = await reportsAPI.getWeeklyReport({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      setReportData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch weekly report");
      console.error("Weekly report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + direction * 7);
    setCurrentWeek(newWeek);
  };

  const formatWeekRange = () => {
    const startDate = new Date(currentWeek);
    const endDate = new Date(currentWeek);
    endDate.setDate(endDate.getDate() + 6);

    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay())
    );
    setCurrentWeek(startOfWeek);
  };

  // Process trends data for charts
  const processCashFlowTrends = () => {
    if (!reportData?.trends?.cashFlow) return [];

    const dailyData = {};
    reportData.trends.cashFlow.forEach((item) => {
      if (!dailyData[item._id.date]) {
        dailyData[item._id.date] = { date: item._id.date, IN: 0, OUT: 0 };
      }
      dailyData[item._id.date][item._id.type] = item.totalAmount;
    });

    return Object.values(dailyData).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  const processAttendanceTrends = () => {
    if (!reportData?.trends?.attendance) return [];

    return reportData.trends.attendance
      .map((item) => ({
        date: item._id,
        totalMarked: item.totalMarked,
        presentCount: item.presentCount,
        attendanceRate:
          Math.round((item.presentCount / item.totalMarked) * 100) || 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Weekly Report"
          subheader={`Business analysis for week of ${formatWeekRange()}`}
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

  const cashFlowData = processCashFlowTrends();
  const attendanceData = processAttendanceTrends();

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Weekly Report"
        subheader={`Business analysis for week of ${formatWeekRange()}`}
        onRefresh={fetchWeeklyReport}
        loading={loading}
      />

      {/* Week Navigation & Actions */}
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
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900 min-w-[200px] text-center">
              {formatWeekRange()}
            </span>

            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={getCurrentWeek}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Current Week
          </button>
          <button
            onClick={() => console.log("Export weekly report")}
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
          title="Stock Value"
          value={`₹${
            reportData?.stock?.totalStockValue?.toLocaleString() || 0
          }`}
          icon={BarChart3}
          color="purple"
          change={`${reportData?.stock?.totalProducts || 0} products`}
        />
        <StatCard
          title="Low Stock Items"
          value={reportData?.stock?.lowStockItems || 0}
          icon={TrendingDown}
          color="orange"
          change="Need attention"
        />
        <StatCard
          title="Weekly Transactions"
          value={cashFlowData.length}
          icon={Calendar}
          color="blue"
          change="Days with activity"
        />
        <StatCard
          title="Avg Attendance"
          value={`${
            Math.round(
              attendanceData.reduce((sum, day) => sum + day.attendanceRate, 0) /
                attendanceData.length
            ) || 0
          }%`}
          icon={Users}
          color="green"
          change="Weekly average"
        />
      </div>

      {/* Trends Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Trends */}
        <SectionCard
          title="Daily Cash Flow Trends"
          icon={TrendingUp}
          headerColor="green"
        >
          <div className="space-y-4">
            {cashFlowData.map((day, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </h4>
                  <span
                    className={`font-bold ${
                      day.IN - day.OUT >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{(day.IN - day.OUT).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">
                      Income: ₹{day.IN.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600">
                      Outflow: ₹{day.OUT.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!cashFlowData.length && (
              <p className="text-gray-500 text-center py-8">
                No cash flow data for this week
              </p>
            )}
          </div>
        </SectionCard>

        {/* Attendance Trends */}
        <SectionCard
          title="Daily Attendance Trends"
          icon={Users}
          headerColor="blue"
        >
          <div className="space-y-4">
            {attendanceData.map((day, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </h4>
                  <span
                    className={`font-bold ${
                      day.attendanceRate >= 80
                        ? "text-green-600"
                        : day.attendanceRate >= 60
                        ? "text-orange-600"
                        : "text-red-600"
                    }`}
                  >
                    {day.attendanceRate}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">
                      Present: {day.presentCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      Total: {day.totalMarked}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {!attendanceData.length && (
              <p className="text-gray-500 text-center py-8">
                No attendance data for this week
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Expense Trends */}
      <SectionCard
        title="Daily Expense Trends"
        icon={TrendingDown}
        headerColor="red"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Total Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Transactions
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  Average
                </th>
              </tr>
            </thead>
            <tbody>
              {reportData?.trends?.expenses?.map((day, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">
                      {new Date(day._id).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-red-600">
                      ₹{day.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">{day.count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600">
                      ₹
                      {Math.round(day.totalAmount / day.count).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!reportData?.trends?.expenses?.length && (
            <div className="text-center py-8">
              <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No expense data for this week</p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default WeeklyReport;
