if (process.env.NODE_ENV === 'production') {
    process.env.PUPPETEER_CACHE_DIR = '/opt/render/project/src/backend/.cache/puppeteer';
}

import puppeteer from 'puppeteer';
import { formatDate } from '../utils/dateUtils.js';

class PDFService {
    async generateClientLedgerPDF(clientData, ledgerEntries, filters = {}, companyName = 'Beerich') {
        let browser;
        try {
            const executablePath = process.env.NODE_ENV === 'production'
                ? '/opt/render/project/src/backend/.cache/puppeteer/chrome/linux-139.0.7258.138/chrome-linux64/chrome'
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
                particulars: entry.productName || '-',
                category: entry.transactionCategory === 'stock' ? 'Stock' : 'Payment',
                type: this.getClientTransactionType(entry),
                bags: entry.transactionCategory === 'stock' ? (entry.bags || '-') : 'N/A',
                weight: entry.transactionCategory === 'stock' ? (entry.weight || '-') : 'N/A',
                rate: entry.transactionCategory === 'stock' && entry.rate ? `₹${entry.rate}` : 'N/A',
                // FROM CLIENT PERSPECTIVE: What client owes or receives
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
                hasActiveFilters: this.hasActiveFilters(filters),
                companyName
            });

            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '8mm',
                    right: '8mm',
                    bottom: '8mm',
                    left: '8mm'
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
            // CLIENT PERSPECTIVE: What client owes vs receives
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

    // Convert transaction type to CLIENT-FRIENDLY LANGUAGE
    getClientTransactionType(entry) {
        if (entry.transactionCategory === 'stock') {
            return entry.transactionType === 'IN' ? 'Sale' : 'Purchase';
        } else {
            return entry.transactionType === 'IN' ? 'You Paid' : 'Payment';
        }
    }

    generateLedgerHTML(data) {
        const { clientData, processedEntries, summary, filters, hasActiveFilters, companyName } = data;

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Statement - ${clientData.name}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Times New Roman', 'Times', serif;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #000000;
                    background: #ffffff;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 15px;
                }
                
                /* Header */
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 3px solid #000000;
                    padding-bottom: 12px;
                }
                
                .company-name {
                    font-size: 24px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 6px;
                    color: #1a1a1a;
                }
                
                .document-title {
                    font-size: 18px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    color: #333333;
                }
                
                .document-subtitle {
                    font-size: 13px;
                    color: #666666;
                }
                
                /* Account Info */
                .account-section {
                    margin-bottom: 18px;
                    border: 2px solid #000000;
                    border-radius: 3px;
                }
                
                .section-header {
                    background-color: #f0f0f0;
                    padding: 8px 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 14px;
                    border-bottom: 2px solid #000000;
                    color: #1a1a1a;
                }
                
                .account-details {
                    padding: 12px;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 6px;
                    align-items: center;
                }
                
                .detail-label {
                    width: 160px;
                    font-weight: bold;
                    color: #333333;
                    font-size: 14px;
                }
                
                .detail-value {
                    flex: 1;
                    color: #000000;
                    font-size: 14px;
                }
                
                /* Summary Section */
                .summary-section {
                    margin-bottom: 18px;
                    border: 2px solid #000000;
                    border-radius: 3px;
                }
                
                .summary-grid {
                    display: flex;
                    border-collapse: collapse;
                }
                
                .summary-item {
                    flex: 1;
                    padding: 10px 8px;
                    text-align: center;
                    border-right: 1px solid #cccccc;
                }
                
                .summary-item:last-child {
                    border-right: none;
                }
                
                .summary-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    color: #666666;
                    margin-bottom: 4px;
                    font-weight: bold;
                }
                
                .summary-value {
                    font-size: 15px;
                    font-weight: bold;
                    color: #000000;
                }
                
                /* Filters */
                .filter-section {
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #f9f9f9;
                    border: 1px solid #cccccc;
                    border-radius: 3px;
                }
                
                .filter-title {
                    font-weight: bold;
                    font-size: 12px;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    color: #333333;
                }
                
                .filter-details {
                    font-size: 11px;
                    color: #555555;
                }
                
                /* Transaction Table */
                .transaction-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 2px solid #000000;
                    margin-bottom: 15px;
                    border-radius: 3px;
                    overflow: hidden;
                }
                
                .transaction-table th {
                    background-color: #2c3e50;
                    color: #ffffff;
                    padding: 8px 6px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 11px;
                    text-transform: uppercase;
                    border: 1px solid #34495e;
                }
                
                .transaction-table td {
                    padding: 6px 6px;
                    border: 1px solid #dddddd;
                    font-size: 11px;
                    vertical-align: middle;
                }
                
                .transaction-table tbody tr:nth-child(even) {
                    background-color: #f8f9fa;
                }
                
                .transaction-table tbody tr:nth-child(odd) {
                    background-color: #ffffff;
                }
                
                /* Column Alignments */
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                
                /* Amount Styling */
                .amount-debit {
                    color: #dc3545;
                    font-weight: bold;
                }
                
                .amount-credit {
                    color: #28a745;
                    font-weight: bold;
                }
                
                .balance-negative {
                    color: #dc3545;
                    font-weight: bold;
                }
                
                .balance-positive {
                    color: #28a745;
                    font-weight: bold;
                }
                
                /* Transaction Type Styling */
                .type-you-sold {
                    background-color: #d4edda;
                    color: #155724;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .type-you-purchased {
                    background-color: #f8d7da;
                    color: #721c24;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .type-you-paid {
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: bold;
                    font-size: 10px;
                }
                
                .type-you-received-payment {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-weight: bold;
                    font-size: 10px;
                }
                
                /* Footer */
                .footer {
                    margin-top: 20px;
                    padding-top: 12px;
                    border-top: 2px solid #000000;
                    text-align: center;
                    font-size: 11px;
                    color: #666666;
                }
                
                .footer-item {
                    margin-bottom: 3px;
                }
                
                /* Print Optimization */
                @media print {
                    body {
                        font-size: 13px;
                    }
                    
                    .container {
                        padding: 12px;
                    }
                    
                    .transaction-table th,
                    .transaction-table td {
                        padding: 5px;
                        font-size: 10px;
                    }
                }
                
                /* No Data */
                .no-data {
                    text-align: center;
                    padding: 30px 15px;
                    color: #666666;
                    font-style: italic;
                    font-size: 15px;
                }

                /* Balance Status */
                .balance-status {
                    font-size: 15px;
                    font-weight: bold;
                    padding: 6px 8px;
                    border-radius: 3px;
                    display: inline-block;
                }
                
                .balance-owe {
                    background-color: #f8d7da;
                    color: #721c24;
                }
                
                .balance-receive {
                    background-color: #d4edda;
                    color: #155724;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="company-name">${companyName}</div>
                    <div class="document-title">Your Account Statement</div>
                    <div class="document-subtitle">Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
                </div>
                
                <!-- Account Information -->
                <div class="account-section">
                    <div class="section-header">Account Information</div>
                    <div class="account-details">
                        <div class="detail-row">
                            <div class="detail-label">Account Holder:</div>
                            <div class="detail-value">${clientData.name}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Account Type:</div>
                            <div class="detail-value">${clientData.type}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Contact Number:</div>
                            <div class="detail-value">${clientData.phone}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Address:</div>
                            <div class="detail-value">${clientData.address || 'Not provided'}</div>
                        </div>
                        <div class="detail-row">
                            <div class="detail-label">Current Balance:</div>
                            <div class="detail-value">
                                <span class="balance-status ${clientData.currentBalance >= 0 ? 'balance-owe' : 'balance-receive'}">
                                    ₹${Math.abs(clientData.currentBalance).toLocaleString('en-IN')} 
                                    ${clientData.currentBalance >= 0 ? '(You Owe)' : '(Pending Amount)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary -->
                <div class="summary-section">
                    <div class="section-header">Transaction Summary</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-label">Total Transactions</div>
                            <div class="summary-value">${summary.totalTransactions}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">You Owe</div>
                            <div class="summary-value">₹${summary.totalDebit.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Pending Amount</div>
                            <div class="summary-value">₹${summary.totalCredit.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Net Balance</div>
                            <div class="summary-value">
                                ₹${Math.abs(summary.totalCredit - summary.totalDebit).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Stock Deals</div>
                            <div class="summary-value">${summary.stockTransactions}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Payments</div>
                            <div class="summary-value">${summary.cashTransactions}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Applied Filters -->
                ${hasActiveFilters ? `
                <div class="filter-section">
                    <div class="filter-title">Applied Filters:</div>
                    <div class="filter-details">
                        ${filters.startDate && filters.endDate ? `Date Range: ${formatDate(filters.startDate)} to ${formatDate(filters.endDate)} | ` : ''}
                        ${filters.monthYear ? `Month/Year: ${new Date(filters.monthYear + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} | ` : ''}
                        ${filters.year ? `Year: ${filters.year} | ` : ''}
                        ${filters.transactionType && filters.transactionType !== 'all' ? `Type: ${filters.transactionType.toUpperCase()} | ` : ''}
                        ${filters.minAmount || filters.maxAmount ? `Amount: ₹${filters.minAmount || '0'} - ₹${filters.maxAmount || '∞'}` : ''}
                    </div>
                </div>` : ''}
                
                <!-- Transaction Details -->
                ${processedEntries.length > 0 ? `
                <table class="transaction-table">
                    <thead>
                        <tr>
                            <th style="width: 4%;">Sr.</th>
                            <th style="width: 10%;">Date</th>
                            <th style="width: 22%;">Particulars</th>
                            <th style="width: 12%;">Transaction</th>
                            <th style="width: 6%;">Bags</th>
                            <th style="width: 8%;">Weight (kg)</th>
                            <th style="width: 8%;">Rate/kg</th>
                            <th style="width: 10%;">You Owe (₹)</th>
                            <th style="width: 10%;">Pending (₹)</th>
                            <th style="width: 10%;">Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processedEntries.map(entry => `
                        <tr>
                            <td class="text-center">${entry.sno}</td>
                            <td class="text-center">${entry.date}</td>
                            <td class="text-left">
                                <strong>${entry.particulars}</strong>
                                ${entry.invoiceNo !== '-' ? `<br><small style="color: #666; font-size: 9px;">Invoice: ${entry.invoiceNo}</small>` : ''}
                            </td>
                            <td class="text-center">
                                <span class="type-${entry.type.toLowerCase().replace(/\s+/g, '-')}">${entry.type}</span>
                            </td>
                            <td class="text-center">${entry.bags}</td>
                            <td class="text-center">${entry.weight}</td>
                            <td class="text-right">${entry.rate}</td>
                            <td class="text-right ${entry.debitAmount !== '-' ? 'amount-debit' : ''}">${entry.debitAmount}</td>
                            <td class="text-right ${entry.creditAmount !== '-' ? 'amount-credit' : ''}">${entry.creditAmount}</td>
                            <td class="text-right ${entry.balanceType === 'you-owe' ? 'balance-negative' : 'balance-positive'}">
                                ${entry.balance}
                                <br><small style="font-size: 9px;">(${entry.balanceType === 'you-owe' ? 'You Owe' : 'Pending'})</small>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : `
                <div class="no-data">
                    No transaction records found for the selected criteria.
                </div>
                `}
                
                <!-- Footer -->
                <div class="footer">
                    <div class="footer-item"><strong>This statement contains ${processedEntries.length} transaction record(s)</strong></div>
                    <div class="footer-item">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
                    <div class="footer-item">For any questions or discrepancies, please contact us within 7 days</div>
                    <div class="footer-item" style="margin-top: 8px; font-weight: bold;">Thank you for your business!</div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

export default new PDFService();
