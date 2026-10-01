import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';
import { emptyHistoricalVm, fulfillJson, historicalVm, mockHistoricalData } from '../support/historical-data';

/**
 * Historical Data for SELF (ARVIJ-1450; requester ruling: SELF is the SAME screen as TEAM) on the 375 mobile
 * shell: AC-P4-03-33 (Self parity) and AC-P4-03-34 (metric set / gating). `/insights/history` with no `scope`
 * is SELF; the BFF is asked for `scope=SELF`, never with `teamView`. Responses come from contract-shaped
 * fixtures (`page.route`); the last block runs against pa-be-dev's memory source.
 */
const SELF_URL = '/insights/history';

const cards = (page: Page): Locator => page.getByRole('list', { name: /Repricing|Case Count|FYP|FYC/ }).getByRole('listitem');
const filterButton = (page: Page): Locator => page.getByRole('button', { name: 'Filter', exact: true });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Filter & Selection' });
const chips = (page: Page): Locator => page.getByRole('list', { name: 'Filter & Selection' }).getByRole('listitem');
const card = (page: Page, month: string): Locator =>
  cards(page).filter({ has: page.getByRole('heading', { name: month, exact: true }) });

for (const persona of ['AGENT_P4', 'LEADER_P2'] as const) {
  test.describe(`Self Historical Data — mobile, ${persona} (ARVIJ-1450)`, () => {
    test.beforeEach(async ({ context }) => {
      await setPersona(context, persona);
    });

    test(`AC-P4-03-33 ${persona} with no scope opens the same card layout, asking the BFF for scope=SELF and no teamView`, async ({ page }) => {
      const watch = watchConsole(page);
      const mock = await mockHistoricalData(page);
      await page.goto(SELF_URL);

      await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
      await expect(cards(page)).toHaveCount(12);
      await expect(chips(page)).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
      await expect(page.getByText(/^As of 03\/09\/2026$/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
      await expect(filterButton(page)).toBeEnabled();
      await expect(card(page, 'January').locator('dt')).toHaveText(['2026']);
      await expect(card(page, 'January').locator('.hd-change')).toHaveText('-30.5%vs last month'); // Jan vs the previous Dec

      expect(mock.requests.length).toBeGreaterThan(0);
      for (const q of mock.requests) {
        expect(Object.fromEntries(q)).toEqual({ scope: 'SELF', metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR' });
      }
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });

    test(`AC-P4-03-33 ${persona}: scope=SELF in the URL is the same as no scope; businessLine is forwarded, teamView never is`, async ({ page }) => {
      const mock = await mockHistoricalData(page);
      await page.goto(`${SELF_URL}?scope=SELF&businessLine=TAKAFUL&teamView=GROUP`);
      await expect(cards(page)).toHaveCount(12);
      for (const q of mock.requests) {
        expect(q.get('scope')).toBe('SELF');
        expect(q.get('businessLine')).toBe('TAKAFUL');
        expect(q.has('teamView')).toBe(false);
      }
    });

    test(`AC-P4-03-34 ${persona}: the sheet offers the VM's five self metrics and the three times, nothing team-only`, async ({ page }) => {
      await mockHistoricalData(page);
      await page.goto(SELF_URL);
      await expect(cards(page)).toHaveCount(12);

      await filterButton(page).click();
      const s = sheet(page);
      await expect(s.getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveText([
        'TPC without Repricing', 'TPC with Repricing', 'Case Count', 'FYP', 'FYC',
      ]);
      await expect(s.getByRole('radiogroup', { name: 'Time' }).getByRole('radio')).toHaveText(['Current', 'vs Last Year', 'vs Last 2 Years']);
      await expect(s.getByRole('radio', { name: 'TPC without Repricing' })).toHaveAttribute('aria-checked', 'true');
      for (const teamOnly of ['Manpower (M)', 'Activity Ratio (A)', 'Productivity (P)', 'Average Case Size (A)', 'New Recruit Contracted']) {
        await expect(s.getByRole('radio', { name: teamOnly })).toHaveCount(0);
      }
    });

    test(`AC-P4-03-33 ${persona}: Apply switches metric and comparison, refetching once with scope=SELF`, async ({ page }) => {
      const mock = await mockHistoricalData(page);
      await page.goto(SELF_URL);
      await expect(cards(page)).toHaveCount(12);
      const loaded = mock.requests.length; // dev StrictMode mounts the effect twice, so count relative to first paint

      await filterButton(page).click();
      await sheet(page).getByRole('radio', { name: 'FYP' }).click();
      await sheet(page).getByRole('radio', { name: 'vs Last 2 Years' }).click();
      await sheet(page).getByRole('button', { name: 'Apply' }).click();

      await expect(page.getByRole('list', { name: 'FYP' }).getByRole('listitem')).toHaveCount(12);
      await expect(page).toHaveURL(/scope=SELF/);
      await expect(page).toHaveURL(/metricCode=FYP/);
      await expect(page).toHaveURL(/comparison=VS_LAST_2_YEARS/);
      await expect(page).not.toHaveURL(/variant=|teamView=/);
      await expect(chips(page)).toHaveText(['Timevs Last 2 Years', 'MetricFYP']);
      await expect(card(page, 'March').locator('dt')).toHaveText(['2026', '2025', '2024']);
      await expect(card(page, 'March').locator('.hd-change')).toHaveText(['+5.6%vs 2025', '-14.0%vs 2024']);
      expect(mock.requests).toHaveLength(loaded + 1);
      expect(Object.fromEntries(mock.requests.at(-1)!)).toEqual({ scope: 'SELF', metricCode: 'FYP', comparison: 'VS_LAST_2_YEARS' });
    });
  });
}

test.describe('Self Historical Data — states and entry (ARVIJ-1450)', () => {
  test('AC-P4-03-33 the dashboard entry carries scope=SELF + businessLine for an agent, and Back returns to the dashboard', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const mock = await mockHistoricalData(page);
    await page.goto('/insights/performance');
    await page.getByRole('button', { name: 'More actions' }).click();
    const entry = page.locator('.sheet').getByRole('link', { name: /Historical Data/ });
    await expect(entry).toHaveAttribute('href', /^\/insights\/history\?(?=.*scope=SELF)(?=.*businessLine=)/);
    await expect(entry).not.toHaveAttribute('href', /teamView/);
    await entry.click();

    await expect(page).toHaveURL(/\/insights\/history\?.*scope=SELF/);
    await expect(cards(page)).toHaveCount(12);
    for (const q of mock.requests) expect(q.get('scope')).toBe('SELF');

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/insights\/performance/);
  });

  test('AC-P4-03-33 a leader in SELF scope reaches the SELF page from the dashboard (no teamView)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    const mock = await mockHistoricalData(page);
    await page.goto('/insights/performance'); // a leader opens in SELF
    await page.getByRole('button', { name: 'More actions' }).click();
    const entry = page.locator('.sheet').getByRole('link', { name: /Historical Data/ });
    await expect(entry).toHaveAttribute('href', /scope=SELF/);
    await expect(entry).not.toHaveAttribute('href', /teamView/);
    await entry.click();
    await expect(cards(page)).toHaveCount(12);
    for (const q of mock.requests) {
      expect(q.get('scope')).toBe('SELF');
      expect(q.has('teamView')).toBe(false);
    }
  });

  test('AC-P4-03-33 the SELF page shows no TEAM-only chrome', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await mockHistoricalData(page);
    await page.goto(SELF_URL);
    await expect(cards(page)).toHaveCount(12);
    await expect(page.getByLabel('Scope switcher')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'My Team' })).toHaveCount(0);
    await expect(page.getByText(/Direct|Group|My Team/)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeVisible(); // Download sits beside Filter (§D; its journeys are in historical-data-download*.spec.ts)
    await expect(page.getByRole('tab')).toHaveCount(0); // the old metric pills are gone
    await expect(page.getByRole('button', { name: /Older window|Newer window/ })).toHaveCount(0); // and so is the pager
    await expect(page.getByRole('table')).toHaveCount(0); // cards on mobile
  });

  test('AC-P4-03-33 neither scope calls the legacy per-metric history endpoint any more', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const legacy: string[] = [];
    page.on('request', (r) => { if (/\/metrics\/[A-Z_]+\/history/.test(r.url())) legacy.push(r.url()); });
    await mockHistoricalData(page);
    await page.goto(SELF_URL);
    await expect(cards(page)).toHaveCount(12);
    await page.goto('/insights/history?scope=TEAM');
    await expect(cards(page)).toHaveCount(12);
    await page.goto('/insights/history?metricCode=TPC&window=VS_LAST_2_YEARS'); // an old bookmark: window is ignored
    await expect(cards(page)).toHaveCount(12);
    await expect(chips(page)).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    expect(legacy).toEqual([]);
  });

  test('AC-P4-03-25 SELF: a month with no current value shows "-" and an "N/A" change; Vs Last 2 Years shows three years', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await mockHistoricalData(page);
    await page.goto(`${SELF_URL}?comparison=VS_LAST_2_YEARS`);
    const oct = card(page, 'October');
    await expect(oct.locator('dt')).toHaveText(['2026', '2025', '2024']);
    await expect(oct.locator('dd')).toHaveText(['-', '32,400', '34,900']);
    await expect(oct.locator('.hd-na')).toHaveText(['N/A', 'N/A']);
    await expect(oct.locator('.hd-change-caption')).toHaveText(['vs 2025', 'vs 2024']);
    await expect(page.getByText('Total', { exact: true })).toHaveCount(0); // cards never show a total
  });

  test('AC-P4-03-33 SELF request failure keeps the frame; the filter stays disabled until a VM arrives; Retry recovers', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    let failing = true;
    await mockHistoricalData(page, (_q, route) => (failing ? fulfillJson(route, { code: 'BFF-5000' }, 500).then(() => true) : false));
    await page.goto(SELF_URL);

    await expect(page.getByRole('alert')).toContainText('Historical data could not be loaded. Please try again.');
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-card dd')).toHaveText(Array.from({ length: 12 }, () => '-'));
    await expect(chips(page)).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    await expect(filterButton(page)).toBeDisabled();

    failing = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(card(page, 'January').locator('dd')).toHaveText('25,246');
    await expect(filterButton(page)).toBeEnabled();
  });

  test('AC-P4-03-33 SELF loading shows the skeleton frame first', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await mockHistoricalData(page, async (_q, route) => {
      await gate;
      await fulfillJson(route, historicalVm({ scope: 'SELF' }));
      return true;
    });
    await page.goto(SELF_URL);
    await expect(page.locator('.hd-skel')).toBeVisible();
    await expect(chips(page)).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    release();
    await expect(cards(page)).toHaveCount(12);
  });

  test('AC-P4-03-26 / AC-P4-03-27 SELF EMPTY (a new agent) keeps the 12-month frame under the notice', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await mockHistoricalData(page, (_q, route) => fulfillJson(route, emptyHistoricalVm({ scope: 'SELF' })).then(() => true));
    await page.goto(SELF_URL);
    await expect(page.getByRole('status').filter({ hasText: 'Historical data is not available.' })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-card dd')).toHaveText(Array.from({ length: 12 }, () => '-'));
    await filterButton(page).click();
    await expect(sheet(page).getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveCount(5);
  });
});

/**
 * Against pa-be-dev's memory data source (Playwright boots it). Skips with a reason until the BFF build in use
 * serves `scope=SELF`.
 */
test.describe('Self Historical Data — real BFF (memory source)', () => {
  test.beforeEach(async ({ request }) => {
    const probe = await request.get(bffUrl('/api/bff/v1/performance/historical-data?scope=SELF'), { headers: { 'x-persona': 'AGENT_P4' } });
    const body = probe.ok() ? await probe.json() : {};
    test.skip(body?.context?.scope !== 'SELF', 'pa-be-dev dist does not serve historical-data for scope=SELF yet (rebuild pa-be-dev/dist)');
  });

  for (const persona of ['AGENT_P4', 'LEADER_P2'] as const) {
    test(`AC-P4-03-33 ${persona}: defaults render 12 month cards from the live BFF`, async ({ context, page }) => {
      await setPersona(context, persona);
      const watch = watchConsole(page);
      const responses: string[] = [];
      page.on('response', (r) => { if (r.url().includes('/performance/historical-data')) responses.push(`${r.status()} ${new URL(r.url()).search}`); });
      await page.goto(SELF_URL);

      await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
      await expect(cards(page)).toHaveCount(12);
      await expect(chips(page)).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('.hd-card dt').first()).toHaveText(/^20\d\d$/);
      await expect(page.locator('.hd-card').first().locator('.hd-change-caption')).toHaveText('vs last month');
      expect(responses[0]).toMatch(/^200 .*scope=SELF/);
      expect(responses.join('\n')).not.toContain('teamView');
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

  test('AC-P4-03-34 the live sheet offers exactly the five self metrics; Apply switches to FYP and Vs Last 2 Years', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto(SELF_URL);
    await expect(cards(page)).toHaveCount(12);
    await filterButton(page).click();
    await expect(sheet(page).getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveText([
      'TPC without Repricing', 'TPC with Repricing', 'Case Count', 'FYP', 'FYC',
    ]);
    await sheet(page).getByRole('radio', { name: 'FYP' }).click();
    await sheet(page).getByRole('radio', { name: 'vs Last 2 Years' }).click();
    await sheet(page).getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('list', { name: 'FYP' }).getByRole('listitem')).toHaveCount(12);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('.hd-card').first().locator('dt')).toHaveCount(3);
    await expect(page.locator('.hd-card').first().locator('.hd-change')).toHaveCount(2);
  });

  test('AC-P4-03-34 a leader keeps the team page: TEAM still offers the eight team metrics, SELF never does', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/history?scope=TEAM');
    await expect(page.getByRole('list', { name: 'TPC without Repricing' }).getByRole('listitem')).toHaveCount(12);
    await filterButton(page).click();
    await expect(sheet(page).getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveCount(8);
    await page.keyboard.press('Escape');
    await page.goto(SELF_URL);
    await expect(cards(page)).toHaveCount(12);
    await filterButton(page).click();
    await expect(sheet(page).getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveCount(5);
  });
});
