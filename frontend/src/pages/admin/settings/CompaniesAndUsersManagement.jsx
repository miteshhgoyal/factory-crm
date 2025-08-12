import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building,
  Shield,
  User,
  Crown,
  UserPlus,
  Mail,
  Phone,
  X,
  Save,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  Check,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { userAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import StatCard from "../../../components/cards/StatCard";
import Modal from "../../../components/ui/Modal";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] transform transition-all duration-300 ease-in-out ${
        type === "success"
          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
      }`}
    >
      <div className="flex-shrink-0">
        {type === "success" ? (
          <Check className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
      </div>
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const CompaniesAndUsersManagement = () => {
  const { user } = useAuth();

  // States
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [viewModal, setViewModal] = useState({ open: false, user: null });
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [companyModal, setCompanyModal] = useState({
    open: false,
    company: null,
  });
  const [companyDeleteModal, setCompanyDeleteModal] = useState({
    open: false,
    company: null,
  });

  // Form Data
  const [userFormData, setUserFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    role: "subadmin",
    phone: "",
    companies: [],
  });

  const [companyFormData, setCompanyFormData] = useState({
    name: "",
    description: "",
  });

  // User selection for company assignment
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [selectedSubadmins, setSelectedSubadmins] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Fetch Available Users
  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await userAPI.getAvailableUsers();
      if (response?.data?.success) {
        setAvailableUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch available users:", error);
    }
  }, []);

  // Fetch Data - Updated to use proper endpoint based on role
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userResponse, companyResponse] = await Promise.all([
        userAPI.getAllUsers(),
        // Use different endpoint based on role - admins get only assigned companies
        user.role === "superadmin"
          ? userAPI.getAllCompanies()
          : userAPI.getMyAssignedCompanies(),
      ]);

      if (userResponse?.data?.success) {
        setUsers(userResponse.data.data || []);
      }
      if (companyResponse?.data?.success) {
        setCompanies(companyResponse.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [user.role, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((userItem) => {
      const matchesSearch =
        userItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !roleFilter || userItem.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const subadmins = users.filter((u) => u.role === "subadmin").length;
    const totalCompanies = companies.length;

    return { totalUsers, admins, subadmins, totalCompanies };
  }, [users, companies]);

  // User CRUD Operations
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        username: userFormData.username.trim(),
        email: userFormData.email.trim(),
        name: userFormData.name?.trim(),
        role: userFormData.role,
        phone: userFormData.phone?.trim(),
        companies: userFormData.companies,
      };

      if (userFormData.password) {
        payload.password = userFormData.password;
      }

      if (editModal.user) {
        await userAPI.updateUser(editModal.user._id, payload);
        showToast("User updated successfully");
      } else {
        await userAPI.createUser(payload);
        showToast("User created successfully");
      }

      setEditModal({ open: false, user: null });
      setUserFormData({
        username: "",
        email: "",
        password: "",
        name: "",
        role: "subadmin",
        phone: "",
        companies: [],
      });

      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to save user",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setSaving(true);
      await userAPI.deleteUser(deleteModal.user._id);
      setDeleteModal({ open: false, user: null });
      showToast("User deleted successfully");
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete user",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // Company CRUD Operations
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        name: companyFormData.name.trim(),
        description: companyFormData.description?.trim(),
      };

      // Add user assignments - only superadmin can assign admins
      if (user.role === "superadmin") {
        payload.adminIds = selectedAdmins;
      }
      payload.subadminIds = selectedSubadmins;

      if (companyModal.company) {
        await userAPI.updateCompany(companyModal.company._id, payload);
        showToast(
          user.role === "admin"
            ? "Subadmins assigned successfully"
            : "Company updated successfully"
        );
      } else {
        await userAPI.createCompany(payload);
        showToast("Company created successfully");
      }

      setCompanyModal({ open: false, company: null });
      setCompanyFormData({ name: "", description: "" });
      setSelectedAdmins([]);
      setSelectedSubadmins([]);
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to save company",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    try {
      setSaving(true);
      await userAPI.deleteCompany(companyDeleteModal.company._id);
      setCompanyDeleteModal({ open: false, company: null });
      showToast("Company deleted successfully");
      fetchData();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to delete company",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const canManageUser = useCallback(
    (targetUser) => {
      if (user.role === "superadmin") return true;
      if (user.role === "admin" && targetUser.role === "subadmin") return true;
      return user._id === targetUser._id;
    },
    [user]
  );

  const canCreateUser = user.role === "superadmin" || user.role === "admin";
  const canCreateCompany = user.role === "superadmin";

  // Check if admin can edit company (only if assigned to it)
  const canEditCompany = useCallback(
    (company) => {
      if (user.role === "superadmin") return true;
      if (
        user.role === "admin" &&
        company.admins?.some((a) => (a._id || a) === user._id)
      )
        return true;
      return false;
    },
    [user]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Companies & Users Management"
          subheader="Loading..."
        />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}

        <HeaderComponent
          header="Companies & Users Management"
          subheader={`Manage users, roles, and companies - ${user.role.toUpperCase()} Dashboard`}
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Breadcrumb & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>User Management</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {activeTab === "users" ? "Users" : "Companies"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-primary btn-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
            {activeTab === "users" && canCreateUser && (
              <button
                onClick={() => {
                  setUserFormData({
                    username: "",
                    email: "",
                    password: "",
                    name: "",
                    role: user.role === "admin" ? "subadmin" : "subadmin",
                    phone: "",
                    companies: [],
                  });
                  setEditModal({ open: true, user: null });
                }}
                className="btn-success btn-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add User</span>
              </button>
            )}
            {activeTab === "companies" && canCreateCompany && (
              <button
                onClick={() => {
                  setCompanyFormData({ name: "", description: "" });
                  setSelectedAdmins([]);
                  setSelectedSubadmins([]);
                  setCompanyModal({ open: true, company: null });
                  fetchAvailableUsers();
                }}
                className="btn-success btn-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Company</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="blue"
            subtitle="All users in system"
          />
          {user.role === "superadmin" && (
            <StatCard
              title="Admins"
              value={stats.admins}
              icon={Shield}
              color="purple"
              subtitle="Admin users"
            />
          )}
          <StatCard
            title="Subadmins"
            value={stats.subadmins}
            icon={User}
            color="green"
            subtitle="Subadmin users"
          />
          <StatCard
            title={user.role === "admin" ? "My Companies" : "Companies"}
            value={stats.totalCompanies}
            icon={Building}
            color="orange"
            subtitle={
              user.role === "admin" ? "Assigned to me" : "Total companies"
            }
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Filter {activeTab === "users" ? "Users" : "Companies"}
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, username, email..."
                    className="input-primary pl-10"
                  />
                </div>
              </div>

              {activeTab === "users" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="input-primary"
                  >
                    <option value="">All Roles</option>
                    {user.role === "superadmin" && (
                      <>
                        <option value="superadmin">Superadmin</option>
                        <option value="admin">Admin</option>
                      </>
                    )}
                    <option value="subadmin">Subadmin</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("");
                }}
                className="btn-secondary btn-sm"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
              <div className="text-sm text-gray-600 flex items-center">
                Showing{" "}
                {activeTab === "users"
                  ? filteredUsers.length
                  : companies.length}{" "}
                results
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users ({stats.totalUsers})
                </div>
              </button>

              <button
                onClick={() => setActiveTab("companies")}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "companies"
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {user.role === "admin" ? "My Companies" : "Companies"} (
                  {stats.totalCompanies})
                </div>
              </button>
            </nav>
          </div>

          {/* Users Tab Content */}
          {activeTab === "users" && (
            <div className="p-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        User
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Role
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Contact
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Companies
                      </th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-900 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((userItem) => (
                        <tr
                          key={userItem._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  userItem.role === "superadmin"
                                    ? "bg-red-100"
                                    : userItem.role === "admin"
                                    ? "bg-purple-100"
                                    : "bg-blue-100"
                                }`}
                              >
                                {userItem.role === "superadmin" ? (
                                  <Crown className="w-5 h-5 text-red-600" />
                                ) : userItem.role === "admin" ? (
                                  <Shield className="w-5 h-5 text-purple-600" />
                                ) : (
                                  <User className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {userItem.name || userItem.username}
                                </p>
                                <p className="text-sm text-gray-600">
                                  @{userItem.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-medium ${
                                userItem.role === "superadmin"
                                  ? "bg-red-100 text-red-800"
                                  : userItem.role === "admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {userItem.role}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[200px]">
                                  {userItem.email}
                                </span>
                              </div>
                              {userItem.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  <span>{userItem.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">
                                {userItem.companies?.length || 0} assigned
                              </span>
                              {userItem.companies?.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {userItem.companies
                                    .slice(0, 2)
                                    .map((company, idx) => (
                                      <span key={idx}>
                                        {typeof company === "object"
                                          ? company.name
                                          : companies.find(
                                              (c) => c._id === company
                                            )?.name || "Unknown"}
                                        {idx <
                                          Math.min(
                                            userItem.companies.length,
                                            2
                                          ) -
                                            1 && ", "}
                                      </span>
                                    ))}
                                  {userItem.companies.length > 2 && (
                                    <span>
                                      {" "}
                                      +{userItem.companies.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setViewModal({ open: true, user: userItem })
                                }
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canManageUser(userItem) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setUserFormData({
                                        username: userItem.username || "",
                                        email: userItem.email || "",
                                        password: "",
                                        name: userItem.name || "",
                                        role: userItem.role || "subadmin",
                                        phone: userItem.phone || "",
                                        companies:
                                          userItem.companies?.map(
                                            (c) => c._id || c
                                          ) || [],
                                      });
                                      setEditModal({
                                        open: true,
                                        user: userItem,
                                      });
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  {user.role === "superadmin" && (
                                    <button
                                      onClick={() =>
                                        setDeleteModal({
                                          open: true,
                                          user: userItem,
                                        })
                                      }
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-12">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">
                            No users found
                          </p>
                          <p className="text-gray-400 text-sm">
                            Try adjusting your filters
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userItem) => (
                    <div
                      key={userItem._id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                userItem.role === "superadmin"
                                  ? "bg-red-100"
                                  : userItem.role === "admin"
                                  ? "bg-purple-100"
                                  : "bg-blue-100"
                              }`}
                            >
                              {userItem.role === "superadmin" ? (
                                <Crown className="w-5 h-5 text-red-600" />
                              ) : userItem.role === "admin" ? (
                                <Shield className="w-5 h-5 text-purple-600" />
                              ) : (
                                <User className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {userItem.name || userItem.username}
                              </p>
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  userItem.role === "superadmin"
                                    ? "bg-red-100 text-red-800"
                                    : userItem.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {userItem.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{userItem.email}</span>
                          </div>
                          {userItem.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{userItem.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-3 h-3" />
                            <span>
                              {userItem.companies?.length || 0} companies
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() =>
                              setViewModal({ open: true, user: userItem })
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canManageUser(userItem) && (
                            <>
                              <button
                                onClick={() => {
                                  setUserFormData({
                                    username: userItem.username || "",
                                    email: userItem.email || "",
                                    password: "",
                                    name: userItem.name || "",
                                    role: userItem.role || "subadmin",
                                    phone: userItem.phone || "",
                                    companies:
                                      userItem.companies?.map(
                                        (c) => c._id || c
                                      ) || [],
                                  });
                                  setEditModal({ open: true, user: userItem });
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {user.role === "superadmin" && (
                                <button
                                  onClick={() =>
                                    setDeleteModal({
                                      open: true,
                                      user: userItem,
                                    })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No users found</p>
                    <p className="text-gray-400 text-sm">
                      Try adjusting your filters
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Companies Tab Content */}
          {activeTab === "companies" && (
            <div className="p-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Company
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Description
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Team
                      </th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900 text-sm">
                        Created
                      </th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-900 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length > 0 ? (
                      companies.map((company) => (
                        <tr
                          key={company._id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Building className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {company.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  ID: {company._id.slice(-6)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {company.description || "No description"}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {user.role === "superadmin" && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                                  {company.admins?.length || 0} Admins
                                </span>
                              )}
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                {company.subadmins?.length || 0} Subadmins
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-600">
                              {new Date(company.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEditCompany(company) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setCompanyFormData({
                                        name: company.name || "",
                                        description: company.description || "",
                                      });
                                      setSelectedAdmins(
                                        company.admins?.map((a) => a._id) || []
                                      );
                                      setSelectedSubadmins(
                                        company.subadmins?.map((s) => s._id) ||
                                          []
                                      );
                                      setCompanyModal({ open: true, company });
                                      fetchAvailableUsers();
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title={
                                      user.role === "admin"
                                        ? "Assign Subadmins"
                                        : "Edit Company"
                                    }
                                  >
                                    {user.role === "admin" ? (
                                      <UserPlus className="w-4 h-4" />
                                    ) : (
                                      <Edit className="w-4 h-4" />
                                    )}
                                  </button>

                                  {canCreateCompany && (
                                    <button
                                      onClick={() =>
                                        setCompanyDeleteModal({
                                          open: true,
                                          company,
                                        })
                                      }
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete Company"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-12">
                          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">
                            {user.role === "admin"
                              ? "No companies assigned to you"
                              : "No companies found"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {user.role === "admin"
                              ? "Ask your superadmin to assign companies to you"
                              : "Create your first company to get started"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <div
                      key={company._id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                              <Building className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {company.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Created{" "}
                                {new Date(
                                  company.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {company.description && (
                          <p className="text-sm text-gray-600">
                            {company.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          {user.role === "superadmin" && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                              {company.admins?.length || 0} Admins
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {company.subadmins?.length || 0} Subadmins
                          </span>
                        </div>

                        {canEditCompany(company) && (
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setCompanyFormData({
                                  name: company.name || "",
                                  description: company.description || "",
                                });
                                setSelectedAdmins(
                                  company.admins?.map((a) => a._id) || []
                                );
                                setSelectedSubadmins(
                                  company.subadmins?.map((s) => s._id) || []
                                );
                                setCompanyModal({ open: true, company });
                                fetchAvailableUsers();
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={
                                user.role === "admin"
                                  ? "Assign Subadmins"
                                  : "Edit Company"
                              }
                            >
                              {user.role === "admin" ? (
                                <UserPlus className="w-4 h-4" />
                              ) : (
                                <Edit className="w-4 h-4" />
                              )}
                            </button>

                            {canCreateCompany && (
                              <button
                                onClick={() =>
                                  setCompanyDeleteModal({ open: true, company })
                                }
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Company"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      {user.role === "admin"
                        ? "No companies assigned to you"
                        : "No companies found"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {user.role === "admin"
                        ? "Ask your superadmin to assign companies to you"
                        : "Create your first company to get started"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, user: null })}
        title="User Details"
        subtitle="View user information"
        headerIcon={<Eye />}
        headerColor="blue"
        size="md"
      >
        {viewModal.user && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    viewModal.user.role === "superadmin"
                      ? "bg-red-100"
                      : viewModal.user.role === "admin"
                      ? "bg-purple-100"
                      : "bg-blue-100"
                  }`}
                >
                  {viewModal.user.role === "superadmin" ? (
                    <Crown className="w-8 h-8 text-red-600" />
                  ) : viewModal.user.role === "admin" ? (
                    <Shield className="w-8 h-8 text-purple-600" />
                  ) : (
                    <User className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {viewModal.user.name || viewModal.user.username}
                  </h3>
                  <p className="text-blue-600">@{viewModal.user.username}</p>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mt-2 ${
                      viewModal.user.role === "superadmin"
                        ? "bg-red-100 text-red-800"
                        : viewModal.user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {viewModal.user.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{viewModal.user.email}</p>
                </div>
                {viewModal.user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Phone
                    </label>
                    <p className="text-gray-900">{viewModal.user.phone}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created
                  </label>
                  <p className="text-gray-900">
                    {new Date(viewModal.user.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Companies
                  </label>
                  <p className="text-gray-900">
                    {viewModal.user.companies?.length || 0} assigned
                  </p>
                </div>
              </div>
            </div>

            {/* Companies List */}
            {viewModal.user.companies?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Assigned Companies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {viewModal.user.companies.map((company) => (
                    <div
                      key={company._id || company}
                      className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-gray-900">
                          {typeof company === "object"
                            ? company.name
                            : companies.find((c) => c._id === company)?.name ||
                              "Unknown Company"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit/Create User Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        title={editModal.user ? "Edit User" : "Create New User"}
        subtitle={
          editModal.user
            ? "Update user information"
            : "Add a new user to the system"
        }
        headerIcon={editModal.user ? <Edit /> : <UserPlus />}
        headerColor="blue"
        size="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={userFormData.username}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, username: e.target.value })
                }
                className="input-primary"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                className="input-primary"
                placeholder="Enter email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, name: e.target.value })
                }
                className="input-primary"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={userFormData.phone}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, phone: e.target.value })
                }
                className="input-primary"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={userFormData.role}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, role: e.target.value })
                }
                className="input-primary"
                disabled={user.role === "admin"}
              >
                {user.role === "superadmin" && (
                  <>
                    <option value="admin">Admin</option>
                    <option value="subadmin">Subadmin</option>
                  </>
                )}
                {user.role === "admin" && (
                  <option value="subadmin">Subadmin</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editModal.user ? "New Password (optional)" : "Password *"}
              </label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, password: e.target.value })
                }
                className="input-primary"
                placeholder={
                  editModal.user
                    ? "Leave blank to keep current"
                    : "Enter password"
                }
                required={!editModal.user}
              />
            </div>
          </div>

          {/* Company Assignment - Show only companies admin can access */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Assign Companies
              {user.role === "admin" && (
                <span className="text-xs text-gray-500 ml-2">
                  (Only companies assigned to you)
                </span>
              )}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
              {companies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {companies.map((company) => (
                    <label
                      key={company._id}
                      className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={userFormData.companies.includes(company._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserFormData({
                              ...userFormData,
                              companies: [
                                ...userFormData.companies,
                                company._id,
                              ],
                            });
                          } else {
                            setUserFormData({
                              ...userFormData,
                              companies: userFormData.companies.filter(
                                (id) => id !== company._id
                              ),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Building className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">
                          {company.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {user.role === "admin"
                      ? "No companies assigned to you"
                      : "No companies available"}
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: {userFormData.companies.length} companies
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setEditModal({ open: false, user: null })}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editModal.user ? "Update User" : "Create User"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Delete User"
        subtitle="This action cannot be undone"
        headerIcon={<AlertCircle />}
        headerColor="red"
        size="sm"
      >
        {deleteModal.user && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this user?
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {deleteModal.user.name || deleteModal.user.username} -{" "}
                  {deleteModal.user.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn-danger flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Enhanced Create/Edit Company Modal */}
      <Modal
        isOpen={companyModal.open}
        onClose={() => {
          setCompanyModal({ open: false, company: null });
          setSelectedAdmins([]);
          setSelectedSubadmins([]);
        }}
        title={
          companyModal.company
            ? user.role === "admin"
              ? "Assign Subadmins"
              : "Edit Company"
            : "Create New Company"
        }
        subtitle={
          companyModal.company
            ? user.role === "admin"
              ? "Assign subadmins to this company"
              : "Update company information and assignments"
            : "Add a new company to the system"
        }
        headerIcon={<Building />}
        headerColor="orange"
        size="md"
      >
        <form onSubmit={handleSaveCompany} className="space-y-6">
          {/* Company Details - Only for Superadmin */}
          {user.role === "superadmin" && (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={companyFormData.name}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      name: e.target.value,
                    })
                  }
                  className="input-primary"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={companyFormData.description}
                  onChange={(e) =>
                    setCompanyFormData({
                      ...companyFormData,
                      description: e.target.value,
                    })
                  }
                  className="input-primary"
                  rows="3"
                  placeholder="Enter company description"
                />
              </div>
            </div>
          )}

          {/* Company Info Display for Admin */}
          {user.role === "admin" && companyModal.company && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {companyModal.company.name}
                  </h3>
                  <p className="text-gray-600">
                    {companyModal.company.description || "No description"}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                You can only assign subadmins to this company. Company details
                can only be modified by superadmin.
              </p>
            </div>
          )}

          {/* User Assignment Section */}
          <div className="space-y-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">
              {user.role === "admin" ? "Assign Subadmins" : "User Assignments"}
            </h4>

            {/* Admin Assignment - Only for Superadmin */}
            {user.role === "superadmin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assign Admins
                </label>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                  {availableUsers.filter((u) => u.role === "admin").length >
                  0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableUsers
                        .filter((u) => u.role === "admin")
                        .map((admin) => (
                          <label
                            key={admin._id}
                            className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-purple-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAdmins.includes(admin._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAdmins([
                                    ...selectedAdmins,
                                    admin._id,
                                  ]);
                                } else {
                                  setSelectedAdmins(
                                    selectedAdmins.filter(
                                      (id) => id !== admin._id
                                    )
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <Shield className="w-4 h-4 text-purple-600" />
                              <div>
                                <span className="text-sm font-medium">
                                  {admin.name || admin.username}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {admin.email}
                                </p>
                              </div>
                            </div>
                          </label>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">
                        No admins available
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedAdmins.length} admins
                </p>
              </div>
            )}

            {/* Subadmin Assignment - For both Superadmin and Admin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Subadmins
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                {availableUsers.filter((u) => u.role === "subadmin").length >
                0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableUsers
                      .filter((u) => u.role === "subadmin")
                      .map((subadmin) => (
                        <label
                          key={subadmin._id}
                          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSubadmins.includes(subadmin._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubadmins([
                                  ...selectedSubadmins,
                                  subadmin._id,
                                ]);
                              } else {
                                setSelectedSubadmins(
                                  selectedSubadmins.filter(
                                    (id) => id !== subadmin._id
                                  )
                                );
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <User className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="text-sm font-medium">
                                {subadmin.name || subadmin.username}
                              </span>
                              <p className="text-xs text-gray-500">
                                {subadmin.email}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      No subadmins available
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedSubadmins.length} subadmins
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setCompanyModal({ open: false, company: null });
                setSelectedAdmins([]);
                setSelectedSubadmins([]);
              }}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {user.role === "admin"
                    ? "Update Assignments"
                    : companyModal.company
                    ? "Update Company"
                    : "Create Company"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Company Modal */}
      <Modal
        isOpen={companyDeleteModal.open}
        onClose={() => setCompanyDeleteModal({ open: false, company: null })}
        title="Delete Company"
        subtitle="This action cannot be undone"
        headerIcon={<AlertCircle />}
        headerColor="red"
        size="sm"
      >
        {companyDeleteModal.company && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">
                  Are you sure you want to delete this company?
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  {companyDeleteModal.company.name}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  This will remove all user assignments from this company.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() =>
                  setCompanyDeleteModal({ open: false, company: null })
                }
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                className="btn-danger flex-1"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Company
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CompaniesAndUsersManagement;
