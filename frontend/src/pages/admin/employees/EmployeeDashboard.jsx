import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  IndianRupee,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Eye,
  BarChart3,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import SectionCard from "../../../components/cards/SectionCard";
import DataRow from "../../../components/cards/DataRow";

const EmployeeDashboard = () => {
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
      const response = await employeeAPI.getDashboardStats();
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
      console.error("Employee dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Employee Management"
          subheader="Manage workforce and employee data"
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
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
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

  const attendancePercentage =
    dashboardData?.attendance?.totalAttendance > 0
      ? Math.round(
          (dashboardData.attendance.presentCount /
            dashboardData.attendance.totalAttendance) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <HeaderComponent
        header="Employee Management"
        subheader="Manage workforce, attendance, and employee data"
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/employees/add"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Link>
        <Link
          to="/admin/employees/list"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Users className="w-4 h-4" />
          Employee List
        </Link>
        <Link
          to="/admin/employees/salary"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <IndianRupee className="w-4 h-4" />
          Salary Management
        </Link>
        <button
          onClick={() => navigate("/admin/attendance/dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Calendar className="w-4 h-4" />
          Attendance
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={dashboardData?.employees?.totalEmployees || 0}
          icon={Users}
          color="blue"
          change={`${dashboardData?.employees?.activeEmployees || 0} active`}
        />
        <StatCard
          title="Present Today"
          value={`${dashboardData?.attendance?.presentCount || 0}/${
            dashboardData?.attendance?.totalAttendance || 0
          }`}
          icon={UserCheck}
          color="green"
          change={`${attendancePercentage}% attendance`}
        />
        <StatCard
          title="Monthly Salary Paid"
          value={`₹${
            dashboardData?.salary?.totalSalaryPaid?.toLocaleString() || 0
          }`}
          icon={IndianRupee}
          color="purple"
          change={`${dashboardData?.salary?.paymentCount || 0} payments`}
        />
        <StatCard
          title="Total Hours (Today)"
          value={`${dashboardData?.attendance?.totalHours || 0}h`}
          icon={Clock}
          color="orange"
          change={`${dashboardData?.attendance?.overtimeHours || 0}h overtime`}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Types Breakdown */}
        <SectionCard
          title="Payment Type Breakdown"
          icon={BarChart3}
          headerColor="blue"
        >
          <div className="space-y-4">
            {dashboardData?.paymentTypes?.map((type, index) => (
              <DataRow
                key={index}
                label={`${
                  type._id === "fixed" ? "Fixed Salary" : "Hourly Rate"
                }`}
                value={`${type.count} employees`}
                valueColor={
                  type._id === "fixed" ? "text-blue-600" : "text-green-600"
                }
              />
            ))}
            {!dashboardData?.paymentTypes?.length && (
              <p className="text-gray-500 text-sm text-center py-4">
                No employee data available
              </p>
            )}
          </div>
        </SectionCard>

        {/* Today's Attendance Summary */}
        <SectionCard
          title="Today's Attendance"
          icon={Calendar}
          headerColor="green"
        >
          <div className="space-y-4">
            <DataRow
              label="Total Employees Marked"
              value={dashboardData?.attendance?.totalAttendance || 0}
            />
            <DataRow
              label="Present"
              value={dashboardData?.attendance?.presentCount || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Absent"
              value={
                (dashboardData?.attendance?.totalAttendance || 0) -
                (dashboardData?.attendance?.presentCount || 0)
              }
              valueColor="text-red-600"
            />
            <DataRow
              label="Attendance Rate"
              value={`${attendancePercentage}%`}
              valueColor={
                attendancePercentage >= 80
                  ? "text-green-600"
                  : "text-orange-600"
              }
              bold={true}
              className="pt-2 border-t"
            />
          </div>
        </SectionCard>

        {/* Quick Stats */}
        <SectionCard
          title="Quick Statistics"
          icon={TrendingUp}
          headerColor="purple"
        >
          <div className="space-y-4">
            <DataRow
              label="Active Employees"
              value={dashboardData?.employees?.activeEmployees || 0}
              valueColor="text-green-600"
            />
            <DataRow
              label="Inactive Employees"
              value={dashboardData?.employees?.inactiveEmployees || 0}
              valueColor="text-red-600"
            />
            <DataRow
              label="Total Work Hours (Today)"
              value={`${dashboardData?.attendance?.totalHours || 0} hours`}
              valueColor="text-blue-600"
            />
            <DataRow
              label="Overtime Hours (Today)"
              value={`${dashboardData?.attendance?.overtimeHours || 0} hours`}
              valueColor="text-orange-600"
            />
          </div>
        </SectionCard>
      </div>

      {/* Recent Employees */}
      <SectionCard
        title="Recently Added Employees"
        icon={Users}
        headerColor="gray"
        actions={
          <Link
            to="/admin/employees/list"
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View All
          </Link>
        }
      >
        <div className="space-y-3">
          {dashboardData?.recentEmployees?.map((employee, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    employee.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {employee.isActive ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">
                    {employee.employeeId} • {employee.paymentType} pay
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {employee.paymentType === "fixed"
                    ? `₹${employee.basicSalary?.toLocaleString()}/month`
                    : `₹${employee.hourlyRate}/hour`}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {!dashboardData?.recentEmployees?.length && (
            <p className="text-gray-500 text-sm text-center py-4">
              No recent employees
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default EmployeeDashboard;
