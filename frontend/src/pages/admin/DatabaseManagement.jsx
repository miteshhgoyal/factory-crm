import React, { useState, useEffect } from "react";
import {
  Database,
  Trash2,
  Download,
  AlertTriangle,
  Server,
  Users,
  Building2,
  Package,
  IndianRupee,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { databaseAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import HeaderComponent from "../../components/ui/HeaderComponent";
import SectionCard from "../../components/cards/SectionCard";
import StatCard from "../../components/cards/StatCard";
import Modal from "../../components/ui/Modal";

const DatabaseManagement = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [operationResults, setOperationResults] = useState(null);

  // data models configuration - removed users and companies
  const dataModels = [
    {
      key: "employees",
      label: "Employees",
      icon: Users,
      color: "green",
      description: "Employee records and profiles",
      isCompanyScoped: true,
    },
    {
      key: "clients",
      label: "Clients",
      icon: Building2,
      color: "purple",
      description: "Customer and supplier information",
      isCompanyScoped: true,
    },
    {
      key: "clientLedgers",
      label: "Client Ledgers",
      icon: FileText,
      color: "indigo",
      description: "Client transaction records",
      isCompanyScoped: true,
    },
    {
      key: "stocks",
      label: "Stock Entries",
      icon: Package,
      color: "orange",
      description: "Inventory and stock movements",
      isCompanyScoped: true,
    },
    {
      key: "expenses",
      label: "Expenses",
      icon: IndianRupee,
      color: "red",
      description: "Business expense records",
      isCompanyScoped: true,
    },
    {
      key: "cashFlows",
      label: "Cash Flows",
      icon: IndianRupee,
      color: "emerald",
      description: "Cash inflow and outflow records",
      isCompanyScoped: true,
    },
    {
      key: "attendances",
      label: "Attendance",
      icon: Clock,
      color: "yellow",
      description: "Employee attendance records",
      isCompanyScoped: true,
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
      const response = await databaseAPI.clearAll();
      setOperationResults(response.data.results);
      setShowClearAllModal(false);
      await fetchStats();
    } catch (error) {
      console.error("Failed to clear all data:", error);
      setError("Failed to clear all company data");
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

      // Include company name in filename if available
      const companyName =
        response.data.backup?.companyName?.replace(/[^a-z0-9]/gi, "_") ||
        "company";
      link.download = `${companyName}-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowBackupModal(false);
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
        subheader={`Manage data for ${user.selectedCompany} - Company-scoped operations only`}
        onRefresh={fetchStats}
        loading={loading}
      />

      {/* Company Context Alert */}
      {stats?.currentCompanyId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-blue-900 font-medium">
              Company-Scoped Operations
            </p>
            <p className="text-blue-800 text-sm">
              All operations will only affect data for your currently selected
              company. Users and Companies are preserved and cannot be deleted
              through this interface.
            </p>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Records"
            value={stats.totalRecords.toLocaleString()}
            icon={Database}
            color="blue"
            change="All collections"
          />
          <StatCard
            title="Company Records"
            value={stats.companyRecords.toLocaleString()}
            icon={Building2}
            color="green"
            change="Current company"
          />
          <StatCard
            title="Total System Users"
            value={stats["users"].toLocaleString()}
            icon={Users}
            color="blue"
            change="Protected From Deletion"
          />
          <StatCard
            title="Total Companies"
            value={stats["companies"].toLocaleString()}
            icon={Building2}
            color="green"
            change="Protected From Deletion"
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

      {/* Company Data Models */}
      {stats && (
        <SectionCard
          title="Company Data Models"
          icon={Database}
          headerColor="green"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <p className="text-xs text-green-600 mt-1">Company-scoped</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Database Operations */}
      <SectionCard title="Database Operations" icon={Server} headerColor="red">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setShowClearModal(true)}
            disabled={operationLoading || !stats?.currentCompanyId}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={operationLoading || !stats?.currentCompanyId}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-red-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-8 h-8 text-red-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                Clear Company Data
              </h3>
              <p className="text-sm text-gray-600">
                Remove all company records
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowBackupModal(true)}
            disabled={operationLoading || !stats?.currentCompanyId}
            className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-8 h-8 text-green-600" />
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">
                Backup Company Data
              </h3>
              <p className="text-sm text-gray-600">Export company data</p>
            </div>
          </button>
        </div>

        {!stats?.currentCompanyId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                Please select a company to enable database operations.
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Clear Selected Models Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Clear Selected Company Data"
        subtitle="Choose which company data models to clear"
        headerIcon={<Trash2 />}
        headerColor="orange"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-orange-900 mb-1">
                  Company-Scoped Operation
                </h4>
                <p className="text-sm text-orange-800">
                  This will only delete data for your currently selected
                  company. Users and Companies are protected and will not be
                  affected.
                </p>
              </div>
            </div>
          </div>

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
                    <h4 className="font-medium text-gray-900">{model.label}</h4>
                    <p className="text-sm text-gray-500">
                      {count.toLocaleString()} records
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
      </Modal>

      {/* Clear All Data Modal */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        title="Clear All Company Data"
        subtitle="This action cannot be undone"
        headerIcon={<AlertTriangle />}
        headerColor="red"
        size="sm"
      >
        <div className="text-center">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This will permanently delete all data for your currently selected
              company. Users and Companies will remain protected and unaffected.
              Are you sure you want to continue?
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
              <p className="text-sm text-yellow-800">
                <strong>Protected:</strong> Users, Companies
                <br />
                <strong>Will be deleted:</strong> Employees, Clients, Stock,
                Expenses, Cash Flows, Attendance
              </p>
            </div>
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
              {operationLoading ? "Clearing..." : "Clear Company Data"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Backup Database Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Backup Company Data"
        subtitle="Export company data and associated users to a JSON file"
        headerIcon={<Download />}
        headerColor="green"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">
                  Backup includes:
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• All data from your selected company</li>
                  <li>• Users associated with the company</li>
                  <li>• Company information and settings</li>
                  <li>• Employee and client records</li>
                  <li>• Stock entries and transactions</li>
                  <li>• All financial records</li>
                </ul>
              </div>
            </div>
          </div>

          {stats && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Company records to backup:
                </span>
                <span className="text-sm text-gray-600">
                  {stats.companyRecords.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-700">
                  Estimated file size:
                </span>
                <span className="text-sm text-gray-600">
                  {formatBytes(
                    Math.floor(
                      stats.databaseSize *
                        (stats.companyRecords / stats.totalRecords)
                    )
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  File Details:
                </h4>
                <p className="text-sm text-blue-800">
                  The backup will be saved as a JSON file with the company name
                  and today's date. You can use this file to restore or migrate
                  company data later.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowBackupModal(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBackup}
              disabled={operationLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {operationLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Backup
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={operationLoading}
        onClose={() => {}}
        showCloseButton={false}
        closeOnOverlayClick={false}
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Processing...
          </p>
          <p className="text-sm text-gray-600">
            Please wait while we process your request
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseManagement;
