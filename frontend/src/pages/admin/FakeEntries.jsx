import React, { useState, useEffect } from "react";
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
  Package,
  IndianRupee,
  Building2,
  Clock,
  Receipt,
  User,
  Loader2,
  Target,
  Settings,
  Zap,
} from "lucide-react";
import {
  employeeAPI,
  clientAPI,
  stockAPI,
  expenseAPI,
  cashFlowAPI,
  userAPI,
  attendanceAPI,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import HeaderComponent from "../../components/ui/HeaderComponent";
import SectionCard from "../../components/cards/SectionCard";

const FakeEntries = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("employees");
  const [quantity, setQuantity] = useState(5);
  const [generatedData, setGeneratedData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [successes, setSuccesses] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({});

  // Simplified data types configuration
  const dataTypes = [
    { key: "employees", label: "Employees", icon: Users, color: "blue" },
    { key: "clients", label: "Clients", icon: Building2, color: "purple" },
    { key: "stockIn", label: "Stock In", icon: Package, color: "green" },
    { key: "stockOut", label: "Stock Out", icon: Package, color: "red" },
    { key: "expenses", label: "Expenses", icon: Receipt, color: "orange" },
    { key: "cashIn", label: "Cash In", icon: IndianRupee, color: "emerald" },
    { key: "cashOut", label: "Cash Out", icon: IndianRupee, color: "red" },
    { key: "attendance", label: "Attendance", icon: Clock, color: "yellow" },
    { key: "users", label: "Users", icon: User, color: "indigo" },
  ];

  // Random data generators with ALL fields from original forms
  const generateRandomData = (type, count) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case "employees":
          data.push(generateEmployee(i));
          break;
        case "clients":
          data.push(generateClient(i));
          break;
        case "stockIn":
          data.push(generateStockIn(i));
          break;
        case "stockOut":
          data.push(generateStockOut(i));
          break;
        case "expenses":
          data.push(generateExpense(i));
          break;
        case "cashIn":
          data.push(generateCashIn(i));
          break;
        case "cashOut":
          data.push(generateCashOut(i));
          break;
        case "attendance":
          data.push(generateAttendance(i));
          break;
        case "users":
          data.push(generateUser(i));
          break;
        default:
          break;
      }
    }
    return data;
  };

  // Employee generator - ALL fields from AddEmployee.jsx
  const generateEmployee = (index) => {
    const names = [
      "Rajesh Kumar",
      "Priya Sharma",
      "Amit Singh",
      "Neha Gupta",
      "Vikram Patel",
      "Sunita Rani",
      "Manoj Verma",
      "Kavita Devi",
      "Ravi Kumar",
      "Anjali Singh",
      "Deepak Sharma",
      "Pooja Gupta",
    ];

    const addresses = [
      "House 10, Sector 1, Budhlada, Punjab",
      "Village Budhlada, Punjab",
      "Near Gurdwara, Budhlada, Punjab",
      "Main Market, Budhlada, Punjab",
      "Civil Lines, Budhlada, Punjab",
      "Model Town, Budhlada, Punjab",
    ];

    const paymentType = Math.random() > 0.5 ? "fixed" : "hourly";
    const hasBank = Math.random() > 0.3;

    return {
      name: names[index % names.length] + ` ${index + 1}`,
      phone: `98765${String(43210 + index).padStart(5, "0")}`,
      address: addresses[index % addresses.length],
      aadharNo: `${String(123456780000 + index).padStart(12, "0")}`,
      panNo: `ABCDE${String(1234 + index).padStart(4, "0")}F`,
      paymentType,
      basicSalary: paymentType === "fixed" ? 10000 + index * 1500 : "",
      hourlyRate: paymentType === "hourly" ? 100 + index * 15 : "",
      workingDays: Math.floor(Math.random() * 6) + 22,
      workingHours: Math.floor(Math.random() * 4) + 7,
      bankAccount: hasBank
        ? {
            accountNo: `${String(12345678900 + index).padStart(11, "0")}`,
            ifsc: "SBIN0001234",
            bankName: "State Bank of India",
            branch: "Budhlada Branch",
          }
        : {
            accountNo: "",
            ifsc: "",
            bankName: "",
            branch: "",
          },
    };
  };

  // Client generator - ALL fields from AddClient.jsx
  const generateClient = (index) => {
    const names = [
      "ABC Industries Ltd",
      "XYZ Traders",
      "Global Suppliers",
      "Local Distributors",
      "Premium Materials",
      "Quality Goods",
      "Fast Trading Co",
      "Best Suppliers",
    ];

    const addresses = [
      "Plot 20, Industrial Area, Budhlada, Punjab",
      "Sector 5, Budhlada, Punjab",
      "Near Bus Stand, Budhlada, Punjab",
      "Main Road, Budhlada, Punjab",
    ];

    const types = ["Customer", "Supplier"];

    return {
      name: names[index % names.length] + ` ${index + 1}`,
      phone: `99887${String(65432 + index).padStart(5, "0")}`,
      address: addresses[index % addresses.length],
      type: types[index % types.length],
      currentBalance: (Math.random() - 0.5) * 20000,
    };
  };

  // Stock In generator - ALL fields from StockIn.jsx
  const generateStockIn = (index) => {
    const products = [
      "PVC Compound Grade A",
      "PVC Compound Grade B",
      "Plastic Granules",
      "Raw Material Type 1",
      "Raw Material Type 2",
      "PVC Resin",
    ];

    const clients = [
      "ABC Suppliers Ltd",
      "XYZ Industries",
      "Global Trading",
      "Local Vendor",
      "Premium Suppliers",
      "Quality Materials",
    ];

    const units = ["kg", "bag"];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = unit === "kg" ? 5 + index * 3 : 1 + Math.floor(index / 2);
    const weightPerBag = 35 + Math.random() * 15;

    return {
      productName: products[index % products.length],
      quantity: quantity.toString(),
      unit,
      rate: (45 + index * 2 + Math.random() * 10).toFixed(2),
      clientName: clients[index % clients.length],
      invoiceNo: `INV-${String(1001 + index).padStart(4, "0")}`,
      notes: `Stock in entry ${index + 1} for testing`,
      weightPerBag: unit === "bag" ? parseFloat(weightPerBag.toFixed(2)) : 40,
    };
  };

  // Stock Out generator - ALL fields from StockOut.jsx
  const generateStockOut = (index) => {
    const products = [
      "PVC Compound Grade A",
      "PVC Compound Grade B",
      "Plastic Granules",
      "Raw Material Type 1",
      "Compound Mix A",
    ];

    const clients = [
      "Customer A Ltd",
      "Customer B Corp",
      "Buyer Industries",
      "Local Customer",
      "Premium Buyers",
      "Quality Users",
    ];

    const units = ["kg", "bag"];
    const unit = units[Math.floor(Math.random() * units.length)];
    const quantity = unit === "kg" ? 3 + index * 2 : 1;
    const weightPerBag = 35 + Math.random() * 15;

    return {
      productName: products[index % products.length],
      quantity: quantity.toString(),
      unit,
      rate: (50 + index * 3 + Math.random() * 15).toFixed(2),
      clientName: clients[index % clients.length],
      invoiceNo: `OUT-${String(2001 + index).padStart(4, "0")}`,
      notes: `Stock out entry ${index + 1} for testing`,
      weightPerBag: unit === "bag" ? parseFloat(weightPerBag.toFixed(2)) : 40,
    };
  };

  // Expense generator - ALL fields from AddExpense.jsx
  const generateExpense = (index) => {
    const categories = [
      "Office Supplies",
      "Utilities",
      "Transportation",
      "Marketing",
      "Maintenance",
      "Professional Services",
      "Raw Materials",
      "Labour",
    ];

    const employees = [
      "Rajesh Kumar",
      "Priya Sharma",
      "Amit Singh",
      "Neha Gupta",
      "",
      "",
    ];

    const today = new Date();
    const pastDate = new Date(
      today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
    );

    return {
      category: categories[index % categories.length],
      amount: (200 + index * 100 + Math.random() * 500).toFixed(2),
      description: `${
        categories[index % categories.length]
      } expense for business - Entry ${index + 1}`,
      employeeName: employees[index % employees.length],
      billNo:
        Math.random() > 0.3
          ? `BILL-${String(3001 + index).padStart(4, "0")}`
          : "",
      date: pastDate.toISOString().split("T")[0],
    };
  };

  // Cash In generator - ALL fields from CashIn.jsx
  const generateCashIn = (index) => {
    const categories = [
      "Sales",
      "Service Income",
      "Investment",
      "Loan Received",
      "Interest Received",
      "Refund",
      "Miscellaneous",
    ];

    const paymentModes = ["Cash", "Bank Transfer", "UPI", "Cheque", "Online"];
    const employees = ["Rajesh Kumar", "Priya Sharma", "", "", ""];

    const paymentMode = paymentModes[index % paymentModes.length];
    const needsTransactionId = ["Online", "UPI", "Bank Transfer"].includes(
      paymentMode
    );

    return {
      amount: (1000 + index * 500 + Math.random() * 1500).toFixed(2),
      category: categories[index % categories.length],
      description: `Cash inflow from ${
        categories[index % categories.length]
      } - Entry ${index + 1}`,
      employeeName: employees[index % employees.length],
      paymentMode,
      transactionId: needsTransactionId
        ? `TXN-${String(4001 + index).padStart(6, "0")}`
        : "",
      isOnline: user.role === "superadmin" && Math.random() > 0.7,
      notes: `Test cash in entry ${index + 1}`,
    };
  };

  // Cash Out generator - ALL fields from CashOut.jsx
  const generateCashOut = (index) => {
    const categories = [
      "Purchase",
      "Utilities",
      "Rent",
      "Transportation",
      "Marketing",
      "Maintenance",
      "Professional Services",
      "Tax",
      "Loan Payment",
    ];

    const paymentModes = ["Cash", "Bank Transfer", "UPI", "Cheque", "Online"];
    const employees = ["Rajesh Kumar", "Priya Sharma", "", "", ""];

    const paymentMode = paymentModes[index % paymentModes.length];
    const needsTransactionId = ["Online", "UPI", "Bank Transfer"].includes(
      paymentMode
    );

    return {
      amount: (500 + index * 300 + Math.random() * 1000).toFixed(2),
      category: categories[index % categories.length],
      description: `Cash outflow for ${
        categories[index % categories.length]
      } - Entry ${index + 1}`,
      employeeName: employees[index % employees.length],
      paymentMode,
      transactionId: needsTransactionId
        ? `TXN-${String(5001 + index).padStart(6, "0")}`
        : "",
      isOnline: user.role === "superadmin" && Math.random() > 0.8,
      notes: `Test cash out entry ${index + 1}`,
    };
  };

  // Attendance generator - ALL fields from MarkAttendance.jsx
  const generateAttendance = (index) => {
    const today = new Date();
    const attendanceDate = new Date(
      today.getTime() - index * 24 * 60 * 60 * 1000
    );
    const isPresent = Math.random() > 0.1;
    const hoursWorked = isPresent ? 7 + Math.random() * 3 : 0;

    return {
      employeeId: `EMP00${index + 1}`,
      date: attendanceDate.toISOString().split("T")[0],
      isPresent,
      hoursWorked: parseFloat(hoursWorked.toFixed(1)),
      notes: isPresent
        ? `Regular attendance - Entry ${index + 1}`
        : `Absent - Entry ${index + 1}`,
    };
  };

  // User generator - ALL fields from UserManagement.jsx
  const generateUser = (index) => {
    const names = [
      "Test Admin",
      "Sub Admin User",
      "Admin User",
    ];

    const roles =
      user.role === "superadmin" ? ["admin", "subadmin"] : ["subadmin"];

    return {
      name: names[index % names.length] + ` ${index + 1}`,
      username: `testuser${index + 1}`,
      email: `testuser${index + 1}@company.com`,
      phone: `97654${String(32100 + index).padStart(5, "0")}`,
      password: `Test@123${index + 1}`,
      role: roles[index % roles.length],
      isActive: Math.random() > 0.05,
    };
  };

  // Generate data
  const handleGenerate = () => {
    setIsGenerating(true);
    setErrors([]);
    setSuccesses([]);

    setTimeout(() => {
      const data = generateRandomData(selectedType, quantity);
      setGeneratedData(data);
      setIsGenerating(false);
      setShowPreview(true);
    }, 500);
  };

  // Process entries one by one
  const processEntries = async () => {
    setIsProcessing(true);
    setProcessedCount(0);
    setErrors([]);
    setSuccesses([]);

    for (let i = 0; i < generatedData.length; i++) {
      try {
        await processEntry(generatedData[i], selectedType);
        setSuccesses((prev) => [
          ...prev,
          `✓ Entry ${i + 1}: ${getEntryDescription(
            generatedData[i],
            selectedType
          )}`,
        ]);
        setProcessedCount(i + 1);
      } catch (error) {
        setErrors((prev) => [
          ...prev,
          `✗ Entry ${i + 1}: ${error.response?.data?.message || error.message}`,
        ]);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsProcessing(false);
  };

  // Process single entry using same APIs as original forms
  const processEntry = async (data, type) => {
    switch (type) {
      case "employees":
        return await employeeAPI.createEmployee(data);
      case "clients":
        return await clientAPI.createClient(data);
      case "stockIn":
        return await stockAPI.addStockIn(data);
      case "stockOut":
        return await stockAPI.addStockOut(data);
      case "expenses":
        return await expenseAPI.addExpense(data);
      case "cashIn":
        return await cashFlowAPI.addCashIn(data);
      case "cashOut":
        return await cashFlowAPI.addCashOut(data);
      case "attendance":
        return await attendanceAPI.markAttendance(data);
      case "users":
        return await userAPI.createUser(data);
      default:
        throw new Error("Unknown entry type");
    }
  };

  // Get entry description
  const getEntryDescription = (data, type) => {
    switch (type) {
      case "employees":
        return data.name;
      case "clients":
        return data.name;
      case "stockIn":
        return `${data.productName} (${data.quantity} ${data.unit})`;
      case "stockOut":
        return `${data.productName} (${data.quantity} ${data.unit})`;
      case "expenses":
        return `${data.category} - ₹${data.amount}`;
      case "cashIn":
        return `${data.category} - ₹${data.amount}`;
      case "cashOut":
        return `${data.category} - ₹${data.amount}`;
      case "attendance":
        return `${data.employeeId} - ${data.date}`;
      case "users":
        return data.name;
      default:
        return "Unknown";
    }
  };

  // Edit functionality
  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditData({ ...generatedData[index] });
  };

  const handleSaveEdit = () => {
    const newData = [...generatedData];
    newData[editingIndex] = editData;
    setGeneratedData(newData);
    setEditingIndex(null);
    setEditData({});
  };

  const handleDelete = (index) => {
    const newData = generatedData.filter((_, i) => i !== index);
    setGeneratedData(newData);
  };

  const handleClearAll = () => {
    setGeneratedData([]);
    setErrors([]);
    setSuccesses([]);
    setProcessedCount(0);
    setShowPreview(false);
  };

  const retryFailed = async () => {
    if (errors.length === 0) return;

    setIsProcessing(true);
    const failedIndices = errors
      .map((error) => {
        const match = error.match(/Entry (\d+):/);
        return match ? parseInt(match[1]) - 1 : -1;
      })
      .filter((index) => index !== -1);

    const newErrors = [];
    const newSuccesses = [...successes];

    for (const index of failedIndices) {
      try {
        await processEntry(generatedData[index], selectedType);
        newSuccesses.push(
          `✓ Entry ${index + 1} processed successfully (retry)`
        );
      } catch (error) {
        newErrors.push(`✗ Entry ${index + 1}: ${error.message} (retry failed)`);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setErrors(newErrors);
    setSuccesses(newSuccesses);
    setIsProcessing(false);
  };

  const selectedConfig = dataTypes.find((type) => type.key === selectedType);

  return (
    <div className="space-y-6">
      <HeaderComponent
        header="Fake Entries Generator"
        subheader="Generate bulk test data for development and testing"
        removeRefresh={true}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="xl:col-span-3">
          <SectionCard
            title="Data Generator"
            icon={Database}
            headerColor="blue"
          >
            <div className="space-y-6">
              {/* Type Selection - Simple Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Data Type
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {dataTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.key;

                    return (
                      <button
                        key={type.key}
                        onClick={() => setSelectedType(type.key)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `border-${type.color}-500 bg-${type.color}-50`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 mx-auto mb-2 ${
                            isSelected
                              ? `text-${type.color}-600`
                              : "text-gray-500"
                          }`}
                        />
                        <p className="text-xs font-medium text-gray-700">
                          {type.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generation Controls */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate Data
                    </>
                  )}
                </button>

                {generatedData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      {showPreview ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {showPreview ? "Hide" : "Show"}
                    </button>

                    <button
                      onClick={handleClearAll}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Generated Data Preview */}
              {generatedData.length > 0 && showPreview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Generated Data ({generatedData.length} entries)
                  </h3>

                  <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                    <div className="space-y-2 p-4">
                      {generatedData.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              Entry {index + 1}:{" "}
                              {getEntryDescription(item, selectedType)}
                            </div>
                            {editingIndex === index ? (
                              <div className="mt-2">
                                <textarea
                                  value={JSON.stringify(editData, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      setEditData(JSON.parse(e.target.value));
                                    } catch (err) {
                                      // Invalid JSON
                                    }
                                  }}
                                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded font-mono text-xs"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingIndex(null)}
                                    className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 mt-1">
                                Click edit to modify •{" "}
                                {Object.keys(item).length} fields
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(index)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(index)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Process Controls */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl mt-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={processEntries}
                        disabled={isProcessing || generatedData.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing... ({processedCount}/
                            {generatedData.length})
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Process All Entries
                          </>
                        )}
                      </button>

                      {errors.length > 0 && (
                        <button
                          onClick={retryFailed}
                          disabled={isProcessing}
                          className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry Failed ({errors.length})
                        </button>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      {processedCount > 0 && (
                        <span>
                          Progress: {processedCount}/{generatedData.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Status Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Current Selection */}
          <SectionCard
            title="Current Selection"
            icon={selectedConfig?.icon || Settings}
            headerColor="gray"
          >
            <div className="text-center">
              {selectedConfig && (
                <selectedConfig.icon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              )}
              <h3 className="font-semibold text-gray-900">
                {selectedConfig?.label}
              </h3>
              <div className="mt-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Generated:</span>
                  <span className="font-medium">{generatedData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processed:</span>
                  <span className="font-medium">{processedCount}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Status Messages */}
          {(successes.length > 0 || errors.length > 0) && (
            <SectionCard title="Status" icon={AlertCircle} headerColor="gray">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {successes.map((success, index) => (
                  <div
                    key={`success-${index}`}
                    className="text-sm p-2 bg-green-50 text-green-800 rounded"
                  >
                    {success}
                  </div>
                ))}

                {errors.map((error, index) => (
                  <div
                    key={`error-${index}`}
                    className="text-sm p-2 bg-red-50 text-red-800 rounded"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Usage Tips */}
          <SectionCard
            title="Quick Tips"
            icon={AlertCircle}
            headerColor="yellow"
          >
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Keep quantity small (1-20) for testing</p>
              <p>• All original form fields included</p>
              <p>• Uses same APIs as original forms</p>
              <p>• Edit entries before processing</p>
              <p>• Retry failed entries if needed</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default FakeEntries;
