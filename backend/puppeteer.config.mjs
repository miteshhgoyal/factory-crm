import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
