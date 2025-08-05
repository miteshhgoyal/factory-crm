import React, { useState, useEffect } from "react";
import {
  Database,
  Trash2,
  RefreshCw,
  Download,
  AlertTriangle,
  Server,
  HardDrive,
  Users,
  Building2,
  Package,
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";
import { databaseAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import HeaderComponent from "../../components/ui/HeaderComponent";
import SectionCard from "../../components/cards/SectionCard";
import StatCard from "../../components/cards/StatCard";

const DatabaseManagement = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [keepSuperadmin, setKeepSuperadmin] = useState(true);
  const [operationResults, setOperationResults] = useState(null);

  // Data models configuration
  const dataModels = [
    {
      key: "users",
      label: "Users",
      icon: Users,
      color: "blue",
      description: "System users and admin accounts",
    },
    {
      key: "employees",
      label: "Employees",
      icon: Users,
      color: "green",
      description: "Employee records and profiles",
    },
    {
      key: "clients",
      label: "Clients",
      icon: Building2,
      color: "purple",
      description: "Customer and supplier information",
    },
    {
      key: "clientLedgers",
      label: "Client Ledgers",
      icon: FileText,
      color: "indigo",
      description: "Client transaction records",
    },
    {
      key: "stocks",
      label: "Stock Entries",
      icon: Package,
      color: "orange",
      description: "Inventory and stock movements",
    },
    {
      key: "expenses",
      label: "Expenses",
      icon: DollarSign,
      color: "red",
      description: "Business expense records",
    },
    {
      key: "cashFlows",
      label: "Cash Flows",
      icon: DollarSign,
      color: "emerald",
      description: "Cash inflow and outflow records",
    },
    {
      key: "attendances",
      label: "Attendance",
      icon: Clock,
      color: "yellow",
      description: "Employee attendance records",
    },
    {
      key: "managers",
      label: "Managers",
      icon: Shield,
      color: "pink",
      description: "Manager budget and allocation records",
    },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await databaseAPI.getStats();
      console.log(response.data);
      setStats(response.data.data);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch database stats:", error);
      setError("Failed to fetch database statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelection = (modelKey) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelKey)) {
        return prev.filter((key) => key !== modelKey);
      } else {
        return [...prev, modelKey];
      }
    });
  };

  const handleClearModels = async () => {
    if (selectedModels.length === 0) return;

    try {
      setOperationLoading(true);
      const response = await databaseAPI.clearModels({
        models: selectedModels,
        keepSuperadmin,
      });
      setOperationResults(response.data.results);
      setShowClearModal(false);
      setSelectedModels([]);
      await fetchStats();
    } catch (error) {
      console.error("Failed to clear models:", error);
      setError("Failed to clear selected data models");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setOperationLoading(true);
      const response = await databaseAPI.clearAll({ keepSuperadmin });
      setOperationResults(response.data.results);
      setShowClearAllModal(false);
      await fetchStats();
    } catch (error) {
      console.error("Failed to clear all data:", error);
      setError("Failed to clear all data");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleResetSample = async () => {
    if (
      !window.confirm(
        "This will reset the database and remove all current data. Are you sure?"
      )
    ) {
      return;
    }

    try {
      setOperationLoading(true);
      const response = await databaseAPI.resetSample();
      setOperationResults(response.data.results);
      await fetchStats();
      alert(
        "Database reset completed. Run the seeder script to populate with sample data."
      );
    } catch (error) {
      console.error("Failed to reset database:", error);
      setError("Failed to reset database");
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setOperationLoading(true);
      const response = await databaseAPI.backup();

      // Create and download backup file
      const dataStr = JSON.stringify(response.data.backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `database-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create backup:", error);
      setError("Failed to create database backup");
    } finally {
      setOperationLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Database Management"
          subheader="Manage system database and data operations"
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

  if (user.role !== "superadmin") {
    return (
      <div className="space-y-6">
        <HeaderComponent
          header="Database Management"
          subheader="Access Denied"
        />
        <SectionCard
          title="Access Denied"
          icon={AlertTriangle}
          headerColor="red"
        >
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600">
              Only superadmin users can access database management.
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Database Management"
        subheader="Manage system database, clear data, and perform maintenance operations"
        onRefresh={fetchStats}
        loading={loading}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Database Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Records"
            value={stats.totalRecords.toLocaleString()}
            icon={Database}
            color="blue"
            change="All collections"
          />
          <StatCard
            title="Database Size"
            value={formatBytes(stats.databaseSize)}
            icon={HardDrive}
            color="purple"
            change="Storage used"
          />
          <StatCard
            title="Collections"
            value="9"
            icon={Server}
            color="green"
            change="Data models"
          />
          <StatCard
            title="Last Updated"
            value={new Date(stats.lastUpdated).toLocaleTimeString()}
            icon={RefreshCw}
            color="orange"
            change="System time"
          />
        </div>
      )}

      {/* Operation Results */}
      {operationResults && (
        <SectionCard
          title="Operation Results"
          icon={CheckCircle}
          headerColor="green"
          actions={
            <button
              onClick={() => setOperationResults(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          }
        >
          <div className="space-y-3">
            {Object.entries(operationResults).map(([model, result]) => (
              <div
                key={model}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900 capitalize">
                    {model}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {result.success
                    ? `${result.deletedCount} records deleted`
                    : `Error: ${result.error}`}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Data Models Overview */}
      {stats && (
        <SectionCard
          title="Data Models Overview"
          icon={Database}
          headerColor="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataModels.map((model) => {
              const Icon = model.icon;
              const count = stats[model.key] || 0;

              return (
                <div
                  key={model.key}
                  className="p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${model.color}-100 rounded-lg`}>
                        <Icon className={`w-5 h-5 text-${model.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {model.label}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {count.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{model.description}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Database Operations */}
      <SectionCard title="Database Operations" icon={Server} headerColor="red">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setShowClearModal(true)}
            disabled={operationLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-8 h-8 text-orange-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                Clear Selected Data
              </h3>
              <p className="text-sm text-gray-600">
                Choose specific models to clear
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowClearAllModal(true)}
            disabled={operationLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-red-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-red-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Clear All Data</h3>
              <p className="text-sm text-gray-600">Remove all records</p>
            </div>
          </button>

          <button
            onClick={handleResetSample}
            disabled={operationLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Reset to Sample</h3>
              <p className="text-sm text-gray-600">Prepare for sample data</p>
            </div>
          </button>

          <button
            onClick={handleBackup}
            disabled={operationLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-8 h-8 text-green-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Backup Database</h3>
              <p className="text-sm text-gray-600">Export all data</p>
            </div>
          </button>
        </div>
      </SectionCard>

      {/* Clear Selected Models Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Clear Selected Data
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose which data models to clear from the database
                  </p>
                </div>
                <button
                  onClick={() => setShowClearModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dataModels.map((model) => {
                    const Icon = model.icon;
                    const isSelected = selectedModels.includes(model.key);
                    const count = stats?.[model.key] || 0;

                    return (
                      <label
                        key={model.key}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleModelSelection(model.key)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className={`p-2 bg-${model.color}-100 rounded-lg`}>
                          <Icon className={`w-4 h-4 text-${model.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {model.label}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {count.toLocaleString()} records
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedModels.length} model(s) selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearModels}
                    disabled={selectedModels.length === 0 || operationLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {operationLoading ? "Clearing..." : "Clear Selected Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Clear All Data
                  </h2>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  This will permanently delete all data from the database. Are
                  you sure you want to continue?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={operationLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {operationLoading ? "Clearing..." : "Clear All Data"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {operationLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-900">Processing...</p>
            <p className="text-sm text-gray-600">
              Please wait while we process your request
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement;
