import { expect, test, type Locator, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';
import { mockHistoricalData } from '../support/historical-data';

/**
 * Historical Data for SELF on the 1440 desktop shell (ARVIJ-1450; requester ruling: SELF is the SAME screen as
 * TEAM): the table in a white card with a Total row — all five self metrics are additive, so the Total row
 * shows for SELF too (AC-P4-03-32, AC-P4-03-33). Responses come from contract-shaped fixtures (`page.route`);
 * the last block runs against pa-be-dev's memory source.
 */
const SELF_URL = '/insights/history';

const table = (page: Page, name: string): Locator => page.getByRole('table', { name });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Filter & Selection' });

for (const persona of ['AGENT_P4', 'LEADER_P2'] as const) {
  test.describe(`Self Historical Data — desktop, ${persona} (ARVIJ-1450)`, () => {
    test.beforeEach(async ({ context }) => {
      await setPersona(context, persona);
    });

    test(`AC-P4-03-33 ${persona}: the same table card, breadcrumb and Filter pill as TEAM, requesting scope=SELF`, async ({ page }) => {
      const watch = watchConsole(page);
      const mock = await mockHistoricalData(page);
      await page.goto(`${SELF_URL}?comparison=VS_LAST_2_YEARS`);

      const t = table(page, 'TPC without Repricing');
      await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
      await expect(t.getByRole('columnheader')).toHaveText(['Month', '2026', '2025', '2024', '% Change vs LY', '% Change vs L2Y']);
      await expect(t.locator('tbody tr')).toHaveCount(12);
      await expect(t.locator('tbody tr').first().getByRole('cell')).toHaveText(['RM 25,246', 'RM 24,890', 'RM 34,900', '+1.4%', '-27.7%']);
      const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      await expect(crumb.locator('[aria-current="page"]')).toHaveText('Historical Data');
      await expect(page.getByRole('button', { name: 'Back' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Filter', exact: true })).toHaveCSS('border-top-left-radius', '56px');
      await expect(page.getByRole('button', { name: 'Download', exact: true })).toHaveCSS('border-top-left-radius', '56px'); // the same outlined pill as Filter (§D)
      for (const q of mock.requests) {
        expect(q.get('scope')).toBe('SELF');
        expect(q.has('teamView')).toBe(false);
      }
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });

    test(`AC-P4-03-32 / AC-P4-03-33 ${persona}: the Total row shows for FYP (and every self metric); Apply from the 608px drawer switches to it`, async ({ page }) => {
      const mock = await mockHistoricalData(page);
      await page.goto(`${SELF_URL}?comparison=VS_LAST_YEAR`);
      await expect(table(page, 'TPC without Repricing').locator('tfoot tr')).toHaveCount(1);
      const loaded = mock.requests.length;

      await page.getByRole('button', { name: 'Filter', exact: true }).click();
      const s = sheet(page);
      expect(Math.round((await s.boundingBox())!.width)).toBe(608);
      await expect(s.getByRole('radiogroup', { name: 'Metric' }).getByRole('radio')).toHaveText([
        'TPC without Repricing', 'TPC with Repricing', 'Case Count', 'FYP', 'FYC',
      ]);
      await s.getByRole('radio', { name: 'FYP' }).click();
      await s.getByRole('button', { name: 'Apply' }).click();

      const fyp = table(page, 'FYP');
      await expect(fyp.getByRole('columnheader')).toHaveText(['Month', '2026', '2025', '% Change vs LY']);
      const total = fyp.locator('tfoot tr');
      await expect(total.getByRole('rowheader')).toHaveText('Total');
      await expect(total.getByRole('cell')).toHaveText(['RM 270,116', 'RM 255,330', '+5.8%']);
      const change = total.locator('.hd-total-change');
      await expect(change).toHaveClass(/hd-tone-success/);
      await expect(change).toHaveCSS('font-weight', '700');
      expect(mock.requests).toHaveLength(loaded + 1);
      expect(Object.fromEntries(mock.requests.at(-1)!)).toEqual({ scope: 'SELF', metricCode: 'FYP', comparison: 'VS_LAST_YEAR' });
    });

    test(`AC-P4-03-32 ${persona}: Current Year is month-over-month; the Total row's MoM cell is empty`, async ({ page }) => {
      await mockHistoricalData(page);
      await page.goto(`${SELF_URL}?metricCode=FYC`);
      const fyc = table(page, 'FYC');
      await expect(fyc.getByRole('columnheader')).toHaveText(['Month', '2026', 'MoM % Change']);
      await expect(fyc.locator('tfoot tr').getByRole('cell')).toHaveText(['RM 270,116', '']);
    });
  });
}

test.describe('Self Historical Data — desktop, real BFF (memory source)', () => {
  test.beforeEach(async ({ context, request }) => {
    await setPersona(context, 'AGENT_P4');
    const probe = await request.get(bffUrl('/api/bff/v1/performance/historical-data?scope=SELF&metricCode=FYP&comparison=VS_LAST_YEAR'), { headers: { 'x-persona': 'AGENT_P4' } });
    const body = probe.ok() ? await probe.json() : {};
    test.skip(body?.context?.scope !== 'SELF', 'pa-be-dev dist does not serve historical-data for scope=SELF yet (rebuild pa-be-dev/dist)');
    test.skip(!body.totals, 'pa-be-dev dist does not serve `totals` for the SELF metrics yet');
  });

  test('AC-P4-03-32 / AC-P4-03-33 FYP Vs Last Year from the live BFF: 12 month rows then a Total row', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto(`${SELF_URL}?metricCode=FYP&comparison=VS_LAST_YEAR`);
    const fyp = table(page, 'FYP');
    await expect(fyp.getByRole('columnheader')).toHaveText(['Month', /^20\d\d$/, /^20\d\d$/, '% Change vs LY']);
    await expect(fyp.locator('tbody tr')).toHaveCount(12);
    await expect(fyp.locator('tfoot tr').getByRole('rowheader')).toHaveText('Total');
    await expect(fyp.locator('tfoot tr').getByRole('cell')).toHaveCount(3);
    await expect(fyp.locator('tfoot tr').getByRole('cell').first()).toHaveText(/^RM [\d,]+(\.\d\d)?$/);
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-03-33 the live SELF table has the same shape as TEAM for TPC (Current Year: one value column, MoM)', async ({ page }) => {
    await page.goto(SELF_URL);
    const t = table(page, 'TPC without Repricing');
    await expect(t.getByRole('columnheader')).toHaveText(['Month', /^20\d\d$/, 'MoM % Change']);
    await expect(t.locator('tfoot tr').getByRole('cell').last()).toHaveText('');
  });
});
