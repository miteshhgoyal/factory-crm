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
                    font-family: 'Times New Roman', serif;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #000000;
                    background: #ffffff;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                /* Header */
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000000;
                    padding-bottom: 15px;
                }
                
                .company-name {
                    font-size: 18px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 5px;
                }
                
                .document-title {
                    font-size: 14px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                }
                
                .document-subtitle {
                    font-size: 11px;
                    color: #555555;
                }
                
                /* Account Info */
                .account-section {
                    margin-bottom: 25px;
                    border: 1px solid #000000;
                }
                
                .section-header {
                    background-color: #f5f5f5;
                    padding: 8px 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 11px;
                    border-bottom: 1px solid #000000;
                }
                
                .account-details {
                    padding: 12px;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 6px;
                }
                
                .detail-label {
                    width: 150px;
                    font-weight: bold;
                    color: #333333;
                }
                
                .detail-value {
                    flex: 1;
                    color: #000000;
                }
                
                /* Summary Section */
                .summary-section {
                    margin-bottom: 25px;
                    border: 1px solid #000000;
                }
                
                .summary-grid {
                    display: flex;
                    border-collapse: collapse;
                }
                
                .summary-item {
                    flex: 1;
                    padding: 10px;
                    text-align: center;
                    border-right: 1px solid #000000;
                }
                
                .summary-item:last-child {
                    border-right: none;
                }
                
                .summary-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #666666;
                    margin-bottom: 4px;
                    font-weight: bold;
                }
                
                .summary-value {
                    font-size: 13px;
                    font-weight: bold;
                    color: #000000;
                }
                
                /* Filters */
                .filter-section {
                    margin-bottom: 20px;
                    padding: 10px;
                    background-color: #f9f9f9;
                    border: 1px solid #cccccc;
                }
                
                .filter-title {
                    font-weight: bold;
                    font-size: 11px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                
                .filter-details {
                    font-size: 10px;
                    color: #555555;
                }
                
                /* Transaction Table */
                .transaction-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #000000;
                    margin-bottom: 20px;
                }
                
                .transaction-table th {
                    background-color: #333333;
                    color: #ffffff;
                    padding: 8px 6px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 10px;
                    text-transform: uppercase;
                    border: 1px solid #000000;
                }
                
                .transaction-table td {
                    padding: 6px 6px;
                    border: 1px solid #cccccc;
                    font-size: 10px;
                    vertical-align: middle;
                }
                
                .transaction-table tbody tr:nth-child(even) {
                    background-color: #fafafa;
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
                    color: #d32f2f;
                    font-weight: bold;
                }
                
                .amount-credit {
                    color: #2e7d32;
                    font-weight: bold;
                }
                
                .balance-negative {
                    color: #d32f2f;
                    font-weight: bold;
                }
                
                .balance-positive {
                    color: #2e7d32;
                    font-weight: bold;
                }
                
                /* Footer */
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #000000;
                    text-align: center;
                    font-size: 10px;
                    color: #666666;
                }
                
                .footer-item {
                    margin-bottom: 3px;
                }
                
                /* Print Optimization */
                @media print {
                    body {
                        font-size: 11px;
                    }
                    
                    .container {
                        padding: 15px;
                    }
                    
                    .transaction-table {
                        page-break-inside: avoid;
                    }
                    
                    .transaction-table th,
                    .transaction-table td {
                        padding: 4px;
                        font-size: 9px;
                    }
                }
                
                /* No Data */
                .no-data {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666666;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="company-name">${companyName}</div>
                    <div class="document-title">Account Statement</div>
                    <div class="document-subtitle">Statement Date: ${new Date().toLocaleDateString('en-IN')} | Generated at: ${new Date().toLocaleTimeString('en-IN')}</div>
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
                                <span class="${clientData.currentBalance >= 0 ? 'balance-negative' : 'balance-positive'}">
                                    ₹${Math.abs(clientData.currentBalance).toLocaleString('en-IN')} 
                                    ${clientData.currentBalance >= 0 ? '(Dr)' : '(Cr)'}
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
                            <div class="summary-label">Total Debits</div>
                            <div class="summary-value">₹${summary.totalDebit.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Total Credits</div>
                            <div class="summary-value">₹${summary.totalCredit.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Net Amount</div>
                            <div class="summary-value">
                                ₹${Math.abs(summary.totalCredit - summary.totalDebit).toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Stock Transactions</div>
                            <div class="summary-value">${summary.stockTransactions}</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-label">Cash Transactions</div>
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
                            <th style="width: 25%;">Particulars</th>
                            <th style="width: 8%;">Type</th>
                            <th style="width: 6%;">Bags</th>
                            <th style="width: 8%;">Weight</th>
                            <th style="width: 8%;">Rate</th>
                            <th style="width: 10%;">Debit (₹)</th>
                            <th style="width: 10%;">Credit (₹)</th>
                            <th style="width: 11%;">Balance (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${processedEntries.map(entry => `
                        <tr>
                            <td class="text-center">${entry.sno}</td>
                            <td class="text-center">${entry.date}</td>
                            <td class="text-left">
                                ${entry.particulars}
                                ${entry.invoiceNo !== '-' ? `<br><small>Inv: ${entry.invoiceNo}</small>` : ''}
                            </td>
                            <td class="text-center">${entry.type}</td>
                            <td class="text-center">${entry.bags}</td>
                            <td class="text-center">${entry.weight}</td>
                            <td class="text-right">${entry.rate}</td>
                            <td class="text-right ${entry.debitAmount !== '-' ? 'amount-debit' : ''}">${entry.debitAmount}</td>
                            <td class="text-right ${entry.creditAmount !== '-' ? 'amount-credit' : ''}">${entry.creditAmount}</td>
                            <td class="text-right ${entry.balanceType === 'you-owe' ? 'balance-negative' : 'balance-positive'}">
                                ${entry.balanceType === 'you-owe' ? '(' : ''}${entry.balance}${entry.balanceType === 'you-owe' ? ')' : ''}
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
                    <div class="footer-item">This statement contains ${processedEntries.length} transaction record(s)</div>
                    <div class="footer-item">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
                    <div class="footer-item">For any discrepancies, please contact us within 7 days</div>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

export default new PDFService();
