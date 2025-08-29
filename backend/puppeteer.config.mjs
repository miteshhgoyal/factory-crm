import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * @type {import("puppeteer").Configuration}
 */
export default {
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
