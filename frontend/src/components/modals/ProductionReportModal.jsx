import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  AlertCircle,
  Loader2,
  Factory,
  Thermometer,
  Droplets,
  User,
  Wrench,
  FileText,
  Award,
  Info,
  Package,
  Settings,
  TestTube,
  BarChart3,
  Clock,
  Beaker,
} from "lucide-react";
import Modal from "../ui/Modal";
import { stockAPI } from "../../services/api";

const ProductionReportModal = ({
  isOpen,
  onClose,
  stockTransactionId,
  stockTransaction,
  onReportCreated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingReport, setExistingReport] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Information
    batchNumber: "",
    productionDate: new Date().toISOString().split("T")[0],
    qualityGrade: "A",
    formulationCode: "",
    supervisor: "",
    operator: "",

    // Raw Materials (5 materials max)
    rawMaterial1Name: "",
    rawMaterial1Quantity: "",
    rawMaterial1Unit: "kg",
    rawMaterial2Name: "",
    rawMaterial2Quantity: "",
    rawMaterial2Unit: "kg",
    rawMaterial3Name: "",
    rawMaterial3Quantity: "",
    rawMaterial3Unit: "kg",
    rawMaterial4Name: "",
    rawMaterial4Quantity: "",
    rawMaterial4Unit: "kg",
    rawMaterial5Name: "",
    rawMaterial5Quantity: "",
    rawMaterial5Unit: "kg",

    // PVC Specific - Raw Materials
    pvcResinKValue: "",
    pvcResinSupplier: "",
    pvcResinBatchNo: "",
    pvcResinQuantity: "",
    stabilizerType: "",
    stabilizerQuantity: "",
    internalLubricantQuantity: "",
    externalLubricantQuantity: "",
    impactModifierQuantity: "",
    processingAidQuantity: "",
    colorantQuantity: "",
    plasticizer: "",
    plasticizerQuantity: "",

    // Process Parameters
    polymerizationTemperature: "",
    polymerizationPressure: "",
    polymerizationTime: "",
    polymerizationPH: "",
    mixingTemperature: "",
    mixingTime: "",
    mixingRPM: "",
    mixingTorque: "",
    extruderTemperature: "",
    screwSpeed: "",
    diePressure: "",
    coolingWaterTemp: "",

    // Physical Properties
    bulkDensity: "",
    apparentDensity: "",
    averageParticleSize: "",
    particleSizeRange: "",
    moistureContent: "",
    volatilesContent: "",

    // Mechanical Properties
    kValue: "",
    meltFlowIndex: "",
    shoreHardness: "",
    tensileStrength: "",
    impactStrength: "",

    // Thermal Properties
    heatDeflectionTemp: "",
    vicatSofteningTemp: "",
    thermalStabilityTime: "",
    congoRedTestResult: "",

    // Chemical Properties
    residualVCMContent: "",
    leadContent: "",
    cadmiumContent: "",
    mercuryContent: "",
    pHAqueousExtract: "",
    ashContent: "",

    // Processing Properties
    gelationTime: "",
    fusionCharacteristics: "",
    viscosityAtProcessingTemp: "",
    torqueRheometerResult: "",

    // Water Tests
    waterAbsorption24h: "",
    dimensionalStabilityWater: "",
    hydrostaticStrength: "",
    chemicalResistance: "",

    // Environmental & Safety
    vocEmission: "",
    plasticizerMigration: "",
    heavyMetalLeaching: "",
    flameRetardancy: "",

    // Visual Quality
    colorConsistencyL: "",
    colorConsistencyA: "",
    colorConsistencyB: "",
    surfaceQuality: "",
    transparencyLevel: "",
    foreignParticles: "",
    granuleShapeUniformity: "",

    // Production Efficiency
    yieldPercentage: "",
    wasteGenerated: "",
    energyConsumed: "",
    cycleTime: "",
    throughputRate: "",

    // Equipment (5 equipment max)
    equipment1: "",
    equipment2: "",
    equipment3: "",
    equipment4: "",
    equipment5: "",

    // Standards Compliance
    astmStandardsMet: "",
    isoStandardsMet: "",
    bisStandardsMet: "",
    fdaCompliance: false,
    reachCompliance: false,

    // Storage & Quality
    storageTemperature: "",
    storageHumidity: "",
    packagingMethod: "",
    shelfLife: "",
    storageLocation: "",

    // Defects & Quality
    defectsFound: "",
    rejectionRate: "",
    rootCauseAnalysis: "",
    correctiveActions: "",

    // Notes
    remarks: "",
    qualityNotes: "",
    productionNotes: "",
  });

  // Check for existing report when modal opens
  useEffect(() => {
    if (isOpen && stockTransactionId) {
      checkExistingReport();
      generateBatchNumber();
    }
  }, [isOpen, stockTransactionId]);

  const generateBatchNumber = () => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const batchNo = `PVC-${dateStr}`;

    setFormData((prev) => ({
      ...prev,
      batchNumber: prev.batchNumber || batchNo,
    }));
  };

  const checkExistingReport = async () => {
    try {
      setExistingReport(null);
      const response = await stockAPI.getProductionReportByStockId(
        stockTransactionId
      );
      if (response.data.success) {
        setExistingReport(response.data.data);
        const reportData = response.data.data;
        setFormData({
          ...formData,
          ...reportData,
          productionDate: reportData.productionDate
            ? new Date(reportData.productionDate).toISOString().split("T")[0]
            : formData.productionDate,
        });
      }
    } catch (error) {
      console.log("No existing report found");
      setExistingReport(null);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = "Batch number is required";
    }

    if (!formData.productionDate) {
      newErrors.productionDate = "Production date is required";
    }

    if (!formData.supervisor.trim()) {
      newErrors.supervisor = "Supervisor name is required";
    }

    if (!formData.operator.trim()) {
      newErrors.operator = "Operator name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      const submitData = { ...formData };

      // Convert numeric fields and remove empty ones
      const numericFields = [
        "pvcResinKValue",
        "pvcResinQuantity",
        "stabilizerQuantity",
        "internalLubricantQuantity",
        "externalLubricantQuantity",
        "impactModifierQuantity",
        "processingAidQuantity",
        "colorantQuantity",
        "plasticizerQuantity",
        "polymerizationTemperature",
        "polymerizationPressure",
        "polymerizationTime",
        "polymerizationPH",
        "mixingTemperature",
        "mixingTime",
        "mixingRPM",
        "mixingTorque",
        "extruderTemperature",
        "screwSpeed",
        "diePressure",
        "coolingWaterTemp",
        "bulkDensity",
        "apparentDensity",
        "averageParticleSize",
        "moistureContent",
        "volatilesContent",
        "kValue",
        "meltFlowIndex",
        "shoreHardness",
        "tensileStrength",
        "impactStrength",
        "heatDeflectionTemp",
        "vicatSofteningTemp",
        "thermalStabilityTime",
        "residualVCMContent",
        "leadContent",
        "cadmiumContent",
        "mercuryContent",
        "pHAqueousExtract",
        "ashContent",
        "gelationTime",
        "viscosityAtProcessingTemp",
        "waterAbsorption24h",
        "dimensionalStabilityWater",
        "hydrostaticStrength",
        "vocEmission",
        "plasticizerMigration",
        "colorConsistencyL",
        "colorConsistencyA",
        "colorConsistencyB",
        "yieldPercentage",
        "wasteGenerated",
        "energyConsumed",
        "cycleTime",
        "throughputRate",
        "storageTemperature",
        "storageHumidity",
        "shelfLife",
        "rejectionRate",
        "rawMaterial1Quantity",
        "rawMaterial2Quantity",
        "rawMaterial3Quantity",
        "rawMaterial4Quantity",
        "rawMaterial5Quantity",
      ];

      numericFields.forEach((field) => {
        if (submitData[field] && submitData[field] !== "") {
          const numValue = parseFloat(submitData[field]);
          if (!isNaN(numValue)) {
            submitData[field] = numValue;
          } else {
            delete submitData[field];
          }
        } else {
          delete submitData[field];
        }
      });

      // Remove empty string fields
      Object.keys(submitData).forEach((key) => {
        if (
          submitData[key] === "" ||
          submitData[key] === null ||
          submitData[key] === undefined
        ) {
          delete submitData[key];
        }
      });

      let response;
      if (existingReport) {
        response = await stockAPI.updateProductionReport(
          existingReport._id,
          submitData
        );
      } else {
        response = await stockAPI.createProductionReport(
          stockTransactionId,
          submitData
        );
      }

      if (response.data.success) {
        onReportCreated && onReportCreated(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({
        submit:
          error.response?.data?.message || "Failed to save production report",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        existingReport ? "Update Production Report" : "Create Production Report"
      }
      subtitle={
        stockTransaction
          ? `${stockTransaction.productName} - ${stockTransaction.quantity} ${stockTransaction.unit}`
          : "Add detailed production information"
      }
      headerIcon={<Factory />}
      headerColor="green"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-3" />
            <span className="text-red-700">{errors.submit}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-8 pr-2">
          {/* Basic Information Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    handleInputChange("batchNumber", e.target.value)
                  }
                  className={`input-primary ${
                    errors.batchNumber ? "border-red-500" : ""
                  }`}
                  placeholder="Enter batch number"
                />
                {errors.batchNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.batchNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Production Date *
                </label>
                <input
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) =>
                    handleInputChange("productionDate", e.target.value)
                  }
                  className={`input-primary ${
                    errors.productionDate ? "border-red-500" : ""
                  }`}
                />
                {errors.productionDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.productionDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade *
                </label>
                <select
                  value={formData.qualityGrade}
                  onChange={(e) =>
                    handleInputChange("qualityGrade", e.target.value)
                  }
                  className="input-primary"
                >
                  <option value="A+">A+ (Premium)</option>
                  <option value="A">A (High)</option>
                  <option value="B+">B+ (Good)</option>
                  <option value="B">B (Standard)</option>
                  <option value="C">C (Low)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formulation Code
                </label>
                <input
                  type="text"
                  value={formData.formulationCode}
                  onChange={(e) =>
                    handleInputChange("formulationCode", e.target.value)
                  }
                  className="input-primary"
                  placeholder="PVC-001-2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor *
                </label>
                <input
                  type="text"
                  value={formData.supervisor}
                  onChange={(e) =>
                    handleInputChange("supervisor", e.target.value)
                  }
                  className={`input-primary ${
                    errors.supervisor ? "border-red-500" : ""
                  }`}
                  placeholder="Supervisor name"
                />
                {errors.supervisor && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.supervisor}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator *
                </label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) =>
                    handleInputChange("operator", e.target.value)
                  }
                  className={`input-primary ${
                    errors.operator ? "border-red-500" : ""
                  }`}
                  placeholder="Operator name"
                />
                {errors.operator && (
                  <p className="mt-1 text-sm text-red-600">{errors.operator}</p>
                )}
              </div>
            </div>
          </div>

          {/* Raw Materials Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Raw Materials
              </h3>
            </div>

            {/* PVC Specific Materials */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-blue-800 mb-3">
                PVC Specific Materials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PVC Resin K-Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pvcResinKValue}
                    onChange={(e) =>
                      handleInputChange("pvcResinKValue", e.target.value)
                    }
                    className="input-primary"
                    placeholder="67.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PVC Resin Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.pvcResinSupplier}
                    onChange={(e) =>
                      handleInputChange("pvcResinSupplier", e.target.value)
                    }
                    className="input-primary"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PVC Resin Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pvcResinQuantity}
                    onChange={(e) =>
                      handleInputChange("pvcResinQuantity", e.target.value)
                    }
                    className="input-primary"
                    placeholder="1000.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stabilizer Type
                  </label>
                  <select
                    value={formData.stabilizerType}
                    onChange={(e) =>
                      handleInputChange("stabilizerType", e.target.value)
                    }
                    className="input-primary"
                  >
                    <option value="">Select Type</option>
                    <option value="Lead-based">Lead-based</option>
                    <option value="Tin-based">Tin-based</option>
                    <option value="Calcium-based">Calcium-based</option>
                    <option value="Organic">Organic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stabilizer Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stabilizerQuantity}
                    onChange={(e) =>
                      handleInputChange("stabilizerQuantity", e.target.value)
                    }
                    className="input-primary"
                    placeholder="25.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Lubricant (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.internalLubricantQuantity}
                    onChange={(e) =>
                      handleInputChange(
                        "internalLubricantQuantity",
                        e.target.value
                      )
                    }
                    className="input-primary"
                    placeholder="5.0"
                  />
                </div>
              </div>
            </div>

            {/* General Raw Materials */}
            <div>
              <h4 className="text-md font-semibold text-blue-800 mb-3">
                Additional Raw Materials
              </h4>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white/50 rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material {num} Name
                      </label>
                      <input
                        type="text"
                        value={formData[`rawMaterial${num}Name`]}
                        onChange={(e) =>
                          handleInputChange(
                            `rawMaterial${num}Name`,
                            e.target.value
                          )
                        }
                        className="input-primary"
                        placeholder="Material name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData[`rawMaterial${num}Quantity`]}
                        onChange={(e) =>
                          handleInputChange(
                            `rawMaterial${num}Quantity`,
                            e.target.value
                          )
                        }
                        className="input-primary"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={formData[`rawMaterial${num}Unit`]}
                        onChange={(e) =>
                          handleInputChange(
                            `rawMaterial${num}Unit`,
                            e.target.value
                          )
                        }
                        className="input-primary"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Process Parameters Section */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-900">
                Process Parameters
              </h3>
            </div>

            <div className="space-y-6">
              {/* Polymerization Process */}
              <div>
                <h4 className="text-md font-semibold text-purple-800 mb-3">
                  Polymerization Process
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.polymerizationTemperature}
                      onChange={(e) =>
                        handleInputChange(
                          "polymerizationTemperature",
                          e.target.value
                        )
                      }
                      className="input-primary"
                      placeholder="50.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pressure (bar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.polymerizationPressure}
                      onChange={(e) =>
                        handleInputChange(
                          "polymerizationPressure",
                          e.target.value
                        )
                      }
                      className="input-primary"
                      placeholder="8.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time (hours)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.polymerizationTime}
                      onChange={(e) =>
                        handleInputChange("polymerizationTime", e.target.value)
                      }
                      className="input-primary"
                      placeholder="4.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      pH Level
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="14"
                      value={formData.polymerizationPH}
                      onChange={(e) =>
                        handleInputChange("polymerizationPH", e.target.value)
                      }
                      className="input-primary"
                      placeholder="7.0"
                    />
                  </div>
                </div>
              </div>

              {/* Mixing Process */}
              <div>
                <h4 className="text-md font-semibold text-purple-800 mb-3">
                  Mixing Process
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.mixingTemperature}
                      onChange={(e) =>
                        handleInputChange("mixingTemperature", e.target.value)
                      }
                      className="input-primary"
                      placeholder="120.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time (minutes)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.mixingTime}
                      onChange={(e) =>
                        handleInputChange("mixingTime", e.target.value)
                      }
                      className="input-primary"
                      placeholder="15.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RPM
                    </label>
                    <input
                      type="number"
                      value={formData.mixingRPM}
                      onChange={(e) =>
                        handleInputChange("mixingRPM", e.target.value)
                      }
                      className="input-primary"
                      placeholder="35"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Torque (Nm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.mixingTorque}
                      onChange={(e) =>
                        handleInputChange("mixingTorque", e.target.value)
                      }
                      className="input-primary"
                      placeholder="85.0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Properties Section */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TestTube className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">
                Quality Properties
              </h3>
            </div>

            <div className="space-y-6">
              {/* Physical Properties */}
              <div>
                <h4 className="text-md font-semibold text-orange-800 mb-3">
                  Physical Properties
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bulk Density (g/cm³)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.bulkDensity}
                      onChange={(e) =>
                        handleInputChange("bulkDensity", e.target.value)
                      }
                      className="input-primary"
                      placeholder="0.650"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      K-Value
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.kValue}
                      onChange={(e) =>
                        handleInputChange("kValue", e.target.value)
                      }
                      className="input-primary"
                      placeholder="67.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Moisture Content (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.moistureContent}
                      onChange={(e) =>
                        handleInputChange("moistureContent", e.target.value)
                      }
                      className="input-primary"
                      placeholder="0.05"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tensile Strength (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tensileStrength}
                      onChange={(e) =>
                        handleInputChange("tensileStrength", e.target.value)
                      }
                      className="input-primary"
                      placeholder="52.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shore Hardness
                    </label>
                    <input
                      type="number"
                      value={formData.shoreHardness}
                      onChange={(e) =>
                        handleInputChange("shoreHardness", e.target.value)
                      }
                      className="input-primary"
                      placeholder="80"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Residual VCM (ppm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.residualVCMContent}
                      onChange={(e) =>
                        handleInputChange("residualVCMContent", e.target.value)
                      }
                      className="input-primary"
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Production Efficiency Section */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-teal-900">
                Production Efficiency
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yield Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.yieldPercentage}
                  onChange={(e) =>
                    handleInputChange("yieldPercentage", e.target.value)
                  }
                  className="input-primary"
                  placeholder="95.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Consumed (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.energyConsumed}
                  onChange={(e) =>
                    handleInputChange("energyConsumed", e.target.value)
                  }
                  className="input-primary"
                  placeholder="125.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cycle Time (hours)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cycleTime}
                  onChange={(e) =>
                    handleInputChange("cycleTime", e.target.value)
                  }
                  className="input-primary"
                  placeholder="8.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Throughput Rate (kg/hr)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.throughputRate}
                  onChange={(e) =>
                    handleInputChange("throughputRate", e.target.value)
                  }
                  className="input-primary"
                  placeholder="150.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rejectionRate}
                  onChange={(e) =>
                    handleInputChange("rejectionRate", e.target.value)
                  }
                  className="input-primary"
                  placeholder="1.5"
                />
              </div>
            </div>
          </div>

          {/* Equipment & Storage Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-indigo-900">
                Equipment & Storage
              </h3>
            </div>

            <div className="space-y-6">
              {/* Equipment */}
              <div>
                <h4 className="text-md font-semibold text-indigo-800 mb-3">
                  Equipment Used
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment {num}
                      </label>
                      <input
                        type="text"
                        value={formData[`equipment${num}`]}
                        onChange={(e) =>
                          handleInputChange(`equipment${num}`, e.target.value)
                        }
                        className="input-primary"
                        placeholder="Equipment name/ID"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage */}
              <div>
                <h4 className="text-md font-semibold text-indigo-800 mb-3">
                  Storage Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.storageTemperature}
                      onChange={(e) =>
                        handleInputChange("storageTemperature", e.target.value)
                      }
                      className="input-primary"
                      placeholder="25.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Humidity (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.storageHumidity}
                      onChange={(e) =>
                        handleInputChange("storageHumidity", e.target.value)
                      }
                      className="input-primary"
                      placeholder="60.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packaging Method
                    </label>
                    <select
                      value={formData.packagingMethod}
                      onChange={(e) =>
                        handleInputChange("packagingMethod", e.target.value)
                      }
                      className="input-primary"
                    >
                      <option value="">Select Method</option>
                      <option value="25kg Bags">25kg Bags</option>
                      <option value="50kg Bags">50kg Bags</option>
                      <option value="Bulk">Bulk</option>
                      <option value="Small Bags">Small Bags</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Standards & Notes Section */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Standards & Notes
              </h3>
            </div>

            <div className="space-y-6">
              {/* Standards Compliance */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Standards Compliance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ASTM Standards Met
                    </label>
                    <input
                      type="text"
                      value={formData.astmStandardsMet}
                      onChange={(e) =>
                        handleInputChange("astmStandardsMet", e.target.value)
                      }
                      className="input-primary"
                      placeholder="ASTM D1784, D1785, D638"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISO Standards Met
                    </label>
                    <input
                      type="text"
                      value={formData.isoStandardsMet}
                      onChange={(e) =>
                        handleInputChange("isoStandardsMet", e.target.value)
                      }
                      className="input-primary"
                      placeholder="ISO 527, ISO 1133"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.fdaCompliance}
                        onChange={(e) =>
                          handleInputChange("fdaCompliance", e.target.checked)
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        FDA Compliance
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.reachCompliance}
                        onChange={(e) =>
                          handleInputChange("reachCompliance", e.target.checked)
                        }
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        REACH Compliance
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Additional Notes
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Production Notes
                    </label>
                    <textarea
                      value={formData.productionNotes}
                      onChange={(e) =>
                        handleInputChange("productionNotes", e.target.value)
                      }
                      className="input-primary"
                      rows="3"
                      placeholder="Production-specific notes and observations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quality Notes
                    </label>
                    <textarea
                      value={formData.qualityNotes}
                      onChange={(e) =>
                        handleInputChange("qualityNotes", e.target.value)
                      }
                      className="input-primary"
                      rows="3"
                      placeholder="Quality control notes and observations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      General Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) =>
                        handleInputChange("remarks", e.target.value)
                      }
                      className="input-primary"
                      rows="3"
                      placeholder="Additional remarks and comments..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {existingReport ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {existingReport ? "Update Report" : "Create Report"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductionReportModal;
