import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  X,
  MoreVertical,
  Loader2,
  AlertCircle,
  IndianRupee,
  Calendar,
  User,
  Download,
  RefreshCw,
  TrendingUp,
  Banknote,
  CreditCard,
  Clock,
  Save,
  Building,
  Phone,
  MapPin,
  FileText,
  CalendarIcon,
  Activity,
  FilterX,
  Receipt,
  Tag,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { employeeLedgerAPI, employeeAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDate } from "../../../utils/dateUtils";

const EmployeeLedger = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modal states
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Edit form states
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

  // Summary stats
  const [summaryStats, setSummaryStats] = useState({
    totalPaid: 0,
    totalSalary: 0,
    totalAdvances: 0,
    salaryCount: 0,
    advanceCount: 0,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchLedgerEntries();
  }, [employeeFilter, paymentTypeFilter, startDate, endDate]);

  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (employeeFilter !== "all") params.employeeId = employeeFilter;
      if (paymentTypeFilter !== "all") params.paymentType = paymentTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await employeeLedgerAPI.getLedgerEntries(params);
      setLedgerEntries(response.data.data.ledgerEntries);
      setSummaryStats(response.data.data.summary);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch ledger entries:", error);
      setError("Failed to fetch ledger entries");
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getEmployees();
      setEmployees(response.data.data.employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setEmployeeFilter("all");
    setPaymentTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchTerm ||
      employeeFilter !== "all" ||
      paymentTypeFilter !== "all" ||
      startDate ||
      endDate
    );
  };

  const handleEditEntry = async (entry) => {
    try {
      const response = await employeeLedgerAPI.getLedgerEntryById(entry._id);
      const entryDetails = response.data.data;

      setSelectedEntry(entryDetails);
      setEditFormData({
        amount: entryDetails.amount || "",
        description: entryDetails.description || "",
        paymentMode: entryDetails.paymentMode || "Cash",
        date: entryDetails.date
          ? new Date(entryDetails.date).toISOString().split("T")[0]
          : "",
        category: entryDetails.category || "Salary",
        employeeName: entryDetails.employeeName || "",
      });
      setEditErrors({});
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.amount || editFormData.amount <= 0) {
      errors.amount = "Valid amount is required";
    }

    if (!editFormData.employeeName?.trim()) {
      errors.employeeName = "Employee name is required";
    }

    if (!editFormData.date) {
      errors.date = "Date is required";
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      setEditLoading(true);
      await employeeLedgerAPI.updateLedgerEntry(selectedEntry._id, {
        ...editFormData,
        amount: Math.round(editFormData.amount),
      });

      setShowEditModal(false);
      setSelectedEntry(null);
      setEditFormData({});
      setEditErrors({});
      fetchLedgerEntries();
    } catch (error) {
      console.error("Failed to update entry:", error);
      setEditErrors({
        submit: error.response?.data?.message || "Failed to update entry",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      setActionLoading(entryToDelete._id);
      await employeeLedgerAPI.deleteLedgerEntry(entryToDelete._id);
      fetchLedgerEntries();
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirmation = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteModal(true);
  };

  const handleViewDetails = async (entry) => {
    try {
      const response = await employeeLedgerAPI.getLedgerEntryById(entry._id);
      setSelectedEntry(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  const filteredEntries = ledgerEntries.filter((entry) => {
    const matchesSearch =
      entry.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.paymentMode?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent
          header="Employee Ledger"
          subheader="Track employee payments and advances"
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {[...Array(5)].map((_, i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent
        header="Employee Ledger"
        subheader="Track employee payments, salaries, and advances"
        onRefresh={fetchLedgerEntries}
        loading={loading}
      />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Total Paid"
            value={`₹${summaryStats.totalPaid.toLocaleString()}`}
            icon={IndianRupee}
            color="blue"
            change={`${
              summaryStats.salaryCount + summaryStats.advanceCount
            } payments`}
          />
          <StatCard
            title="Salary Payments"
            value={`₹${summaryStats.totalSalary.toLocaleString()}`}
            icon={Banknote}
            color="green"
            change={`${summaryStats.salaryCount} payments`}
          />
          <StatCard
            title="Advance Payments"
            value={`₹${summaryStats.totalAdvances.toLocaleString()}`}
            icon={CreditCard}
            color="orange"
            change={`${summaryStats.advanceCount} advances`}
          />
          <StatCard
            title="Total Entries"
            value={ledgerEntries.length}
            icon={FileText}
            color="purple"
            change={`${filteredEntries.length} filtered`}
          />
          <StatCard
            title="Avg Payment"
            value={`₹${Math.round(
              summaryStats.totalPaid /
                (summaryStats.salaryCount + summaryStats.advanceCount || 1)
            ).toLocaleString()}`}
            icon={TrendingUp}
            color="indigo"
            change="Per transaction"
          />
        </div>

        {/* Enhanced Filters */}
        <SectionCard>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 items-end justify-between">
              <div className="flex flex-wrap flex-col md:flex-row gap-3 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by employee, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      value={employeeFilter}
                      onChange={(e) => setEmployeeFilter(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none min-w-[180px]"
                    >
                      <option value="all">All Employees</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="salary">Salary</option>
                    <option value="advance">Advance</option>
                  </select>

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    placeholder="End date"
                  />
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2 w-full lg:w-auto">
                {hasActiveFilters() && (
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-lg transition-all"
                  >
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Filter Summary */}
            {hasActiveFilters() && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">
                    Showing {filteredEntries.length} of {ledgerEntries.length}{" "}
                    entries
                  </span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                      <Search className="h-3 w-3 mr-1" />"{searchTerm}"
                    </span>
                  )}
                  {employeeFilter !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full">
                      <User className="h-3 w-3 mr-1" />
                      {
                        employees.find((emp) => emp._id === employeeFilter)
                          ?.name
                      }
                    </span>
                  )}
                  {paymentTypeFilter !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
                      <Tag className="h-3 w-3 mr-1" />
                      {paymentTypeFilter}
                    </span>
                  )}
                  {startDate && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                      <Calendar className="h-3 w-3 mr-1" />
                      From: {formatDate(startDate)}
                    </span>
                  )}
                  {endDate && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-800 rounded-full">
                      <Calendar className="h-3 w-3 mr-1" />
                      To: {formatDate(endDate)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Ledger Table */}
        <SectionCard>
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Employee
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900">
                      Payment Mode
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEntries.map((entry) => (
                    <tr
                      key={entry._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(entry.date)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="font-semibold text-gray-900">
                            {entry.employeeName}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.category === "Salary"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {entry.category}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-lg font-semibold text-gray-900">
                          <IndianRupee className="h-4 w-4 mr-1 text-green-600" />
                          {entry.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600 capitalize">
                          {entry.paymentMode}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(entry)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {(user.role === "superadmin" ||
                            user.role === "admin") && (
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}

                          {user.role === "superadmin" && (
                            <button
                              onClick={() => showDeleteConfirmation(entry)}
                              disabled={actionLoading === entry._id}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              {actionLoading === entry._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No ledger entries found
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {hasActiveFilters()
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "Employee payment entries will appear here once payments are made."}
              </p>
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Enhanced Details Modal */}
      {showDetailsModal && selectedEntry && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Payment Details"
          subtitle="Complete payment transaction information"
          headerIcon={<Receipt />}
          headerColor="blue"
          size="lg"
        >
          <div className="space-y-6">
            {/* Payment Overview Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Payment Transaction
                    </h3>
                    <p className="text-sm text-gray-600">
                      Transaction ID: #
                      {selectedEntry._id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-8 w-8 mr-1" />
                    {selectedEntry.amount.toLocaleString()}
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                      selectedEntry.category === "Salary"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {selectedEntry.category} Payment
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Payment Date
                    </label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(selectedEntry.date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedEntry.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Payment Method
                    </label>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedEntry.paymentMode}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Transaction mode
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <label className="text-sm font-medium text-gray-600">
                      Status
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-lg font-semibold text-green-600">
                      Completed
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Payment processed
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {selectedEntry.description && (
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Payment Description
                  </h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {selectedEntry.description}
                  </p>
                </div>
              </div>
            )}

            {/* Employee Information */}
            {selectedEntry.employee && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Employee Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Recipient details and employment information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Full Name
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedEntry.employee.name}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Employee ID
                    </label>
                    <div className="text-lg font-semibold text-gray-900 font-mono">
                      {selectedEntry.employee.employeeId}
                    </div>
                  </div>

                  {selectedEntry.employee.phone && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Phone Number
                      </label>
                      <div className="flex items-center text-lg text-gray-900">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedEntry.employee.phone}
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Employment Type
                    </label>
                    <div className="text-lg font-semibold text-gray-900 capitalize">
                      {selectedEntry.employee.paymentType} Employee
                    </div>
                  </div>

                  {selectedEntry.employee.basicSalary && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Monthly Salary
                      </label>
                      <div className="text-lg font-semibold text-green-600">
                        ₹{selectedEntry.employee.basicSalary.toLocaleString()}
                        /month
                      </div>
                    </div>
                  )}

                  {selectedEntry.employee.hourlyRate && (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Hourly Rate
                      </label>
                      <div className="text-lg font-semibold text-green-600">
                        ₹{selectedEntry.employee.hourlyRate}/hour
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <Receipt className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Payment Summary
                </h3>
              </div>

              <div className="bg-white rounded-lg p-6 border border-green-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Payment Type:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Employee:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedEntry.employeeName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ₹{selectedEntry.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(selectedEntry.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                    <span className="font-semibold text-gray-900">
                      Transaction Status:
                    </span>
                    <span className="font-bold text-green-600 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal - Keep existing edit modal code */}
      {showEditModal && selectedEntry && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Payment Entry"
          subtitle="Update payment information"
          headerIcon={<Edit />}
          headerColor="green"
          size="md"
        >
          {/* Keep your existing edit form code here */}
          <form onSubmit={handleUpdateEntry} className="space-y-6">
            {editErrors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <span className="text-red-700">{editErrors.submit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, amount: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.amount
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Enter amount"
                />
                {editErrors.amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.amount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Name *
                </label>
                <input
                  type="text"
                  value={editFormData.employeeName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      employeeName: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.employeeName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Enter employee name"
                />
                {editErrors.employeeName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.employeeName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Salary">Salary</option>
                  <option value="Advance">Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment Mode
                </label>
                <select
                  value={editFormData.paymentMode}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      paymentMode: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    editErrors.date
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                />
                {editErrors.date && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.date}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter description"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal - Keep existing delete modal code */}
      {showDeleteModal && entryToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Payment Entry"
          subtitle="This action cannot be undone"
          headerIcon={<Trash2 />}
          headerColor="red"
          size="sm"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this payment entry?
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-left">
                <div className="font-semibold text-gray-900 flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {entryToDelete.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {entryToDelete.employeeName} - {entryToDelete.category}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(entryToDelete.date)}
                </div>
              </div>
            </div>
            <p className="text-gray-600">
              This will permanently remove the payment record from the system.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setEntryToDelete(null);
              }}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEntry}
              disabled={actionLoading === entryToDelete._id}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-semibold transition-all"
            >
              {actionLoading === entryToDelete._id ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete Entry
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeLedger;
