import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { inspectPdf, watchSecrets } from '../support/download';
import { fulfillJson, mockHistoricalData } from '../support/historical-data';

/**
 * Historical Data download (S-P4-03 §D, AC-P4-03-36…-39) on the 1440 desktop shell, both scopes: the "Download"
 * outlined pill beside Filter, the 608px right drawer, and the same encrypted-PDF journeys for Selected Metric and
 * All Metrics (the mobile spec covers the sheet states in depth).
 */
const PASSWORD = 'Qm4-desktop-pw-9082';

const CASES = [
  { persona: 'AGENT_P4', scope: 'SELF', url: '/insights/history', count: 5, table: 'TPC without Repricing' },
  { persona: 'LEADER_P2', scope: 'TEAM', url: '/insights/history?scope=TEAM', count: 8, table: 'TPC without Repricing' },
] as const;

const openButton = (page: Page): Locator => page.getByRole('button', { name: 'Download', exact: true });
const dialog = (page: Page): Locator => page.getByRole('dialog', { name: 'Download' });
const submitButton = (page: Page): Locator => dialog(page).getByRole('button', { name: /^(Download|Preparing your file…)$/ });

for (const { persona, scope, url, count, table } of CASES) {
  test.describe(`Download — desktop, ${scope} (${persona}) (ARVIJ-1450-SP02)`, () => {
    test.beforeEach(async ({ context }) => {
      test.setTimeout(90_000);
      await setPersona(context, persona);
    });

    test(`AC-P4-03-36 ${scope}: a labelled "Download" pill beside Filter, disabled until the data loads, opening a 608px drawer`, async ({ page }) => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await mockHistoricalData(page, async () => { await gate; });
      await page.goto(url);

      const pill = openButton(page);
      await expect(pill).toBeDisabled();
      await expect(pill).toContainText('Download');
      await expect(pill).toHaveCSS('border-top-left-radius', '56px'); // the same outlined pill as Filter
      const [filterBox, pillBox] = [await page.getByRole('button', { name: 'Filter', exact: true }).boundingBox(), await pill.boundingBox()];
      expect(Math.abs(filterBox!.y - pillBox!.y)).toBeLessThan(1); // side by side
      expect(pillBox!.x).toBeGreaterThan(filterBox!.x + filterBox!.width);
      release();
      await expect(page.getByRole('table', { name: table })).toBeVisible();
      await expect(pill).toBeEnabled();

      await pill.click();
      const box = (await dialog(page).boundingBox())!;
      expect(Math.round(box.width)).toBe(608);
      expect(Math.round(box.x + box.width)).toBe(1440);
      await expect(dialog(page).getByRole('radio', { name: 'Selected Metric' })).toHaveAttribute('aria-checked', 'true');
      await expect(dialog(page).getByLabel('Password')).toHaveAttribute('type', 'password');
      await dialog(page).getByLabel('Password').fill('short');
      await submitButton(page).click();
      await expect(dialog(page).getByRole('alert')).toHaveText('Use at least 6 characters.');
      await page.keyboard.press('Escape');
      await expect(dialog(page)).toHaveCount(0);
    });

    test(`AC-P4-03-37 / AC-P4-03-38 ${scope}: Selected Metric downloads an encrypted PDF and closes the drawer`, async ({ page }) => {
      const watch = watchConsole(page);
      const secrets = watchSecrets(page);
      const mock = await mockHistoricalData(page);
      await page.goto(`${url}${url.includes('?') ? '&' : '?'}comparison=VS_LAST_2_YEARS`);
      await expect(page.getByRole('table', { name: table })).toBeVisible();
      const loaded = mock.requests.length;

      await openButton(page).click();
      await dialog(page).getByLabel('Password').fill(PASSWORD);
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(download.suggestedFilename()).toMatch(/^historical-data-selected-vs-last-2-years-\d{8}\.pdf$/);
      const facts = await inspectPdf(download, ['Repricing', 'RM 25,246', 'Total']);
      expect(facts.startsWithPdfHeader && facts.hasEncryptDictionary && facts.usesAes256).toBe(true);
      expect(facts.leaks).toEqual([]);
      expect(facts.bytes).toBeGreaterThan(1500);
      await expect(dialog(page)).toHaveCount(0);
      expect(mock.requests).toHaveLength(loaded);
      expect(secrets.traffic.join('\n')).not.toContain(PASSWORD);
      expect(await secrets.storage()).not.toContain(PASSWORD);
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    });

    test(`AC-P4-03-37 ${scope}: All Metrics makes one request per metric (${count}) and one encrypted PDF`, async ({ page }) => {
      const mock = await mockHistoricalData(page);
      await page.goto(url);
      await expect(page.getByRole('table', { name: table })).toBeVisible();
      const loaded = mock.requests.length;

      await openButton(page).click();
      await dialog(page).getByRole('radio', { name: 'All Metrics' }).click();
      await dialog(page).getByLabel('Password').fill(PASSWORD);
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(mock.requests.slice(loaded)).toHaveLength(count);
      for (const q of mock.requests.slice(loaded)) {
        expect(q.get('scope')).toBe(scope);
        expect(q.get('comparison')).toBe('CURRENT_YEAR');
      }
      expect(download.suggestedFilename()).toMatch(/^historical-data-all-metrics-current-year-\d{8}\.pdf$/);
      const facts = await inspectPdf(download, ['Case Count', 'RM 25,246']);
      expect(facts.startsWithPdfHeader && facts.hasEncryptDictionary && facts.usesAes256).toBe(true);
      expect(facts.leaks).toEqual([]);
    });

    test(`AC-P4-03-39 ${scope}: a failing metric request shows the failure, keeps the entry, and a retry downloads`, async ({ page }) => {
      let failing = true;
      await mockHistoricalData(page, (query, route) => {
        if (failing && query.get('metricCode') === 'CASE_COUNT') return fulfillJson(route, {}, 503).then(() => true);
        return false;
      });
      await page.goto(url);
      await expect(page.getByRole('table', { name: table })).toBeVisible();
      await openButton(page).click();
      await dialog(page).getByRole('radio', { name: 'All Metrics' }).click();
      await dialog(page).getByLabel('Password').fill(PASSWORD);
      await submitButton(page).click();
      await expect(dialog(page).getByRole('alert')).toHaveText('The file could not be created. Please try again.');
      await expect(dialog(page).getByLabel('Password')).toHaveValue(PASSWORD);
      await expect(submitButton(page)).toBeEnabled();
      failing = false;
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
      await expect(dialog(page)).toHaveCount(0);
    });
  });
}
