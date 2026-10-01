import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';
import { SERIES, emptyHistoricalVm, fulfillJson, historicalVm, mockHistoricalData } from '../support/historical-data';

/**
 * Team Historical Data (S-P4-03 §B, ARVIJ-1450-SP01) on the 375 mobile shell:
 * 12 month cards, read-only context chips, Filter & Selection sheet.
 * Request/response states the memory BFF cannot produce (EMPTY, N/A, 500) are
 * served by `page.route` fixtures shaped exactly like contract §2; the
 * "real BFF" block at the bottom runs against pa-be-dev's memory source.
 */
const TEAM_URL = '/insights/history?scope=TEAM';

const cards = (page: Page): Locator => page.getByRole('list', { name: /Repricing|Case Count|Manpower|Activity|Productivity|Average|New Recruit/ }).getByRole('listitem');
const filterButton = (page: Page): Locator => page.getByRole('button', { name: 'Filter', exact: true });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Filter & Selection' });
const card = (page: Page, month: string): Locator => cards(page).filter({ has: page.getByRole('heading', { name: month, exact: true }) });

/** Computed rgb() of a DLS colour token (no hard-coded hex in the tests). */
async function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

test.describe('Team Historical Data — mobile (ARVIJ-1450)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('AC-P4-03-15 TEAM dashboard "Historical Data" opens the Team view with scope=TEAM', async ({ page }) => {
    const watch = watchConsole(page);
    const mock = await mockHistoricalData(page);
    await page.goto('/insights/performance');
    await page.getByLabel('Scope switcher').click();
    await page.locator('.sheet').getByRole('radio', { name: 'Team' }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('link', { name: 'My Team' })).toBeVisible();

    await page.getByRole('button', { name: 'More actions' }).click();
    const entry = page.locator('.sheet').getByRole('link', { name: /Historical Data/ });
    await expect(entry).toHaveAttribute('href', /^\/insights\/history\?(?=.*scope=TEAM)(?=.*businessLine=)(?=.*teamView=DIRECT)/);
    await entry.click();

    await expect(page).toHaveURL(/\/insights\/history\?.*scope=TEAM/);
    await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    expect(mock.requests.length).toBeGreaterThan(0);
    for (const q of mock.requests) {
      expect(q.get('scope')).toBe('TEAM');
      expect(q.get('teamView')).toBe('DIRECT');
    }
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-18 first load defaults to TPC without Repricing + Current Year; chips are read-only; Filter and Download sit in the title bar', async ({ page }) => {
    const watch = watchConsole(page);
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);

    await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    const q = mock.requests[0]!;
    expect(Object.fromEntries(q)).toEqual({
      scope: 'TEAM', metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR',
    });

    const chips = page.getByRole('list', { name: 'Filter & Selection' }).getByRole('listitem');
    await expect(chips).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    await expect(chips.first().locator('strong')).toHaveText('Current Year');
    // read-only: not controls, and clicking one does not open the sheet
    await expect(page.getByRole('button', { name: /Current Year|TPC without Repricing/ })).toHaveCount(0);
    await chips.first().click();
    await expect(sheet(page)).toHaveCount(0);

    // Filter and Download (S-P4-03 §D) sit side by side in the title bar; the Download journeys are in historical-data-download*.spec.ts
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Filter', exact: true })).toBeVisible();
    await expect(page.getByText(/^As of 03\/09\/2026$/)).toBeVisible();
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-19 cards: month name, year label over value, no RM prefix, "-" for a missing month', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    const jan = card(page, 'January');
    await expect(jan.locator('dt')).toHaveText(['2026', '2025', '2024']);
    await expect(jan.locator('dd')).toHaveText(['25,246', '24,890', '34,900']);
    await expect(jan).not.toContainText('RM');

    const oct = card(page, 'October');
    await expect(oct.locator('dd')).toHaveText(['-', '32,400', '34,900']);
    // the cards are stacked, one column, 16px gutters (Figma 343 wide on 375)
    const box = (await jan.boundingBox())!;
    expect(Math.round(box.x)).toBe(16);
    expect(Math.round(box.width)).toBe(343);
    const next = (await card(page, 'February').boundingBox())!;
    expect(next.y).toBeGreaterThan(box.y + box.height);
  });

  test('AC-P4-03-20 Current Year: one value column; the change is month-over-month, captioned "vs last month"', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);

    const feb = card(page, 'February');
    await expect(feb.locator('dt')).toHaveText(['2026']);
    await expect(feb.locator('dd')).toHaveText(['27,120']);
    await expect(feb.locator('.hd-change')).toHaveCount(1);
    // Feb 2026 27,120 vs Jan 2026 25,246 → +7.4% (Jira AC7: the previous month)
    await expect(feb.locator('.hd-change').first()).toHaveText('+7.4%vs last month');
    await expect(page.getByText(/^vs 20\d\d$/)).toHaveCount(0); // no year captions in Current Year
  });

  test('AC-P4-03-31 January compares with the previous December and says so', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    // Jan 2026 25,246 vs Dec 2025 36,300 → -30.5% (the BFF computes it; the UI shows it with the "last month" caption)
    await expect(card(page, 'January').locator('.hd-change')).toHaveText('-30.5%vs last month');
  });

  test('AC-P4-03-21 Vs Last Year: two value columns, one pill captioned "vs 2025"', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);

    const mar = card(page, 'March');
    await expect(mar.locator('dt')).toHaveText(['2026', '2025']);
    await expect(mar.locator('dd')).toHaveText(['30,000', '28,400']);
    await expect(mar.locator('.hd-change')).toHaveText(['+5.6%vs 2025']);
  });

  test('AC-P4-03-22 Vs Last 2 Years: three value columns, two pills captioned "vs 2025" / "vs 2024"', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    const mar = card(page, 'March');
    await expect(mar.locator('dt')).toHaveText(['2026', '2025', '2024']);
    await expect(mar.locator('.hd-change')).toHaveText(['+5.6%vs 2025', '-14.0%vs 2024']);
    // wording lives in the bundle, not the component
    await expect(page.getByRole('list', { name: 'Filter & Selection' })).toContainText('vs Last 2 Years');
  });

  test('AC-P4-03-19 change pills: positive green, negative red, zero neutral, N/A plain', async ({ page }) => {
    const series = { ...SERIES, 2026: SERIES[2026]!.map((v, i) => (i === 1 ? SERIES[2025]![1]! : v)) };
    await mockHistoricalData(page, (q, route) => {
      if (q.get('comparison') !== 'VS_LAST_YEAR') return false;
      return fulfillJson(route, historicalVm({ comparison: 'VS_LAST_YEAR', series })).then(() => true);
    });
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);

    const positive = card(page, 'March').locator('.tag');
    await expect(positive).toHaveText('+5.6%');
    await expect(positive).toHaveClass(/badge-success/);
    await expect(positive).toHaveCSS('color', await tokenColor(page, '--tone-success'));
    await expect(positive).toHaveCSS('background-color', 'rgb(220, 252, 231)'); // Figma 9:11700 Tag-Success-Surface

    const zero = card(page, 'February').locator('.tag');
    await expect(zero).toHaveText('0%');
    await expect(zero).toHaveClass(/badge-muted/);
    await expect(zero).toHaveCSS('color', await tokenColor(page, '--tone-muted'));

    const na = card(page, 'October').locator('.hd-change');
    await expect(na).toHaveText('N/Avs 2025');
    await expect(na.locator('.tag')).toHaveCount(0);
    await expect(na.locator('.hd-na')).toHaveCSS('color', await tokenColor(page, '--color-text-muted'));
  });

  test('AC-P4-03-19 a decrease renders a red pill with one decimal and an explicit minus', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    const pill = card(page, 'January').locator('.tag').nth(1);
    await expect(pill).toHaveText('-27.7%');
    await expect(pill).toHaveClass(/badge-danger/);
    await expect(pill).toHaveCSS('color', 'rgb(149, 3, 32)'); // Figma 9:11700 Tag-Danger-Text
    await expect(pill).toHaveCSS('background-color', 'rgb(247, 228, 232)'); // Tag-Danger-Surface
  });

  test('AC-P4-03-25 a month without a current value shows "-" and an "N/A" change in a full-height card', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    const oct = card(page, 'October');
    await expect(oct.locator('dd').first()).toHaveText('-');
    await expect(oct.locator('.hd-na')).toHaveText(['N/A', 'N/A']);
    await expect(oct.locator('.hd-change-caption')).toHaveText(['vs 2025', 'vs 2024']);
    const h = async (c: Locator) => Math.round((await c.boundingBox())!.height);
    expect(await h(oct)).toBe(await h(card(page, 'January')));
  });

  test('AC-P4-03-32 mobile cards never show a Total, even when the VM carries totals; values stay without "RM"', async ({ page }) => {
    await mockHistoricalData(page); // TPC fixture: totals present
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(cards(page)).toHaveCount(12);
    await expect(page.getByText('Total', { exact: true })).toHaveCount(0);
    await expect(page.getByText('270,116')).toHaveCount(0);
    await expect(page.locator('.hd-cards')).not.toContainText('RM');
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('AC-P4-03-16 sheet: Metric radios in Figma order; selecting one + Apply refetches', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    const loaded = mock.requests.length; // dev StrictMode mounts the effect twice, so count relative to the first paint

    await filterButton(page).click();
    const s = sheet(page);
    await expect(s).toBeVisible();
    await expect(s.getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveText([
      'TPC without Repricing', 'TPC with Repricing', 'Case Count', 'Manpower (M)', 'Activity Ratio (A)',
      'Productivity (P)', 'Average Case Size (A)', 'New Recruit Contracted',
    ]);
    await expect(s.getByRole('radio', { name: 'TPC without Repricing' })).toHaveAttribute('aria-checked', 'true');
    await expect(s.getByRole('radio', { name: 'Current', exact: true })).toHaveAttribute('aria-checked', 'true');

    await s.getByRole('radio', { name: 'Case Count' }).click();
    await s.getByRole('button', { name: 'Apply' }).click();

    await expect(sheet(page)).toHaveCount(0);
    await expect(page).toHaveURL(/metricCode=CASE_COUNT/);
    await expect(page).not.toHaveURL(/variant=/);
    await expect(page.getByRole('list', { name: 'Filter & Selection' }).getByRole('listitem').nth(1)).toHaveText('MetricCase Count');
    await expect(page.getByRole('list', { name: 'Case Count' }).getByRole('listitem')).toHaveCount(12);
    expect(mock.requests).toHaveLength(loaded + 1);
    expect(Object.fromEntries(mock.requests.at(-1)!)).toEqual({ scope: 'TEAM', metricCode: 'CASE_COUNT', comparison: 'CURRENT_YEAR' });
  });

  test('AC-P4-03-16 TPC with Repricing sends its variant', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    await filterButton(page).click();
    await sheet(page).getByRole('radio', { name: 'TPC with Repricing' }).click();
    await sheet(page).getByRole('button', { name: 'Apply' }).click();
    await expect(page).toHaveURL(/variant=WITH_REPRICING/);
    await expect(page.getByRole('list', { name: 'Filter & Selection' })).toContainText('TPC with Repricing');
    expect(mock.requests.at(-1)!.get('variant')).toBe('WITH_REPRICING');
  });

  test('AC-P4-03-17 / AC-P4-03-23 changing Time and Metric together refetches once with both', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    const loaded = mock.requests.length;

    await filterButton(page).click();
    const s = sheet(page);
    await s.getByRole('radio', { name: 'vs Last 2 Years' }).click();
    await s.getByRole('radio', { name: 'Manpower (M)' }).click();
    await s.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByRole('list', { name: 'Manpower (M)' }).getByRole('listitem')).toHaveCount(12);
    await expect(card(page, 'January').locator('dt')).toHaveText(['2026', '2025', '2024']);
    expect(mock.requests).toHaveLength(loaded + 1);
    expect(Object.fromEntries(mock.requests.at(-1)!)).toEqual({ scope: 'TEAM', metricCode: 'MANPOWER', comparison: 'VS_LAST_2_YEARS' });
    // Apply replaces the history entry: the selection does not pile up Back steps
    await expect(page).toHaveURL(/comparison=VS_LAST_2_YEARS/);
  });

  test('AC-P4-03-17 the sheet opens on the applied selection; closing discards staged changes', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&metricCode=CASE_COUNT&comparison=VS_LAST_YEAR`);
    await expect(page.getByRole('list', { name: 'Case Count' }).getByRole('listitem')).toHaveCount(12);
    const loaded = mock.requests.length;

    await filterButton(page).click();
    const s = sheet(page);
    await expect(s.getByRole('radio', { name: 'Case Count' })).toHaveAttribute('aria-checked', 'true');
    await expect(s.getByRole('radio', { name: 'vs Last Year' })).toHaveAttribute('aria-checked', 'true');
    await s.getByRole('radio', { name: 'Manpower (M)' }).click();
    await s.getByRole('radio', { name: 'vs Last 2 Years' }).click();
    await s.getByRole('button', { name: 'Close' }).click();

    await expect(sheet(page)).toHaveCount(0);
    await expect(page).toHaveURL(/metricCode=CASE_COUNT&comparison=VS_LAST_YEAR|comparison=VS_LAST_YEAR.*metricCode=CASE_COUNT/);
    expect(mock.requests).toHaveLength(loaded);

    // re-opening starts from the applied selection again, not the discarded one
    await filterButton(page).click();
    await expect(sheet(page).getByRole('radio', { name: 'Case Count' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    expect(mock.requests).toHaveLength(loaded);
  });

  test('AC-P4-03-17 Apply without a change closes the sheet and does not refetch', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    const loaded = mock.requests.length;
    await filterButton(page).click();
    await sheet(page).getByRole('button', { name: 'Apply' }).click();
    await expect(sheet(page)).toHaveCount(0);
    expect(mock.requests).toHaveLength(loaded);
  });

  test('a11y: the sheet is a named modal dialog with named radio groups; focus goes in and returns to Filter', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);

    const trigger = filterButton(page);
    await trigger.click();
    const s = sheet(page);
    await expect(s).toHaveAttribute('aria-modal', 'true');
    await expect(s.getByRole('radiogroup', { name: 'Time' }).getByRole('radio')).toHaveText(['Current', 'vs Last Year', 'vs Last 2 Years']);
    await expect(s.getByRole('radiogroup', { name: 'Metric' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(s).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('a11y: radios can be selected from the keyboard', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    await filterButton(page).click();
    const radio = sheet(page).getByRole('radio', { name: 'vs Last Year' });
    await radio.focus();
    await page.keyboard.press('Space');
    await expect(radio).toHaveAttribute('aria-checked', 'true');
  });

  test('a11y: each card is a list item with a month heading and a year/value description list', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(12);
    await expect(page.getByRole('heading', { name: 'December', level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter', exact: true })).toHaveAccessibleName('Filter');
  });

  test('loading shows a skeleton and keeps the title bar; no data flashes in first', async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await mockHistoricalData(page, async (_q, route) => {
      await gate;
      await fulfillJson(route, historicalVm());
      return true;
    });
    await page.goto(TEAM_URL);

    await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
    await expect(page.locator('.hd-skel')).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(1);
    await expect(cards(page)).toHaveCount(0);
    await expect(filterButton(page)).toBeDisabled(); // the options come with the first response
    release();
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-skel')).toHaveCount(0);
    await expect(filterButton(page)).toBeEnabled();
  });

  test('AC-P4-03-26 / AC-P4-03-27 EMPTY: notice above the intact 12-month layout, all "-" and "N/A"', async ({ page }) => {
    const watch = watchConsole(page);
    await mockHistoricalData(page, (_q, route) => fulfillJson(route, emptyHistoricalVm({ comparison: 'VS_LAST_YEAR' })).then(() => true));
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);

    await expect(page.getByRole('status').filter({ hasText: 'Historical data is not available.' })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-card dd')).toHaveText(Array.from({ length: 24 }, () => '-'));
    await expect(page.locator('.hd-card .hd-na')).toHaveCount(12);
    await expect(page.locator('.hd-card .tag')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    // the filter stays usable so a leader can pick another metric
    await filterButton(page).click();
    await expect(sheet(page)).toBeVisible();
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('AC-P4-03-26 request failure: error banner + Retry over the intact layout; Retry recovers', async ({ page }) => {
    let failing = true;
    await mockHistoricalData(page, (_q, route) => {
      if (!failing) return false;
      return fulfillJson(route, { code: 'BFF-5000' }, 500).then(() => true);
    });
    await page.goto(TEAM_URL);

    const banner = page.getByRole('alert');
    await expect(banner).toContainText('Historical data could not be loaded. Please try again.');
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-card dd')).toHaveText(Array.from({ length: 12 }, () => '-'));
    await expect(page.getByRole('list', { name: 'Filter & Selection' })).toContainText('Current Year');

    failing = false;
    await banner.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(card(page, 'January').locator('dd')).toHaveText('25,246');
  });

  test('AC-P4-03-26 a malformed 200 is a failure, not a half-rendered grid', async ({ page }) => {
    await mockHistoricalData(page, (_q, route) => fulfillJson(route, { hello: 'world' }).then(() => true));
    await page.goto(TEAM_URL);
    await expect(page.getByRole('alert')).toContainText('could not be loaded');
    await expect(cards(page)).toHaveCount(12);
  });

  test('AC-P4-03-15 Back from the dashboard-opened view returns to the TEAM dashboard', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto('/insights/performance');
    await page.getByLabel('Scope switcher').click();
    await page.locator('.sheet').getByRole('radio', { name: 'Team' }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.locator('.sheet').getByRole('link', { name: /Historical Data/ }).click();
    await expect(cards(page)).toHaveCount(12);

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/insights\/performance/);
    await expect(page.getByRole('link', { name: 'My Team' })).toBeVisible(); // still the TEAM lens
  });

  test('AC-P4-03-15 a cold-opened link has nothing to go back to, so Back lands on the dashboard', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/insights\/performance/);
  });
});

/**
 * Against pa-be-dev's memory data source (Playwright boots it). The route only
 * exists once the BFF half of ARVIJ-1450 is built; skip with a clear reason
 * rather than failing when the dist predates it.
 */
test.describe('Team Historical Data — real BFF (memory source)', () => {
  test.beforeEach(async ({ context, request }) => {
    await setPersona(context, 'LEADER_P2');
    const probe = await request.get(bffUrl('/api/bff/v1/performance/historical-data?scope=TEAM'), { headers: { 'x-persona': 'LEADER_P2' } });
    test.skip(probe.status() === 404, 'pa-be-dev dist has no historical-data route yet (BFF half of ARVIJ-1450 not built)');
  });

  test('AC-P4-03-18 / AC-P4-03-19 defaults render 12 month cards from the live BFF', async ({ page }) => {
    const watch = watchConsole(page);
    const responses: string[] = [];
    page.on('response', (r) => { if (r.url().includes('/performance/historical-data')) responses.push(`${r.status()} ${new URL(r.url()).search}`); });
    await page.goto(TEAM_URL);

    await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
    await expect(cards(page)).toHaveCount(12);
    await expect(page.getByRole('list', { name: 'Filter & Selection' }).getByRole('listitem')).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('.hd-card dt').first()).toHaveText(/^20\d\d$/);
    await expect(page.locator('.hd-card').first().locator('.hd-change-caption')).toHaveText('vs last month'); // Current Year is month-over-month (Jira AC7)
    expect(responses[0]).toMatch(/^200 /);
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-17 / AC-P4-03-22 Vs Last 2 Years from the live BFF shows three years and two pills per month', async ({ page }) => {
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(cards(page)).toHaveCount(12);
    await expect(page.locator('.hd-card').first().locator('dt')).toHaveCount(3);
    await expect(page.locator('.hd-card').first().locator('.hd-change')).toHaveCount(2);
    await expect(page.locator('.hd-card').first().locator('.hd-change-caption')).toHaveText([/^vs 20\d\d$/, /^vs 20\d\d$/]);
  });

  test('AC-P4-03-16 / AC-P4-03-23 switching the metric in the sheet refetches from the live BFF', async ({ page }) => {
    await page.goto(TEAM_URL);
    await expect(cards(page)).toHaveCount(12);
    await filterButton(page).click();
    await sheet(page).getByRole('radio', { name: 'Case Count' }).click();
    await sheet(page).getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('list', { name: 'Case Count' }).getByRole('listitem')).toHaveCount(12);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('AC-P4-03-29 a non-leader cannot read it: the page shows the error state, not data', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto(TEAM_URL);
    await expect(page.getByRole('alert')).toContainText('could not be loaded');
    await expect(page.locator('.hd-card dd').first()).toHaveText('-');
  });
});
