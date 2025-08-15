import React, { useState, useEffect } from "react";
import {
  Settings,
  Building,
  Shield,
  Bell,
  Mail,
  Database,
  Activity,
  Save,
  TestTube,
  Download,
  Power,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  Clock,
  Smartphone,
  Globe,
  Key,
  Server,
  HardDrive,
  Cpu,
  Monitor,
} from "lucide-react";
import { systemSettingsAPI } from "../../../services/api";
import HeaderComponent from "../../../components/ui/HeaderComponent";
import SectionCard from "../../../components/cards/SectionCard";
import StatCard from "../../../components/cards/StatCard";
import FormInput from "../../../components/ui/FormInput";

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [systemLogs, setSystemLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, statsResponse] = await Promise.all([
        systemSettingsAPI.getSettings(),
        systemSettingsAPI.getStats(),
      ]);

      setSettings(settingsResponse.data);
      setSystemStats(statsResponse.data);
    } catch (error) {
      console.error("Failed to fetch system data:", error);
      setErrorMessage("Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await systemSettingsAPI.getLogs({ limit: 20 });
      setSystemLogs(response.data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await systemSettingsAPI.updateSettings(settings);
      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setErrorMessage("Failed to save settings");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const testEmail = prompt("Enter email address to send test email:");
      if (testEmail) {
        await systemSettingsAPI.testEmail({ testEmail });
        setSuccessMessage("Test email sent successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Failed to send test email");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await systemSettingsAPI.createBackup();
      setSuccessMessage("Backup created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchData(); // Refresh stats
    } catch (error) {
      setErrorMessage("Failed to create backup");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      const maintenance = !settings.systemInfo.maintenance;
      const message = maintenance
        ? prompt("Enter maintenance message:") || "System is under maintenance"
        : "";

      await systemSettingsAPI.toggleMaintenance({ maintenance, message });
      setSettings({
        ...settings,
        systemInfo: {
          ...settings.systemInfo,
          maintenance,
          maintenanceMessage: message,
        },
      });

      setSuccessMessage(
        `Maintenance mode ${maintenance ? "enabled" : "disabled"}!`
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage("Failed to toggle maintenance mode");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const updateSettings = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    });
  };

  const updateNestedSettings = (section, subsection, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [subsection]: {
          ...settings[section][subsection],
          [field]: value,
        },
      },
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: "company", label: "Company Info", icon: Building },
    { id: "business", label: "Business", icon: Activity },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "email", label: "Email Config", icon: Mail },
    { id: "backup", label: "Backup", icon: Database },
    { id: "system", label: "System", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="System Settings"
          subheader="Configure system-wide settings and preferences"
          loading={loading}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="System Settings"
        subheader="Configure system-wide settings and preferences"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-medium">{errorMessage}</span>
        </div>
      )}

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={systemStats?.users?.total || 0}
          icon={Shield}
          color="blue"
          change={`${systemStats?.users?.admins || 0} admins`}
        />
        <StatCard
          title="Employees"
          value={systemStats?.business?.employees || 0}
          icon={Activity}
          color="green"
          change="Active employees"
        />
        <StatCard
          title="System Uptime"
          value={formatUptime(systemStats?.system?.uptime || 0)}
          icon={Clock}
          color="purple"
          change="Current session"
        />
        <StatCard
          title="Memory Usage"
          value={formatBytes(systemStats?.system?.memoryUsage?.used || 0)}
          icon={Cpu}
          color="orange"
          change="RAM usage"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Settings
        </button>

        <button
          onClick={handleCreateBackup}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Create Backup
        </button>

        <button
          onClick={handleToggleMaintenance}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:shadow-lg transition-all ${
            settings?.systemInfo?.maintenance
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
              : "bg-gradient-to-r from-orange-600 to-orange-700 text-white"
          }`}
        >
          <Power className="w-4 h-4" />
          {settings?.systemInfo?.maintenance ? "Disable" : "Enable"} Maintenance
        </button>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Company Info Tab */}
          {activeTab === "company" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Company Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Company Name"
                  value={settings?.companyInfo?.name || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "name", e.target.value)
                  }
                  placeholder="Enter company name"
                  theme="white"
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={settings?.companyInfo?.email || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "email", e.target.value)
                  }
                  placeholder="Enter company email"
                  theme="white"
                />

                <FormInput
                  label="Phone"
                  value={settings?.companyInfo?.phone || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "phone", e.target.value)
                  }
                  placeholder="Enter phone number"
                  theme="white"
                />

                <FormInput
                  label="Website"
                  value={settings?.companyInfo?.website || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "website", e.target.value)
                  }
                  placeholder="Enter website URL"
                  theme="white"
                />

                <FormInput
                  label="GST Number"
                  value={settings?.companyInfo?.gstNumber || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "gstNumber", e.target.value)
                  }
                  placeholder="Enter GST number"
                  theme="white"
                />

                <FormInput
                  label="PAN Number"
                  value={settings?.companyInfo?.panNumber || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "panNumber", e.target.value)
                  }
                  placeholder="Enter PAN number"
                  theme="white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={settings?.companyInfo?.address || ""}
                  onChange={(e) =>
                    updateSettings("companyInfo", "address", e.target.value)
                  }
                  placeholder="Enter company address"
                  rows={3}
                  className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Business Settings Tab */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Business Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings?.businessSettings?.currency || "INR"}
                    onChange={(e) =>
                      updateSettings(
                        "businessSettings",
                        "currency",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                  >
                    <option value="INR">Indian Rupee (INR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Zone
                  </label>
                  <select
                    value={
                      settings?.businessSettings?.timeZone || "Asia/Kolkata"
                    }
                    onChange={(e) =>
                      updateSettings(
                        "businessSettings",
                        "timeZone",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </div>

                <FormInput
                  label="Working Hours per Day"
                  type="number"
                  min="1"
                  max="24"
                  value={settings?.businessSettings?.workingHours || 8}
                  onChange={(e) =>
                    updateSettings(
                      "businessSettings",
                      "workingHours",
                      parseInt(e.target.value)
                    )
                  }
                  theme="white"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiscal Year Start Month
                  </label>
                  <select
                    value={settings?.businessSettings?.fiscalYearStart || 4}
                    onChange={(e) =>
                      updateSettings(
                        "businessSettings",
                        "fiscalYearStart",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i, 1).toLocaleDateString("en-US", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Security Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Minimum Password Length"
                  type="number"
                  min="4"
                  max="20"
                  value={
                    settings?.securitySettings?.passwordPolicy?.minLength || 6
                  }
                  onChange={(e) =>
                    updateNestedSettings(
                      "securitySettings",
                      "passwordPolicy",
                      "minLength",
                      parseInt(e.target.value)
                    )
                  }
                  theme="white"
                />

                <FormInput
                  label="Session Timeout (hours)"
                  type="number"
                  min="1"
                  max="168"
                  value={settings?.securitySettings?.sessionTimeout || 24}
                  onChange={(e) =>
                    updateSettings(
                      "securitySettings",
                      "sessionTimeout",
                      parseInt(e.target.value)
                    )
                  }
                  theme="white"
                />

                <FormInput
                  label="Max Login Attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={settings?.securitySettings?.loginAttempts || 5}
                  onChange={(e) =>
                    updateSettings(
                      "securitySettings",
                      "loginAttempts",
                      parseInt(e.target.value)
                    )
                  }
                  theme="white"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Password Requirements
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        settings?.securitySettings?.passwordPolicy
                          ?.requireUppercase || false
                      }
                      onChange={(e) =>
                        updateNestedSettings(
                          "securitySettings",
                          "passwordPolicy",
                          "requireUppercase",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Require uppercase letters
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        settings?.securitySettings?.passwordPolicy
                          ?.requireNumbers || false
                      }
                      onChange={(e) =>
                        updateNestedSettings(
                          "securitySettings",
                          "passwordPolicy",
                          "requireNumbers",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Require numbers
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        settings?.securitySettings?.passwordPolicy
                          ?.requireSymbols || false
                      }
                      onChange={(e) =>
                        updateNestedSettings(
                          "securitySettings",
                          "passwordPolicy",
                          "requireSymbols",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Require special characters
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={
                        settings?.securitySettings?.twoFactorAuth || false
                      }
                      onChange={(e) =>
                        updateSettings(
                          "securitySettings",
                          "twoFactorAuth",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Enable Two-Factor Authentication
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">IP Restrictions</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed IP Addresses (one per line)
                  </label>
                  <textarea
                    value={
                      settings?.securitySettings?.allowedIPs?.join("\n") || ""
                    }
                    onChange={(e) =>
                      updateSettings(
                        "securitySettings",
                        "allowedIPs",
                        e.target.value.split("\n").filter((ip) => ip.trim())
                      )
                    }
                    placeholder="192.168.1.1&#10;10.0.0.1&#10;Leave empty to allow all IPs"
                    rows={4}
                    className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to allow access from all IP addresses
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Notification Settings
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      General Notifications
                    </h4>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.emailNotifications || false
                        }
                        onChange={(e) =>
                          updateSettings(
                            "notifications",
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">
                        Enable Email Notifications
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.smsNotifications || false
                        }
                        onChange={(e) =>
                          updateSettings(
                            "notifications",
                            "smsNotifications",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Smartphone className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        Enable SMS Notifications
                      </span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Business Alerts
                    </h4>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.lowStockAlert || false
                        }
                        onChange={(e) =>
                          updateSettings(
                            "notifications",
                            "lowStockAlert",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-700">
                        Low Stock Alerts
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.salaryReminders || false
                        }
                        onChange={(e) =>
                          updateSettings(
                            "notifications",
                            "salaryReminders",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">
                        Salary Reminders
                      </span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={
                          settings?.notifications?.expenseApprovals || false
                        }
                        onChange={(e) =>
                          updateSettings(
                            "notifications",
                            "expenseApprovals",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        Expense Approval Notifications
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <FormInput
                    label="Low Stock Threshold"
                    type="number"
                    min="1"
                    value={settings?.notifications?.lowStockThreshold || 100}
                    onChange={(e) =>
                      updateSettings(
                        "notifications",
                        "lowStockThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    placeholder="Enter threshold quantity"
                    theme="white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock quantity falls below this number
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Configuration Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Email Configuration
                </h3>
                <button
                  onClick={handleTestEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  Test Email
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="SMTP Host"
                  value={settings?.emailConfig?.smtpHost || ""}
                  onChange={(e) =>
                    updateSettings("emailConfig", "smtpHost", e.target.value)
                  }
                  placeholder="smtp.gmail.com"
                  theme="white"
                />

                <FormInput
                  label="SMTP Port"
                  type="number"
                  value={settings?.emailConfig?.smtpPort || 587}
                  onChange={(e) =>
                    updateSettings(
                      "emailConfig",
                      "smtpPort",
                      parseInt(e.target.value)
                    )
                  }
                  theme="white"
                />

                <FormInput
                  label="SMTP Username"
                  value={settings?.emailConfig?.smtpUser || ""}
                  onChange={(e) =>
                    updateSettings("emailConfig", "smtpUser", e.target.value)
                  }
                  placeholder="your-email@gmail.com"
                  theme="white"
                />

                <FormInput
                  label="SMTP Password"
                  type="password"
                  value={settings?.emailConfig?.smtpPassword || ""}
                  onChange={(e) =>
                    updateSettings(
                      "emailConfig",
                      "smtpPassword",
                      e.target.value
                    )
                  }
                  placeholder="Enter SMTP password"
                  theme="white"
                />

                <FormInput
                  label="From Email"
                  type="email"
                  value={settings?.emailConfig?.fromEmail || ""}
                  onChange={(e) =>
                    updateSettings("emailConfig", "fromEmail", e.target.value)
                  }
                  placeholder="noreply@yourcompany.com"
                  theme="white"
                />

                <FormInput
                  label="From Name"
                  value={settings?.emailConfig?.fromName || ""}
                  onChange={(e) =>
                    updateSettings("emailConfig", "fromName", e.target.value)
                  }
                  placeholder="Your Company Name"
                  theme="white"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Email Configuration Help
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    • For Gmail: Host: smtp.gmail.com, Port: 587, Enable "Less
                    secure app access"
                  </p>
                  <p>• For Outlook: Host: smtp-mail.outlook.com, Port: 587</p>
                  <p>• For Yahoo: Host: smtp.mail.yahoo.com, Port: 587</p>
                  <p>• Use app passwords for accounts with 2FA enabled</p>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings Tab */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Backup Settings
                </h3>
                <button
                  onClick={handleCreateBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Create Backup Now
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Automatic Backup
                  </h4>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={settings?.backupSettings?.autoBackup || false}
                      onChange={(e) =>
                        updateSettings(
                          "backupSettings",
                          "autoBackup",
                          e.target.checked
                        )
                      }
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      Enable Automatic Backup
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backup Frequency
                    </label>
                    <select
                      value={
                        settings?.backupSettings?.backupFrequency || "weekly"
                      }
                      onChange={(e) =>
                        updateSettings(
                          "backupSettings",
                          "backupFrequency",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all duration-200"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <FormInput
                    label="Retention Period (days)"
                    type="number"
                    min="1"
                    max="365"
                    value={settings?.backupSettings?.retentionDays || 30}
                    onChange={(e) =>
                      updateSettings(
                        "backupSettings",
                        "retentionDays",
                        parseInt(e.target.value)
                      )
                    }
                    theme="white"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Backup Status</h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">
                        Last Backup:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {settings?.backupSettings?.lastBackup
                          ? new Date(
                              settings.backupSettings.lastBackup
                            ).toLocaleString()
                          : "Never"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">
                        Auto Backup:
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          settings?.backupSettings?.autoBackup
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {settings?.backupSettings?.autoBackup
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Frequency:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {settings?.backupSettings?.backupFrequency || "weekly"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h4 className="font-medium text-orange-900 mb-2">
                  Backup Guidelines
                </h4>
                <div className="text-sm text-orange-800 space-y-1">
                  <p>• Regular backups protect your data from loss</p>
                  <p>• Store backups in a secure, separate location</p>
                  <p>• Test backup restoration periodically</p>
                  <p>• Automatic backups run during low-traffic hours</p>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                System Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">System Details</h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Version:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {settings?.systemInfo?.version || "1.0.0"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">Uptime:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatUptime(systemStats?.system?.uptime || 0)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">
                        Memory Usage:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatBytes(
                          systemStats?.system?.memoryUsage?.used || 0
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700">
                        Last Updated:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {settings?.systemInfo?.lastUpdated
                          ? new Date(
                              settings.systemInfo.lastUpdated
                            ).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Mode */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Maintenance Mode
                  </h4>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Status:</span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          settings?.systemInfo?.maintenance
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {settings?.systemInfo?.maintenance
                          ? "Maintenance Active"
                          : "System Online"}
                      </span>
                    </div>

                    {settings?.systemInfo?.maintenance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maintenance Message
                        </label>
                        <textarea
                          value={settings?.systemInfo?.maintenanceMessage || ""}
                          onChange={(e) =>
                            updateNestedSettings(
                              "systemInfo",
                              "maintenanceMessage",
                              e.target.value
                            )
                          }
                          placeholder="System is under maintenance"
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleToggleMaintenance}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        settings?.systemInfo?.maintenance
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      {settings?.systemInfo?.maintenance
                        ? "Exit Maintenance"
                        : "Enter Maintenance"}
                    </button>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    Recent System Logs
                  </h4>
                  <button
                    onClick={fetchSystemLogs}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Refresh Logs
                  </button>
                </div>

                <div className="bg-gray-900 rounded-xl p-4 max-h-64 overflow-y-auto">
                  {systemLogs.length > 0 ? (
                    <div className="space-y-2">
                      {systemLogs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">
                          <span className="text-gray-400">
                            [{new Date(log.timestamp).toLocaleString()}]
                          </span>
                          <span
                            className={`ml-2 ${
                              log.level === "error"
                                ? "text-red-400"
                                : log.level === "warn"
                                ? "text-yellow-400"
                                : "text-green-400"
                            }`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                          <span className="text-white ml-2">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p>No recent logs available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
