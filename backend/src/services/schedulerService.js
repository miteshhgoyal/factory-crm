import schedule from 'node-schedule';
import Client from '../models/Client.js';
import Company from '../models/Company.js';
import Stock from '../models/Stock.js';
import CashFlow from '../models/CashFlow.js';
import whatsifyService from './whatsifyService.js';
import pdfService from './pdfService.js';
import mongoose from 'mongoose';

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.initializeScheduler();
    }

    initializeScheduler() {
        // Schedule for 1st day of every month at 9:00 AM
        const monthlyJob = schedule.scheduleJob('0 9 1 * *', async () => {
            console.log('Starting monthly ledger send job...');
            await this.sendMonthlyLedgers();
        });

        this.jobs.set('monthly-ledgers', monthlyJob);
        console.log('Monthly ledger scheduler initialized');
    }

    async sendMonthlyLedgers() {
        try {
            // Get all companies
            const companies = await Company.find({ isActive: true });

            for (const company of companies) {
                console.log(`Processing ledgers for company: ${company.companyName}`);

                // Get clients with autoSend enabled
                const clients = await Client.find({
                    companyId: company._id,
                    isActive: true,
                    autoSendLedger: true
                });

                console.log(`Found ${clients.length} clients with auto-send enabled`);

                // Calculate last month's date range
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

                const filters = {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };

                for (const client of clients) {
                    try {
                        await this.sendLedgerToClient(client, filters, company._id);
                        // Add delay between sends to avoid rate limiting
                        await this.delay(2000);
                    } catch (error) {
                        console.error(`Failed to send ledger to ${client.name}:`, error);
                    }
                }
            }

            console.log('Monthly ledger send job completed');
        } catch (error) {
            console.error('Error in monthly ledger job:', error);
        }
    }

    async sendLedgerToClient(client, filters, companyId) {
        try {
            // Validate WhatsApp number
            const validation = await whatsifyService.validateNumber(client.phone);
            if (!validation.success || !validation.exists) {
                console.log(`Invalid WhatsApp number for ${client.name}: ${client.phone}`);
                return { success: false, error: 'Invalid WhatsApp number' };
            }

            // Get ledger data
            const ledgerData = await this.getLedgerData(client._id, filters, companyId);

            if (!ledgerData.entries || ledgerData.entries.length === 0) {
                console.log(`No transactions found for ${client.name} in the specified period`);
                return { success: false, error: 'No transactions found' };
            }

            // Generate PDF using backend service
            const pdfBuffer = await pdfService.generateClientLedgerPDF(
                ledgerData.client,
                ledgerData.entries,
                filters
            );

            // Create filename
            const monthName = new Date(filters.startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            const fileName = `${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_Ledger_${monthName}.pdf`;

            // Send via WhatsApp
            const caption = `Hi ${client.name},

Here's your account ledger for ${monthName}.

Summary:
• Total Transactions: ${ledgerData.entries.length}
• Current Balance: ₹${Math.abs(client.currentBalance || 0).toLocaleString('en-IN')} ${client.currentBalance >= 0 ? '(Receivable)' : '(Payable)'}

Please review and let us know if you have any questions.

Thank you!`;

            const result = await whatsifyService.sendDocument(
                client.phone,
                pdfBuffer,
                fileName,
                caption
            );

            if (result.success) {
                console.log(`Ledger sent successfully to ${client.name} (${client.phone})`);

                // Update last sent timestamp
                await Client.findByIdAndUpdate(client._id, {
                    lastLedgerSent: new Date()
                });

                return { success: true };
            } else {
                console.error(`Failed to send to ${client.name}:`, result.error);
                return { success: false, error: result.error };
            }

        } catch (error) {
            console.error(`Error sending ledger to ${client.name}:`, error);
            return { success: false, error: error.message };
        }
    }

    async getLedgerData(clientId, filters, companyId) {
        try {
            const client = await Client.findById(clientId);
            if (!client) {
                throw new Error('Client not found');
            }

            // Build filter objects
            const stockFilter = {
                companyId: new mongoose.Types.ObjectId(companyId),
                clientId: new mongoose.Types.ObjectId(clientId),
            };

            const cashFlowFilter = {
                companyId: new mongoose.Types.ObjectId(companyId),
                clientId: new mongoose.Types.ObjectId(clientId),
            };

            // Add date filters
            if (filters.startDate && filters.endDate) {
                const dateFilter = {
                    $gte: new Date(filters.startDate),
                    $lte: new Date(filters.endDate + 'T23:59:59.999Z')
                };
                stockFilter.date = dateFilter;
                cashFlowFilter.date = dateFilter;
            }

            // Fetch transactions
            const [stockTransactions, cashFlowTransactions] = await Promise.all([
                Stock.find(stockFilter).populate({
                    path: 'clientId',
                    select: 'name phone address type currentBalance'
                }),
                CashFlow.find(cashFlowFilter).populate('createdBy', 'username name')
            ]);

            // Combine and process transactions
            const allTransactions = [];

            stockTransactions.forEach(transaction => {
                allTransactions.push({
                    ...transaction.toObject(),
                    transactionCategory: 'stock',
                    sourceModel: 'Stock'
                });
            });

            cashFlowTransactions.forEach(transaction => {
                allTransactions.push({
                    ...transaction.toObject(),
                    transactionCategory: 'cash',
                    sourceModel: 'CashFlow',
                    productName: transaction.description,
                    particulars: transaction.description,
                    quantity: null,
                    rate: null,
                    bags: null
                });
            });

            // Sort and process
            allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

            const processedEntries = [];
            let runningBalance = 0;

            for (let transaction of allTransactions) {
                let balanceChange = 0;
                let debitAmount = 0;
                let creditAmount = 0;

                if (transaction.transactionCategory === 'stock') {
                    if (transaction.type === 'IN') {
                        debitAmount = transaction.amount;
                        balanceChange = -transaction.amount;
                    } else {
                        creditAmount = transaction.amount;
                        balanceChange = transaction.amount;
                    }
                } else {
                    if (transaction.type === 'IN') {
                        creditAmount = transaction.amount;
                        balanceChange = -transaction.amount;
                    } else {
                        debitAmount = transaction.amount;
                        balanceChange = transaction.amount;
                    }
                }

                runningBalance += balanceChange;

                const entry = {
                    _id: transaction._id,
                    date: transaction.date,
                    particulars: transaction.particulars || transaction.productName || transaction.description,
                    bags: transaction.bags?.count || 0,
                    weight: transaction.quantity || 0,
                    rate: transaction.rate || 0,
                    debitAmount: debitAmount,
                    creditAmount: creditAmount,
                    balance: runningBalance,
                    transactionType: transaction.type,
                    transactionCategory: transaction.transactionCategory,
                    productName: transaction.productName || transaction.description,
                    invoiceNo: transaction.invoiceNo || null,
                    notes: transaction.notes,
                    originalUnit: transaction.bags && transaction.bags.count > 0 ? 'bag' : 'kg',
                    paymentMode: transaction.paymentMode || null,
                    category: transaction.category || null,
                    sourceModel: transaction.sourceModel
                };

                processedEntries.push(entry);
            }

            return {
                client: {
                    ...client.toObject(),
                    currentBalance: runningBalance
                },
                entries: processedEntries
            };

        } catch (error) {
            console.error('Error fetching ledger data:', error);
            throw error;
        }
    }

    async manualSendLedger(clientId, filters, userId) {
        try {
            const client = await Client.findById(clientId);
            if (!client) {
                return { success: false, error: 'Client not found' };
            }

            const result = await this.sendLedgerToClient(client, filters, client.companyId);

            return result;
        } catch (error) {
            console.error('Manual send error:', error);
            return { success: false, error: error.message };
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stopScheduler() {
        this.jobs.forEach((job, name) => {
            job.cancel();
            console.log(`Stopped scheduler: ${name}`);
        });
        this.jobs.clear();
    }
}

export default new SchedulerService();
