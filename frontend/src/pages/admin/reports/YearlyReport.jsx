// frontend/src/pages/admin/reports/YearlyReport.jsx
import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  IndianRupee,
  Users,
  Package,
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Target,
  Building2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const YearlyReport = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchYearlyReport();
  }, [selectedYear]);

  const fetchYearlyReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getYearlyReport({ year: selectedYear });
      setReportData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch yearly report");
      console.error("Yearly report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const navigateYear = (direction) => {
    setSelectedYear((prev) => prev + direction);
  };

  const getCurrentYear = () => {
    setSelectedYear(new Date().getFullYear());
  };

  // Process monthly trends data
  const processMonthlyTrends = () => {
    if (!reportData?.monthlyTrends) return [];

    const monthlyData = {};

    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: i,
        IN: 0,
        OUT: 0,
        count: 0,
      };
    }

    // Fill with actual data
    reportData.monthlyTrends.forEach((item) => {
      monthlyData[item._id.month][item._id.type] = item.totalAmount;
      monthlyData[item._id.month].count += item.count;
    });

    return Object.values(monthlyData);
  };

  const getCashFlowTotals = () => {
    if (!reportData?.yearlyTotals?.cashFlow) return { IN: 0, OUT: 0 };

    return reportData.yearlyTotals.cashFlow.reduce(
      (acc, item) => {
        acc[item._id] = item.totalAmount;
        return acc;
      },
      { IN: 0, OUT: 0 }
    );
  };

  const calculateGrowthRate = () => {
    const monthlyTrends = processMonthlyTrends();
    if (monthlyTrends.length < 6) return 0;

    const firstHalf = monthlyTrends
      .slice(0, 6)
      .reduce((sum, month) => sum + (month.IN - month.OUT), 0);
    const secondHalf = monthlyTrends
      .slice(6, 12)
      .reduce((sum, month) => sum + (month.IN - month.OUT), 0);

    if (firstHalf === 0) return 0;
    return Math.round(((secondHalf - firstHalf) / Math.abs(firstHalf)) * 100);
  };

  const getBestMonth = () => {
    const monthlyTrends = processMonthlyTrends();
    return monthlyTrends.reduce(
      (best, month, index) => {
        const netFlow = month.IN - month.OUT;
        const bestNetFlow = best.IN - best.OUT;
        return netFlow > bestNetFlow ? { ...month, index } : best;
      },
      { IN: 0, OUT: 0, index: 0 }
    );
  };

  const getQuarterlyData = () => {
    const monthlyTrends = processMonthlyTrends();
    const quarters = [
      { name: "Q1", months: [0, 1, 2], label: "Jan - Mar" },
      { name: "Q2", months: [3, 4, 5], label: "Apr - Jun" },
      { name: "Q3", months: [6, 7, 8], label: "Jul - Sep" },
      { name: "Q4", months: [9, 10, 11], label: "Oct - Dec" },
    ];

    return quarters.map((quarter) => {
      const quarterData = quarter.months.reduce(
        (acc, monthIndex) => {
          const month = monthlyTrends[monthIndex];
          if (month) {
            acc.income += month.IN;
            acc.expenses += month.OUT;
            acc.transactions += month.count;
          }
          return acc;
        },
        { income: 0, expenses: 0, transactions: 0 }
      );

      return {
        ...quarter,
        ...quarterData,
        net: quarterData.income - quarterData.expenses,
        profitMargin:
          quarterData.income > 0
            ? Math.round(
                ((quarterData.income - quarterData.expenses) /
                  quarterData.income) *
                  100
              )
            : 0,
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Annual Business Report"
          subheader={`Comprehensive analysis for ${selectedYear}`}
          loading={loading}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
          header="Annual Business Report"
          subheader={`Comprehensive analysis for ${selectedYear}`}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Report
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchYearlyReport}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  const monthlyTrends = processMonthlyTrends();
  const cashFlowTotals = getCashFlowTotals();
  const totalExpenses =
    cashFlowTotals.OUT + (reportData?.yearlyTotals?.expenses?.totalAmount || 0);
  const netProfit = cashFlowTotals.IN - totalExpenses;
  const growthRate = calculateGrowthRate();
  const bestMonth = getBestMonth();
  const quarterlyData = getQuarterlyData();

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

  const shortMonthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <HeaderComponent
        header="Annual Business Report"
        subheader={`Comprehensive financial and operational analysis for ${selectedYear}`}
        onRefresh={fetchYearlyReport}
        loading={loading}
      />

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/reports/dashboard")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>

          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-1 border border-blue-200">
            <button
              onClick={() => navigateYear(-1)}
              className="p-2 hover:bg-blue-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-blue-600" />
            </button>

            <span className="px-4 py-2 font-semibold text-blue-900 min-w-[100px] text-center">
              {selectedYear}
            </span>

            <button
              onClick={() => navigateYear(1)}
              className="p-2 hover:bg-blue-100 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={getCurrentYear}
            className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            Current Year
          </button>
          <button
            onClick={() => console.log("Export yearly report")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${cashFlowTotals.IN?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          change="Annual income"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${totalExpenses?.toLocaleString() || 0}`}
          icon={TrendingDown}
          color="red"
          change="Annual expenses"
        />
        <StatCard
          title="Net Profit"
          value={`₹${netProfit?.toLocaleString() || 0}`}
          icon={IndianRupee}
          color={netProfit >= 0 ? "green" : "red"}
          change={`${
            Math.round((netProfit / cashFlowTotals.IN) * 100) || 0
          }% margin`}
        />
        <StatCard
          title="Growth Rate"
          value={`${growthRate >= 0 ? "+" : ""}${growthRate}%`}
          icon={BarChart3}
          color={growthRate >= 0 ? "green" : "red"}
          change="H2 vs H1 comparison"
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Working Days"
          value={reportData?.yearlyTotals?.attendance?.totalDays || 0}
          icon={Calendar}
          color="blue"
          change={`${
            Math.round(
              (reportData?.yearlyTotals?.attendance?.presentDays /
                reportData?.yearlyTotals?.attendance?.totalDays) *
                100
            ) || 0
          }% attendance rate`}
        />
        <StatCard
          title="Total Hours"
          value={`${
            reportData?.yearlyTotals?.attendance?.totalHours?.toLocaleString() ||
            0
          }h`}
          icon={Clock}
          color="blue"
          change="Employee productivity"
        />
        <StatCard
          title="Best Month"
          value={monthNames[bestMonth.index] || "N/A"}
          icon={Target}
          color="green"
          change={`₹${
            (bestMonth.IN - bestMonth.OUT).toLocaleString() || 0
          } profit`}
        />
        <StatCard
          title="Revenue/Hour"
          value={`₹${Math.round(
            cashFlowTotals.IN /
              (reportData?.yearlyTotals?.attendance?.totalHours || 1)
          ).toLocaleString()}`}
          icon={Activity}
          color="blue"
          change="Productivity rate"
        />
      </div>

      {/* Monthly Performance Overview */}
      <SectionCard
        title="Monthly Performance Overview"
        icon={BarChart3}
        headerColor="blue"
      >
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-green-700 font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-red-700 font-medium">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-blue-700 font-medium">Net Profit</span>
            </div>
          </div>

          {/* Monthly Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthlyTrends.map((month, index) => {
              const netFlow = month.IN - month.OUT;
              const isPositive = netFlow >= 0;

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {shortMonthNames[month.month - 1]}
                    </h4>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        isPositive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isPositive ? "Profit" : "Loss"}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Revenue:</span>
                      <span className="font-medium text-green-900">
                        ₹{month.IN.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Expenses:</span>
                      <span className="font-medium text-red-900">
                        ₹{month.OUT.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-medium text-gray-700">Net:</span>
                      <span
                        className={`font-bold ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ₹{netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Performance bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isPositive ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (Math.abs(netFlow) /
                              Math.max(
                                ...monthlyTrends.map((m) =>
                                  Math.abs(m.IN - m.OUT)
                                )
                              )) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Financial & Operational Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Summary */}
        <SectionCard
          title="Financial Summary"
          icon={IndianRupee}
          headerColor="green"
        >
          <div className="space-y-6">
            {/* Key Financial Figures */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  ₹{cashFlowTotals.IN?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-green-600 mt-1">Total Revenue</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  ₹{totalExpenses?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-red-600 mt-1">Total Expenses</div>
              </div>
            </div>

            {/* Net Profit */}
            <div
              className={`text-center p-6 rounded-lg border-2 ${
                netProfit >= 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div
                className={`text-3xl font-bold ${
                  netProfit >= 0 ? "text-green-700" : "text-red-700"
                }`}
              >
                ₹{netProfit?.toLocaleString() || 0}
              </div>
              <div className="text-gray-700 mt-1 font-medium">
                Net Profit for {selectedYear}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Profit Margin:{" "}
                {Math.round((netProfit / cashFlowTotals.IN) * 100) || 0}%
              </div>
            </div>

            {/* Financial Metrics */}
            <div className="space-y-3">
              <DataRow
                label="Average Monthly Revenue"
                value={`₹${Math.round(
                  cashFlowTotals.IN / 12
                ).toLocaleString()}`}
                valueColor="text-green-700"
              />
              <DataRow
                label="Average Monthly Expenses"
                value={`₹${Math.round(totalExpenses / 12).toLocaleString()}`}
                valueColor="text-red-700"
              />
              <DataRow
                label="Revenue Growth Rate"
                value={`${growthRate >= 0 ? "+" : ""}${growthRate}%`}
                valueColor={growthRate >= 0 ? "text-green-700" : "text-red-700"}
              />
            </div>
          </div>
        </SectionCard>

        {/* Operational Summary */}
        <SectionCard
          title="Operational Summary"
          icon={Users}
          headerColor="blue"
        >
          <div className="space-y-6">
            {/* Attendance Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(
                    (reportData?.yearlyTotals?.attendance?.presentDays /
                      reportData?.yearlyTotals?.attendance?.totalDays) *
                      100
                  ) || 0}
                  %
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  Attendance Rate
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  {reportData?.yearlyTotals?.attendance?.totalHours?.toLocaleString() ||
                    0}
                </div>
                <div className="text-sm text-blue-600 mt-1">Total Hours</div>
              </div>
            </div>

            {/* Productivity Metrics */}
            <div className="text-center p-6 bg-blue-100 rounded-lg border-2 border-blue-300">
              <div className="text-3xl font-bold text-blue-800">
                ₹
                {Math.round(
                  cashFlowTotals.IN /
                    (reportData?.yearlyTotals?.attendance?.totalHours || 1)
                ).toLocaleString()}
              </div>
              <div className="text-blue-700 mt-1 font-medium">
                Revenue per Hour
              </div>
              <div className="text-sm text-blue-600 mt-2">
                Productivity Indicator
              </div>
            </div>

            {/* Operational Metrics */}
            <div className="space-y-3">
              <DataRow
                label="Total Working Days"
                value={reportData?.yearlyTotals?.attendance?.totalDays || 0}
                valueColor="text-blue-700"
              />
              <DataRow
                label="Present Days"
                value={reportData?.yearlyTotals?.attendance?.presentDays || 0}
                valueColor="text-blue-700"
              />
              <DataRow
                label="Average Daily Hours"
                value={`${Math.round(
                  (reportData?.yearlyTotals?.attendance?.totalHours || 0) /
                    (reportData?.yearlyTotals?.attendance?.presentDays || 1)
                )}h`}
                valueColor="text-blue-700"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quarterly Analysis */}
      <SectionCard
        title="Quarterly Business Performance"
        icon={Building2}
        headerColor="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quarterlyData.map((quarter, index) => (
            <div
              key={index}
              className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-blue-900">
                  {quarter.name}
                </h4>
                <p className="text-sm text-blue-600">{quarter.label}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Revenue:</span>
                    <span className="font-semibold text-green-800">
                      ₹{quarter.income.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-700">Expenses:</span>
                    <span className="font-semibold text-red-800">
                      ₹{quarter.expenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium text-gray-700">
                      Net Profit:
                    </span>
                    <span
                      className={`font-bold ${
                        quarter.net >= 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      ₹{quarter.net.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-blue-600">Profit Margin</div>
                  <div
                    className={`text-lg font-bold ${
                      quarter.profitMargin >= 0
                        ? "text-blue-700"
                        : "text-red-700"
                    }`}
                  >
                    {quarter.profitMargin}%
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      quarter.profitMargin >= 15
                        ? "bg-green-100 text-green-800"
                        : quarter.profitMargin >= 5
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {quarter.profitMargin >= 15
                      ? "Excellent"
                      : quarter.profitMargin >= 5
                      ? "Good"
                      : "Needs Focus"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Business Insights */}
      <SectionCard
        title="Key Business Insights"
        icon={Target}
        headerColor="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profitability Insight */}
          <div
            className={`p-6 rounded-lg border-2 ${
              (netProfit / cashFlowTotals.IN) * 100 >= 15
                ? "bg-green-50 border-green-200"
                : (netProfit / cashFlowTotals.IN) * 100 >= 5
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <IndianRupee
                className={`w-5 h-5 ${
                  (netProfit / cashFlowTotals.IN) * 100 >= 15
                    ? "text-green-600"
                    : (netProfit / cashFlowTotals.IN) * 100 >= 5
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              />
              <span className="font-semibold text-gray-900">Profitability</span>
            </div>
            <div className="space-y-2">
              <div
                className={`text-2xl font-bold ${
                  (netProfit / cashFlowTotals.IN) * 100 >= 15
                    ? "text-green-700"
                    : (netProfit / cashFlowTotals.IN) * 100 >= 5
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {Math.round((netProfit / cashFlowTotals.IN) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">
                Annual profit margin
                {(netProfit / cashFlowTotals.IN) * 100 >= 15
                  ? " - Excellent performance"
                  : (netProfit / cashFlowTotals.IN) * 100 >= 5
                  ? " - Good performance"
                  : " - Needs improvement"}
              </div>
            </div>
          </div>

          {/* Growth Insight */}
          <div
            className={`p-6 rounded-lg border-2 ${
              growthRate >= 10
                ? "bg-green-50 border-green-200"
                : growthRate >= 0
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp
                className={`w-5 h-5 ${
                  growthRate >= 10
                    ? "text-green-600"
                    : growthRate >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              />
              <span className="font-semibold text-gray-900">Growth Trend</span>
            </div>
            <div className="space-y-2">
              <div
                className={`text-2xl font-bold ${
                  growthRate >= 10
                    ? "text-green-700"
                    : growthRate >= 0
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {growthRate >= 0 ? "+" : ""}
                {growthRate}%
              </div>
              <div className="text-sm text-gray-600">
                Second half vs first half
                {growthRate >= 10
                  ? " - Strong growth"
                  : growthRate >= 0
                  ? " - Positive trend"
                  : " - Declining trend"}
              </div>
            </div>
          </div>

          {/* Productivity Insight */}
          <div
            className={`p-6 rounded-lg border-2 ${
              (reportData?.yearlyTotals?.attendance?.presentDays /
                reportData?.yearlyTotals?.attendance?.totalDays) *
                100 >=
              85
                ? "bg-green-50 border-green-200"
                : (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100 >=
                  75
                ? "bg-blue-50 border-blue-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Activity
                className={`w-5 h-5 ${
                  (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100 >=
                  85
                    ? "text-green-600"
                    : (reportData?.yearlyTotals?.attendance?.presentDays /
                        reportData?.yearlyTotals?.attendance?.totalDays) *
                        100 >=
                      75
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              />
              <span className="font-semibold text-gray-900">Productivity</span>
            </div>
            <div className="space-y-2">
              <div
                className={`text-2xl font-bold ${
                  (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100 >=
                  85
                    ? "text-green-700"
                    : (reportData?.yearlyTotals?.attendance?.presentDays /
                        reportData?.yearlyTotals?.attendance?.totalDays) *
                        100 >=
                      75
                    ? "text-blue-700"
                    : "text-red-700"
                }`}
              >
                {Math.round(
                  (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100
                ) || 0}
                %
              </div>
              <div className="text-sm text-gray-600">
                Overall attendance rate
                {(reportData?.yearlyTotals?.attendance?.presentDays /
                  reportData?.yearlyTotals?.attendance?.totalDays) *
                  100 >=
                85
                  ? " - Excellent reliability"
                  : " - Room for improvement"}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Performance Alert */}
      {(netProfit < 0 ||
        growthRate < -10 ||
        (reportData?.yearlyTotals?.attendance?.presentDays /
          reportData?.yearlyTotals?.attendance?.totalDays) *
          100 <
          70) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Performance Alert
            </h3>
          </div>
          <div className="space-y-2 text-red-800">
            {netProfit < 0 && (
              <p>
                • Business is operating at a loss this year. Consider cost
                optimization strategies.
              </p>
            )}
            {growthRate < -10 && (
              <p>
                • Significant decline in performance compared to first half.
                Review business operations.
              </p>
            )}
            {(reportData?.yearlyTotals?.attendance?.presentDays /
              reportData?.yearlyTotals?.attendance?.totalDays) *
              100 <
              70 && (
              <p>
                • Low attendance rate affecting productivity. Implement
                attendance improvement measures.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YearlyReport;
