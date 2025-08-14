import React, { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Trash2,
  Calendar,
  Filter,
  RefreshCw,
  User,
  Building,
  CheckSquare,
  Square,
  Trash,
  Calendar as CalendarIcon,
  Eye,
  Clock,
  Package,
  FileText,
  DollarSign,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { notificationAPI, userAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import RecordDetailsModal from "../../../components/ui/RecordDetailsModal";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);

  // Filter data
  const [availableCreators, setAvailableCreators] = useState([]);
  const [availableCompanies, setAvailableCompanies] = useState([]);

  // Filter states - default to today's date
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0], // Today's date
    createdBy: "",
    creatorRole: "",
    recordType: "",
    companyId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Available filter options
  const recordTypes = [
    "Employee",
    "Client",
    "CashFlow",
    "Stock",
    "CashFlow",
    "Expense",
    "Attendance",
    "ClientLedger",
  ];
  const roles =
    user?.role === "superadmin" ? ["admin", "subadmin"] : ["subadmin"];

  // Check if user has access
  if (!user || !["superadmin", "admin"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view notifications.
          </p>
        </div>
      </div>
    );
  }

  // Fetch filter data
  const fetchFilterData = useCallback(async () => {
    try {
      const [creatorsResponse, companiesResponse] = await Promise.all([
        notificationAPI.getNotificationCreators(),
        userAPI.getMyAssignedCompanies(),
      ]);

      if (creatorsResponse?.data?.success) {
        setAvailableCreators(creatorsResponse.data.data);
      }

      if (companiesResponse?.data?.success) {
        setAvailableCompanies(companiesResponse.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
    }
  }, [user.role]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params (excluding empty values)
      const queryParams = Object.entries(filters)
        .filter(([key, value]) => value !== "")
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      const response = await notificationAPI.getNotifications(queryParams);

      if (response?.data?.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle record details view
  const handleViewRecord = async (notification) => {
    try {
      setRecordLoading(true);
      setShowRecordModal(true);

      const response = await notificationAPI.getNotificationRecordDetails(
        notification.recordType,
        notification.newRecordId
      );

      if (response?.data?.success) {
        setSelectedRecord(response.data.data);
      } else {
        alert("Failed to fetch record details");
        setShowRecordModal(false);
      }
    } catch (error) {
      console.error("Failed to fetch record details:", error);
      alert("Failed to fetch record details");
      setShowRecordModal(false);
    } finally {
      setRecordLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      date: new Date().toISOString().split("T")[0], // Reset to today
      createdBy: "",
      creatorRole: "",
      recordType: "",
      companyId: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setShowFilters(false);
  }, []);

  // Handle individual notification selection
  const handleNotificationSelect = (notificationId, checked) => {
    if (checked) {
      setSelectedNotifications((prev) => [...prev, notificationId]);
    } else {
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
      setSelectAll(false);
    }
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNotifications(notifications.map((n) => n._id));
    } else {
      setSelectedNotifications([]);
    }
  };

  // Delete single notification (superadmin only)
  const handleDeleteNotification = async (notificationId) => {
    if (user.role !== "superadmin") return;

    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      setDeleting(true);
      const response = await notificationAPI.deleteNotification(notificationId);

      if (response?.data?.success) {
        await fetchNotifications();
        setSelectedNotifications((prev) =>
          prev.filter((id) => id !== notificationId)
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete selected notifications (superadmin only)
  const handleBulkDelete = async () => {
    if (user.role !== "superadmin" || selectedNotifications.length === 0)
      return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedNotifications.length} selected notifications?`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await notificationAPI.bulkDeleteNotifications({
        notificationIds: selectedNotifications,
      });

      if (response?.data?.success) {
        await fetchNotifications();
        setSelectedNotifications([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error("Failed to bulk delete notifications:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Delete old notifications (superadmin only)
  const handleDeleteOld = async (daysOld = 2) => {
    if (user.role !== "superadmin") return;

    if (
      !window.confirm(
        `Are you sure you want to delete all notifications older than ${daysOld} days?`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await notificationAPI.deleteOldNotifications({
        daysOld,
      });

      if (response?.data?.success) {
        alert(
          `${response.data.deletedCount} old notifications deleted successfully`
        );
        await fetchNotifications();
        setSelectedNotifications([]);
        setSelectAll(false);
      }
    } catch (error) {
      console.error("Failed to delete old notifications:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Format date with proper display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "subadmin":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get record type icon
  const getRecordTypeIcon = (recordType) => {
    switch (recordType) {
      case "Employee":
        return <User className="w-4 h-4" />;
      case "Client":
        return <Building className="w-4 h-4" />;
      case "Stock":
        return <Package className="w-4 h-4" />;
      case "CashFlow":
        return <DollarSign className="w-4 h-4" />;
      case "Expense":
        return <FileText className="w-4 h-4" />;
      case "Attendance":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get record type color
  const getRecordTypeColor = (recordType) => {
    switch (recordType) {
      case "Employee":
        return "bg-blue-100 text-blue-800";
      case "Client":
        return "bg-green-100 text-green-800";
      case "Stock":
        return "bg-purple-100 text-purple-800";
      case "CashFlow":
        return "bg-orange-100 text-orange-800";
      case "Expense":
        return "bg-red-100 text-red-800";
      case "Attendance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const calculations = {
    totalNotifications: notifications.length,
    recordTypes: Object.keys(
      notifications.reduce((acc, n) => {
        acc[n.recordType] = true;
        return acc;
      }, {})
    ).length,
    todayNotifications: notifications.filter(
      (n) => new Date(n.createdAt).toDateString() === new Date().toDateString()
    ).length,
    selectedCount: selectedNotifications.length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent header="Notifications" subheader="Loading..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <HeaderComponent
          header="Notifications"
          subheader="View and manage system notifications"
          onRefresh={fetchNotifications}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Bell className="w-4 h-4" />
            <span>System</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Notifications</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-primary btn-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            {user.role === "superadmin" && (
              <>
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="btn-danger btn-sm"
                  >
                    <Trash className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Delete Selected ({selectedNotifications.length})
                    </span>
                    <span className="sm:hidden">
                      Delete ({selectedNotifications.length})
                    </span>
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOld(2)}
                  disabled={deleting}
                  className="btn-secondary btn-sm"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete 2+ Days Old</span>
                  <span className="sm:hidden">2+ Days</span>
                </button>
                <button
                  onClick={() => handleDeleteOld(7)}
                  disabled={deleting}
                  className="btn-purple btn-sm"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete 7+ Days Old</span>
                  <span className="sm:hidden">7+ Days</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Notifications"
            value={calculations.totalNotifications}
            icon={Bell}
            color="blue"
            subtitle="All notifications"
          />
          <StatCard
            title="Record Types"
            value={calculations.recordTypes}
            icon={FileText}
            color="green"
            subtitle="Different record types"
          />
          <StatCard
            title="Today's Notifications"
            value={calculations.todayNotifications}
            icon={Calendar}
            color="orange"
            subtitle="Received today"
          />
          <StatCard
            title="Selected"
            value={calculations.selectedCount}
            icon={CheckSquare}
            color="purple"
            subtitle="Currently selected"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="input-primary"
                />
              </div>

              {user.role === "superadmin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Creator Role
                  </label>
                  <select
                    name="creatorRole"
                    value={filters.creatorRole}
                    onChange={handleFilterChange}
                    className="input-primary"
                  >
                    <option value="">All Roles</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Creator
                </label>
                <select
                  name="createdBy"
                  value={filters.createdBy}
                  onChange={handleFilterChange}
                  className="input-primary"
                >
                  <option value="">All Creators</option>
                  {availableCreators.map((creator) => (
                    <option key={creator._id} value={creator._id}>
                      {creator.name} ({creator.role})
                    </option>
                  ))}
                </select>
              </div>

              {availableCompanies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    name="companyId"
                    value={filters.companyId}
                    onChange={handleFilterChange}
                    className="input-primary"
                  >
                    <option value="">All Companies</option>
                    {availableCompanies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type
                </label>
                <select
                  name="recordType"
                  value={filters.recordType}
                  onChange={handleFilterChange}
                  className="input-primary"
                >
                  <option value="">All Types</option>
                  {recordTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="input-primary"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="message">Message</option>
                  <option value="creatorRole">Creator Role</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="input-primary"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
              <button onClick={clearFilters} className="btn-secondary btn-sm">
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                Showing {notifications.length} notifications
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Notification Records
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filters.recordType
                      ? `${filters.recordType} notifications`
                      : "System notifications and alerts"}
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                {notifications.length} total notifications
              </div>
            </div>
          </div>

          <div className="p-0">
            {notifications.length > 0 ? (
              <>
                {/* Select All Header - Only for superadmin */}
                {user.role === "superadmin" && (
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        {selectAll ? (
                          <CheckSquare
                            className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => handleSelectAll(false)}
                          />
                        ) : (
                          <Square
                            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleSelectAll(true)}
                          />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        Select All Notifications ({notifications.length})
                      </span>
                    </label>
                  </div>
                )}

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {user.role === "superadmin" && (
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                            Select
                          </th>
                        )}
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                          Message
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                          Creator
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                          Record Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                          Company
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">
                          Date
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-900 text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {notifications.map((notification) => (
                        <tr
                          key={notification._id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            selectedNotifications.includes(notification._id)
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          {user.role === "superadmin" && (
                            <td className="py-3 px-4">
                              {selectedNotifications.includes(
                                notification._id
                              ) ? (
                                <CheckSquare
                                  className="w-5 h-5 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                                  onClick={() =>
                                    handleNotificationSelect(
                                      notification._id,
                                      false
                                    )
                                  }
                                />
                              ) : (
                                <Square
                                  className="w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() =>
                                    handleNotificationSelect(
                                      notification._id,
                                      true
                                    )
                                  }
                                />
                              )}
                            </td>
                          )}
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 text-sm">
                              {notification.message}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-gray-900 text-sm font-medium">
                                {notification.createdBy?.name || "Unknown"}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium inline-block w-fit ${getRoleBadgeColor(
                                  notification.creatorRole
                                )}`}
                              >
                                {notification.creatorRole}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getRecordTypeColor(
                                notification.recordType
                              )}`}
                            >
                              {getRecordTypeIcon(notification.recordType)}
                              {notification.recordType}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 text-sm">
                              {notification.companyId?.name || "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600 text-sm">
                              {formatDate(notification.createdAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewRecord(notification)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View record details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user.role === "superadmin" && (
                                <button
                                  onClick={() =>
                                    handleDeleteNotification(notification._id)
                                  }
                                  disabled={deleting}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4 p-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm transition-all ${
                        selectedNotifications.includes(notification._id)
                          ? "border-blue-300 bg-blue-50"
                          : ""
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            {user.role === "superadmin" && (
                              <>
                                {selectedNotifications.includes(
                                  notification._id
                                ) ? (
                                  <CheckSquare
                                    className="w-5 h-5 text-blue-600 cursor-pointer mt-1"
                                    onClick={() =>
                                      handleNotificationSelect(
                                        notification._id,
                                        false
                                      )
                                    }
                                  />
                                ) : (
                                  <Square
                                    className="w-5 h-5 text-gray-400 cursor-pointer mt-1 hover:text-blue-600 transition-colors"
                                    onClick={() =>
                                      handleNotificationSelect(
                                        notification._id,
                                        true
                                      )
                                    }
                                  />
                                )}
                              </>
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-500">
                                Message
                              </span>
                              <div className="mt-1">
                                <span className="font-medium text-gray-900">
                                  {notification.message}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Creator
                            </span>
                            <div className="mt-1">
                              <span className="text-gray-700 text-sm">
                                {notification.createdBy?.name || "Unknown"}
                              </span>
                              <div className="mt-1">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                    notification.creatorRole
                                  )}`}
                                >
                                  {notification.creatorRole}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Record Type
                            </span>
                            <div className="mt-1">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getRecordTypeColor(
                                  notification.recordType
                                )}`}
                              >
                                {getRecordTypeIcon(notification.recordType)}
                                {notification.recordType}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Date
                            </span>
                            <div className="mt-1">
                              <span className="text-gray-700 text-sm">
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleViewRecord(notification)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View record details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.role === "superadmin" && (
                            <button
                              onClick={() =>
                                handleDeleteNotification(notification._id)
                              }
                              disabled={deleting}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No Notifications Found
                </h4>
                <p className="text-gray-500">
                  {Object.values(filters).some((v) => v !== "")
                    ? "No notifications match your current filters."
                    : "There are no notifications to display at the moment."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <RecordDetailsModal
        isOpen={showRecordModal}
        onClose={() => {
          setShowRecordModal(false);
          setSelectedRecord(null);
        }}
        recordData={selectedRecord}
        loading={recordLoading}
      />
    </>
  );
};

export default Notifications;
