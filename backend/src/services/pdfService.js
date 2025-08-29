import puppeteer from 'puppeteer';
import { formatDate } from '../utils/dateUtils.js';

class PDFService {
    async generateClientLedgerPDF(clientData, ledgerEntries, filters = {}) {
        let browser;
        try {
            // Set the executable path for Render environment
            const executablePath = process.env.NODE_ENV === 'production'
                ? '/opt/render/.cache/puppeteer/chrome/linux-139.0.7258.138/chrome-linux64/chrome'
                : undefined;

            browser = await puppeteer.launch({
                headless: true,
                executablePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Calculate summary
            const summary = this.calculateSummaryStats(ledgerEntries);

            // Process entries for PDF display - FROM CLIENT'S PERSPECTIVE
            const processedEntries = ledgerEntries.map((entry, index) => ({
                sno: index + 1,
                date: formatDate(entry.date),
                particulars: entry.particulars || entry.productName || '-',
                category: entry.transactionCategory === 'stock' ? 'Stock' : 'Cash Flow',
                type: this.getClientTransactionType(entry),
                bags: entry.transactionCategory === 'stock' ? (entry.bags || '-') : 'N/A',
                weight: entry.transactionCategory === 'stock' ? (entry.weight || '-') : 'N/A',
                rate: entry.transactionCategory === 'stock' && entry.rate ? `₹${entry.rate}` : 'N/A',
                // FROM CLIENT PERSPECTIVE: Reverse debit/credit
                debitAmount: entry.creditAmount ? `₹${entry.creditAmount.toLocaleString('en-IN')}` : '-',
                creditAmount: entry.debitAmount ? `₹${entry.debitAmount.toLocaleString('en-IN')}` : '-',
                balance: `₹${Math.abs(entry.balance).toLocaleString('en-IN')}`,
                balanceType: entry.balance >= 0 ? 'you-owe' : 'you-receive',
                invoiceNo: entry.invoiceNo || '-',
                notes: entry.notes || '-'
            }));

            // Generate HTML using the updated template
            const html = this.generateLedgerHTML({
                clientData,
                processedEntries,
                summary,
                filters,
                hasActiveFilters: this.hasActiveFilters(filters)
            });

            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '5mm',
                    right: '5mm',
                    bottom: '5mm',
                    left: '5mm'
                },
                printBackground: true
            });

            return pdfBuffer;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    calculateSummaryStats(entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return {
                totalTransactions: 0,
                totalDebit: 0,
                totalCredit: 0,
                netAmount: 0,
                stockTransactions: 0,
                cashTransactions: 0
            };
        }

        return entries.reduce((acc, entry) => {
            acc.totalTransactions++;
            // CLIENT PERSPECTIVE: Reverse debit/credit
            acc.totalDebit += entry.creditAmount || 0;
            acc.totalCredit += entry.debitAmount || 0;

            if (entry.transactionCategory === 'stock') {
                acc.stockTransactions++;
            } else {
                acc.cashTransactions++;
            }

            return acc;
        }, {
            totalTransactions: 0,
            totalDebit: 0,
            totalCredit: 0,
            netAmount: 0,
            stockTransactions: 0,
            cashTransactions: 0
        });
    }

    hasActiveFilters(filters) {
        if (!filters) return false;
        return !!(
            filters.startDate ||
            filters.endDate ||
            filters.monthYear ||
            filters.year ||
            (filters.transactionType && filters.transactionType !== 'all') ||
            filters.minAmount ||
            filters.maxAmount
        );
    }

    // Convert transaction type to CLIENT PERSPECTIVE
    getClientTransactionType(entry) {
        if (entry.transactionCategory === 'stock') {
            return entry.transactionType === 'IN' ? 'Sale' : 'Purchase';
        } else {
            return entry.transactionType === 'IN' ? 'Cash Out' : 'Cash In';
        }
    }

    generateLedgerHTML(data) {
        const { clientData, processedEntries, summary, filters, hasActiveFilters } = data;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Statement - ${clientData.name}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', Arial, sans-serif;
                    font-size: 11pt;
                    line-height: 1.5;
                    color: #1f2937;
                    background: #ffffff;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 10px;
                    background: #f9fafb;
                }
                
                /* Header Styles */
                .header {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    color: white;
                    padding: 25px 30px;
                    text-align: center;
                    border-radius: 16px;
                    margin-bottom: 25px;
                    box-shadow: 0 10px 25px rgba(30, 64, 175, 0.2);
                }
                
                .header h1 {
                    font-size: 24pt;
                    font-weight: 700;
                    margin-bottom: 8px;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                
                .header .subtitle {
                    font-size: 13pt;
                    font-weight: 400;
                    opacity: 0.9;
                    letter-spacing: 0.5px;
                }
                
                /* Report Info Bar */
                .report-info {
                    display: flex;
                    justify-content: space-between;
                    background: white;
                    padding: 18px 25px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e5e7eb;
                }
                
                .report-info-item {
                    text-align: center;
                    flex: 1;
                }
                
                .report-info-label {
                    font-size: 9pt;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                
                .report-info-value {
                    font-size: 12pt;
                    font-weight: 600;
                    color: #1e40af;
                }
                
                /* Section Styles */
                .section {
                    background: white;
                    border-radius: 16px;
                    margin-bottom: 25px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e5e7eb;
                }
                
                .section-header {
                    padding: 16px 20px;
                    font-size: 15pt;
                    font-weight: 600;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .section-header.blue {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                }
                
                .section-header.green {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                }
                
                .section-header.purple {
                    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
                }
                
                .section-header.orange {
                    background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
                }
                
                .section-content {
                    padding: 25px;
                }
                
                /* Grid Layouts */
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 18px;
                    margin-bottom: 20px;
                }
                
                .info-item {
                    background: #f8fafc;
                    padding: 15px 18px;
                    border-radius: 10px;
                    border-left: 4px solid #3b82f6;
                    transition: all 0.3s ease;
                }
                
                .info-item.green { border-left-color: #10b981; }
                .info-item.red { border-left-color: #ef4444; }
                .info-item.purple { border-left-color: #8b5cf6; }
                .info-item.orange { border-left-color: #f97316; }
                
                .info-label {
                    font-size: 9pt;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    margin-bottom: 6px;
                }
                
                .info-value {
                    font-size: 13pt;
                    font-weight: 600;
                    color: #111827;
                    word-break: break-word;
                }
                
                /* Filter Info */
                .filter-info {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 2px solid #f59e0b;
                    border-radius: 12px;
                    padding: 16px 22px;
                    margin-bottom: 20px;
                }
                
                .filter-title {
                    font-size: 12pt;
                    font-weight: 600;
                    color: #92400e;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 12px;
                }
                
                .filter-item {
                    background: rgba(255, 255, 255, 0.7);
                    padding: 12px;
                    border-radius: 8px;
                }
                
                .filter-item-label {
                    font-size: 9pt;
                    font-weight: 600;
                    color: #78350f;
                    margin-bottom: 4px;
                }
                
                .filter-item-value {
                    font-size: 10pt;
                    color: #92400e;
                    font-weight: 500;
                }
                
                /* Summary Cards */
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                
                .summary-card {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border: 2px solid #0ea5e9;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                }
                
                .summary-card.green {
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border-color: #22c55e;
                }
                
                .summary-card.red {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border-color: #ef4444;
                }
                
                .summary-card.purple {
                    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
                    border-color: #a855f7;
                }
                
                .summary-label {
                    font-size: 9pt;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                    color: #374151;
                }
                
                .summary-value {
                    font-size: 16pt;
                    font-weight: 700;
                    color: #111827;
                }
                
                .summary-subtitle {
                    font-size: 8pt;
                    color: #6b7280;
                    margin-top: 4px;
                    font-weight: 500;
                }
                
                /* Table Styles */
                .table-container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                    margin-top: 20px;
                }
                
                .table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9pt;
                }
                
                .table th {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    color: white;
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 8pt;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                }
                
                .table td {
                    padding: 10px 8px;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 8pt;
                    vertical-align: middle;
                    color: #374151;
                }
                
                .table tbody tr:nth-child(even) {
                    background-color: #f9fafb;
                }
                
                .table tbody tr:hover {
                    background-color: #f3f4f6;
                }
                
                .table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                /* Amount Styling - Client Perspective */
                .amount-debit {
                    color: #dc2626;
                    font-weight: 600;
                }
                
                .amount-credit {
                    color: #059669;
                    font-weight: 600;
                }
                
                .balance-you-receive {
                    color: #059669;
                    font-weight: 700;
                }
                
                .balance-you-owe {
                    color: #dc2626;
                    font-weight: 700;
                }
                
                /* Status Badges - Client Perspective */
                .status-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 9pt;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    text-wrap: nowrap;
                }
                
                .badge-you-purchased {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .badge-you-sold {
                    background: #fee2e2;
                    color: #dc2626;
                }
                
                .badge-you-received {
                    background: #dcfce7;
                    color: #16a34a;
                }
                
                .badge-you-paid {
                    background: #fee2e2;
                    color: #dc2626;
                }
                
                /* No Data */
                .no-data {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6b7280;
                }
                
                .no-data-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                
                .no-data-text {
                    font-size: 14pt;
                    font-weight: 500;
                    margin-bottom: 8px;
                }
                
                .no-data-subtitle {
                    font-size: 11pt;
                    color: #9ca3af;
                }
                
                /* Footer */
                .footer {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f3f4f6;
                    border-radius: 12px;
                    text-align: center;
                    font-size: 9pt;
                    color: #6b7280;
                }
                
                .footer-title {
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                }
                
                .footer-info {
                    margin-bottom: 4px;
                }
                
                /* Print Optimizations */
                @media print {
                    body { 
                        font-size: 9pt; 
                        margin: 0;
                        padding: 0;
                    }
                    .container { 
                        padding: 15px; 
                        background: white;
                    }
                    .section { 
                        page-break-inside: avoid; 
                        margin-bottom: 15px;
                    }
                    .table { 
                        font-size: 7pt; 
                    }
                    .table th, .table td { 
                        padding: 6px 4px; 
                    }
                    .info-grid { 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                        gap: 12px; 
                    }
                    .summary-grid { 
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <h1>📊 Your Account Statement</h1>
                    <p class="subtitle">Your Complete Transaction History & Account Summary</p>
                </div>
                
                <!-- Report Info -->
                <div class="report-info">
                    <div class="report-info-item">
                        <div class="report-info-label">Statement Date</div>
                        <div class="report-info-value">${new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">Time</div>
                        <div class="report-info-value">${new Date().toLocaleTimeString('en-IN', { hour12: true })}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">Total Records</div>
                        <div class="report-info-value">${processedEntries.length}</div>
                    </div>
                    <div class="report-info-item">
                        <div class="report-info-label">Account Status</div>
                        <div class="report-info-value">ACTIVE</div>
                    </div>
                </div>
                
                <!-- Account Information -->
                <div class="section">
                    <div class="section-header blue">
                        👤 Your Account Information
                    </div>
                    <div class="section-content">
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Account Holder</div>
                                <div class="info-value">${clientData.name}</div>
                            </div>
                            <div class="info-item green">
                                <div class="info-label">Account Type</div>
                                <div class="info-value">${clientData.type}</div>
                            </div>
                            <div class="info-item purple">
                                <div class="info-label">Phone Number</div>
                                <div class="info-value">${clientData.phone}</div>
                            </div>
                            <div class="info-item orange">
                                <div class="info-label">Address</div>
                                <div class="info-value">${clientData.address || 'Not provided'}</div>
                            </div>
                            <div class="info-item ${clientData.currentBalance <= 0 ? 'green' : 'red'}">
                                <div class="info-label">Your Balance</div>
                                <div class="info-value">₹${Math.abs(clientData.currentBalance).toLocaleString('en-IN')}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Balance Status</div>
                                <div class="info-value">${clientData.currentBalance <= 0 ? 'You have credit' : 'You owe'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Applied Filters (if any) -->
                ${hasActiveFilters ? `
                <div class="filter-info">
                    <div class="filter-title">
                        🔍 Applied Filters
                    </div>
                    <div class="filter-grid">
                        ${filters.startDate && filters.endDate ? `
                        <div class="filter-item">
                            <div class="filter-item-label">Date Range</div>
                            <div class="filter-item-value">${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}</div>
                        </div>` : ''}
                        ${filters.monthYear ? `
                        <div class="filter-item">
                            <div class="filter-item-label">Month/Year</div>
                            <div class="filter-item-value">${new Date(filters.monthYear + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                        </div>` : ''}
                        ${filters.year ? `
                        <div class="filter-item">
                            <div class="filter-item-label">Year</div>
                            <div class="filter-item-value">${filters.year}</div>
                        </div>` : ''}
                        ${filters.transactionType && filters.transactionType !== 'all' ? `
                        <div class="filter-item">
                            <div class="filter-item-label">Transaction Type</div>
                            <div class="filter-item-value">${filters.transactionType.toUpperCase()}</div>
                        </div>` : ''}
                        ${filters.minAmount || filters.maxAmount ? `
                        <div class="filter-item">
                            <div class="filter-item-label">Amount Range</div>
                            <div class="filter-item-value">₹${filters.minAmount || '0'} - ₹${filters.maxAmount || '∞'}</div>
                        </div>` : ''}
                    </div>
                </div>` : ''}
                
                <!-- Transaction Summary -->
                <div class="section">
                    <div class="section-header green">
                        📈 Your Transaction Summary
                    </div>
                    <div class="section-content">
                        <div class="summary-grid">
                            <div class="summary-card">
                                <div class="summary-label">Total Transactions</div>
                                <div class="summary-value">${summary.totalTransactions}</div>
                                <div class="summary-subtitle">All Records</div>
                            </div>
                            <div class="summary-card red">
                                <div class="summary-label">Total Cash Out</div>
                                <div class="summary-value">₹${summary.totalDebit.toLocaleString('en-IN')}</div>
                                <div class="summary-subtitle">Your Payments</div>
                            </div>
                            <div class="summary-card green">
                                <div class="summary-label">Total Cash In</div>
                                <div class="summary-value">₹${summary.totalCredit.toLocaleString('en-IN')}</div>
                                <div class="summary-subtitle">Your Receipts</div>
                            </div>
                            <div class="summary-card purple">
                                <div class="summary-label">Stock Transactions</div>
                                <div class="summary-value">${summary.stockTransactions}</div>
                                <div class="summary-subtitle">Product Related</div>
                            </div>
                            <div class="summary-card purple">
                                <div class="summary-label">Cash Transactions</div>
                                <div class="summary-value">${summary.cashTransactions}</div>
                                <div class="summary-subtitle">Cash Flow</div>
                            </div>
                            <div class="summary-card ${summary.totalCredit >= summary.totalDebit ? 'green' : 'red'}">
                                <div class="summary-label">Net Amount</div>
                                <div class="summary-value">₹${Math.abs(summary.totalCredit - summary.totalDebit).toLocaleString('en-IN')}</div>
                                <div class="summary-subtitle">${summary.totalCredit >= summary.totalDebit ? 'In Your Favor' : 'You Owe'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Transaction Details -->
                <div class="section">
                    <div class="section-header orange">
                        📋 Your Detailed Transaction History
                    </div>
                    <div class="section-content">
                        ${processedEntries.length > 0 ? `
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th style="width: 4%;">#</th>
                                        <th style="width: 10%;">Date</th>
                                        <th style="width: 20%;">Particulars</th>
                                        <th style="width: 10%;">Type</th>
                                        <th style="width: 6%;">Bags</th>
                                        <th style="width: 8%;">Weight</th>
                                        <th style="width: 8%;">Rate</th>
                                        <th style="width: 10%;">Cash Out</th>
                                        <th style="width: 10%;">Cash In</th>
                                        <th style="width: 12%;">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${processedEntries.map(entry => `
                                    <tr>
                                        <td style="text-align: center; font-weight: 600;">${entry.sno}</td>
                                        <td style="font-weight: 500; white-space: nowrap;">${entry.date}</td>
                                        <td style="font-weight: 500;">
                                            ${entry.particulars.length > 25 ? entry.particulars.substring(0, 25) + '...' : entry.particulars}
                                            ${entry.invoiceNo !== '-' ? `<br><small style="color: #6b7280;">Invoice: ${entry.invoiceNo}</small>` : ''}
                                        </td>
                                        <td>
                                            <span class="status-badge ${entry.type === 'Purchase' ? 'badge-you-purchased' :
                entry.type === 'Sale' ? 'badge-you-sold' :
                    entry.type === 'Cash In' ? 'badge-you-received' : 'badge-you-paid'
            }">
                                                ${entry.type}
                                            </span>
                                        </td>
                                        <td style="text-align: center;">${entry.bags}</td>
                                        <td style="text-align: center;">${entry.weight}</td>
                                        <td style="text-align: center;">${entry.rate}</td>
                                        <td class="amount-debit" style="text-align: right; font-weight: 600;">${entry.debitAmount}</td>
                                        <td class="amount-credit" style="text-align: right; font-weight: 600;">${entry.creditAmount}</td>
                                        <td class="${entry.balanceType === 'you-receive' ? 'balance-you-receive' : 'balance-you-owe'}" style="text-align: right; font-weight: 700;">
                                            ${entry.balanceType === 'you-owe' ? '-' : ''}${entry.balance}
                                        </td>
                                    </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        ` : `
                        <div class="no-data">
                            <div class="no-data-icon">📄</div>
                            <div class="no-data-text">No Transaction Records Found</div>
                            <div class="no-data-subtitle">No transactions match the selected criteria</div>
                        </div>
                        `}
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-title">Statement Information</div>
                    <div class="footer-info">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
                    <div class="footer-info">This statement contains ${processedEntries.length} transaction records</div>
                    <div class="footer-info">Statement is valid only for the specified date range and filters applied</div>
                    <div style="margin-top: 10px; font-size: 8pt; color: #9ca3af;">
                        For any queries, please contact us immediately
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

export default new PDFService();
