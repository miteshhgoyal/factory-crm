import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  AlertCircle,
  Eye,
  Search,
  UserCheck,
  Phone,
  Edit,
  Trash2,
  X,
  Loader2,
  IndianRupee,
  Save,
  FilterX,
  Receipt,
  Tag,
  Info,
  Package,
  FileText,
  Activity,
  ShoppingCart,
  ShoppingBag,
  MapPin,
  CreditCard,
  Hash,
  Weight,
  Calculator,
  Download,
  FileSpreadsheet,
  SortAsc,
  SortDesc,
  Filter,
  Clock,
  CalendarDays,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { clientAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";
import { useAuth } from "../../../contexts/AuthContext";
import { formatDate } from "../../../utils/dateUtils";
import { generateClientLedgerPDF } from "../../../services/clientLedgerPdfGenerator";
import * as XLSX from "xlsx";

// Enhanced Date Filter Component (keeping the same as original)
const DateFilterSection = ({
  filters,
  onFilterChange,
  onQuickFilter,
  hasActiveFilters,
  clearFilters,
}) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  const quickFilters = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "This Week", value: "thisWeek" },
    { label: "Last Week", value: "lastWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "This Year", value: "thisYear" },
    { label: "Last Year", value: "lastYear" },
  ];

  const getQuickFilterDates = (filterType) => {
    const today = new Date();
    const startOfDay = (date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = (date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    switch (filterType) {
      case "today":
        return { startDate: startOfDay(today), endDate: endOfDay(today) };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: startOfDay(yesterday),
          endDate: endOfDay(yesterday),
        };
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { startDate: startOfDay(startOfWeek), endDate: endOfDay(today) };
      case "lastWeek":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          startDate: startOfDay(lastWeekStart),
          endDate: endOfDay(lastWeekEnd),
        };
      case "thisMonth":
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: endOfDay(today),
        };
      case "lastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: lastMonth, endDate: endOfDay(lastMonthEnd) };
      case "thisYear":
        return {
          startDate: new Date(today.getFullYear(), 0, 1),
          endDate: endOfDay(today),
        };
      case "lastYear":
        return {
          startDate: new Date(today.getFullYear() - 1, 0, 1),
          endDate: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59),
        };
      default:
        return { startDate: null, endDate: null };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Date & Transaction Filters
            </h2>
            <p className="text-sm text-gray-600">
              Filter transactions by date, type, amount and more
            </p>
          </div>
        </div>

        {/* Quick Date Filters */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Date Filters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {quickFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  const dates = getQuickFilterDates(filter.value);
                  if (dates.startDate && dates.endDate) {
                    onQuickFilter(dates);
                  }
                }}
                className="px-4 py-2.5 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all duration-200"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Custom Date Range
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => onFilterChange("startDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => onFilterChange("endDate", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Month & Year
              </label>
              <input
                type="month"
                value={filters.monthYear || ""}
                onChange={(e) => onFilterChange("monthYear", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Year Only
              </label>
              <select
                value={filters.year || ""}
                onChange={(e) => onFilterChange("year", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Filters */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Transaction Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Transaction Type
              </label>
              <select
                value={filters.transactionType || "all"}
                onChange={(e) =>
                  onFilterChange("transactionType", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">All Transactions</option>
                <option value="stock">Stock Transactions Only</option>
                <option value="cash">Cash Flow Only</option>
                <option value="IN">Purchase/Cash In</option>
                <option value="OUT">Sale/Cash Out</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={filters.minAmount || ""}
                  onChange={(e) => onFilterChange("minAmount", e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={filters.maxAmount || ""}
                  onChange={(e) => onFilterChange("maxAmount", e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            Search Transactions
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by particulars, product name, invoice number..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-base"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                {hasActiveFilters ? (
                  <span className="text-blue-600 font-medium">
                    Active filters applied
                  </span>
                ) : (
                  "No filters active - showing all transactions"
                )}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-medium transition-colors duration-200"
              >
                <FilterX className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Client Selector Component with Tabular View
const ClientSelector = ({
  clients,
  selectedClient,
  onClientSelect,
  searchTerm,
  onSearchChange,
  onBack,
  onToggleAutoSend,
  loading = false,
}) => {
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const sortedAndFilteredClients = filteredClients
    .filter((client) => {
      if (balanceFilter === "positive") return client.currentBalance > 0;
      if (balanceFilter === "negative") return client.currentBalance < 0;
      if (balanceFilter === "zero") return client.currentBalance === 0;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "balance") {
        comparison = a.currentBalance - b.currentBalance;
      } else if (sortBy === "type") {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination logic
  const totalItems = sortedAndFilteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = sortedAndFilteredClients.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleToggleAutoSend = async (client) => {
    setActionLoading(client._id);
    try {
      await onToggleAutoSend(client._id, !client.autoSendLedger);
    } finally {
      setActionLoading(null);
    }
  };

  const Pagination = () => (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
          clients
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        {/* Page Header */}
        <div className="mb-8">
          <HeaderComponent
            header="Client Ledger"
            subheader="Select a client to view their account statement and transaction history"
            removeRefresh={true}
          />
        </div>

        {/* Client Selection Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Select Client
                </h2>
                <p className="text-gray-600">
                  Choose a client to view their complete ledger
                </p>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search clients by name or phone..."
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Balance Filter */}
                <select
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                >
                  <option value="all">All Balances</option>
                  <option value="positive">Positive Balance</option>
                  <option value="negative">Negative Balance</option>
                  <option value="zero">Zero Balance</option>
                </select>

                {/* Sort Controls */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="balance">Sort by Balance</option>
                    <option value="type">Sort by Type</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {sortOrder === "asc" ? (
                      <SortAsc className="w-5 h-5 text-gray-600" />
                    ) : (
                      <SortDesc className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Filter Summary */}
              {(searchTerm || balanceFilter !== "all") && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Showing {sortedAndFilteredClients.length} of{" "}
                      {clients.length} clients
                    </span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        <Search className="h-3 w-3 mr-1" />"{searchTerm}"
                      </span>
                    )}
                    {balanceFilter !== "all" && (
                      <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                        <Tag className="h-3 w-3 mr-1" />
                        {balanceFilter.charAt(0).toUpperCase() +
                          balanceFilter.slice(1)}{" "}
                        Balance
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Client Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading clients...</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Client Details
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Type
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Current Balance
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          WhatsApp Status
                        </th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-900">
                          Auto-Send
                        </th>
                        <th className="text-right py-4 px-6 font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedClients.map((client) => (
                        <tr
                          key={client._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Client Details */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  client.type === "Customer"
                                    ? "bg-blue-100"
                                    : "bg-green-100"
                                }`}
                              >
                                {client.type === "Customer" ? (
                                  <UserCheck className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Users className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {client.name}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {client.phone}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                client.type === "Customer"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {client.type}
                            </span>
                          </td>

                          {/* Current Balance */}
                          <td className="py-4 px-6">
                            <div
                              className={`font-bold ${
                                client.currentBalance >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {client.currentBalance < 0 && "-"}₹
                              {Math.abs(
                                client.currentBalance || 0
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {client.currentBalance >= 0
                                ? "Receivable"
                                : "Payable"}
                            </div>
                          </td>

                          {/* WhatsApp Status */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {client.whatsappVerified ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  client.whatsappVerified
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {client.whatsappVerified
                                  ? "Verified"
                                  : "Not Verified"}
                              </span>
                            </div>
                            {client.lastLedgerSent && (
                              <div className="text-xs text-gray-500 mt-1">
                                Last: {formatDate(client.lastLedgerSent)}
                              </div>
                            )}
                          </td>

                          {/* Auto-Send Toggle */}
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleToggleAutoSend(client)}
                              disabled={actionLoading === client._id}
                              className="flex items-center gap-2"
                            >
                              {actionLoading === client._id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                              ) : client.autoSendLedger ? (
                                <ToggleRight className="w-6 h-6 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-400" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  client.autoSendLedger
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {client.autoSendLedger ? "Enabled" : "Disabled"}
                              </span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onClientSelect(client._id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                              >
                                View Ledger
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && <Pagination />}

                {/* Empty State */}
                {paginatedClients.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No clients found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || balanceFilter !== "all"
                        ? "Try adjusting your search filters to find what you're looking for."
                        : "No clients available."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Pagination Component for Ledger Table
const LedgerPagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page) => {
    onPageChange(Math.max(1, Math.min(page, totalPages)));
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Showing {startItem} to {endItem} of {totalItems} transactions
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Ledger Table Component (keeping the same structure but adding pagination support)
const LedgerTable = ({
  entries,
  user,
  onViewDetails,
  onEditEntry,
  onDeleteEntry,
  actionLoading,
  pagination,
  onPageChange,
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <BarChart3 className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No ledger entries found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          No transactions recorded for this client yet. Start by adding stock or
          cash transactions.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Date & Type
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Details
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Quantity
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Rate
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Debit
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Credit
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">
                Balance
              </th>
              <th className="text-right py-4 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, index) => (
              <tr
                key={`${entry._id}-${index}`}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Date & Type Column */}
                <td className="py-4 px-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(entry.date)}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.transactionCategory === "stock"
                          ? entry.transactionType === "IN"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                          : entry.transactionType === "IN"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {entry.transactionCategory === "stock" ? (
                        <Package className="w-3 h-3" />
                      ) : (
                        <CreditCard className="w-3 h-3" />
                      )}
                      {entry.transactionType === "IN"
                        ? entry.transactionCategory === "stock"
                          ? "Purchase"
                          : "Cash In"
                        : entry.transactionCategory === "stock"
                        ? "Sale"
                        : "Paid"}
                    </span>
                  </div>
                </td>

                {/* Details Column */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {entry.particulars}
                    </div>
                    {entry.invoiceNo && (
                      <div className="text-sm text-gray-500">
                        Invoice: {entry.invoiceNo}
                      </div>
                    )}
                    {entry.transactionCategory === "cash" && entry.category && (
                      <div className="text-sm text-gray-500">
                        Category: {entry.category}
                      </div>
                    )}
                  </div>
                </td>

                {/* Quantity Column */}
                <td className="py-4 px-4">
                  {entry.transactionCategory === "stock" ? (
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {entry.weight || "-"} kg
                      </div>
                      {entry.bags && (
                        <div className="text-sm text-gray-500">
                          {entry.bags} bags
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>

                {/* Rate Column */}
                <td className="py-4 px-4">
                  <span className="text-gray-900 font-medium">
                    {entry.transactionCategory === "stock"
                      ? entry.rate
                        ? `₹${entry.rate}`
                        : "-"
                      : "N/A"}
                  </span>
                </td>

                {/* Debit Column */}
                <td className="py-4 px-4">
                  <span className="text-red-600 font-semibold">
                    {entry.debitAmount
                      ? `₹${entry.debitAmount.toLocaleString()}`
                      : "-"}
                  </span>
                </td>

                {/* Credit Column */}
                <td className="py-4 px-4">
                  <span className="text-green-600 font-semibold">
                    {entry.creditAmount
                      ? `₹${entry.creditAmount.toLocaleString()}`
                      : "-"}
                  </span>
                </td>

                {/* Balance Column */}
                <td className="py-4 px-4">
                  <span
                    className={`font-bold ${
                      entry.balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {entry.balance < 0 && "-"}₹
                    {Math.abs(entry.balance).toLocaleString()}
                  </span>
                </td>

                {/* Actions Column */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(entry)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {user.role === "superadmin" && (
                      <>
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Edit Transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry)}
                          disabled={actionLoading === entry._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Transaction"
                        >
                          {actionLoading === entry._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination for Ledger */}
      {pagination && (
        <LedgerPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
        />
      )}
    </>
  );
};

// Main Component
const ClientLedger = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams();
  const [client, setClient] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(clientId || "");
  const [searchTerm, setSearchTerm] = useState("");

  // Enhanced filter states with pagination
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    monthYear: "",
    year: "",
    transactionType: "all",
    minAmount: "",
    maxAmount: "",
    page: 1,
    limit: 25,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pagination, setPagination] = useState(null);

  // Modal states (keeping the same as original)
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
  const [summary, setSummary] = useState({});

  const [editCashFlowModal, setEditCashFlowModal] = useState({
    open: false,
    entry: null,
  });
  const [editCashFlowFormData, setEditCashFlowFormData] = useState({});
  const [editCashFlowErrors, setEditCashFlowErrors] = useState({});
  const [editCashFlowLoading, setEditCashFlowLoading] = useState(false);

  // WhatsApp states
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [whatsappVerified, setWhatsappVerified] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  useEffect(() => {
    fetchClients();
    if (selectedClient) {
      fetchLedgerData();
    }
  }, [selectedClient, filters]);

  useEffect(() => {
    if (client) {
      setAutoSendEnabled(client.autoSendLedger || false);
      setWhatsappVerified(client.whatsappVerified || false);
    }
  }, [client]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientAPI.getClients({ limit: 1000 });
      setClients(response.data.data.clients || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgerData = async () => {
    if (!selectedClient) return;

    try {
      setLoading(true);
      const response = await clientAPI.getClientLedger(selectedClient, filters);
      setClient(response.data.data.client);
      setLedgerEntries(
        Array.isArray(response.data.data.entries)
          ? response.data.data.entries
          : []
      );
      setSummary(response.data.data.summary || {});
      setPagination(response.data.data.pagination || null);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch ledger data:", error);
      setError("Failed to fetch ledger data");
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filter handlers
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value, page: 1 };

      // Clear conflicting filters
      if (field === "monthYear" && value) {
        newFilters.startDate = "";
        newFilters.endDate = "";
        newFilters.year = "";
      } else if (field === "year" && value) {
        newFilters.startDate = "";
        newFilters.endDate = "";
        newFilters.monthYear = "";
      } else if ((field === "startDate" || field === "endDate") && value) {
        newFilters.monthYear = "";
        newFilters.year = "";
      }

      return newFilters;
    });
  }, []);

  const handleQuickFilter = useCallback((dateRange) => {
    if (dateRange.startDate && dateRange.endDate) {
      setFilters((prev) => ({
        ...prev,
        startDate: dateRange.startDate.toISOString().split("T")[0],
        endDate: dateRange.endDate.toISOString().split("T")[0],
        monthYear: "",
        year: "",
        page: 1,
      }));
    }
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      startDate: "",
      endDate: "",
      monthYear: "",
      year: "",
      transactionType: "all",
      minAmount: "",
      maxAmount: "",
      page: 1,
      limit: 25,
    });
    setSearchTerm("");
  }, []);

  const hasActiveFilters = useCallback(() => {
    return !!(
      filters.startDate ||
      filters.endDate ||
      filters.monthYear ||
      filters.year ||
      filters.transactionType !== "all" ||
      filters.minAmount ||
      filters.maxAmount ||
      searchTerm
    );
  }, [filters, searchTerm]);

  // Pagination handlers
  const handlePageChange = useCallback((newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  // Toggle auto-send function for client selector
  const handleToggleAutoSend = async (clientId, newState) => {
    try {
      const response = await clientAPI.toggleAutoSend(clientId, newState);
      if (response.data.success) {
        // Update the clients list
        setClients((prev) =>
          prev.map((client) =>
            client._id === clientId
              ? {
                  ...client,
                  autoSendLedger: newState,
                  whatsappVerified: response.data.data.whatsappVerified,
                }
              : client
          )
        );
      } else {
        alert(`Failed to toggle auto-send: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Auto-send toggle error:", error);
      alert(
        `Failed to toggle auto-send: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // WhatsApp Functions
  const handleSendWhatsApp = async () => {
    if (!client || ledgerEntries.length === 0) {
      alert("No client data or transactions to send");
      return;
    }

    try {
      setWhatsappSending(true);

      const filtersToSend = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        monthYear: filters.monthYear,
        year: filters.year,
        transactionType: filters.transactionType,
      };

      const response = await clientAPI.sendWhatsAppLedger(
        selectedClient,
        filtersToSend
      );

      if (response.data.success) {
        // Success message handled by API
      } else {
        // Error message handled by API
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
    } finally {
      setWhatsappSending(false);
    }
  };

  const handleToggleAutoSendForSelectedClient = async () => {
    if (!client) return;

    try {
      const newAutoSendState = !autoSendEnabled;

      const response = await clientAPI.toggleAutoSend(
        selectedClient,
        newAutoSendState
      );

      if (response.data.success) {
        setAutoSendEnabled(newAutoSendState);
        setWhatsappVerified(response.data.data.whatsappVerified);
        alert(
          `Auto-send ledger ${newAutoSendState ? "enabled" : "disabled"} for ${
            client.name
          }`
        );

        await fetchLedgerData();
      } else {
        alert(`Failed to toggle auto-send: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Auto-send toggle error:", error);
      alert(
        `Failed to toggle auto-send: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Export Functions (keeping the same as original)
  const exportToExcel = () => {
    try {
      const exportData = ledgerEntries.map((entry, index) => ({
        "S.No": index + 1,
        Date: formatDate(entry.date),
        Category: entry.transactionCategory === "stock" ? "Stock" : "Cash Flow",
        Particulars: entry.particulars,
        Type:
          entry.transactionType === "IN"
            ? entry.transactionCategory === "stock"
              ? "Purchase"
              : "Cash In"
            : entry.transactionCategory === "stock"
            ? "Sale"
            : "Cash Out",
        Bags: entry.transactionCategory === "stock" ? entry.bags || 0 : "N/A",
        "Weight (kg)":
          entry.transactionCategory === "stock" ? entry.weight || 0 : "N/A",
        Rate:
          entry.transactionCategory === "stock"
            ? entry.rate
              ? `₹${entry.rate}`
              : "N/A"
            : "N/A",
        "Debit Amount": entry.debitAmount ? `₹${entry.debitAmount}` : "₹0",
        "Credit Amount": entry.creditAmount ? `₹${entry.creditAmount}` : "₹0",
        Balance: `₹${entry.balance}`,
        "Invoice No": entry.invoiceNo || "",
        "Payment Mode": entry.paymentMode || "",
        Notes: entry.notes || "",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${client.name} - Ledger`);

      // Auto-width columns
      const colWidths = Object.keys(exportData[0] || {}).map(() => ({
        wch: 15,
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(
        wb,
        `${client.name}_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    } catch (error) {
      console.error("Export to Excel failed:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  const exportToPDF = useCallback(async () => {
    if (!client) {
      alert("No client data available to export");
      return;
    }

    if (ledgerEntries.length === 0) {
      alert("No transaction data available to export");
      return;
    }

    try {
      setPdfGenerating(true);

      const clientDataForPDF = {
        name: client.name || "Unknown Client",
        type: client.type || "N/A",
        phone: client.phone || "N/A",
        address: client.address || "N/A",
        currentBalance: client.currentBalance || 0,
      };

      await generateClientLedgerPDF(clientDataForPDF, ledgerEntries, filters);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert(
        `Failed to generate PDF: ${error.message || "Unknown error occurred"}`
      );
    } finally {
      setPdfGenerating(false);
    }
  }, [client, ledgerEntries, filters]);

  const handleClientSelect = (clientId) => {
    setSelectedClient(clientId);
    navigate(`/admin/clients/${clientId}/ledger`);
  };

  const handleEditEntry = async (entry) => {
    if (entry.transactionCategory === "stock") {
      try {
        const response = await clientAPI.getLedgerEntryById(entry._id);
        const entryDetails = response.data.data;

        setSelectedEntry(entryDetails);

        const isOriginallyBags = entryDetails.originalUnit === "bag";

        if (isOriginallyBags) {
          setEditFormData({
            productName: entryDetails.productName || "",
            type: entryDetails.type || "IN",
            bagCount: entryDetails.bags?.count || "",
            bagWeight: entryDetails.bags?.weight || "",
            rate: entryDetails.rate || "",
            invoiceNo: entryDetails.invoiceNo || "",
            notes: entryDetails.notes || "",
            date: entryDetails.date
              ? new Date(entryDetails.date).toISOString().split("T")[0]
              : "",
            originalUnit: "bag",
          });
        } else {
          setEditFormData({
            productName: entryDetails.productName || "",
            type: entryDetails.type || "IN",
            quantity: entryDetails.quantity || "",
            rate: entryDetails.rate || "",
            invoiceNo: entryDetails.invoiceNo || "",
            notes: entryDetails.notes || "",
            date: entryDetails.date
              ? new Date(entryDetails.date).toISOString().split("T")[0]
              : "",
            originalUnit: "kg",
          });
        }

        setEditErrors({});
        setShowEditModal(true);
      } catch (error) {
        console.error("Failed to fetch entry details:", error);
      }
    } else if (entry.transactionCategory === "cash") {
      try {
        const response = await clientAPI.getCashFlowEntryById(entry._id);
        const entryDetails = response.data.data;

        setSelectedEntry(entryDetails);
        setEditCashFlowFormData({
          amount: entryDetails.amount || "",
          category: entryDetails.category || "",
          description: entryDetails.description || "",
          paymentMode: entryDetails.paymentMode || "",
          transactionId: entryDetails.transactionId || "",
          notes: entryDetails.notes || "",
          date: entryDetails.date
            ? new Date(entryDetails.date).toISOString().split("T")[0]
            : "",
        });

        setEditCashFlowErrors({});
        setEditCashFlowModal({ open: true, entry: entryDetails });
      } catch (error) {
        console.error("Failed to fetch cash flow entry details:", error);
      }
    }
  };

  const validateEditCashFlowForm = () => {
    const errors = {};

    if (!editCashFlowFormData.amount || editCashFlowFormData.amount <= 0) {
      errors.amount = "Valid amount is required";
    }

    if (!editCashFlowFormData.category?.trim()) {
      errors.category = "Category is required";
    }

    if (!editCashFlowFormData.description?.trim()) {
      errors.description = "Description is required";
    }

    if (!editCashFlowFormData.paymentMode) {
      errors.paymentMode = "Payment mode is required";
    }

    if (!editCashFlowFormData.date) {
      errors.date = "Date is required";
    }

    setEditCashFlowErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateCashFlowEntry = async (e) => {
    e.preventDefault();
    if (!validateEditCashFlowForm()) return;

    try {
      setEditCashFlowLoading(true);

      const updateData = {
        amount: Math.round(editCashFlowFormData.amount),
        category: editCashFlowFormData.category,
        description: editCashFlowFormData.description,
        paymentMode: editCashFlowFormData.paymentMode,
        transactionId: editCashFlowFormData.transactionId,
        notes: editCashFlowFormData.notes,
        date: editCashFlowFormData.date,
      };

      await clientAPI.updateCashFlowEntry(selectedEntry._id, updateData);

      await fetchLedgerData();

      setEditCashFlowModal({ open: false, entry: null });
      setSelectedEntry(null);
      setEditCashFlowFormData({});
      setEditCashFlowErrors({});
    } catch (error) {
      console.error("Failed to update cash flow entry:", error);
      setEditCashFlowErrors({
        submit:
          error.response?.data?.message || "Failed to update cash flow entry",
      });
    } finally {
      setEditCashFlowLoading(false);
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData.productName?.trim()) {
      errors.productName = "Product name is required";
    }

    if (editFormData.originalUnit === "bag") {
      if (!editFormData.bagCount || editFormData.bagCount <= 0) {
        errors.bagCount = "Valid bag count is required";
      }
      if (!editFormData.bagWeight || editFormData.bagWeight <= 0) {
        errors.bagWeight = "Valid bag weight is required";
      }
    } else {
      if (!editFormData.quantity || editFormData.quantity <= 0) {
        errors.quantity = "Valid quantity is required";
      }
    }

    if (!editFormData.rate || editFormData.rate <= 0) {
      errors.rate = "Valid rate is required";
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

      let updateData = {
        productName: editFormData.productName,
        type: editFormData.type,
        rate: editFormData.rate,
        invoiceNo: editFormData.invoiceNo,
        notes: editFormData.notes,
        date: editFormData.date,
      };

      if (editFormData.originalUnit === "bag") {
        updateData.bags = {
          count: Math.round(editFormData.bagCount),
          weight: Math.round(editFormData.bagWeight),
        };
        updateData.quantity = updateData.bags.count * updateData.bags.weight;
      } else {
        updateData.quantity = Math.round(editFormData.quantity);
      }

      await clientAPI.updateLedgerEntry(selectedEntry._id, updateData);

      await fetchLedgerData();

      setShowEditModal(false);
      setSelectedEntry(null);
      setEditFormData({});
      setEditErrors({});
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

      if (entryToDelete.transactionCategory === "stock") {
        await clientAPI.deleteLedgerEntry(entryToDelete._id);
      } else if (entryToDelete.transactionCategory === "cash") {
        await clientAPI.deleteCashFlowEntry(entryToDelete._id);
      }

      await fetchLedgerData();
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showDeleteConfirmation = (entry) => {
    if (user.role === "superadmin") {
      setEntryToDelete(entry);
      setShowDeleteModal(true);
    }
  };

  const handleViewDetails = async (entry) => {
    try {
      if (entry.transactionCategory === "stock") {
        const response = await clientAPI.getLedgerEntryById(entry._id);
        setSelectedEntry(response.data.data);
      } else {
        setSelectedEntry(entry);
      }
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Failed to fetch entry details:", error);
    }
  };

  const calculateAmount = () => {
    if (editFormData.originalUnit === "bag") {
      if (
        editFormData.bagCount &&
        editFormData.bagWeight &&
        editFormData.rate
      ) {
        return (
          editFormData.bagCount * editFormData.bagWeight * editFormData.rate
        );
      }
    } else {
      if (editFormData.quantity && editFormData.rate) {
        return editFormData.quantity * editFormData.rate;
      }
    }
    return 0;
  };

  if (!selectedClient) {
    return (
      <ClientSelector
        clients={clients}
        selectedClient={selectedClient}
        onClientSelect={handleClientSelect}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBack={() => navigate("/admin/clients/dashboard")}
        onToggleAutoSend={handleToggleAutoSend}
        loading={loading}
      />
    );
  }

  if (loading && !client) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="">
          <HeaderComponent
            header="Client Ledger"
            subheader="Loading client data..."
            loading={loading}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {[...Array(5)].map((_, i) => (
              <StatCard key={i} loading={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="">
          <HeaderComponent
            header="Client Ledger"
            subheader="Account statement and transaction history"
            removeRefresh={true}
          />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-600 font-medium mb-6">{error}</p>
              <button
                onClick={fetchLedgerData}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-8">
        {/* Page Header */}
        <HeaderComponent
          header={`Client Ledger - ${client?.name || "Loading..."}`}
          subheader={
            client
              ? `${client.type} (${client.phone})`
              : "Loading client details..."
          }
          onRefresh={fetchLedgerData}
          loading={loading}
        />

        {/* Navigation & Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <BarChart3 className="w-5 h-5" />
              <span>Client Management</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">Client Ledger</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Navigation Buttons */}
              <button
                onClick={() => {
                  setSelectedClient("");
                  navigate("/admin/clients/ledger");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Client
              </button>

              <button
                onClick={() => navigate("/admin/clients/dashboard")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>

              {/* Export Buttons */}
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                disabled={ledgerEntries.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>

              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                disabled={pdfGenerating || ledgerEntries.length === 0}
              >
                {pdfGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                PDF
              </button>

              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="Stock Sales"
            value={`₹${summary?.stock?.totalDebit?.toLocaleString() || 0}`}
            icon={ShoppingBag}
            color="green"
            change={`${summary?.stock?.saleCount || 0} transactions`}
          />
          <StatCard
            title="Stock Purchases"
            value={`₹${summary?.stock?.totalCredit?.toLocaleString() || 0}`}
            icon={ShoppingCart}
            color="red"
            change={`${summary?.stock?.purchaseCount || 0} transactions`}
          />
          <StatCard
            title="Cash In"
            value={`₹${summary?.cashFlow?.totalCashIn?.toLocaleString() || 0}`}
            icon={TrendingUp}
            color="green"
            change={`${summary?.cashFlow?.cashInCount || 0} transactions`}
          />
          <StatCard
            title="Cash Out"
            value={`₹${summary?.cashFlow?.totalCashOut?.toLocaleString() || 0}`}
            icon={TrendingDown}
            color="red"
            change={`${summary?.cashFlow?.cashOutCount || 0} transactions`}
          />
          <StatCard
            title="Current Balance"
            value={`₹${Math.abs(client?.currentBalance || 0).toLocaleString()}`}
            icon={IndianRupee}
            color={client?.currentBalance >= 0 ? "green" : "red"}
            change={client?.currentBalance >= 0 ? "Receivable" : "Payable"}
          />
        </div>

        {/* WhatsApp Status */}
        {client && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    whatsappVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {whatsappVerified
                    ? "WhatsApp Verified"
                    : "WhatsApp Not Verified"}
                </div>

                {autoSendEnabled && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <Calendar className="w-4 h-4" />
                    Auto-Send Enabled
                  </div>
                )}

                {client.lastLedgerSent && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <Clock className="w-4 h-4" />
                    Last Sent: {formatDate(client.lastLedgerSent)}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Monthly ledgers sent automatically on the 1st at 9:00 AM
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 font-medium rounded-xl transition-colors ${
              showFilters
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        )}

        {/* Filter Section */}
        {showFilters && (
          <DateFilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onQuickFilter={handleQuickFilter}
            hasActiveFilters={hasActiveFilters()}
            clearFilters={clearFilters}
          />
        )}

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Transaction Ledger
                  </h2>
                  <p className="text-sm text-gray-600">
                    {pagination
                      ? `${pagination.totalItems} total transactions`
                      : `${ledgerEntries.length} transactions found`}
                    {pagination &&
                      ` - Page ${pagination.currentPage} of ${pagination.totalPages}`}
                  </p>
                </div>
              </div>

              {hasActiveFilters() && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600 font-medium">
                    Filters Active
                  </span>
                  <button
                    onClick={clearFilters}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Clear Filters"
                  >
                    <FilterX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {ledgerEntries.length > 0 ? (
            <LedgerTable
              entries={ledgerEntries}
              user={user}
              onViewDetails={handleViewDetails}
              onEditEntry={handleEditEntry}
              onDeleteEntry={showDeleteConfirmation}
              actionLoading={actionLoading}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No transactions found
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {hasActiveFilters()
                  ? "Try adjusting your search filters to find what you're looking for."
                  : "No transactions recorded for this client yet."}
              </p>
              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                >
                  <FilterX className="h-4 w-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp Settings Modal */}
        {showWhatsAppModal && (
          <Modal
            isOpen={showWhatsAppModal}
            onClose={() => setShowWhatsAppModal(false)}
            title="WhatsApp Settings"
            subtitle={`Configure WhatsApp ledger sending for ${client?.name}`}
            headerIcon={<MessageCircle />}
            headerColor="green"
            size="md"
          >
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Current WhatsApp Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Phone Number
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {client?.phone}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        WhatsApp Status
                      </span>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        whatsappVerified ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {whatsappVerified ? "Verified" : "Not Verified"}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Auto-Send Status
                      </span>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        autoSendEnabled ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {autoSendEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600">
                        Last Sent
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {client?.lastLedgerSent
                        ? formatDate(client.lastLedgerSent)
                        : "Never"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Send Configuration */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Monthly Auto-Send Configuration
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium text-gray-900">
                        Enable Monthly Auto-Send
                      </div>
                      <div className="text-sm text-gray-600">
                        Automatically send ledger PDF on 1st of each month at
                        9:00 AM
                      </div>
                    </div>

                    <button
                      onClick={handleToggleAutoSendForSelectedClient}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        autoSendEnabled
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {autoSendEnabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  {!whatsappVerified && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-yellow-800">
                            WhatsApp Verification Required
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            To enable auto-send, the phone number must be
                            verified as a valid WhatsApp number. Click "Enable
                            Auto-Send" to verify and activate.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Send Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  Manual Send Options
                </h3>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="font-medium text-gray-900 mb-2">
                      Send Current Filtered Data
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Send ledger PDF with currently applied date filters and
                      transaction filters.
                      {ledgerEntries.length > 0
                        ? ` Contains ${ledgerEntries.length} transactions.`
                        : " No transactions to send."}
                    </div>
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={whatsappSending || ledgerEntries.length === 0}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        whatsappSending || ledgerEntries.length === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {whatsappSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          Send Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Information Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  How It Works
                </h3>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Auto-Send:</strong> Runs automatically on the 1st
                      day of each month at 9:00 AM
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Period:</strong> Sends previous month's complete
                      transaction ledger
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Format:</strong> High-quality PDF with transaction
                      summary and details
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Verification:</strong> Phone numbers are validated
                      before sending
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong>Manual Send:</strong> Available anytime with
                      custom date filters
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Enhanced Details Modal */}
        {showDetailsModal && selectedEntry && (
          <Modal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`${
              selectedEntry.transactionCategory === "stock"
                ? "Stock"
                : "Cash Flow"
            } Transaction Details`}
            subtitle="Complete transaction information"
            headerIcon={<Receipt />}
            headerColor="blue"
            size="md"
          >
            <div className="space-y-6">
              {/* Client Information Card */}
              {selectedEntry.client && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Client Information
                      </h3>
                      <p className="text-sm text-gray-600">
                        Account holder details and current status
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Client Name
                      </label>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEntry.client.name || client.name}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Client Type
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          (selectedEntry.client.type || client.type) ===
                          "Customer"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedEntry.client.type || client.type}
                      </span>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Phone Number
                      </label>
                      <div className="flex items-center text-lg text-gray-900">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {selectedEntry.client.phone || client.phone}
                      </div>
                    </div>

                    {(selectedEntry.client.address || client.address) && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Address
                        </label>
                        <div className="flex items-start text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          {selectedEntry.client.address || client.address}
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Current Balance
                      </label>
                      <div
                        className={`text-lg font-bold ${
                          client.currentBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {client.currentBalance < 0 && "-"}₹
                        {Math.abs(client.currentBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Overview Card */}
              <div
                className={`bg-gradient-to-br rounded-2xl p-6 border ${
                  selectedEntry.transactionCategory === "stock"
                    ? "from-blue-50 to-indigo-50 border-blue-100"
                    : "from-orange-50 to-amber-50 border-orange-100"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedEntry.transactionCategory === "stock"
                          ? "bg-blue-100"
                          : "bg-orange-100"
                      }`}
                    >
                      {selectedEntry.transactionCategory === "stock" ? (
                        <Package className="h-6 w-6 text-blue-600" />
                      ) : (
                        <CreditCard className="h-6 w-6 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedEntry.productName || selectedEntry.particulars}
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
                      {selectedEntry.amount?.toLocaleString() ||
                        (
                          Math.abs(selectedEntry.debitAmount || 0) +
                          Math.abs(selectedEntry.creditAmount || 0)
                        ).toLocaleString()}
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                        selectedEntry.type === "IN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedEntry.type === "IN"
                        ? selectedEntry.transactionCategory === "stock"
                          ? "Purchase"
                          : "Cash In"
                        : selectedEntry.transactionCategory === "stock"
                        ? "Sale"
                        : "Cash Out"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    className={`bg-white rounded-lg p-4 border ${
                      selectedEntry.transactionCategory === "stock"
                        ? "border-blue-200"
                        : "border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar
                        className={`h-4 w-4 ${
                          selectedEntry.transactionCategory === "stock"
                            ? "text-blue-500"
                            : "text-orange-500"
                        }`}
                      />
                      <label className="text-sm font-medium text-gray-600">
                        Transaction Date
                      </label>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedEntry.date)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(selectedEntry.date).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>

                  {selectedEntry.transactionCategory === "stock" && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Weight className="h-4 w-4 text-blue-500" />
                        <label className="text-sm font-medium text-gray-600">
                          Quantity
                        </label>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEntry.quantity} kg
                      </div>
                      {selectedEntry.originalUnit === "bag" &&
                        selectedEntry.bags && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({selectedEntry.bags.count} bags ×{" "}
                            {selectedEntry.bags.weight} kg/bag)
                          </div>
                        )}
                    </div>
                  )}

                  {selectedEntry.transactionCategory === "cash" && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-4 w-4 text-orange-500" />
                        <label className="text-sm font-medium text-gray-600">
                          Payment Mode
                        </label>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEntry.paymentMode || "N/A"}
                      </div>
                    </div>
                  )}

                  {selectedEntry.transactionCategory === "stock" && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <IndianRupee className="h-4 w-4 text-blue-500" />
                        <label className="text-sm font-medium text-gray-600">
                          Rate
                        </label>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        ₹{selectedEntry.rate}/kg
                      </div>
                    </div>
                  )}

                  {selectedEntry.transactionCategory === "cash" &&
                    selectedEntry.category && (
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-orange-500" />
                          <label className="text-sm font-medium text-gray-600">
                            Category
                          </label>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {selectedEntry.category}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Additional Details */}
              {(selectedEntry.invoiceNo || selectedEntry.notes) && (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-6 w-6 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Additional Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedEntry.invoiceNo && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Invoice Number
                        </label>
                        <div className="text-lg font-semibold text-gray-900 font-mono flex items-center">
                          <Hash className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedEntry.invoiceNo}
                        </div>
                      </div>
                    )}

                    {selectedEntry.notes && (
                      <div
                        className={`bg-white rounded-lg p-4 border border-gray-200 ${
                          selectedEntry.invoiceNo
                            ? "md:col-span-1"
                            : "md:col-span-2"
                        }`}
                      >
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Notes
                        </label>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedEntry.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transaction Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="h-6 w-6 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Transaction Summary
                  </h3>
                </div>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">
                        {selectedEntry.transactionCategory === "stock"
                          ? "Product:"
                          : "Description:"}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {selectedEntry.productName || selectedEntry.particulars}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Transaction Type:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedEntry.type === "IN"
                          ? selectedEntry.transactionCategory === "stock"
                            ? "Purchase"
                            : "Cash In"
                          : selectedEntry.transactionCategory === "stock"
                          ? "Sale"
                          : "Cash Out"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedEntry.transactionCategory === "stock"
                          ? "Stock Transaction"
                          : `Cash Flow (${
                              selectedEntry.category || "General"
                            })`}
                      </span>
                    </div>
                    {selectedEntry.transactionCategory === "stock" && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-semibold text-gray-900">
                            {selectedEntry.quantity} kg
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Rate:</span>
                          <span className="font-semibold text-gray-900">
                            ₹{selectedEntry.rate}/kg
                          </span>
                        </div>
                      </>
                    )}
                    {selectedEntry.transactionCategory === "cash" &&
                      selectedEntry.paymentMode && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Payment Mode:</span>
                          <span className="font-semibold text-gray-900">
                            {selectedEntry.paymentMode}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                      <span className="font-semibold text-gray-900">
                        Total Amount:
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        ₹
                        {(
                          selectedEntry.amount ||
                          Math.abs(selectedEntry.debitAmount || 0) +
                            Math.abs(selectedEntry.creditAmount || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Edit Modal - Only for Stock Transactions */}
        {showEditModal && selectedEntry && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit Stock Transaction"
            subtitle={`Update transaction information (Original unit: ${editFormData.originalUnit})`}
            headerIcon={<Edit />}
            headerColor="green"
            size="md"
          >
            <form onSubmit={handleUpdateEntry} className="space-y-6">
              {editErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-red-700">{editErrors.submit}</span>
                </div>
              )}

              {/* Unit Information Banner */}
              <div
                className={`border rounded-lg p-3 ${
                  editFormData.originalUnit === "bag"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    This transaction was originally entered in{" "}
                    {editFormData.originalUnit}s.
                    {editFormData.originalUnit === "bag"
                      ? " You can edit bag count and weight."
                      : " You can edit the quantity in kg."}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.productName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        productName: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                      editErrors.productName ? "border-red-300" : ""
                    }`}
                    placeholder="Enter product name"
                  />
                  {editErrors.productName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.productName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transaction Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                  >
                    <option value="IN">Purchase (IN)</option>
                    <option value="OUT">Sale (OUT)</option>
                  </select>
                </div>

                {/* Conditional Quantity Fields based on Original Unit */}
                {editFormData.originalUnit === "bag" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bag Count *
                      </label>
                      <input
                        type="number"
                        value={editFormData.bagCount}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bagCount: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                          editErrors.bagCount ? "border-red-300" : ""
                        }`}
                        placeholder="Number of bags"
                      />
                      {editErrors.bagCount && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {editErrors.bagCount}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Weight per Bag (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.bagWeight}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            bagWeight: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                          editErrors.bagWeight ? "border-red-300" : ""
                        }`}
                        placeholder="Weight per bag in kg"
                      />
                      {editErrors.bagWeight && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {editErrors.bagWeight}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.quantity}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          quantity: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                        editErrors.quantity ? "border-red-300" : ""
                      }`}
                      placeholder="Enter quantity in kg"
                    />
                    {editErrors.quantity && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {editErrors.quantity}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rate (₹/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.rate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, rate: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                      editErrors.rate ? "border-red-300" : ""
                    }`}
                    placeholder="Enter rate per kg"
                  />
                  {editErrors.rate && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.rate}
                    </p>
                  )}
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
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
                      editErrors.date ? "border-red-300" : ""
                    }`}
                  />
                  {editErrors.date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editErrors.date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.invoiceNo}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        invoiceNo: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    placeholder="Enter invoice number"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>

              {/* Calculated Amount Display */}
              {calculateAmount() > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Calculated Amount:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{calculateAmount().toLocaleString()}
                    </span>
                  </div>
                  {editFormData.originalUnit === "bag" &&
                    editFormData.bagCount &&
                    editFormData.bagWeight && (
                      <div className="text-xs text-gray-600 mt-1">
                        {editFormData.bagCount} bags × {editFormData.bagWeight}{" "}
                        kg/bag × ₹{editFormData.rate}/kg
                      </div>
                    )}
                </div>
              )}

              {/* Form Actions */}
              <div className="border-t pt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className={`px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors ${
                    editLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 inline mr-2" />
                      Update Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Cash Flow Modal */}
        {editCashFlowModal.open && selectedEntry && (
          <Modal
            isOpen={editCashFlowModal.open}
            onClose={() => setEditCashFlowModal({ open: false, entry: null })}
            title="Edit Cash Flow Transaction"
            subtitle="Update cash flow transaction information"
            headerIcon={<Edit />}
            headerColor="green"
            size="md"
          >
            <form onSubmit={handleUpdateCashFlowEntry} className="space-y-6">
              {editCashFlowErrors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <span className="text-red-700">
                    {editCashFlowErrors.submit}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCashFlowFormData.amount}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        amount: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${
                      editCashFlowErrors.amount ? "border-red-300" : ""
                    }`}
                    placeholder="Enter amount"
                  />
                  {editCashFlowErrors.amount && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editCashFlowErrors.amount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={editCashFlowFormData.category}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        category: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${
                      editCashFlowErrors.category ? "border-red-300" : ""
                    }`}
                    placeholder="Enter category"
                  />
                  {editCashFlowErrors.category && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editCashFlowErrors.category}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editCashFlowFormData.description}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${
                      editCashFlowErrors.description ? "border-red-300" : ""
                    }`}
                    placeholder="Enter description"
                  />
                  {editCashFlowErrors.description && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editCashFlowErrors.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Mode *
                  </label>
                  <select
                    value={editCashFlowFormData.paymentMode}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        paymentMode: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${
                      editCashFlowErrors.paymentMode ? "border-red-300" : ""
                    }`}
                  >
                    <option value="">Select Payment Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                  {editCashFlowErrors.paymentMode && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editCashFlowErrors.paymentMode}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editCashFlowFormData.date}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        date: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${
                      editCashFlowErrors.date ? "border-red-300" : ""
                    }`}
                  />
                  {editCashFlowErrors.date && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {editCashFlowErrors.date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={editCashFlowFormData.transactionId}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        transactionId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    placeholder="Enter transaction ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editCashFlowFormData.notes}
                    onChange={(e) =>
                      setEditCashFlowFormData({
                        ...editCashFlowFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>
              {/* Form Actions */}
              <div className="border-t pt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setEditCashFlowModal({ open: false, entry: null })
                  }
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editCashFlowLoading}
                  className={`px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors ${
                    editCashFlowLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {editCashFlowLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 inline mr-2" />
                      Update Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && entryToDelete && (
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title={`Delete ${
              entryToDelete.transactionCategory === "stock"
                ? "Stock"
                : "Cash Flow"
            } Transaction`}
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
                Are you sure you want to delete this{" "}
                {entryToDelete.transactionCategory} transaction?
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-left">
                  <div className="flex gap-2 flex-wrap justify-between">
                    <div className="font-semibold text-gray-900">
                      {entryToDelete.productName || entryToDelete.particulars}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(entryToDelete.date)}
                    </div>
                  </div>
                  <div className="text-sm mt-1 text-gray-600 flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        entryToDelete.transactionType === "IN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {entryToDelete.transactionType === "IN"
                        ? entryToDelete.transactionCategory === "stock"
                          ? "Purchase"
                          : "Cash In"
                        : entryToDelete.transactionCategory === "stock"
                        ? "Sale"
                        : "Cash Out"}
                    </span>
                    <span>
                      ₹
                      {(
                        entryToDelete.debitAmount || entryToDelete.creditAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                This will permanently remove the transaction record from the
                system and recalculate the client balance.
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEntryToDelete(null);
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEntry}
                disabled={actionLoading === entryToDelete._id}
                className={`px-6 py-2.5 bg-red-600 text-white rounded-xl font-medium flex-1 hover:bg-red-700 transition-colors ${
                  actionLoading === entryToDelete._id
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {actionLoading === entryToDelete._id ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 inline mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ClientLedger;
