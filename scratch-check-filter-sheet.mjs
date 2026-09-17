import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:3600/insights/performance', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Priority Metric', { timeout: 15000 });
await page.click('button:has-text("Filter")');
await page.waitForTimeout(500);
await page.screenshot({ path: `C:\\Users\\jithenr\\AppData\\Local\\Temp\\claude\\c--Users-jithenr-OneDrive---Capgemini-Desktop-Jithendra-Work-repo\\bd1c9715-09d5-4d9b-a2db-22738c902445\\scratchpad\\filter-sheet.png` });
const bodyText = await page.locator('body').innerText();
console.log(JSON.stringify({ hasScheme: /Scheme/i.test(bodyText), hasToggleRow: (await page.locator('.toggle-row').count()) > 0 }, null, 2));
await browser.close();
