import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { userAPI } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "subadmin",
    permissions: [],
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(Array.isArray(response.data.data) ? response.data.data : []);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      role: "subadmin",
      permissions: [],
      isActive: true,
    });
    setSelectedUser(null);
    setShowPassword(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalType("add");
    setShowModal(true);
  };

  const openEditModal = (userItem) => {
    setFormData({
      name: userItem.name,
      username: userItem.username,
      email: userItem.email,
      phone: userItem.phone,
      password: "", // Don't populate password for editing
      role: userItem.role,
      permissions: userItem.permissions || [],
      isActive: userItem.isActive,
    });
    setSelectedUser(userItem);
    setModalType("edit");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "add") {
        await userAPI.createUser(formData);
      } else {
        // Don't send password if it's empty during edit
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await userAPI.updateUser(selectedUser._id, updateData);
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${modalType} user:`, error);
      setError(`Failed to ${modalType} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await userAPI.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const adminUsers = users.filter((u) => u.role === "admin").length;
    const subAdminUsers = users.filter((u) => u.role === "subadmin").length;

    return { totalUsers, activeUsers, adminUsers, subAdminUsers };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="User Management"
          subheader="Manage system users and permissions"
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
        header="User Management"
        subheader="Manage system users, roles, and permissions"
        onRefresh={fetchUsers}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          change="System users"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={UserCheck}
          color="green"
          change="Currently active"
        />
        <StatCard
          title="Admins"
          value={stats.adminUsers}
          icon={Shield}
          color="purple"
          change="Admin level"
        />
        <StatCard
          title="Sub-Admins"
          value={stats.subAdminUsers}
          icon={UserX}
          color="orange"
          change="Sub-admin level"
        />
      </div>

      {/* Users List */}
      <SectionCard
        title="System Users"
        icon={Users}
        headerColor="blue"
        actions={
          user.role === "superadmin" && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  User Details
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Role & Status
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Created By
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Last Login
                </th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr
                  key={userItem._id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {userItem.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userItem.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          @{userItem.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userItem.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          userItem.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : userItem.role === "superadmin"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {userItem.role}
                      </span>

                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          userItem.isActive
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {userItem.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">
                      {userItem.createdBy?.name || "System"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">
                      {userItem.lastLogin
                        ? new Date(userItem.lastLogin).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "Never"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {user.role === "superadmin" && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(userItem)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userItem._id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Deactivate User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No users found
              </h3>
              <p className="text-gray-600 mb-4">
                Start by adding your first user to the system.
              </p>
              {user.role === "superadmin" && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add" ? "Add New User" : "Edit User"}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {modalType === "add"
                      ? "Create a new user account"
                      : `Update ${selectedUser?.name}'s information`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto max-h-[70vh]"
            >
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password{" "}
                    {modalType === "edit" && "(Leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder={
                        modalType === "add"
                          ? "Enter password"
                          : "Enter new password (optional)"
                      }
                      required={modalType === "add"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {user.role === "superadmin" && (
                        <option value="admin">Admin</option>
                      )}
                      <option value="subadmin">Sub-Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            isActive: !formData.isActive,
                          })
                        }
                        className="flex items-center gap-2"
                      >
                        {formData.isActive ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            formData.isActive
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formData.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  {modalType === "add" ? "Create User" : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
