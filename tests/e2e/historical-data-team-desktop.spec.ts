import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';
import { SERIES, emptyHistoricalVm, fulfillJson, historicalVm, mockHistoricalData } from '../support/historical-data';

/**
 * Team Historical Data (ARVIJ-1450) on the 1440 desktop shell: a table inside a
 * white card titled with the selected metric (Figma 9:11300 + the requester's
 * desktop image) — grey bold header, centred value/change columns, "RM" prefix,
 * hairlines, and a bold Total row for additive metrics. The sheet becomes a
 * 608px right drawer. BFF responses come from contract-shaped fixtures
 * (`page.route`); the mobile cards and the full state matrix are in
 * historical-data-team.spec.ts. The last block runs against pa-be-dev.
 */
const TEAM_URL = '/insights/history?scope=TEAM';

const table = (page: Page): Locator => page.getByRole('table', { name: 'TPC without Repricing' });
const bodyRows = (page: Page): Locator => table(page).locator('tbody tr');
const totalRow = (page: Page): Locator => table(page).locator('tfoot tr');
const bodyRow = (page: Page, month: string): Locator =>
  bodyRows(page).filter({ has: page.getByRole('rowheader', { name: month, exact: true }) });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Filter & Selection' });

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

test.describe('Team Historical Data — desktop (ARVIJ-1450)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('AC-P4-03-22 / AC-P4-03-19 Vs Last 2 Years: six equal columns, 12 month rows, "RM" values, "% Change vs LY / L2Y" headers', async ({ page }) => {
    const watch = watchConsole(page);
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'TPC without Repricing', level: 2 })).toBeVisible();
    await expect(table(page).getByRole('columnheader')).toHaveText([
      'Month', '2026', '2025', '2024', '% Change vs LY', '% Change vs L2Y',
    ]);
    await expect(bodyRows(page)).toHaveCount(12);
    await expect(bodyRows(page).getByRole('rowheader')).toHaveText(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

    // equal-width columns (Figma: six equal columns)
    const widths = await table(page).locator('thead th').evaluateAll((ths) => ths.map((th) => Math.round(th.getBoundingClientRect().width)));
    expect(widths).toHaveLength(6);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);

    // the table keeps the currency prefix (the mobile cards do not)
    await expect(bodyRow(page, 'Jan').getByRole('cell')).toHaveText(['RM 25,246', 'RM 24,890', 'RM 34,900', '+1.4%', '-27.7%']);
    expect((await bodyRows(page).first().boundingBox())!.height).toBeGreaterThanOrEqual(72); // Figma: 72px month rows
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-20 / AC-P4-03-21 the other two comparisons use the same grid with fewer columns', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(table(page).getByRole('columnheader')).toHaveText(['Month', '2026', 'MoM % Change']); // Current Year: one value column, month-over-month (Jira AC7)

    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);
    await expect(table(page).getByRole('columnheader')).toHaveText(['Month', '2026', '2025', '% Change vs LY']);
  });

  test('AC-P4-03-19 table look: grey bold header, left regular Month, centred values, hairlines, white rounded card', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(table(page)).toBeVisible();

    const headCell = table(page).getByRole('columnheader', { name: '2026' });
    await expect(headCell).toHaveCSS('background-color', await tokenColor(page, '--color-surface-input'));
    await expect(headCell).toHaveCSS('font-weight', '700');
    await expect(headCell).toHaveCSS('text-align', 'center');
    await expect(table(page).getByRole('columnheader', { name: 'Month' })).toHaveCSS('text-align', 'left');

    const month = bodyRow(page, 'Jan').getByRole('rowheader');
    await expect(month).toHaveCSS('text-align', 'left');
    await expect(month).toHaveCSS('font-weight', '400');
    await expect(bodyRow(page, 'Jan').getByRole('cell').first()).toHaveCSS('text-align', 'center');
    await expect(bodyRow(page, 'Jan').getByRole('cell').first()).toHaveCSS('font-weight', '400');
    await expect(bodyRow(page, 'Jan').getByRole('cell').first()).toHaveCSS('border-bottom-width', '1px');

    const card = page.locator('.hd-table-card');
    await expect(card).toHaveCSS('background-color', await tokenColor(page, '--color-surface'));
    await expect(card).toHaveCSS('border-radius', '16px');
    await expect(page.getByRole('heading', { name: 'TPC without Repricing', level: 2 })).toHaveCSS('font-weight', '700');
  });

  test('AC-P4-03-19 / AC-P4-03-25 pill tones in the table: positive green, negative red, zero follows the VM (neutral)', async ({ page }) => {
    const series = { ...SERIES, 2026: SERIES[2026]!.map((v, i) => (i === 1 ? SERIES[2025]![1]! : v)) }; // Feb == Feb 2025 → 0%
    await mockHistoricalData(page, (q, route) => {
      if (q.get('comparison') !== 'VS_LAST_YEAR') return false;
      return fulfillJson(route, historicalVm({ comparison: 'VS_LAST_YEAR', series })).then(() => true);
    });
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);

    const march = bodyRow(page, 'Mar').locator('.tag');
    await expect(march).toHaveText('+5.6%');
    await expect(march).toHaveCSS('color', 'rgb(34, 197, 94)'); // Figma 9:11300 Tag-Success-Text
    const zero = bodyRow(page, 'Feb').locator('.tag');
    await expect(zero).toHaveText('0%');
    await expect(zero).toHaveClass(/badge-muted/); // Figma draws 0% green — recorded as an open question, not copied
    await expect(zero).toHaveCSS('color', await tokenColor(page, '--tone-muted'));
    await expect(bodyRow(page, 'Oct').getByRole('cell')).toHaveText(['-', 'RM 32,400', 'N/A']);
  });

  test('AC-P4-03-25 missing values are "-" and their change is a plain "N/A"; pills keep their tone', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    await expect(bodyRow(page, 'Oct').getByRole('cell')).toHaveText(['-', 'RM 32,400', 'RM 34,900', 'N/A', 'N/A']);
    await expect(bodyRow(page, 'Oct').locator('.tag')).toHaveCount(0);
    await expect(bodyRow(page, 'Feb').locator('.tag').nth(0)).toHaveClass(/badge-success/);
    await expect(bodyRow(page, 'Feb').locator('.tag').nth(1)).toHaveClass(/badge-danger/);
  });

  test('AC-P4-03-32 Total row (Vs Last 2 Years): grey bold last row with sums, "RM" prefix and two change pills', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);

    await expect(totalRow(page)).toHaveCount(1);
    await expect(totalRow(page).getByRole('rowheader')).toHaveText('Total');
    // like-for-like: Jan–Sep only, the months 2026 has a value for
    await expect(totalRow(page).getByRole('cell')).toHaveText(['RM 270,116', 'RM 255,330', 'RM 314,100', '+5.8%', '-14.0%']);
    // change cells are bold toned TEXT here (requester's desktop image), not pills; the month rows keep theirs
    await expect(totalRow(page).locator('.tag')).toHaveCount(0);
    const [up, down] = [totalRow(page).locator('.hd-total-change').nth(0), totalRow(page).locator('.hd-total-change').nth(1)];
    await expect(up).toHaveText('+5.8%');
    await expect(up).toHaveClass(/hd-tone-success/);
    await expect(up).toHaveCSS('color', 'rgb(34, 197, 94)'); // desktop Tag-Success-Text
    await expect(up).toHaveCSS('font-weight', '700');
    await expect(up).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(down).toHaveText('-14.0%');
    await expect(down).toHaveClass(/hd-tone-danger/);
    await expect(down).toHaveCSS('color', 'rgb(210, 4, 45)'); // desktop Tag-Danger-Text
    await expect(down).toHaveCSS('font-weight', '700');
    await expect(down).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(bodyRow(page, 'Jan').locator('.tag')).toHaveCount(2);

    // it is the last row, grey and bold
    const rows = table(page).getByRole('row');
    await expect(rows.last()).toContainText('Total');
    await expect(rows).toHaveCount(14); // header + 12 months + total
    const cell = totalRow(page).getByRole('cell').first();
    await expect(cell).toHaveCSS('background-color', await tokenColor(page, '--color-surface-input'));
    await expect(cell).toHaveCSS('font-weight', '700');
    await expect(totalRow(page).getByRole('rowheader')).toHaveCSS('font-weight', '700');
    await expect(cell).toHaveCSS('text-align', 'center');
    await expect(totalRow(page).getByRole('rowheader')).toHaveCSS('text-align', 'left');
    expect((await totalRow(page).boundingBox())!.height).toBeGreaterThanOrEqual(56);
  });

  test('AC-P4-03-32 Total row (Current Year): the current total; the MoM change cell stays empty (not "N/A")', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);

    await expect(table(page).getByRole('columnheader')).toHaveText(['Month', '2026', 'MoM % Change']);
    await expect(totalRow(page).getByRole('rowheader')).toHaveText('Total');
    await expect(totalRow(page).getByRole('cell')).toHaveText(['RM 270,116', '']);
    await expect(totalRow(page).locator('.tag')).toHaveCount(0);
    await expect(totalRow(page).locator('.hd-total-change')).toHaveCount(0);
    await expect(totalRow(page)).not.toContainText('N/A');
  });

  test('AC-P4-03-32 Total row (Vs Last Year): one pill; a null total change reads "N/A", a null total value "-"', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_YEAR`);
    await expect(totalRow(page).getByRole('cell')).toHaveText(['RM 270,116', 'RM 255,330', '+5.8%']);

    // the BFF may send nulls (a year missing one of the anchor months): never a partial sum
    await mockHistoricalData(page, (_q, route) =>
      fulfillJson(route, historicalVm({
        comparison: 'VS_LAST_2_YEARS',
        totals: { values: [{ kind: 'MONEY', amount: '270116.00', currency: 'MYR' }, null, { kind: 'MONEY', amount: '314100.00', currency: 'MYR' }], changes: [null, { comparisonBasis: 'LAST_2_YEARS', direction: 'DOWN', sentiment: 'NEGATIVE', display: 'PCT', pct: -14 }] },
      })).then(() => true));
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS&metricCode=TPC`);
    await expect(totalRow(page).getByRole('cell')).toHaveText(['RM 270,116', '-', 'RM 314,100', 'N/A', '-14.0%']);
    await expect(totalRow(page).locator('.hd-na')).toHaveText('N/A');
  });

  test('AC-P4-03-32 a metric without totals renders no Total row; tablet cards never show one', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&metricCode=MANPOWER&comparison=VS_LAST_2_YEARS`);
    const manpower = page.getByRole('table', { name: 'Manpower (M)' });
    await expect(manpower.locator('tbody tr')).toHaveCount(12);
    await expect(manpower.locator('tfoot')).toHaveCount(0);
    await expect(page.getByText('Total', { exact: true })).toHaveCount(0);

    await page.setViewportSize({ width: 820, height: 1000 });
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`); // TPC does have totals in the VM…
    await expect(page.getByRole('list', { name: 'TPC without Repricing' }).getByRole('listitem')).toHaveCount(12);
    await expect(page.getByText('Total', { exact: true })).toHaveCount(0); // …but cards never render them
  });

  test('desktop chrome: breadcrumb instead of Back, pill Filter + Download buttons, read-only chips', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumb.getByRole('link', { name: 'Performance' })).toBeVisible();
    await expect(crumb.locator('[aria-current="page"]')).toHaveText('Historical Data');
    await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0);
    const filter = page.getByRole('button', { name: 'Filter', exact: true });
    await expect(filter).toContainText('Filter');
    await expect(filter).toHaveCSS('border-top-left-radius', '56px'); // outlined pill (Figma)
    await expect(page.getByRole('button', { name: 'Download', exact: true })).toHaveCSS('border-top-left-radius', '56px'); // the same outlined pill as Filter (§D)
    const chips = page.getByRole('list', { name: 'Filter & Selection' }).getByRole('listitem');
    await expect(chips).toHaveText(['TimeCurrent Year', 'MetricTPC without Repricing']);
    await expect(chips.first()).toHaveCSS('background-color', await tokenColor(page, '--color-surface'));
    await expect(page.getByText(/^As of 03\/09\/2026$/)).toBeVisible();
    await crumb.getByRole('link', { name: 'Performance' }).click();
    await expect(page).toHaveURL(/\/insights\/performance/);
  });

  test('a11y: the table is named by its metric, Month is the sticky row-header column, the scroll region is focusable', async ({ page }) => {
    await mockHistoricalData(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(table(page)).toBeVisible();
    await expect(table(page).getByRole('columnheader').first()).toHaveCSS('position', 'sticky');
    await expect(bodyRows(page).getByRole('rowheader').first()).toHaveCSS('position', 'sticky');
    await expect(totalRow(page).getByRole('rowheader')).toHaveCSS('position', 'sticky');
    const region = page.getByRole('region', { name: 'TPC without Repricing' });
    await expect(region).toHaveAttribute('tabindex', '0');
  });

  test('AC-P4-03-16 / AC-P4-03-17 the sheet is a 608px right drawer; Apply switches metric and comparison', async ({ page }) => {
    const mock = await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(table(page)).toBeVisible();
    const loaded = mock.requests.length;

    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    const s = sheet(page);
    const box = (await s.boundingBox())!;
    expect(Math.round(box.width)).toBe(608);
    expect(Math.round(box.x + box.width)).toBe(1440);

    await s.getByRole('radio', { name: 'vs Last Year' }).click();
    await s.getByRole('radio', { name: 'Manpower (M)' }).click();
    await s.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByRole('table', { name: 'Manpower (M)' }).getByRole('columnheader')).toHaveText(['Month', '2026', '2025', '% Change vs LY']);
    expect(mock.requests).toHaveLength(loaded + 1);
    expect(Object.fromEntries(mock.requests.at(-1)!)).toEqual({ scope: 'TEAM', metricCode: 'MANPOWER', comparison: 'VS_LAST_YEAR' });
  });

  test('AC-P4-03-27 EMPTY keeps the table frame: notice above, "-" and "N/A" in all 12 rows (and the Total row)', async ({ page }) => {
    await mockHistoricalData(page, (_q, route) => fulfillJson(route, emptyHistoricalVm({ comparison: 'VS_LAST_2_YEARS' })).then(() => true));
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(page.getByRole('status').filter({ hasText: 'Historical data is not available.' })).toBeVisible();
    await expect(bodyRows(page)).toHaveCount(12);
    await expect(bodyRows(page).getByRole('cell')).toHaveText(Array.from({ length: 12 }, () => ['-', '-', '-', 'N/A', 'N/A']).flat());
    await expect(totalRow(page).getByRole('cell')).toHaveText(['-', '-', '-', 'N/A', 'N/A']);
  });

  test('AC-P4-03-26 request failure keeps the table frame with the error banner and Retry', async ({ page }) => {
    let failing = true;
    await mockHistoricalData(page, (_q, route) => (failing ? fulfillJson(route, {}, 503).then(() => true) : false));
    await page.goto(TEAM_URL);
    await expect(page.getByRole('alert')).toContainText('Historical data could not be loaded. Please try again.');
    await expect(bodyRows(page)).toHaveCount(12);
    await expect(totalRow(page)).toHaveCount(0); // no VM, so no way to know the metric is additive
    failing = false;
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(bodyRows(page).first().getByRole('cell').first()).toHaveText('RM 25,246');
    await expect(totalRow(page)).toHaveCount(1);
  });

  test('tablet (768–1023) reuses the month cards', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await mockHistoricalData(page);
    await page.goto(TEAM_URL);
    await expect(page.getByRole('list', { name: 'TPC without Repricing' }).getByRole('listitem')).toHaveCount(12);
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });
});

/**
 * Against pa-be-dev's memory data source (Playwright boots it). Skips with a
 * reason until the BFF build in use serves the route and the Total row.
 */
test.describe('Team Historical Data — desktop, real BFF (memory source)', () => {
  test.beforeEach(async ({ context, request }) => {
    await setPersona(context, 'LEADER_P2');
    const probe = await request.get(bffUrl('/api/bff/v1/performance/historical-data?scope=TEAM&comparison=VS_LAST_2_YEARS'), { headers: { 'x-persona': 'LEADER_P2' } });
    test.skip(probe.status() === 404, 'pa-be-dev dist has no historical-data route yet');
    const body = probe.ok() ? await probe.json() : {};
    test.skip(!body.totals, 'pa-be-dev dist does not serve `totals` yet (rebuild pa-be-dev/dist)');
  });

  test('AC-P4-03-32 TPC Vs Last 2 Years: 12 month rows then a Total row with RM sums and two change cells', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto(`${TEAM_URL}&comparison=VS_LAST_2_YEARS`);
    await expect(table(page).getByRole('columnheader')).toHaveText(['Month', /^20\d\d$/, /^20\d\d$/, /^20\d\d$/, '% Change vs LY', '% Change vs L2Y']);
    await expect(bodyRows(page)).toHaveCount(12);
    await expect(totalRow(page).getByRole('rowheader')).toHaveText('Total');
    await expect(totalRow(page).getByRole('cell')).toHaveCount(5);
    await expect(totalRow(page).getByRole('cell').first()).toHaveText(/^RM [\d,]+(\.\d\d)?$/);
    await expect(bodyRows(page).first().getByRole('cell').first()).toHaveText(/^RM [\d,]+(\.\d\d)?$/);
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-32 TPC Current Year on the live BFF: MoM header, and the Total row has an empty MoM cell', async ({ page }) => {
    await page.goto(TEAM_URL);
    await expect(table(page).getByRole('columnheader').last()).toHaveText('MoM % Change');
    await expect(totalRow(page).getByRole('cell').last()).toHaveText('');
  });

  test('AC-P4-03-32 a non-additive metric (Manpower) has no Total row on the live BFF', async ({ page }) => {
    await page.goto(`${TEAM_URL}&metricCode=MANPOWER&comparison=VS_LAST_YEAR`);
    const manpower = page.getByRole('table', { name: 'Manpower (M)' });
    await expect(manpower.locator('tbody tr')).toHaveCount(12);
    await expect(manpower.locator('tfoot')).toHaveCount(0);
  });
});
