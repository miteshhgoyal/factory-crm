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
        this.isInitialized = false;
        this.initializeScheduler();
    }

    // Helper method to format time in IST consistently
    formatTimeIST(date) {
        if (!date) return 'Next month (29th)';

        return new Date(date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        });
    }

    initializeScheduler() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('Scheduler already initialized, skipping...');
            return;
        }

        // COMPLETELY CLEAR ALL EXISTING JOBS FIRST
        schedule.gracefulShutdown();
        this.stopScheduler();

        // Use Date object approach instead of cron string to be more explicit
        const rule = new schedule.RecurrenceRule();
        rule.date = process.env.SCHEDULER_DATE;
        rule.hour = process.env.SCHEDULER_HOUR;
        rule.minute = process.env.SCHEDULER_MINUTE;
        rule.second = process.env.SCHEDULER_SECOND;
        rule.tz = process.env.SCHEDULER_TIMEZONE;

        const monthlyJob = schedule.scheduleJob('monthly-ledgers', rule, async () => {
            console.log('=== SCHEDULED JOB TRIGGERED AT 5:25 PM IST (29th) ===');
            console.log('Starting monthly ledger send job...');
            console.log('Execution time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

            // Ensure this job only runs once by immediately canceling after trigger
            await this.sendMonthlyLedgers();
        });

        if (monthlyJob) {
            this.jobs.set('monthly-ledgers', monthlyJob);
            console.log('✅ Monthly ledger scheduler initialized for 29th day at 5:25 PM IST');

            // Fixed timezone display - always shows IST
            const nextRun = monthlyJob.nextInvocation();
            console.log('Next scheduled run:', this.formatTimeIST(nextRun));
        } else {
            console.error('❌ Failed to create monthly job');
        }

        this.isInitialized = true;
        console.log(`Total active jobs: ${this.jobs.size}`);
    }

    async sendMonthlyLedgers() {
        try {
            console.log('='.repeat(60));
            console.log('MONTHLY LEDGER SEND JOB STARTED');
            console.log('Current IST time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
            console.log('='.repeat(60));

            // Get all companies
            const companies = await Company.find({ isActive: true });
            console.log(`Found ${companies.length} active companies`);

            for (const company of companies) {
                console.log(`\n📋 Processing ledgers for company: ${company.name || 'Unnamed Company'}`);

                // Get clients with autoSend enabled
                const clients = await Client.find({
                    companyId: company._id,
                    isActive: true,
                    autoSendLedger: true
                });

                console.log(`Found ${clients.length} clients with auto-send enabled`);

                if (clients.length === 0) {
                    console.log('No clients to process for this company, skipping...');
                    continue;
                }

                // Calculate last month's date range
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

                const filters = {
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };

                console.log(`📅 Date range: ${filters.startDate} to ${filters.endDate}`);

                // Process clients with 15-second delay between each
                for (let i = 0; i < clients.length; i++) {
                    const client = clients[i];

                    try {
                        console.log(`\n📤 [${i + 1}/${clients.length}] Processing: ${client.name} (${client.phone})`);
                        console.log(`⏰ Current time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

                        const result = await this.sendLedgerToClient(client, filters, company._id, company.name);

                        if (result.success) {
                            console.log(`✅ Successfully sent to ${client.name}`);
                        } else {
                            console.log(`❌ Failed to send to ${client.name}: ${result.error}`);
                        }

                        // Add 15-second delay between clients (except for the last one)
                        if (i < clients.length - 1) {
                            console.log(`⏳ Waiting 15 seconds before next client...`);
                            await this.delay(15000); // 15 seconds
                        }

                    } catch (error) {
                        console.error(`❌ Error processing ${client.name}:`, error);

                        // Still wait 15 seconds even if there's an error (except for last client)
                        if (i < clients.length - 1) {
                            console.log(`⏳ Waiting 15 seconds before next client...`);
                            await this.delay(15000);
                        }
                    }
                }

                console.log(`\n✅ Completed processing all clients for company: ${company.name}`);
            }

            console.log('\n' + '='.repeat(60));
            console.log('MONTHLY LEDGER SEND JOB COMPLETED');
            console.log('Completion time:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
            console.log('='.repeat(60));

        } catch (error) {
            console.error('❌ Error in monthly ledger job:', error);
        }
    }

    async sendLedgerToClient(client, filters, companyId, companyName) {
        try {
            const validation = await whatsifyService.validateNumber(client.phone);
            if (!validation.success || !validation.exists) {
                console.log(`❌ Invalid WhatsApp number for ${client.name}: ${client.phone}`);
                return { success: false, error: 'Invalid WhatsApp number' };
            }

            const ledgerData = await this.getLedgerData(client._id, filters, companyId);

            if (!ledgerData.entries || ledgerData.entries.length === 0) {
                console.log(`⚠️ No transactions found for ${client.name} in the specified period`);
                return { success: false, error: 'No transactions found' };
            }

            console.log(`📄 Generating PDF for ${client.name}...`);
            const pdfBuffer = await pdfService.generateClientLedgerPDF(
                ledgerData.client,
                ledgerData.entries,
                filters,
                companyName,
            );

            const monthName = new Date(filters.startDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            const fileName = `${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_Ledger_${monthName}.pdf`;

            const caption = `Hi ${client.name},

Here's your account ledger for ${monthName}.

Summary:
• Total Transactions: ${ledgerData.entries.length}
• Current Balance: ₹${Math.abs(client.currentBalance || 0).toLocaleString('en-IN')} ${client.currentBalance >= 0 ? '(To Pay)' : '(Pending)'}

Please review and let us know if you have any questions.

Thank you!`;

            console.log(`📱 Sending WhatsApp message to ${client.name}...`);
            const result = await whatsifyService.sendDocument(
                client.phone,
                pdfBuffer,
                fileName,
                caption
            );

            if (result.success) {
                console.log(`✅ Ledger sent successfully to ${client.name} (${client.phone})`);

                await Client.findByIdAndUpdate(client._id, {
                    lastLedgerSent: new Date()
                });

                return { success: true };
            } else {
                console.error(`❌ Failed to send to ${client.name}:`, result.error);
                return { success: false, error: result.error };
            }

        } catch (error) {
            console.error(`❌ Error sending ledger to ${client.name}:`, error);
            return { success: false, error: error.message };
        }
    }

    async getLedgerData(clientId, filters, companyId) {
        try {
            const client = await Client.findById(clientId);
            if (!client) {
                throw new Error('Client not found');
            }

            const stockFilter = {
                companyId: new mongoose.Types.ObjectId(companyId),
                clientId: new mongoose.Types.ObjectId(clientId),
            };

            const cashFlowFilter = {
                companyId: new mongoose.Types.ObjectId(companyId),
                clientId: new mongoose.Types.ObjectId(clientId),
            };

            if (filters.startDate && filters.endDate) {
                const dateFilter = {
                    $gte: new Date(filters.startDate),
                    $lte: new Date(filters.endDate + 'T23:59:59.999Z')
                };
                stockFilter.date = dateFilter;
                cashFlowFilter.date = dateFilter;
            }

            const [stockTransactions, cashFlowTransactions] = await Promise.all([
                Stock.find(stockFilter).populate({
                    path: 'clientId',
                    select: 'name phone address type currentBalance'
                }),
                CashFlow.find(cashFlowFilter).populate('createdBy', 'username name')
            ]);

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
                    productName: "-",
                    particulars: "-",
                    quantity: null,
                    rate: null,
                    bags: null
                });
            });

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
                    particulars: transaction.productName || "-",
                    bags: transaction.bags?.count || 0,
                    weight: transaction.quantity || 0,
                    rate: transaction.rate || 0,
                    debitAmount: debitAmount,
                    creditAmount: creditAmount,
                    balance: runningBalance,
                    transactionType: transaction.type,
                    transactionCategory: transaction.transactionCategory,
                    productName: transaction.productName || "-",
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

            // Get company name for manual send
            const company = await Company.findById(client.companyId);
            const companyName = company?.name || 'Beerich';

            const result = await this.sendLedgerToClient(client, filters, client.companyId, companyName);
            return result;
        } catch (error) {
            console.error('Manual send error:', error);
            return { success: false, error: error.message };
        }
    }

    async testSchedulerNow() {
        console.log('🧪 MANUAL TEST: Running scheduler immediately...');
        await this.sendMonthlyLedgers();
    }

    getJobStatus() {
        const job = this.jobs.get('monthly-ledgers');
        if (job) {
            const nextRun = job.nextInvocation();
            return {
                active: true,
                nextRun: this.formatTimeIST(nextRun), // Now shows consistent IST time
                nextRunRaw: nextRun, // Keep raw date for programmatic use
                name: job.name || 'monthly-ledgers'
            };
        }
        return { active: false };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stopScheduler() {
        console.log('🛑 Stopping all scheduled jobs...');
        this.jobs.forEach((job, name) => {
            if (job) {
                job.cancel();
                console.log(`Stopped scheduler: ${name}`);
            }
        });
        this.jobs.clear();
        this.isInitialized = false;
    }
}

export default new SchedulerService();
