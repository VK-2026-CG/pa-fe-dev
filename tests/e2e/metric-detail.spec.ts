import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('Metric detail (S-P4-02)', () => {
  test('TPC renders sections in BFF order (AC-P4-02-01/03)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);

    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('.card').first()).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('TPC SELF has no Penders card; CREDIT_POINTS renders a computed value, not a notice (AC-P4-02-31/33)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('status')).toHaveCount(0); // v1.7.0: no more PRODUCT_DATA_MISSING banner
    await expect(page.getByText(/^Penders$/)).toHaveCount(0);
    await expect(page.getByText(/Credit Point/i).first()).toBeVisible();
  });

  test('TPC TEAM shows a Penders card with a case count, distinct from the money penders in the gauge (AC-P4-02-32)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=TPC&scope=TEAM');

    await expect(page.getByText(/^Penders$/)).toBeVisible();

    // AC-P4-02-26: single row — label and value share one row, no year row.
    const penders = page.locator('.penders-card');
    await expect(penders.locator('.yoy-row')).toHaveCount(1);
    await expect(penders).not.toContainText('YTD');
  });

  test('CASE_COUNT SELF has no Penders card and no gauge legend penders (AC-P4-02-37)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT');

    await expect(page.getByText(/^Penders$/)).toHaveCount(0);
  });

  test('CASE_COUNT TEAM shows a Penders card in addition to the gauge legend penders (AC-P4-02-37)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT&scope=TEAM');

    // Unlike TPC/PTPC (whose value-only combined-card face drops the gauge
    // legend, AC-P4-02-23), CASE_COUNT keeps its standalone donut-270 face
    // (widget-contracts.md) — so at TEAM scope "Penders" legitimately appears
    // twice: once in the gauge legend, once as its own KPI card heading.
    await expect(page.getByText(/^Penders$/)).toHaveCount(2);
    await expect(page.locator('.penders-card')).toBeVisible();
  });

  test('FYP never gains a Penders card at either scope -- the one "Penders" text is always the gauge legend (AC-P4-02-39)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=FYP');
    // insights.gauge.penders and insights.detail.penders both render as the
    // literal string "Penders" -- one match here is the gauge legend value
    // (money, kept per AC-P4-02-39), not a card; zero would mean the legend
    // regressed, two would mean a Penders KPI card was wrongly added.
    await expect(page.getByText(/^Penders$/)).toHaveCount(1);

    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=FYP&scope=TEAM');
    // Unlike CASE_COUNT TEAM (2 "Penders" mentions: legend + its own KPI
    // card), FYP TEAM stays at 1 -- it never gains a Penders card, a
    // confirmed divergence from the TPC/PTPC/CASE_COUNT pattern, not a gap.
    await expect(page.getByText(/^Penders$/)).toHaveCount(1);
  });

  test('FYP renders a 7-product breakdown table with a plain Credit Point row, no second (repriced) table (AC-P4-02-40)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=FYP');

    await expect(page.locator('table.table')).toHaveCount(1); // no WITH_REPRICING variant (no repricing capability)
    const rows = page.locator('table.table tbody tr'); // 7 product rows + 1 Total row
    await expect(rows).toHaveCount(8);
    await expect(page.getByText(/Credit Point/i).first()).toBeVisible();
    await expect(page.getByText(/Unit Trust/i)).toBeVisible();
    await expect(page.getByText(/Group Premium/i)).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('breakdown table shows exactly one value column, matching the Business Line filter (AC-P4-02-35)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC'); // default businessLine=ALL ("Both")

    // TPC emits both breakdown.without-repricing and breakdown.with-repricing
    // (AC-P4-02-29) — each table independently has exactly one value column.
    const firstTable = page.locator('table.table').first();
    await expect(firstTable.locator('thead th.colval')).toHaveCount(1);
    await expect(firstTable.locator('thead th.colval')).toHaveText('Both');

    await page.goto('/insights/metric-detail?metricCode=TPC&businessLine=INSURANCE');
    await expect(page.locator('table.table').first().locator('thead th.colval')).toHaveText('Insurance');
  });

  test('EMPTY persona shows the designed empty state (AC-P4-02-18)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_EMPTY');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT');
    await expect(page.locator('.state')).toBeVisible();
  });

  test('PROCESSING persona shows the refresh affordance (AC-P4-02-17)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_PROCESSING');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT');
    await expect(page.locator('.state')).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible();
  });

  test('TPC gauge + comparison combine into one card, stacked below breakpoint.desktop (AC-P4-02-21)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined).toBeVisible();
    await expect(combined.locator('.gc-gauge')).toBeVisible();
    await expect(combined.locator('.gc-comparison')).toBeVisible();
    await expect(combined).toHaveCSS('flex-direction', 'column');

    // Every other section still renders as its own independent card
    // (AC-P4-02-21). Addressed via the card class, not the word "Penders" —
    // AC-P4-02-23 removed the gauge legend that text used to match.
    await expect(page.locator('.card').filter({ hasText: 'With Repricing' })).toBeVisible();
  });

  test('header region: as-of in the back row, page title below, labelled pills (AC-P4-02-22)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    // As-of moved into the back-bar row; the title is no longer inside it.
    await expect(page.locator('.appbar .detail-asof')).toBeVisible();
    await expect(page.locator('.appbar h1')).toHaveCount(0);
    await expect(page.locator('h1.page-title')).toHaveText('TPC');

    // Back affordance carries a visible label, not just an aria-label.
    await expect(page.locator('.appbar .back .back-label')).toHaveText('Back');

    // Labelled Product/Time pills replace the bare value chips.
    const pills = page.locator('.filter-pill');
    await expect(pills).toHaveCount(2);
    await expect(pills.first()).toContainText('Product');
    await expect(pills.last()).toContainText('Time');
    await expect(pills.last()).toContainText('YTD');
  });

  test('gauge face is value-only with no donut or penders legend below desktop (AC-P4-02-23)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined.locator('.gauge-value-only')).toBeVisible();
    await expect(combined.locator('svg')).toHaveCount(0);
    await expect(combined.locator('.gauge-legend')).toHaveCount(0);
  });

  test('variant-only headings, bare years and a delta line instead of the growth row (AC-P4-02-24/25)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined.locator('.title16')).toHaveText('Without Repricing');
    // AC-P4-02-28: comparison half is headed "{period} Comparison".
    await expect(combined.locator('.gc-comparison .title14')).toHaveText('YTD Comparison');
    // Bare year, no "YTD " prefix.
    await expect(combined.getByText('YTD 2026')).toHaveCount(0);
    // Delta renders under the value, and the labelled growth row is gone.
    await expect(combined.locator('.yoy-value .delta-line')).toBeVisible();
    await expect(combined.getByText('% Growth')).toHaveCount(0);
  });

  // Requester direction 2026-09-24: FYP, FYC and AVERAGE_CASE_SIZE follow the
  // TPC/PTPC combined value-only card, showing only what each metric has.
  for (const { code, persona, query, penders, breakdown } of [
    { code: 'FYP', persona: 'AGENT_P4', query: '', penders: true, breakdown: true },
    { code: 'FYC', persona: 'AGENT_P4', query: '', penders: true, breakdown: false },
    { code: 'AVERAGE_CASE_SIZE', persona: 'LEADER_P2', query: '&scope=TEAM', penders: false, breakdown: false },
  ] as const) {
    test(`${code} uses the combined value-only card, no donut, no repricing card`, async ({ context, page }) => {
      await setPersona(context, persona);
      await page.goto(`/insights/metric-detail?metricCode=${code}${query}`);

      const combined = page.locator('.gauge-comparison');
      await expect(combined).toHaveCount(1);
      await expect(combined.locator('.gauge-value-only')).toBeVisible();
      await expect(combined.locator('svg')).toHaveCount(0);
      // No variant ⇒ no card heading; the page title already names the metric.
      await expect(combined.locator('.title16')).toHaveCount(0);
      await expect(combined.locator('.gc-comparison .title14')).toHaveText('YTD Comparison');
      await expect(combined.locator('.yoy-value .delta-line')).toBeVisible();
      // Money penders (AC-P4-02-39) survive as a value line, not a legend.
      await expect(combined.locator('.gauge-penders-k')).toHaveCount(penders ? 1 : 0);
      await expect(page.locator('.card').filter({ hasText: 'With Repricing' })).toHaveCount(0);
      await expect(page.getByText('Breakdown by Product')).toHaveCount(breakdown ? 1 : 0);
    });
  }

  test('AVERAGE_CASE_SIZE TEAM shows its change as a whole-number %, never an absolute RM amount (AC-P4-02-52/53)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=AVERAGE_CASE_SIZE&scope=TEAM');

    const combined = page.locator('.gauge-comparison');
    const delta = combined.locator('.yoy-value .delta-line');
    await expect(delta).toBeVisible();
    await expect(delta).toContainText(/[+-]?\d+%/);
    await expect(delta).not.toContainText('RM');
    // Values stay money; the retired "Absolute Change" label never renders.
    await expect(combined).toContainText('RM');
    await expect(page.getByText('Absolute Change')).toHaveCount(0);
  });

  test('MANPOWER TEAM renders stacked Existing Agents + New Recruits with a % chip on the total only (AC-P4-02-42/43/44/45)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=MANPOWER&scope=TEAM');

    const bars = page.locator('.bars-stacked');
    await expect(bars).toBeVisible();
    // Two years × two segments; one total label per year; a single chip (none for the earliest year).
    await expect(bars.locator('rect.bar-seg')).toHaveCount(4);
    await expect(bars.locator('.chart-point')).toHaveCount(2);
    await expect(bars.locator('.chart-delta')).toHaveCount(1);
    await expect(bars.locator('.chart-delta')).toHaveText(/^[+-]?\d+%$/);
    await expect(bars).toContainText('Existing Agents');
    await expect(bars).toContainText('New Recruits');
    await expect(bars).toContainText('No. of Agents');
    await expect(page.getByText(/Opening Manpower|Closing Manpower/)).toHaveCount(0);

    // Manpower Growth is shown as a whole-number % — never an absolute "+7".
    const growth = page.locator('.card').filter({ hasText: 'Manpower Growth' });
    await expect(growth).toContainText(/[+-]?\d+%/);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('ACTIVITY_RATIO TEAM keeps the 90% threshold gauge and shows its change as a whole-number %, not pp (AC-P4-02-48/49)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=ACTIVITY_RATIO&scope=TEAM');

    await expect(page.getByText('90%').first()).toBeVisible();
    const change = page.locator('.card').filter({ hasText: 'Activity Ratio Change' });
    await expect(change).toContainText(/[+-]?\d+%/);
    await expect(change).not.toContainText(/\d+(\.\d+)?pp/);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('PRODUCTIVITY TEAM shows its change as a whole-number % while values stay decimal; no bar chart (AC-P4-02-14/50/51, OQ-66)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=PRODUCTIVITY&scope=TEAM');

    const change = page.locator('.card').filter({ hasText: 'Productivity Change' });
    await expect(change).toContainText('+5%');
    await expect(change).not.toContainText('+0.4');
    await expect(change).toContainText('9.7');
    await expect(change).toContainText('9.3');
    await expect(change).not.toContainText(/9\.[37]%/);
    await expect(page.locator('.bars-stacked')).toHaveCount(0);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('NEW_RECRUIT_CONTRACTED keeps simple bars (layout absent ⇒ grouped/simple, AC-P4-02-11)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=NEW_RECRUIT_CONTRACTED');

    await expect(page.locator('svg[role="img"]').first()).toBeVisible();
    await expect(page.locator('.bars-stacked')).toHaveCount(0);
  });

  for (const [code, threshold, query] of [
    ['PERSISTENCY_CY', 90, ''], ['PERSISTENCY_Y1', 85, ''], ['PERSISTENCY_Y2', 80, ''],
    ['PERSISTENCY_CY', 90, '&scope=TEAM&teamView=GROUP'], ['PERSISTENCY_Y1', 85, '&scope=TEAM&teamView=DIRECT'], ['PERSISTENCY_Y2', 80, '&scope=TEAM'],
  ] as const) {
    test(`${code}${query ? ' TEAM' : ''} shows only the threshold gauge with its ${threshold}% marker, no year-on-year comparison (AC-P4-02-46)`, async ({ context, page }) => {
      await setPersona(context, query ? 'LEADER_P2' : 'AGENT_P4');
      const watch = watchConsole(page);
      await page.goto(`/insights/metric-detail?metricCode=${code}${query}`);

      await expect(page.locator('.gauge-legend')).toContainText(`Threshold ${threshold}%`);
      await expect(page.getByText('Persistency Change')).toHaveCount(0);
      await expect(page.getByText('Collected')).toHaveCount(0);

      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

  test('persistency at or above threshold tints the ring success (confirmatory, AC-P4-02-15/46)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=PERSISTENCY_CY');
    await expect(page.locator('svg[role="img"] path[stroke="var(--tone-success)"]')).toHaveCount(1);
  });

  test('persistency opened with MTD shows YTD in the Time pill; Back keeps the earlier page\'s period (AC-P4-02-47)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC&period=MTD');
    await expect(page.locator('.filter-pill').last()).toContainText('MTD');

    await page.goto('/insights/metric-detail?metricCode=PERSISTENCY_CY&period=MTD');
    await expect(page.locator('.filter-pill').last()).toContainText('YTD');
    await expect(page.locator('.gauge-legend')).toContainText('Threshold 90%');
    expect(page.url()).toContain('period=MTD'); // route params are not rewritten

    await page.locator('.appbar .back').click();
    await expect(page).toHaveURL(/metricCode=TPC&period=MTD/);
    await expect(page.locator('.filter-pill').last()).toContainText('MTD');
  });

  test('notice can be dismissed', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const notice = page.locator('.notice');
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Dismiss' }).click();
    await expect(notice).toHaveCount(0);
  });
});
