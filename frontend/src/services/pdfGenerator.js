import html2pdf from "html2pdf.js";

export const generateProductionReportPDF = async (reportData) => {
    if (!reportData) {
        throw new Error("No report data provided");
    }

    // Build raw materials array
    const rawMaterials = [];
    for (let i = 1; i <= 5; i++) {
        if (reportData[`rawMaterial${i}Name`]) {
            rawMaterials.push({
                name: reportData[`rawMaterial${i}Name`],
                quantity: reportData[`rawMaterial${i}Quantity`] || 0,
                unit: reportData[`rawMaterial${i}Unit`] || 'kg'
            });
        }
    }

    // Add PVC specific materials
    if (reportData.pvcResinQuantity) {
        rawMaterials.push({
            name: `PVC Resin (K-Value: ${reportData.pvcResinKValue || 'N/A'})`,
            quantity: reportData.pvcResinQuantity,
            unit: 'kg'
        });
    }

    if (reportData.stabilizerQuantity) {
        rawMaterials.push({
            name: `Stabilizer (${reportData.stabilizerType || 'N/A'})`,
            quantity: reportData.stabilizerQuantity,
            unit: 'kg'
        });
    }

    // Build process parameters array
    const processParameters = [];
    if (reportData.polymerizationTemperature) {
        processParameters.push({
            name: 'Polymerization Temperature',
            value: `${reportData.polymerizationTemperature}°C`,
            specification: '50-60°C'
        });
    }

    if (reportData.mixingTemperature) {
        processParameters.push({
            name: 'Mixing Temperature',
            value: `${reportData.mixingTemperature}°C`,
            specification: '120-140°C'
        });
    }

    if (reportData.mixingTime) {
        processParameters.push({
            name: 'Mixing Time',
            value: `${reportData.mixingTime} min`,
            specification: '10-20 min'
        });
    }

    // Build quality tests array
    const qualityTests = [];
    if (reportData.moistureContent) {
        qualityTests.push({
            name: 'Moisture Content',
            result: `${reportData.moistureContent}%`,
            specification: '< 0.5%'
        });
    }

    if (reportData.kValue) {
        qualityTests.push({
            name: 'K-Value',
            result: reportData.kValue,
            specification: '65-75'
        });
    }

    if (reportData.bulkDensity) {
        qualityTests.push({
            name: 'Bulk Density',
            result: `${reportData.bulkDensity} g/cm³`,
            specification: '0.4-0.6 g/cm³'
        });
    }

    if (reportData.tensileStrength) {
        qualityTests.push({
            name: 'Tensile Strength',
            result: `${reportData.tensileStrength} MPa`,
            specification: '> 40 MPa'
        });
    }

    // Build efficiency data array
    const efficiencyData = [];
    if (reportData.yieldPercentage) {
        efficiencyData.push({
            name: 'Production Yield',
            value: `${reportData.yieldPercentage}%`
        });
    }

    if (reportData.energyConsumed) {
        efficiencyData.push({
            name: 'Energy Consumption',
            value: `${reportData.energyConsumed} kWh`
        });
    }

    if (reportData.cycleTime) {
        efficiencyData.push({
            name: 'Cycle Time',
            value: `${reportData.cycleTime} hours`
        });
    }

    if (reportData.throughputRate) {
        efficiencyData.push({
            name: 'Throughput Rate',
            value: `${reportData.throughputRate} kg/hr`
        });
    }

    const html = generateHTMLTemplate({
        ...reportData,
        rawMaterials,
        processParameters,
        qualityTests,
        efficiencyData
    });

    const options = {
        margin: 0,
        filename: `Production_Report_${reportData.batchNumber || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(options).from(html).save();
        return { success: true };
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error('Failed to generate PDF');
    }
};

const generateHTMLTemplate = (data) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Production Quality Report</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.4;
                color: #1a1a1a;
                background: #ffffff;
                margin: 0;
                padding: 0;
            }
            
            .container {
                margin: 0 auto;
                background: #f8f9fa;
                padding: 40px;
            }
            
            .header {
                background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
                color: white;
                padding: 20px 25px;
                text-align: center;
                border-radius: 12px;
                margin-bottom: 25px;
            }
            
            .header h1 {
                font-size: 22pt;
                font-weight: 700;
                margin-bottom: 6px;
                letter-spacing: 1.2px;
            }
            
            .header .subtitle {
                font-size: 12pt;
                font-weight: 400;
                opacity: 0.9;
            }
            
            .report-info {
                display: flex;
                justify-content: space-between;
                background: white;
                padding: 15px 20px;
                border-radius: 12px;
                margin-bottom: 25px;
                font-size: 10pt;
                color: #495057;
                border: 1px solid #dee2e6;
            }
            
            .report-info-item {
                text-align: center;
                flex: 1;
                padding: 0 10px;
            }
            
            .report-info-label {
                font-weight: 600;
                color: #212529;
                margin-bottom: 3px;
                font-size: 9pt;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .report-info-value {
                font-weight: 500;
                color: #0d6efd;
                font-size: 11pt;
            }
            
            .section {
                margin-bottom: 25px;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #dee2e6;
            }
            
            .section-header {
                background: linear-gradient(135deg, #20c997 0%, #0d9488 100%);
                color: white;
                padding: 6px 20px 20px;
                font-size: 14pt;
                font-weight: 600;
            }
            
            .section-header.blue {
                background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
            }
            
            .section-header.purple {
                background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);
            }
            
            .section-header.orange {
                background: linear-gradient(135deg, #fd7e14 0%, #e8590c 100%);
            }
            
            .section-content {
                padding: 20px 25px;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .info-item {
                background: #f8f9fa;
                padding: 12px 15px;
                border-radius: 8px;
                border-left: 3px solid #0d6efd;
            }
            
            .info-item.green { border-left-color: #20c997; }
            .info-item.purple { border-left-color: #6f42c1; }
            .info-item.orange { border-left-color: #fd7e14; }
            
            .info-label {
                font-weight: 600;
                color: #495057;
                font-size: 9pt;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .info-value {
                font-size: 12pt;
                color: #212529;
                font-weight: 500;
                word-wrap: break-word;
            }
            
            .table-container {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #dee2e6;
            }
            
            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10pt;
            }
            
            .table th {
                background: linear-gradient(135deg, #343a40 0%, #495057 100%);
                color: white;
                padding: 6px 12px 14px;
                text-align: left;
                font-weight: 600;
                font-size: 10pt;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .table td {
                padding: 10px 12px;
                border-bottom: 1px solid #dee2e6;
                color: #495057;
                font-size: 10pt;
                vertical-align: middle;
            }
            
            .table tbody tr:nth-child(even) {
                background: #f8f9fa;
            }
            
            .table tbody tr:last-child td {
                border-bottom: none;
            }
            
            .status-badge {
                display: inline-block;
                padding: 4px 10px;
                padding-bottom: 14px;
                border-radius: 15px;
                font-size: 9pt;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            .status-pass {
                background: linear-gradient(135deg, #20c997 0%, #0d9488 100%);
                color: white;
            }
            
            .status-completed {
                background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
                color: white;
            }
            
            .notes-section {
                background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                border: 2px solid #ffc107;
                border-radius: 12px;
                padding: 20px 25px;
                margin: 20px 0;
            }
            
            .notes-title {
                color: #856404;
                font-size: 13pt;
                font-weight: 600;
                margin-bottom: 15px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            }
            
            .note-item {
                margin-bottom: 12px;
                padding: 8px 0;
                font-size: 11pt;
                line-height: 1.4;
            }
            
            .note-label {
                color: #664d03;
                font-weight: 600;
                display: block;
                margin-bottom: 4px;
                font-size: 10pt;
            }
            
            .note-text {
                color: #856404;
                margin-left: 10px;
            }
            
            .certification {
                background: linear-gradient(135deg, #d1ecf1 0%, #b8daff 100%);
                border: 2px solid #0d6efd;
                padding: 20px 25px;
                margin: 25px 0;
                text-align: center;
                border-radius: 12px;
            }
            
            .certification h3 {
                color: #084298;
                font-size: 15pt;
                font-weight: 700;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .certification p {
                color: #0a58ca;
                font-size: 11pt;
                line-height: 1.5;
                max-width: 85%;
                margin: 0 auto 15px;
                font-weight: 500;
            }
            
            .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
                gap: 30px;
            }
            
            .signature {
                text-align: center;
                flex: 1;
            }
            
            .signature-line {
                border-top: 2px solid #495057;
                margin-bottom: 8px;
                width: 120px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .signature-label {
                font-size: 10pt;
                color: #495057;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .signature-date {
                font-size: 9pt;
                color: #6c757d;
                font-weight: 500;
            }
            
            @media print {
                body { 
                    font-size: 10pt;
                    padding: 10px;
                }
                .container { 
                    max-width: 100%;
                    padding: 15px;
                    border-radius: 0;
                    background: white;
                }
                .section { 
                    page-break-inside: avoid;
                    margin-bottom: 20px;
                }
                .info-grid {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>PRODUCTION QUALITY REPORT</h1>
                <p class="subtitle">Manufacturing Quality Control Division</p>
            </div>
            
            <!-- Report Info -->
            <div class="report-info">
                <div class="report-info-item">
                    <div class="report-info-label">Report ID</div>
                    <div class="report-info-value">PR-${data.batchNumber || 'N/A'}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Generated On</div>
                    <div class="report-info-value">${new Date().toLocaleDateString('en-GB')}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Time</div>
                    <div class="report-info-value">${new Date().toLocaleTimeString('en-GB', { hour12: false })}</div>
                </div>
                <div class="report-info-item">
                    <div class="report-info-label">Status</div>
                    <div class="report-info-value">FINAL</div>
                </div>
            </div>
            
            <!-- Sample Information -->
            <div class="section">
                <div class="section-header">
                    📋 Sample Information
                </div>
                <div class="section-content">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Product Name</div>
                            <div class="info-value">${data.stockTransactionId?.productName || 'N/A'}</div>
                        </div>
                        <div class="info-item green">
                            <div class="info-label">Batch Number</div>
                            <div class="info-value">${data.batchNumber || 'N/A'}</div>
                        </div>
                        <div class="info-item purple">
                            <div class="info-label">Production Date</div>
                            <div class="info-value">${data.productionDate ? new Date(data.productionDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                        </div>
                        <div class="info-item orange">
                            <div class="info-label">Sample Quantity</div>
                            <div class="info-value">${data.stockTransactionId?.quantity || 0} ${data.stockTransactionId?.unit || 'kg'}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Quality Grade</div>
                            <div class="info-value">Grade ${data.qualityGrade || 'A'}</div>
                        </div>
                        <div class="info-item green">
                            <div class="info-label">Supervisor</div>
                            <div class="info-value">${data.supervisor || 'N/A'}</div>
                        </div>
                        <div class="info-item purple">
                            <div class="info-label">Operator</div>
                            <div class="info-value">${data.operator || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Raw Materials -->
            ${data.rawMaterials && data.rawMaterials.length > 0 ? `
            <div class="section">
                <div class="section-header blue">
                    🧪 Raw Materials Analysis
                </div>
                <div class="section-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Material Component</th>
                                    <th>Quantity Used</th>
                                    <th>Unit</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.rawMaterials.map(material => `
                                <tr>
                                    <td style="font-weight: 600; color: #212529;">${material.name}</td>
                                    <td style="font-weight: 500; color: #0d6efd;">${material.quantity}</td>
                                    <td style="color: #6c757d;">${material.unit}</td>
                                    <td><span class="status-badge status-pass">Verified</span></td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Process Parameters -->
            ${data.processParameters && data.processParameters.length > 0 ? `
            <div class="section">
                <div class="section-header purple">
                    ⚙️ Process Control Parameters
                </div>
                <div class="section-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Parameter Name</th>
                                    <th>Measured Value</th>
                                    <th>Reference Range</th>
                                    <th>Compliance Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.processParameters.map(param => `
                                <tr>
                                    <td style="font-weight: 600; color: #212529;">${param.name}</td>
                                    <td style="font-weight: 500; color: #6f42c1;">${param.value}</td>
                                    <td style="color: #6c757d; font-style: italic;">${param.specification}</td>
                                    <td><span class="status-badge status-pass">Within Range</span></td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Quality Test Results -->
            ${data.qualityTests && data.qualityTests.length > 0 ? `
            <div class="section">
                <div class="section-header orange">
                    🔬 Quality Assurance Tests
                </div>
                <div class="section-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Test Parameter</th>
                                    <th>Test Result</th>
                                    <th>Reference Range</th>
                                    <th>Test Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.qualityTests.map(test => `
                                <tr>
                                    <td style="font-weight: 600; color: #212529;">${test.name}</td>
                                    <td style="font-weight: 600; color: #fd7e14; font-size: 11pt;">${test.result}</td>
                                    <td style="color: #6c757d; font-style: italic;">${test.specification}</td>
                                    <td><span class="status-badge status-pass">Pass</span></td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Production Efficiency -->
            ${data.efficiencyData && data.efficiencyData.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    📊 Production Efficiency Metrics
                </div>
                <div class="section-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Performance Indicator</th>
                                    <th>Achieved Value</th>
                                    <th>Performance Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.efficiencyData.map(efficiency => `
                                <tr>
                                    <td style="font-weight: 600; color: #212529;">${efficiency.name}</td>
                                    <td style="font-weight: 600; color: #20c997; font-size: 11pt;">${efficiency.value}</td>
                                    <td><span class="status-badge status-pass">Excellent</span></td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Notes and Observations -->
            ${(data.productionNotes || data.qualityNotes || data.remarks) ? `
            <div class="notes-section">
                <div class="notes-title">📝 Laboratory Comments & Observations</div>
                ${data.productionNotes ? `
                    <div class="note-item">
                        <span class="note-label">Production Analysis:</span>
                        <div class="note-text">${data.productionNotes}</div>
                    </div>
                ` : ''}
                ${data.qualityNotes ? `
                    <div class="note-item">
                        <span class="note-label">Quality Control Assessment:</span>
                        <div class="note-text">${data.qualityNotes}</div>
                    </div>
                ` : ''}
                ${data.remarks ? `
                    <div class="note-item">
                        <span class="note-label">General Remarks:</span>
                        <div class="note-text">${data.remarks}</div>
                    </div>
                ` : ''}
            </div>
            ` : ''}
            
            <!-- Reference Information -->
            <div class="section">
                <div class="section-header blue">
                    📚 Reference Information
                </div>
                <div class="section-content">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #0d6efd;">
                        <p style="font-size: 10pt; color: #495057; line-height: 1.5; margin-bottom: 12px;">
                            <strong style="color: #212529;">Testing Standards:</strong> All tests performed using calibrated equipment and standard operating procedures in accordance with ISO 9001:2015 quality standards.
                        </p>
                        <p style="font-size: 10pt; color: #495057; line-height: 1.5; margin-bottom: 12px;">
                            <strong style="color: #212529;">Validity:</strong> Results are valid only for the sample tested and under the conditions specified in this report.
                        </p>
                        <p style="font-size: 10pt; color: #495057; line-height: 1.5; margin: 0;">
                            <strong style="color: #212529;">Reproduction:</strong> This report may not be reproduced except in full without written approval of the laboratory.
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Certification -->
            <div class="certification">
                <h3>✓ Quality Certification & Authorization</h3>
                <p>
                    This report has been electronically validated and approved by authorized laboratory personnel. 
                    All analytical procedures have been performed in accordance with international quality standards 
                    and regulatory guidelines. The results are traceable to national/international standards where applicable.
                </p>
                <p style="margin-top: 12px; font-weight: 600; color: #084298;">
                    <strong>Certificate of Analysis:</strong> This document serves as an official certificate of analysis 
                    for the tested sample and confirms compliance with specified quality requirements.
                </p>
                
                <!-- Signatures -->
                <div class="signatures">
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div class="signature-label">Laboratory Analyst</div>
                        <div class="signature-date">${data.operator || 'Lab Technician'}<br>${new Date().toLocaleDateString('en-GB')}</div>
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div class="signature-label">Quality Manager</div>
                        <div class="signature-date">${data.supervisor || 'Quality Manager'}<br>${new Date().toLocaleDateString('en-GB')}</div>
                    </div>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <div class="signature-label">Laboratory Director</div>
                        <div class="signature-date">Dr. Lab Director<br>${new Date().toLocaleDateString('en-GB')}</div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
