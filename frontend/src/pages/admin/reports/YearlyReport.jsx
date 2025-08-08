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
  PieChart,
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
      monthlyData[i] = { month: i, IN: 0, OUT: 0 };
    }

    // Fill with actual data
    reportData.monthlyTrends.forEach((item) => {
      monthlyData[item._id.month][item._id.type] = item.totalAmount;
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
    if (monthlyTrends.length < 2) return 0;

    const firstQuarter =
      monthlyTrends
        .slice(0, 3)
        .reduce((sum, month) => sum + (month.IN - month.OUT), 0) / 3;
    const lastQuarter =
      monthlyTrends
        .slice(-3)
        .reduce((sum, month) => sum + (month.IN - month.OUT), 0) / 3;

    if (firstQuarter === 0) return 0;
    return Math.round(((lastQuarter - firstQuarter) / firstQuarter) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Yearly Report"
          subheader={`Annual business analysis for ${selectedYear}`}
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

  if (error) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Yearly Report"
          subheader={`Annual business analysis for ${selectedYear}`}
          removeRefresh={true}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchYearlyReport}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const monthlyTrends = processMonthlyTrends();
  const cashFlowTotals = getCashFlowTotals();
  const growthRate = calculateGrowthRate();
  const monthNames = [
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
    <div className="space-y-6">
      <HeaderComponent
        header="Yearly Report"
        subheader={`Annual business analysis for ${selectedYear}`}
        onRefresh={fetchYearlyReport}
        loading={loading}
      />

      {/* Year Navigation & Actions */}
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
              onClick={() => navigateYear(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium text-gray-900 min-w-[100px] text-center">
              {selectedYear}
            </span>

            <button
              onClick={() => navigateYear(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={getCurrentYear}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Current Year
          </button>
          <button
            onClick={() => console.log("Export yearly report")}
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
          value={`₹${cashFlowTotals.IN?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="green"
          change="Annual income"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${
            (
              cashFlowTotals.OUT +
              (reportData?.yearlyTotals?.expenses?.totalAmount || 0)
            )?.toLocaleString() || 0
          }`}
          icon={TrendingDown}
          color="red"
          change="Annual expenses"
        />
        <StatCard
          title="Net Profit/Loss"
          value={`₹${
            (
              cashFlowTotals.IN -
              cashFlowTotals.OUT -
              (reportData?.yearlyTotals?.expenses?.totalAmount || 0)
            )?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color={
            cashFlowTotals.IN >
            cashFlowTotals.OUT +
              (reportData?.yearlyTotals?.expenses?.totalAmount || 0)
              ? "green"
              : "red"
          }
          change="Net position"
        />
        <StatCard
          title="Growth Rate"
          value={`${growthRate >= 0 ? "+" : ""}${growthRate}%`}
          icon={BarChart3}
          color={growthRate >= 0 ? "green" : "red"}
          change="Quarter comparison"
        />
      </div>

      {/* Key Performance Indicators */}
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
          }% attendance`}
        />
        <StatCard
          title="Total Hours Worked"
          value={`${
            reportData?.yearlyTotals?.attendance?.totalHours?.toLocaleString() ||
            0
          }h`}
          icon={Users}
          color="purple"
          change="Employee hours"
        />
        <StatCard
          title="Stock Value"
          value={`₹${
            reportData?.performance?.totalStockValue?.toLocaleString() || 0
          }`}
          icon={Package}
          color="orange"
          change="Current inventory"
        />
        <StatCard
          title="Avg Monthly Profit"
          value={`₹${Math.round(
            (cashFlowTotals.IN -
              cashFlowTotals.OUT -
              (reportData?.yearlyTotals?.expenses?.totalAmount || 0)) /
              12
          ).toLocaleString()}`}
          icon={TrendingUp}
          color="green"
          change="Monthly average"
        />
      </div>

      {/* Monthly Trends Chart */}
      <SectionCard
        title="Monthly Cash Flow Trends"
        icon={BarChart3}
        headerColor="blue"
      >
        <div className="space-y-4">
          {/* Chart Header */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Net Flow</span>
              </div>
            </div>
          </div>

          {/* Chart Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthlyTrends.map((month, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-medium text-gray-900 mb-3 text-center">
                  {monthNames[month.month - 1]}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Income:</span>
                    <span className="font-medium">
                      ₹{month.IN.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Expenses:</span>
                    <span className="font-medium">
                      ₹{month.OUT.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Net:</span>
                    <span
                      className={`font-bold ${
                        month.IN - month.OUT >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      ₹{(month.IN - month.OUT).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Visual indicator */}
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      month.IN - month.OUT >= 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.abs(
                          (month.IN - month.OUT) /
                            Math.max(
                              ...monthlyTrends.map((m) =>
                                Math.abs(m.IN - m.OUT)
                              )
                            )
                        ) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance */}
        <SectionCard
          title="Financial Performance"
          icon={IndianRupee}
          headerColor="green"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-2xl font-bold text-green-600">
                  ₹{cashFlowTotals.IN?.toLocaleString() || 0}
                </h4>
                <p className="text-sm text-green-700">Total Income</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h4 className="text-2xl font-bold text-red-600">
                  ₹
                  {(
                    cashFlowTotals.OUT +
                    (reportData?.yearlyTotals?.expenses?.totalAmount || 0)
                  )?.toLocaleString() || 0}
                </h4>
                <p className="text-sm text-red-700">Total Expenses</p>
              </div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4
                className={`text-3xl font-bold ${
                  cashFlowTotals.IN -
                    cashFlowTotals.OUT -
                    (reportData?.yearlyTotals?.expenses?.totalAmount || 0) >=
                  0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ₹
                {(
                  cashFlowTotals.IN -
                  cashFlowTotals.OUT -
                  (reportData?.yearlyTotals?.expenses?.totalAmount || 0)
                )?.toLocaleString() || 0}
              </h4>
              <p className="text-sm text-blue-700">Net Profit/Loss</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(
                  ((cashFlowTotals.IN -
                    cashFlowTotals.OUT -
                    (reportData?.yearlyTotals?.expenses?.totalAmount || 0)) /
                    cashFlowTotals.IN) *
                    100
                ) || 0}
                % margin
              </p>
            </div>

            <div className="space-y-3">
              <DataRow
                label="Revenue Growth Rate"
                value={`${growthRate >= 0 ? "+" : ""}${growthRate}%`}
                valueColor={growthRate >= 0 ? "text-green-600" : "text-red-600"}
              />
              <DataRow
                label="Average Monthly Revenue"
                value={`₹${Math.round(
                  cashFlowTotals.IN / 12
                ).toLocaleString()}`}
                valueColor="text-blue-600"
              />
              <DataRow
                label="Average Monthly Expenses"
                value={`₹${Math.round(
                  (cashFlowTotals.OUT +
                    (reportData?.yearlyTotals?.expenses?.totalAmount || 0)) /
                    12
                ).toLocaleString()}`}
                valueColor="text-orange-600"
              />
            </div>
          </div>
        </SectionCard>

        {/* Operational Performance */}
        <SectionCard
          title="Operational Performance"
          icon={Users}
          headerColor="blue"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Working Days"
              value={reportData?.yearlyTotals?.attendance?.totalDays || 0}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Present Days"
              value={reportData?.yearlyTotals?.attendance?.presentDays || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Overall Attendance Rate"
              value={`${
                Math.round(
                  (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100
                ) || 0
              }%`}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Total Hours Worked"
              value={`${
                reportData?.yearlyTotals?.attendance?.totalHours?.toLocaleString() ||
                0
              }h`}
              valueColor="text-orange-600"
            />
            <DataRow
              label="Average Hours/Day"
              value={`${Math.round(
                (reportData?.yearlyTotals?.attendance?.totalHours || 0) /
                  (reportData?.yearlyTotals?.attendance?.presentDays || 1)
              )}h`}
              valueColor="text-gray-600"
            />
            <DataRow
              label="Total Products"
              value={reportData?.performance?.totalProducts || 0}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Current Stock Value"
              value={`₹${
                reportData?.performance?.totalStockValue?.toLocaleString() || 0
              }`}
              valueColor="text-green-600"
            />
            <DataRow
              label="Avg Stock Value/Product"
              value={`₹${Math.round(
                (reportData?.performance?.totalStockValue || 0) /
                  (reportData?.performance?.totalProducts || 1)
              ).toLocaleString()}`}
              valueColor="text-blue-600"
            />
          </div>
        </SectionCard>
      </div>

      {/* Quarterly Analysis */}
      <SectionCard
        title="Quarterly Performance Analysis"
        icon={PieChart}
        headerColor="purple"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Q1", months: [0, 1, 2] },
            { name: "Q2", months: [3, 4, 5] },
            { name: "Q3", months: [6, 7, 8] },
            { name: "Q4", months: [9, 10, 11] },
          ].map((quarter, index) => {
            const quarterData = quarter.months.reduce(
              (acc, monthIndex) => {
                const month = monthlyTrends[monthIndex];
                if (month) {
                  acc.income += month.IN;
                  acc.expenses += month.OUT;
                }
                return acc;
              },
              { income: 0, expenses: 0 }
            );

            const quarterNet = quarterData.income - quarterData.expenses;

            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 text-center">
                  {quarter.name}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Income:</span>
                    <span className="font-medium">
                      ₹{quarterData.income.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Expenses:</span>
                    <span className="font-medium">
                      ₹{quarterData.expenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net:</span>
                    <span
                      className={`font-bold ${
                        quarterNet >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{quarterNet.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Year-over-Year Comparison */}
      <SectionCard
        title="Key Business Insights"
        icon={TrendingUp}
        headerColor="orange"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Financial Insights</h4>
            <div className="space-y-2 text-sm">
              <p className="p-3 bg-blue-50 rounded-lg">
                <strong>Profit Margin:</strong>{" "}
                {Math.round(
                  ((cashFlowTotals.IN -
                    cashFlowTotals.OUT -
                    (reportData?.yearlyTotals?.expenses?.totalAmount || 0)) /
                    cashFlowTotals.IN) *
                    100
                ) || 0}
                %
                {((cashFlowTotals.IN -
                  cashFlowTotals.OUT -
                  (reportData?.yearlyTotals?.expenses?.totalAmount || 0)) /
                  cashFlowTotals.IN) *
                  100 >
                10
                  ? " - Healthy margin"
                  : " - Consider cost optimization"}
              </p>
              <p className="p-3 bg-green-50 rounded-lg">
                <strong>Best Performing Quarter:</strong>{" "}
                {
                  ["Q1", "Q2", "Q3", "Q4"][
                    [
                      [0, 1, 2],
                      [3, 4, 5],
                      [6, 7, 8],
                      [9, 10, 11],
                    ]
                      .map((months) =>
                        months.reduce(
                          (sum, i) =>
                            sum +
                            (monthlyTrends[i]?.IN - monthlyTrends[i]?.OUT || 0),
                          0
                        )
                      )
                      .indexOf(
                        Math.max(
                          ...[
                            [0, 1, 2],
                            [3, 4, 5],
                            [6, 7, 8],
                            [9, 10, 11],
                          ].map((months) =>
                            months.reduce(
                              (sum, i) =>
                                sum +
                                (monthlyTrends[i]?.IN - monthlyTrends[i]?.OUT ||
                                  0),
                              0
                            )
                          )
                        )
                      )
                  ]
                }
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">
              Operational Insights
            </h4>
            <div className="space-y-2 text-sm">
              <p className="p-3 bg-purple-50 rounded-lg">
                <strong>Attendance Rate:</strong>{" "}
                {Math.round(
                  (reportData?.yearlyTotals?.attendance?.presentDays /
                    reportData?.yearlyTotals?.attendance?.totalDays) *
                    100
                ) || 0}
                %
                {(reportData?.yearlyTotals?.attendance?.presentDays /
                  reportData?.yearlyTotals?.attendance?.totalDays) *
                  100 >
                85
                  ? " - Excellent attendance"
                  : " - Room for improvement"}
              </p>
              <p className="p-3 bg-orange-50 rounded-lg">
                <strong>Productivity:</strong> ₹
                {Math.round(
                  (cashFlowTotals.IN || 0) /
                    (reportData?.yearlyTotals?.attendance?.totalHours || 1)
                ).toLocaleString()}{" "}
                per hour worked
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default YearlyReport;
