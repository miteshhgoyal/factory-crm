import mongoose from 'mongoose';

const productReportSchema = new mongoose.Schema({
    // Stock Transaction Reference
    stockTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock',
        required: true,
        unique: true
    },

    // Basic Production Information
    batchNumber: {
        type: String,
        required: true
    },
    productionDate: {
        type: Date,
        required: true
    },
    qualityGrade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C'],
        default: 'A'
    },
    formulationCode: {
        type: String
    },

    // Personnel
    supervisor: {
        type: String,
        required: true
    },
    operator: {
        type: String,
        required: true
    },

    // Raw Materials (flat fields)
    rawMaterial1Name: String,
    rawMaterial1Quantity: Number,
    rawMaterial1Unit: String,
    rawMaterial2Name: String,
    rawMaterial2Quantity: Number,
    rawMaterial2Unit: String,
    rawMaterial3Name: String,
    rawMaterial3Quantity: Number,
    rawMaterial3Unit: String,
    rawMaterial4Name: String,
    rawMaterial4Quantity: Number,
    rawMaterial4Unit: String,
    rawMaterial5Name: String,
    rawMaterial5Quantity: Number,
    rawMaterial5Unit: String,

    // PVC Specific - Raw Material Details
    pvcResinKValue: Number,
    pvcResinSupplier: String,
    pvcResinBatchNo: String,
    pvcResinQuantity: Number,

    // Stabilizers
    stabilizerType: String,
    stabilizerQuantity: Number,

    // Lubricants
    internalLubricantQuantity: Number,
    externalLubricantQuantity: Number,

    // Additives
    impactModifierQuantity: Number,
    processingAidQuantity: Number,
    colorantQuantity: Number,
    plasticizer: String,
    plasticizerQuantity: Number,

    // Process Parameters
    polymerizationTemperature: Number,
    polymerizationPressure: Number,
    polymerizationTime: Number,
    polymerizationPH: Number,
    mixingTemperature: Number,
    mixingTime: Number,
    mixingRPM: Number,
    mixingTorque: Number,
    extruderTemperature: Number,
    screwSpeed: Number,
    diePressure: Number,
    coolingWaterTemp: Number,

    // Physical Properties
    bulkDensity: Number,
    apparentDensity: Number,
    averageParticleSize: Number,
    particleSizeRange: String,
    moistureContent: Number,
    volatilesContent: Number,

    // Mechanical Properties
    kValue: Number,
    meltFlowIndex: Number,
    shoreHardness: Number,
    tensileStrength: Number,
    impactStrength: Number,

    // Thermal Properties
    heatDeflectionTemp: Number,
    vicatSofteningTemp: Number,
    thermalStabilityTime: Number,
    congoRedTestResult: String,

    // Chemical Properties
    residualVCMContent: Number,
    leadContent: Number,
    cadmiumContent: Number,
    mercuryContent: Number,
    pHAqueousExtract: Number,
    ashContent: Number,

    // Processing Properties
    gelationTime: Number,
    fusionCharacteristics: String,
    viscosityAtProcessingTemp: Number,
    torqueRheometerResult: String,

    // Water Immersion Tests
    waterAbsorption24h: Number,
    dimensionalStabilityWater: Number,
    hydrostaticStrength: Number,
    chemicalResistance: String,

    // Environmental & Safety
    vocEmission: Number,
    plasticizerMigration: Number,
    heavyMetalLeaching: String,
    flameRetardancy: String,

    // Visual Quality Assessment
    colorConsistencyL: Number,
    colorConsistencyA: Number,
    colorConsistencyB: Number,
    surfaceQuality: String,
    transparencyLevel: String,
    foreignParticles: String,
    granuleShapeUniformity: String,

    // Production Efficiency
    yieldPercentage: Number,
    wasteGenerated: Number,
    energyConsumed: Number,
    cycleTime: Number,
    throughputRate: Number,

    // Equipment Used (flat fields)
    equipment1: String,
    equipment2: String,
    equipment3: String,
    equipment4: String,
    equipment5: String,

    // Standards Compliance
    astmStandardsMet: String,
    isoStandardsMet: String,
    bisStandardsMet: String,
    fdaCompliance: Boolean,
    reachCompliance: Boolean,

    // Storage & Quality
    storageTemperature: Number,
    storageHumidity: Number,
    packagingMethod: String,
    shelfLife: Number,
    storageLocation: String,

    // Defects & Non-Conformities
    defectsFound: String,
    rejectionRate: Number,
    rootCauseAnalysis: String,
    correctiveActions: String,

    // Additional Notes
    remarks: String,
    qualityNotes: String,
    productionNotes: String,

    // Status and Tracking
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING'
    },

    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: {
        type: Date
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productReportSchema.index({ batchNumber: 1, companyId: 1 });
productReportSchema.index({ status: 1, companyId: 1 });
productReportSchema.index({ productionDate: -1 });

export default mongoose.model('ProductReport', productReportSchema);
