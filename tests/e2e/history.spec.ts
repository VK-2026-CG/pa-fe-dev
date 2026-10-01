import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { fulfillJson, historicalVm, mockHistoricalData } from '../support/historical-data';

test.describe('Historical data (S-P4-03)', () => {
  // REMOVED (ARVIJ-1450, requester ruling: SELF is the same screen as TEAM): the legacy SELF page — metric pills,
  // window pager, MoM column table — no longer exists, so its tests were deleted rather than ported:
  //  - "3-year window renders year columns and no MoM column" (AC-P4-03-02): the 3-year state is now "vs Last 2
  //    Years" (AC-P4-03-22), asserted on the cards/table in historical-data-team*.spec.ts and, for SELF, in
  //    historical-data-self*.spec.ts (AC-P4-03-33).
  //  - "current-year window shows the MoM column with N/A for January" (AC-P4-03-09): the MoM column is now the
  //    "MoM % Change" column / "vs last month" caption (AC-P4-03-20, January vs the previous December: AC-P4-03-31);
  //    the N/A / "-" rule lives on as AC-P4-03-25.
  //  - "metric pill switches the series" (AC-P4-03-12) and "window pager walks older/newer": replaced by the
  //    Filter & Selection sheet journeys (AC-P4-03-16/-17/-23, and AC-P4-03-33 for SELF).
  // SUPERSEDED (ARVIJ-1450): scope=TEAM no longer renders the legacy window/pager table — it opens the
  // Historical Data view (month cards, BFF `historical-data`). The two checks below used to assert the legacy
  // table's "MoM % Change" column header for display=PCT metrics (AC-P4-03-13); their intent — a PCT-display
  // metric's month-over-month change is a percentage, never "pp"/"Delta" — now lives on the cards (AC-P4-03-20,
  // Current Year = "vs last month" per Jira AC7). `momHeaderKey` itself stays covered by tests/unit/format.spec.ts;
  // the full screen is in historical-data-{team,self}*.spec.ts.
  for (const { metricCode, kind, label, series } of [
    { metricCode: 'ACTIVITY_RATIO', kind: 'PERCENT', label: 'Activity Ratio (A)', series: [56, 58, 60, 59, 61, 62, 60, 63, 64, null, null, null] },
    { metricCode: 'PRODUCTIVITY', kind: 'DECIMAL', label: 'Productivity (P)', series: [9.5, 9.7, 9.9, 9.6, 10, 10.1, 9.8, 10.2, 10.3, null, null, null] },
  ] as const) {
    test(`${metricCode} TEAM history: the month-over-month change is a % pill captioned "vs last month", never pp (AC-P4-03-13 superseded by AC-P4-03-20)`, async ({ context, page }) => {
      await setPersona(context, 'LEADER_P2');
      const watch = watchConsole(page);
      await mockHistoricalData(page, (q, route) =>
        fulfillJson(route, historicalVm({
          metricCode: q.get('metricCode')!, comparison: 'CURRENT_YEAR', kind, series: { 2025: Array.from({ length: 12 }, () => 50), 2026: [...series] },
        })).then(() => true));
      await page.goto(`/insights/history?metricCode=${metricCode}&scope=TEAM&window=CURRENT_YEAR`);

      await expect(page.getByRole('heading', { name: 'Historical Data', level: 1 })).toBeVisible();
      await expect(page.getByRole('list', { name: label }).getByRole('listitem')).toHaveCount(12);
      await expect(page.getByRole('columnheader')).toHaveCount(0); // not the legacy table
      await expect(page.locator('.hd-change-caption').first()).toHaveText('vs last month');
      await expect(page.locator('.hd-card .tag').first()).toHaveText(/^[+-]\d+\.\d%$/);
      await expect(page.locator('.hd-card').filter({ hasText: /\bpp\b/ })).toHaveCount(0);

      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }
});
