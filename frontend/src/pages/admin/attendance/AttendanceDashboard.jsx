import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  UserCheck,
  BarChart3,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { attendanceAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const AttendanceDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Attendance dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Attendance Dashboard"
          subheader="Track employee attendance and working hours"
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const attendanceRate =
    dashboardData?.today?.totalMarked > 0
      ? Math.round(
          (dashboardData.today.presentCount / dashboardData.today.totalMarked) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderComponent
        header="Attendance Dashboard"
        subheader="Monitor employee attendance and track working hours"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/attendance/mark"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Mark Attendance
        </Link>
        <Link
          to="/admin/attendance/report"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          View Reports
        </Link>
        <Link
          to="/admin/attendance/calendar"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Calendar className="w-4 h-4" />
          Calendar View
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Present Today"
          value={`${dashboardData?.today?.presentCount || 0}/${
            dashboardData?.today?.totalMarked || 0
          }`}
          icon={UserCheck}
          color="green"
          change={`${attendanceRate}% attendance rate`}
        />
        <StatCard
          title="Absent Today"
          value={dashboardData?.today?.absentCount || 0}
          icon={XCircle}
          color="red"
          change="Not present"
        />
        <StatCard
          title="Total Hours (Today)"
          value={`${dashboardData?.today?.totalHours || 0}h`}
          icon={Clock}
          color="blue"
          change="Working hours"
        />
        <StatCard
          title="Monthly Attendance"
          value={`${dashboardData?.monthly?.presentCount || 0}/${
            dashboardData?.monthly?.totalMarked || 0
          }`}
          icon={Calendar}
          color="purple"
          change="This month"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Summary */}
        <SectionCard title="Today's Summary" icon={Calendar} headerColor="blue">
          <div className="space-y-4">
            <DataRow
              label="Total Marked"
              value={dashboardData?.today?.totalMarked || 0}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Present"
              value={dashboardData?.today?.presentCount || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Absent"
              value={dashboardData?.today?.absentCount || 0}
              valueColor="text-red-600"
            />
            <DataRow
              label="Attendance Rate"
              value={`${attendanceRate}%`}
              valueColor={
                attendanceRate >= 80 ? "text-green-600" : "text-orange-600"
              }
              bold={true}
              className="pt-2 border-t"
            />
          </div>
        </SectionCard>

        {/* Monthly Overview */}
        <SectionCard
          title="Monthly Overview"
          icon={BarChart3}
          headerColor="purple"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Days"
              value={dashboardData?.monthly?.totalMarked || 0}
              valueColor="text-purple-600"
            />
            <DataRow
              label="Present Days"
              value={dashboardData?.monthly?.presentCount || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Total Hours"
              value={`${dashboardData?.monthly?.totalHours || 0}h`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Average Hours/Day"
              value={`${Math.round(dashboardData?.monthly?.avgHours || 0)}h`}
              valueColor="text-orange-600"
              bold={true}
              className="pt-2 border-t"
            />
          </div>
        </SectionCard>

        {/* Top Performers */}
        <SectionCard
          title="Top Performers (Monthly)"
          icon={TrendingUp}
          headerColor="green"
        >
          <div className="space-y-3">
            {dashboardData?.topEmployees?.slice(0, 5).map((employee, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">
                    {employee.employee.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {employee.employee.employeeId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">
                    {employee.presentDays}/{employee.totalDays}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(
                      (employee.presentDays / employee.totalDays) * 100
                    )}
                    %
                  </p>
                </div>
              </div>
            ))}
            {!dashboardData?.topEmployees?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No attendance data available
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Recent Attendance */}
      <SectionCard
        title="Recent Attendance Records"
        icon={Clock}
        headerColor="gray"
        actions={
          <Link
            to="/admin/attendance/report"
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </Link>
        }
      >
        <div className="space-y-3">
          {dashboardData?.recentAttendance?.map((record, index) => (
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
                  {record.isPresent ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {record.employeeId?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.employeeId?.employeeId} •{" "}
                    {new Date(record.date).toLocaleDateString()}
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
                  {record.hoursWorked > 0
                    ? `${record.hoursWorked}h worked`
                    : "No hours logged"}
                </p>
              </div>
            </div>
          ))}
          {!dashboardData?.recentAttendance?.length && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent attendance records
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default AttendanceDashboard;
