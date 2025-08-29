import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

class WhatsifyService {
    constructor() {
        this.baseURL = process.env.WHATSIFY_BASE_URL;
        this.apiSecret = process.env.WHATSIFY_API_SECRET;
        this.accountId = process.env.WHATSIFY_ACCOUNT_ID;

        this.api = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
        });
    }

    async sendDocument(phoneNumber, pdfData, fileName, caption = '') {
        try {
            // Ensure proper buffer conversion
            let pdfBuffer;
            if (pdfData instanceof Uint8Array || Buffer.isBuffer(pdfData)) {
                pdfBuffer = Buffer.from(pdfData);
            } else if (typeof pdfData === 'string') {
                // Handle base64 string
                pdfBuffer = Buffer.from(pdfData, 'base64');
            } else {
                throw new Error('Invalid pdfData type - expected Uint8Array, Buffer, or base64 string');
            }

            const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

            const formData = new FormData();

            // ✅ FIXED: All formData.append values must be strings for non-file fields
            formData.append('secret', this.apiSecret);
            formData.append('account', this.accountId);
            formData.append('recipient', phoneNumber);
            formData.append('message', caption);
            formData.append('type', 'document');
            formData.append('document_type', 'pdf');
            formData.append('document_name', cleanFileName);

            formData.append('document_file', pdfBuffer, {
                filename: cleanFileName,
                contentType: 'application/pdf'
            });

            // ✅ FIXED: Changed from boolean false to string 'false'
            // formData.append('priority', false);

            const response = await this.api.post('/send/whatsapp', formData, {
                headers: formData.getHeaders(),
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Whatsify send error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async validateNumber(phoneNumber) {
        try {
            let cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
            if (!cleanedNumber.startsWith('+')) {
                cleanedNumber = '+' + cleanedNumber;
            }

            const response = await this.api.post('/validate/whatsapp', {
                secret: this.apiSecret,
                unique: this.accountId,
                phone: cleanedNumber
            });

            return {
                success: true,
                exists: response.data.exists === 'true' || response.data.exists === true
            };
        } catch (error) {
            console.error('Number validation error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getAccountStatus() {
        try {
            const response = await this.api.post('/get/wa.accounts', {
                secret: this.apiSecret
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new WhatsifyService();
