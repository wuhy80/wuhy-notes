import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const vault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const browserRoot = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
let executablePath = process.env.READER_BROWSER;
if (!executablePath && fs.existsSync(browserRoot)) {
  for (const name of fs.readdirSync(browserRoot).filter(name => /^chromium-\d+$/.test(name)).sort().reverse()) {
    for (const layout of ['chrome-win/chrome.exe', 'chrome-win64/chrome.exe', 'chrome-linux/chrome']) {
      const candidate = path.join(browserRoot, name, layout);
      if (fs.existsSync(candidate)) { executablePath = candidate; break; }
    }
    if (executablePath) break;
  }
}
export default defineConfig({
  testDir: '.',
  testMatch: 'browser.spec.mjs',
  outputDir: path.join(vault, '.cache/reader-tests'),
  workers: 1,
  timeout: 45000,
  reporter: 'list',
  use: {
    baseURL: process.env.READER_TEST_URL || 'http://127.0.0.1:8791',
    actionTimeout: 10000,
    navigationTimeout: 15000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: executablePath ? { executablePath } : {},
    screenshot: 'only-on-failure',
  },
  webServer: process.env.READER_TEST_URL ? undefined : {
    command: 'node scripts/preview-md-reader.mjs --skip-build --port 8791',
    cwd: vault,
    url: 'http://127.0.0.1:8791',
    reuseExistingServer: false,
    timeout: 15000,
  },
});
