import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const results = {};

for (const [label, viewport] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1440, height: 900 }]]) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  await page.goto('http://127.0.0.1:3600/insights/performance', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Priority Metrics', { timeout: 15000 }).catch(() => {});
  await page.screenshot({ path: `C:\\Users\\jithenr\\AppData\\Local\\Temp\\claude\\c--Users-jithenr-OneDrive---Capgemini-Desktop-Jithendra-Work-repo\\bd1c9715-09d5-4d9b-a2db-22738c902445\\scratchpad\\dashboard-${label}.png` });
  const bodyText = await page.locator('body').innerText();
  results[label] = {
    hasScheme: /Scheme/i.test(bodyText),
    hasToggleRow: (await page.locator('.toggle-row').count()) > 0,
    consoleErrors,
  };
  await page.close();
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
