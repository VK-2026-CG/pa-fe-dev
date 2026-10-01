import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';
import { inspectPdf, watchSecrets } from '../support/download';
import { fulfillJson, mockHistoricalData } from '../support/historical-data';

/**
 * Historical Data download (S-P4-03 §D, ARVIJ-1450-SP02: AC-P4-03-36…-39) on the 375 mobile shell, for BOTH scopes:
 * AGENT_P4 (SELF, 5 metrics) and LEADER_P2 (TEAM, 8 metrics). The PDF is generated in the browser and encrypted
 * with the user's password (AES-256). What these tests can prove without decrypting: the download event, the file
 * name, `%PDF-`, an `/Encrypt` dictionary with `/CFM /AESV3`, no plain-text leak, one BFF request per metric, no
 * password anywhere in traffic / console / storage. Opening the file with and without the password is verified with
 * pypdf (commands in the CHANGELOG). The last block runs against pa-be-dev's memory source.
 */
const PASSWORD = 'Zx9-unique-pw-7413';
const SLOW_PDF_MS = 90_000;

const CASES = [
  {
    persona: 'AGENT_P4', scope: 'SELF', url: '/insights/history', count: 5,
    labels: ['TPC without Repricing', 'TPC with Repricing', 'Case Count', 'FYP', 'FYC'],
    keys: ['TPC|WITHOUT_REPRICING', 'TPC|WITH_REPRICING', 'CASE_COUNT|', 'FYP|', 'FYC|'],
  },
  {
    persona: 'LEADER_P2', scope: 'TEAM', url: '/insights/history?scope=TEAM', count: 8,
    labels: ['TPC without Repricing', 'TPC with Repricing', 'Case Count', 'Manpower (M)', 'Activity Ratio (A)', 'Productivity (P)', 'Average Case Size (A)', 'New Recruit Contracted'],
    keys: ['TPC|WITHOUT_REPRICING', 'TPC|WITH_REPRICING', 'CASE_COUNT|', 'MANPOWER|', 'ACTIVITY_RATIO|', 'PRODUCTIVITY|', 'AVERAGE_CASE_SIZE|', 'NEW_RECRUIT_CONTRACTED|'],
  },
] as const;

const openButton = (page: Page): Locator => page.getByRole('button', { name: 'Download', exact: true });
const dialog = (page: Page): Locator => page.getByRole('dialog', { name: 'Download' });
const submitButton = (page: Page): Locator => dialog(page).getByRole('button', { name: /^(Download|Preparing your file…)$/ });
const cards = (page: Page): Locator => page.getByRole('list', { name: /Repricing|Case Count|FYP|FYC|Manpower/ }).getByRole('listitem');

async function openSheet(page: Page, mode: 'Selected Metric' | 'All Metrics' = 'Selected Metric'): Promise<Locator> {
  await openButton(page).click();
  const dlg = dialog(page);
  await expect(dlg).toBeVisible();
  await dlg.getByRole('radio', { name: mode }).click();
  return dlg;
}

for (const { persona, scope, url, count, labels, keys } of CASES) {
  test.describe(`Download — mobile, ${scope} (${persona}) (ARVIJ-1450-SP02)`, () => {
    test.beforeEach(async ({ context }) => {
      test.setTimeout(SLOW_PDF_MS);
      await setPersona(context, persona);
    });

    test(`AC-P4-03-36 ${scope}: Download is disabled until the data has loaded, then opens the sheet (Selected default, masked required password)`, async ({ page }) => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await mockHistoricalData(page, async () => { await gate; });
      await page.goto(url);

      await expect(openButton(page)).toBeDisabled(); // no VM yet
      await expect(page.getByRole('button', { name: 'Filter', exact: true })).toBeDisabled();
      release();
      await expect(cards(page)).toHaveCount(12);
      await expect(openButton(page)).toBeEnabled();

      await openButton(page).click();
      const dlg = dialog(page);
      await expect(dlg).toHaveAttribute('aria-modal', 'true');
      await expect(dlg.getByRole('radiogroup').getByRole('radio')).toHaveText(['Selected Metric', 'All Metrics']);
      await expect(dlg.getByRole('radio', { name: 'Selected Metric' })).toHaveAttribute('aria-checked', 'true');
      await expect(dlg.getByRole('radio', { name: 'All Metrics' })).toHaveAttribute('aria-checked', 'false');
      const field = dlg.getByLabel('Password');
      await expect(field).toHaveAttribute('type', 'password');
      await expect(field).toHaveValue('');
      await expect(field).toHaveAttribute('required', '');
      await expect(field).toHaveAttribute('aria-required', 'true');
      await expect(dlg.getByText('The file is encrypted. You will need this password to open it.')).toBeVisible();
      await expect(dlg.getByRole('alert')).toHaveCount(0);
      await expect(submitButton(page)).toBeEnabled();
    });

    test(`AC-P4-03-36 ${scope}: a password shorter than 6 characters blocks Download; closing discards the entry`, async ({ page }) => {
      const mock = await mockHistoricalData(page);
      let downloads = 0;
      page.on('download', () => { downloads += 1; });
      await page.goto(url);
      await expect(cards(page)).toHaveCount(12);
      const loaded = mock.requests.length;

      const dlg = await openSheet(page);
      await submitButton(page).click(); // empty = required
      await expect(dlg.getByRole('alert')).toHaveText('Use at least 6 characters.');
      await dlg.getByLabel('Password').fill('abc12');
      await submitButton(page).click();
      await expect(dlg.getByRole('alert')).toHaveText('Use at least 6 characters.');
      await expect(dlg.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');
      await expect(dlg.getByLabel('Password')).toBeFocused();
      await page.waitForTimeout(400);
      expect(downloads).toBe(0);
      expect(mock.requests).toHaveLength(loaded); // blocked before any work

      await page.keyboard.press('Escape'); // closing discards
      await expect(dlg).toHaveCount(0);
      await expect(openButton(page)).toBeFocused();
      await openButton(page).click();
      await expect(dialog(page).getByLabel('Password')).toHaveValue('');
      await expect(dialog(page).getByRole('alert')).toHaveCount(0);
      await dialog(page).getByRole('button', { name: 'Close' }).click();
      await expect(dialog(page)).toHaveCount(0);
    });

    test(`AC-P4-03-37 / AC-P4-03-38 ${scope}: Selected Metric downloads an encrypted PDF from the loaded data, closes the sheet and forgets the password`, async ({ page }) => {
      const watch = watchConsole(page);
      const mock = await mockHistoricalData(page);
      await page.goto(`${url}${url.includes('?') ? '&' : '?'}comparison=VS_LAST_2_YEARS`);
      await expect(cards(page)).toHaveCount(12);
      const loaded = mock.requests.length;

      const dlg = await openSheet(page);
      await dlg.getByLabel('Password').fill(PASSWORD);
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);

      expect(download.suggestedFilename()).toMatch(/^historical-data-selected-vs-last-2-years-\d{8}\.pdf$/);
      expect(download.suggestedFilename()).not.toMatch(/agent|[A-Z]/); // lower-case, no identifier
      const facts = await inspectPdf(download, ['Repricing', 'RM 25,246', 'Historical Data', 'Team', 'Personal']);
      expect(facts.bytes).toBeGreaterThan(1500);
      expect(facts.startsWithPdfHeader).toBe(true);
      expect(facts.hasEncryptDictionary).toBe(true);
      expect(facts.usesAes256).toBe(true);
      expect(facts.leaks).toEqual([]);

      await expect(dlg).toHaveCount(0); // success closes the sheet
      await expect(openButton(page)).toBeFocused();
      expect(mock.requests).toHaveLength(loaded); // Selected reuses the VM already on screen
      await openButton(page).click();
      await expect(dialog(page).getByLabel('Password')).toHaveValue(''); // cleared
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });

    test(`AC-P4-03-37 ${scope}: Selected Metric follows the applied metric and comparison`, async ({ page }) => {
      await mockHistoricalData(page);
      await page.goto(url);
      await expect(cards(page)).toHaveCount(12);
      await page.getByRole('button', { name: 'Filter', exact: true }).click();
      const sheet = page.getByRole('dialog', { name: 'Filter & Selection' });
      await sheet.getByRole('radio', { name: 'vs Last Year' }).click();
      await sheet.getByRole('radio', { name: 'Case Count' }).click();
      await sheet.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByRole('list', { name: 'Case Count' }).getByRole('listitem')).toHaveCount(12);

      const dlg = await openSheet(page);
      await dlg.getByLabel('Password').fill(PASSWORD);
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(download.suggestedFilename()).toMatch(/^historical-data-selected-vs-last-year-\d{8}\.pdf$/);
      expect((await inspectPdf(download, ['Case Count'])).leaks).toEqual([]);
    });

    test(`AC-P4-03-37 ${scope}: All Metrics requests exactly one query per filter metric (3 at a time) and downloads one encrypted PDF`, async ({ page }) => {
      let slow = false; // only the download-phase requests are delayed, so their overlap can be measured
      let inFlight = 0;
      let peak = 0;
      const mock = await mockHistoricalData(page, async () => {
        if (!slow) return;
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => setTimeout(resolve, 150));
        inFlight -= 1;
      });
      await page.goto(`${url}${url.includes('?') ? '&' : '?'}comparison=VS_LAST_YEAR`);
      await expect(cards(page)).toHaveCount(12);
      const loaded = mock.requests.length;
      slow = true;

      const dlg = await openSheet(page, 'All Metrics');
      await dlg.getByLabel('Password').fill(PASSWORD);
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);

      const sent = mock.requests.slice(loaded);
      expect(sent).toHaveLength(count); // one request per metric/variant of the scope's filter list, no more, no fewer
      expect(sent.map((q) => `${q.get('metricCode')}|${q.get('variant') ?? ''}`).sort()).toEqual([...keys].sort());
      for (const q of sent) {
        expect(q.get('scope')).toBe(scope);
        expect(q.get('comparison')).toBe('VS_LAST_YEAR'); // the applied comparison, whatever the metric
        expect(q.has('teamView')).toBe(false); // the URL carried none
        expect(q.has('variant')).toBe(q.get('metricCode') === 'TPC'); // a variant only on TPC
      }
      expect(peak).toBeLessThanOrEqual(3);
      expect(peak).toBeGreaterThanOrEqual(2); // limited parallelism, not one by one

      expect(download.suggestedFilename()).toMatch(/^historical-data-all-metrics-vs-last-year-\d{8}\.pdf$/);
      const facts = await inspectPdf(download, [...labels.slice(0, 3), 'RM 25,246']);
      expect(facts.startsWithPdfHeader && facts.hasEncryptDictionary && facts.usesAes256).toBe(true);
      expect(facts.bytes).toBeGreaterThan(count * 1000);
      expect(facts.leaks).toEqual([]);
      await expect(dlg).toHaveCount(0);
    });

    test(`AC-P4-03-39 ${scope}: the password never appears in a request, console line, storage or the URL; the button is disabled while generating`, async ({ page }) => {
      const secrets = watchSecrets(page);
      await mockHistoricalData(page, async () => { await new Promise((resolve) => setTimeout(resolve, 120)); });
      await page.goto(url);
      await expect(cards(page)).toHaveCount(12);

      const dlg = await openSheet(page, 'All Metrics');
      await dlg.getByLabel('Password').fill(PASSWORD);
      const downloadPromise = page.waitForEvent('download');
      await submitButton(page).click();
      await expect(dlg.getByRole('button', { name: 'Preparing your file…' })).toBeDisabled();
      await expect(dlg.getByLabel('Password')).toBeDisabled();
      const download = await downloadPromise;
      await expect(dlg).toHaveCount(0);

      expect(secrets.traffic.length).toBeGreaterThan(0);
      expect(secrets.traffic.join('\n')).not.toContain(PASSWORD);
      expect(secrets.traffic.join('\n')).not.toContain(encodeURIComponent(PASSWORD));
      expect(secrets.consoleLines.join('\n')).not.toContain(PASSWORD);
      expect(await secrets.storage()).not.toContain(PASSWORD);
      expect((await inspectPdf(download, [PASSWORD])).leaks).toEqual([]);
      expect(download.suggestedFilename()).not.toContain(PASSWORD.toLowerCase());
    });

    test(`AC-P4-03-39 ${scope}: if any metric request fails the whole download fails with a retry; the entry is kept`, async ({ page }) => {
      const secrets = watchSecrets(page);
      let failing = true;
      let downloads = 0;
      page.on('download', () => { downloads += 1; });
      await mockHistoricalData(page, (query, route) => {
        if (failing && query.get('metricCode') === 'CASE_COUNT') return fulfillJson(route, { code: 'BFF-5000' }, 500).then(() => true);
        return false;
      });
      await page.goto(url);
      await expect(cards(page)).toHaveCount(12);

      const dlg = await openSheet(page, 'All Metrics');
      await dlg.getByLabel('Password').fill(PASSWORD);
      await submitButton(page).click();
      await expect(dlg.getByRole('alert')).toHaveText('The file could not be created. Please try again.');
      await expect(dlg.getByLabel('Password')).toHaveValue(PASSWORD); // entry kept
      await expect(dlg.getByRole('radio', { name: 'All Metrics' })).toHaveAttribute('aria-checked', 'true');
      await expect(submitButton(page)).toBeEnabled();
      await expect(submitButton(page)).toHaveText('Download'); // no longer "Preparing your file…"
      await page.waitForTimeout(300);
      expect(downloads).toBe(0);

      failing = false; // retry
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(download.suggestedFilename()).toMatch(/^historical-data-all-metrics-current-year-\d{8}\.pdf$/);
      await expect(dlg).toHaveCount(0);
      expect(secrets.consoleLines.join('\n')).not.toContain(PASSWORD);
      expect(secrets.traffic.join('\n')).not.toContain(PASSWORD);
    });
  });
}

/**
 * Against pa-be-dev's memory data source (Playwright boots it): All Metrics for each scope makes one real request
 * per metric and produces an encrypted PDF. Skips with a reason until the BFF in use serves what the screen needs.
 */
test.describe('Download — real BFF (memory source)', () => {
  for (const { persona, scope, url, count } of CASES) {
    test(`AC-P4-03-37 / AC-P4-03-38 ${scope}: All Metrics from the live BFF — ${count} requests, all 200, one encrypted PDF`, async ({ context, page, request }) => {
      test.setTimeout(SLOW_PDF_MS);
      const probe = await request.get(bffUrl(`/api/bff/v1/performance/historical-data?scope=${scope}`), { headers: { 'x-persona': persona } });
      const body = probe.ok() ? await probe.json() : {};
      test.skip(body?.context?.scope !== scope, `pa-be-dev dist does not serve historical-data for scope=${scope} yet`);
      await setPersona(context, persona);
      const secrets = watchSecrets(page);
      const statuses: number[] = [];
      let watching = false;
      page.on('response', (r) => { if (watching && r.url().includes('/performance/historical-data')) statuses.push(r.status()); });
      await page.goto(url);
      await expect(cards(page)).toHaveCount(12);

      const dlg = await openSheet(page, 'All Metrics');
      await dlg.getByLabel('Password').fill(PASSWORD);
      watching = true;
      const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
      expect(statuses).toHaveLength(count);
      expect(statuses.every((s) => s === 200)).toBe(true);
      const facts = await inspectPdf(download, ['Repricing', 'Case Count']);
      expect(facts.startsWithPdfHeader && facts.hasEncryptDictionary && facts.usesAes256).toBe(true);
      expect(facts.leaks).toEqual([]);
      expect(secrets.traffic.join('\n')).not.toContain(PASSWORD);
    });
  }

  test('AC-P4-03-37 SELF: Selected Metric from the live BFF needs no extra request', async ({ context, page, request }) => {
    test.setTimeout(SLOW_PDF_MS);
    const probe = await request.get(bffUrl('/api/bff/v1/performance/historical-data?scope=SELF'), { headers: { 'x-persona': 'AGENT_P4' } });
    const body = probe.ok() ? await probe.json() : {};
    test.skip(body?.context?.scope !== 'SELF', 'pa-be-dev dist does not serve historical-data for scope=SELF yet');
    await setPersona(context, 'AGENT_P4');
    let seen = 0;
    page.on('response', (r) => { if (r.url().includes('/performance/historical-data')) seen += 1; });
    await page.goto('/insights/history?metricCode=FYP&comparison=VS_LAST_2_YEARS');
    await expect(page.getByRole('list', { name: 'FYP' }).getByRole('listitem')).toHaveCount(12);
    const before = seen;
    const dlg = await openSheet(page);
    await dlg.getByLabel('Password').fill(PASSWORD);
    const [download] = await Promise.all([page.waitForEvent('download'), submitButton(page).click()]);
    expect(seen).toBe(before);
    expect(download.suggestedFilename()).toMatch(/^historical-data-selected-vs-last-2-years-\d{8}\.pdf$/);
    expect((await inspectPdf(download)).usesAes256).toBe(true);
  });
});
