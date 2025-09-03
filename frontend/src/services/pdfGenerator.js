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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000000;
                background: #ffffff;
                margin: 0;                
            }
            
            .container {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                padding: 40px;
            }
            
            /* Header */
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 2px solid #000000;
            }
            
            .company-name {
                font-size: 20px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
                color: #000000;
            }
            
            .document-title {
                font-size: 16px;
                font-weight: bold;
                color: #000000;
                margin-bottom: 3px;
            }
            
            .document-date {
                font-size: 12px;
                color: #666666;
            }
            
            /* Simple 2-column table */
            .report-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                border: 1px solid #000000;
            }
            
            .report-table td {
                padding: 8px 12px;
                border: 1px solid #cccccc;
                vertical-align: top;
                font-size: 12px;
            }
            
            .label-cell {
                width: 40%;
                background-color: #f8f9fa;
                font-weight: bold;
                color: #000000;
            }
            
            .value-cell {
                width: 60%;
                background-color: #ffffff;
                color: #000000;
            }
            
            /* Section headers with minimal blue accent */
            .section-header {
                background-color: #1e40af;
                color: white;
                font-weight: bold;
                text-align: center;
                padding: 10px;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* Multi-row sections */
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 25px;
                border: 1px solid #000000;
            }
            
            .data-table th {
                background-color: #000000;
                color: white;
                padding: 8px 10px;
                text-align: left;
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
            }
            
            .data-table td {
                padding: 8px 10px;
                border: 1px solid #cccccc;
                font-size: 12px;
            }
            
            .data-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .data-table tr:nth-child(odd) {
                background-color: #ffffff;
            }
            
            /* Notes section */
            .notes-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                border: 1px solid #000000;
            }
            
            .notes-header {
                background-color: #f0f0f0;
                font-weight: bold;
                padding: 8px 12px;
                border-bottom: 1px solid #cccccc;
                color: #000000;
            }
            
            .notes-content {
                padding: 12px;
                line-height: 1.5;
                background-color: #ffffff;
            }
            
            .note-item {
                margin-bottom: 10px;
            }
            
            .note-label {
                font-weight: bold;
                color: #000000;
                display: block;
                margin-bottom: 3px;
                font-size: 11px;
                text-transform: uppercase;
            }
            
            .note-text {
                color: #333333;
                font-size: 12px;
            }
            
            /* Signature area */
            .signature-section {
                margin-top: 40px;
                border-top: 1px solid #cccccc;
                padding-top: 20px;
            }
            
            .signature-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .signature-table td {
                width: 33.33%;
                text-align: center;
                padding: 30px 10px 10px;
                vertical-align: top;
                border-bottom: none;
            }
            
            .signature-line {
                border-top: 1px solid #000000;
                margin-bottom: 8px;
                width: 120px;
                margin-left: auto;
                margin-right: auto;
            }
            
            .signature-title {
                font-weight: bold;
                font-size: 10px;
                color: #000000;
                margin-bottom: 3px;
                text-transform: uppercase;
            }
            
            .signature-name {
                font-size: 10px;
                color: #666666;
            }
            
            /* Footer */
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666666;
                border-top: 1px solid #cccccc;
                padding-top: 10px;
            }
            
            /* Print styles */
            @media print {
                body {
                    padding: 10px;
                    font-size: 11px;
                }
                
                .report-table td,
                .data-table td {
                    padding: 6px 8px;
                    font-size: 11px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="company-name">Quality Control Laboratory</div>
                <div class="document-title">Production Analysis Report</div>
                <div class="document-date">Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB', { hour12: false })}</div>
            </div>
            
            <!-- Report Information -->
            <table class="report-table">
                <tr>
                    <td colspan="2" class="section-header">Report Information</td>
                </tr>
                <tr>
                    <td class="label-cell">Report ID</td>
                    <td class="value-cell">PR-${data.batchNumber || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Generation Date</td>
                    <td class="value-cell">${new Date().toLocaleDateString('en-GB')}</td>
                </tr>
                <tr>
                    <td class="label-cell">Generation Time</td>
                    <td class="value-cell">${new Date().toLocaleTimeString('en-GB', { hour12: false })}</td>
                </tr>
                <tr>
                    <td class="label-cell">Report Status</td>
                    <td class="value-cell">CERTIFIED</td>
                </tr>
            </table>
            
            <!-- Sample Information -->
            <table class="report-table">
                <tr>
                    <td colspan="2" class="section-header">Sample Information</td>
                </tr>
                <tr>
                    <td class="label-cell">Product Name</td>
                    <td class="value-cell">${data.stockTransactionId?.productName || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Batch Number</td>
                    <td class="value-cell">${data.batchNumber || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Production Date</td>
                    <td class="value-cell">${data.productionDate ? new Date(data.productionDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Sample Quantity</td>
                    <td class="value-cell">${data.stockTransactionId?.quantity || 0} ${data.stockTransactionId?.unit || 'kg'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Quality Grade</td>
                    <td class="value-cell">Grade ${data.qualityGrade || 'A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Supervisor</td>
                    <td class="value-cell">${data.supervisor || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="label-cell">Operator</td>
                    <td class="value-cell">${data.operator || 'N/A'}</td>
                </tr>
            </table>
            
            <!-- Raw Materials Analysis -->
            ${data.rawMaterials && data.rawMaterials.length > 0 ? `
            <table class="data-table">
                <tr>
                    <th colspan="3">Raw Materials Analysis</th>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Material Component</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Quantity</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Unit</th>
                </tr>
                ${data.rawMaterials.map(material => `
                <tr>
                    <td>${material.name}</td>
                    <td style="text-align: center; font-weight: bold;">${material.quantity}</td>
                    <td style="text-align: center;">${material.unit}</td>
                </tr>
                `).join('')}
            </table>
            ` : ''}
            
            <!-- Process Control Parameters -->
            ${data.processParameters && data.processParameters.length > 0 ? `
            <table class="data-table">
                <tr>
                    <th colspan="3">Process Control Parameters</th>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Parameter Name</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Measured Value</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Reference Range</th>
                </tr>
                ${data.processParameters.map(param => `
                <tr>
                    <td>${param.name}</td>
                    <td style="text-align: center; font-weight: bold;">${param.value}</td>
                    <td style="text-align: center; font-style: italic;">${param.specification}</td>
                </tr>
                `).join('')}
            </table>
            ` : ''}
            
            <!-- Quality Test Results -->
            ${data.qualityTests && data.qualityTests.length > 0 ? `
            <table class="data-table">
                <tr>
                    <th colspan="3">Quality Test Results</th>
                </tr>
                <tr style="background-color: #f0f0f0;">
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Test Parameter</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Test Result</th>
                    <th style="background-color: #f0f0f0; color: #000000; font-weight: bold;">Specification</th>
                </tr>
                ${data.qualityTests.map(test => `
                <tr>
                    <td>${test.name}</td>
                    <td style="text-align: center; font-weight: bold;">${test.result}</td>
                    <td style="text-align: center; font-style: italic;">${test.specification}</td>
                </tr>
                `).join('')}
            </table>
            ` : ''}
            
            <!-- Production Efficiency -->
            ${data.efficiencyData && data.efficiencyData.length > 0 ? `
            <table class="report-table">
                <tr>
                    <td colspan="2" class="section-header">Production Efficiency</td>
                </tr>
                ${data.efficiencyData.map(efficiency => `
                <tr>
                    <td class="label-cell">${efficiency.name}</td>
                    <td class="value-cell" style="font-weight: bold;">${efficiency.value}</td>
                </tr>
                `).join('')}
            </table>
            ` : ''}
            
            <!-- Notes and Observations -->
            ${(data.productionNotes || data.qualityNotes || data.remarks) ? `
            <table class="notes-table">
                <tr>
                    <td class="notes-header">Laboratory Comments & Observations</td>
                </tr>
                <tr>
                    <td class="notes-content">
                        ${data.productionNotes ? `
                            <div class="note-item">
                                <span class="note-label">Production Analysis:</span>
                                <div class="note-text">${data.productionNotes}</div>
                            </div>
                        ` : ''}
                        ${data.qualityNotes ? `
                            <div class="note-item">
                                <span class="note-label">Quality Assessment:</span>
                                <div class="note-text">${data.qualityNotes}</div>
                            </div>
                        ` : ''}
                        ${data.remarks ? `
                            <div class="note-item">
                                <span class="note-label">General Remarks:</span>
                                <div class="note-text">${data.remarks}</div>
                            </div>
                        ` : ''}
                    </td>
                </tr>
            </table>
            ` : ''}
            
            <!-- Standards & References -->
            <table class="report-table">
                <tr>
                    <td colspan="2" class="section-header">Standards & References</td>
                </tr>
                <tr>
                    <td class="label-cell">Testing Standards</td>
                    <td class="value-cell">ISO 9001:2015 Quality Management Systems</td>
                </tr>
                <tr>
                    <td class="label-cell">Equipment Calibration</td>
                    <td class="value-cell">All instruments calibrated as per schedule</td>
                </tr>
                <tr>
                    <td class="label-cell">Sample Validity</td>
                    <td class="value-cell">Results valid only for tested sample</td>
                </tr>
                <tr>
                    <td class="label-cell">Report Approval</td>
                    <td class="value-cell">Electronically validated and approved</td>
                </tr>
            </table>
            
            <!-- Certification & Signatures -->
            <table class="notes-table">
                <tr>
                    <td class="notes-header" style="text-align: center;">CERTIFICATION & AUTHORIZATION</td>
                </tr>
                <tr>
                    <td class="notes-content" style="text-align: center; padding: 20px;">
                        <p style="margin-bottom: 15px; font-size: 12px;">
                            This report has been electronically validated and approved by authorized laboratory personnel. 
                            All analytical procedures performed in accordance with international quality standards.
                        </p>
                        <p style="font-weight: bold; font-size: 12px; margin-bottom: 20px;">
                            CERTIFICATE OF ANALYSIS - OFFICIAL DOCUMENT
                        </p>
                        
                        <table class="signature-table">
                            <tr>
                                <td>
                                    <div class="signature-line"></div>
                                    <div class="signature-title">Laboratory Analyst</div>
                                    <div class="signature-name">${data.operator || 'Lab Technician'}</div>
                                    <div class="signature-name">${new Date().toLocaleDateString('en-GB')}</div>
                                </td>
                                <td>
                                    <div class="signature-line"></div>
                                    <div class="signature-title">Quality Manager</div>
                                    <div class="signature-name">${data.supervisor || 'Quality Manager'}</div>
                                    <div class="signature-name">${new Date().toLocaleDateString('en-GB')}</div>
                                </td>
                                <td>
                                    <div class="signature-line"></div>
                                    <div class="signature-title">Lab Director</div>
                                    <div class="signature-name">Dr. Lab Director</div>
                                    <div class="signature-name">${new Date().toLocaleDateString('en-GB')}</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Report ID:</strong> PR-${data.batchNumber || 'N/A'} | <strong>Generated:</strong> ${new Date().toLocaleDateString('en-GB')} | <strong>Status:</strong> CERTIFIED</p>
                <p>For inquiries regarding this report, contact the Quality Control Laboratory within 7 days</p>
            </div>
        </div>
    </body>
    </html>
    `;
};
