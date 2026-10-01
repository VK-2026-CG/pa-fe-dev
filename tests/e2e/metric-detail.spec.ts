import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/** R-MONEY-COMPACT output: "960K", "78.7K", "1.3M" or a plain integer below 1,000. No currency prefix. */
const COMPACT = /^\d+(\.\d)?[KM]$|^\d{1,3}$/;
/** AC-P4-02-55 product-row output: "24,690" / "4,250.70" — grouped digits, no prefix, no K/M. */
const PLAIN = /^-?\d{1,3}(,\d{3})*(\.\d{2})?$/;

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

  test('TPC SELF shows the Penders card; CREDIT_POINTS renders a computed value, not a notice (AC-P4-02-33/58)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('status')).toHaveCount(0); // v1.7.0: no more PRODUCT_DATA_MISSING banner
    // v1.20.0 (AC-P4-02-58): the Penders card now renders at SELF too; the
    // gauge's money penders stays hidden by the value-only face (AC-P4-02-23).
    await expect(page.getByText(/^Penders$/)).toHaveCount(1);
    await expect(page.locator('.penders-card')).toBeVisible();
    await expect(page.getByText(/Credit Point/i).first()).toBeVisible();
  });

  // v1.20.0 (AC-P4-02-58): TPC/PTPC Penders card at SELF for every persona,
  // with the same "{count} Cases" link face as TEAM (pa-be-dev SELF stub counts).
  for (const { persona, code, count } of [
    { persona: 'AGENT_P4', code: 'TPC', count: '2 Cases' },
    { persona: 'AGENT_P4', code: 'PTPC', count: '1 Cases' },
    { persona: 'LEADER_P3', code: 'TPC', count: '2 Cases' },
    { persona: 'LEADER_P2', code: 'PTPC', count: '1 Cases' },
  ] as const) {
    test(`${persona} ${code} SELF Penders value reads "{count} Cases" with an external-link icon, not a link (AC-P4-02-56/57/58)`, async ({ context, page }) => {
      await setPersona(context, persona);
      const watch = watchConsole(page);
      await page.goto(`/insights/metric-detail?metricCode=${code}`);

      const penders = page.locator('.penders-card');
      await expect(penders.locator('.k')).toHaveText('Penders');
      const value = penders.locator('.penders-link');
      await expect(value).toHaveText(count);
      const icon = value.locator('.icon');
      await expect(icon).toHaveCount(1);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(penders.locator('a')).toHaveCount(0); // nav omitted while OQ-30 is open

      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

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
    // The header is screen-reader only since v1.21.0 (AC-P4-02-62), so its
    // text is read from the column header's accessible name, not asserted visible.
    const firstTable = page.locator('table.table').first();
    await expect(firstTable.locator('thead th.colval')).toHaveCount(1);
    await expect(firstTable.getByRole('columnheader', { name: 'Both' })).toHaveCount(1);
    for (const row of await firstTable.locator('tbody tr').all()) {
      await expect(row.locator('td.colval')).toHaveCount(1);
    }

    await page.goto('/insights/metric-detail?metricCode=TPC&businessLine=INSURANCE');
    await expect(
      page.locator('table.table').first().getByRole('columnheader', { name: 'Insurance' }),
    ).toHaveCount(1);
  });

  for (const code of ['TPC', 'FYP'] as const) {
    test(`${code} breakdown header row is screen-reader only; product rows start under the variant heading (AC-P4-02-62)`, async ({ context, page }) => {
      await setPersona(context, 'AGENT_P4');
      const watch = watchConsole(page);
      await page.goto(`/insights/metric-detail?metricCode=${code}`);

      const table = page.locator('table.table').first();
      // Real column headers stay in the accessibility tree…
      await expect(table.getByRole('columnheader', { name: 'Product' })).toHaveCount(1);
      await expect(table.getByRole('columnheader', { name: 'Both' })).toHaveCount(1);
      // …but the header row takes no visible space.
      await expect(table.locator('thead')).toBeHidden();
      await expect(table.locator('thead th').first()).toBeHidden();
      // First visible row is a product row, not a header.
      await expect(table.locator('tbody tr').first()).toContainText('Linked Premium');

      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

  test('TEAM drilldown renders no Direct/Group chip; the strip is exactly Product then Time (AC-P4-02-60)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    const watch = watchConsole(page);
    for (const teamView of ['DIRECT', 'GROUP'] as const) {
      await page.goto(`/insights/metric-detail?metricCode=TPC&scope=TEAM&teamView=${teamView}`);
      await expect(page.locator('h1.page-title')).toHaveText('TPC');

      const strip = page.locator('.filter-row');
      await expect(strip.locator('> *')).toHaveCount(2);
      await expect(strip.locator('.filter-pill').first()).toContainText('Product');
      await expect(strip.locator('.filter-pill').last()).toContainText('Time');
      await expect(strip.getByText(/^(Direct|Group)$/)).toHaveCount(0);
    }

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('Product pill reads "Both" for ALL and the line name otherwise (AC-P4-02-61)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC'); // default businessLine=ALL
    const product = page.locator('.filter-pill').first();
    await expect(product).toContainText('Both');
    await expect(product).not.toContainText('Insurance + Takaful');

    await page.goto('/insights/metric-detail?metricCode=TPC&businessLine=TAKAFUL');
    await expect(page.locator('.filter-pill').first()).toContainText('Takaful');
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
    await expect(page.locator('.card').filter({ hasText: 'With repricing' }).filter({ hasNot: page.locator('table') })).toBeVisible();
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
    await expect(pills.first()).toContainText('Both'); // AC-P4-02-61 (v1.21.0)
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
    // Figma 1:16160: the drill-down card heading is sentence case.
    await expect(combined.locator('.title16')).toHaveText('Without repricing');
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
    // Values stay money, now compact with no currency prefix (AC-P4-02-54);
    // the retired "Absolute Change" label never renders.
    await expect(combined).not.toContainText('RM');
    await expect(combined.locator('.yoy-value .v')).toHaveText(COMPACT);
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
    await expect(page.locator('svg.ring-gauge path[stroke="var(--chart-success)"]')).toHaveCount(1);
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

  test('TPC money values are compact with no currency prefix; delta unchanged (AC-P4-02-54)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined.locator('.gauge-value-only .v')).toHaveText(COMPACT);
    await expect(combined.locator('.yoy-value .v')).toHaveText(COMPACT);
    await expect(combined.locator('.gc-comparison .yoy-row .v.text-semibold')).toHaveText(COMPACT);
    await expect(combined).not.toContainText('RM');
    await expect(combined.locator('.yoy-value .delta-line')).toContainText(/[+-]?\d+(\.\d+)?%/);

    const repricing = page.locator('.card').filter({ hasText: 'With Repricing' }).filter({ hasNot: page.locator('table') });
    await expect(repricing.locator('.v')).toHaveText(COMPACT);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('breakdown product rows show plain values and only the Total is compact, in both tables (AC-P4-02-54/55)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const tables = page.locator('table.table');
    await expect(tables).toHaveCount(2); // Without + With Repricing
    for (const table of await tables.all()) {
      const rows = table.locator('tbody tr');
      const n = await rows.count();
      for (let i = 0; i < n - 1; i++) await expect(rows.nth(i).locator('td.colval')).toHaveText(PLAIN);
      await expect(rows.nth(n - 1).locator('td.colval.total')).toHaveText(COMPACT);
      await expect(table).not.toContainText('RM');
    }
    // Figma 1:16325: only PSA and Single Premium read "(10%)"; Credit Points has no suffix (closes OQ-72).
    await expect(page.getByText('PSA (10%)').first()).toBeVisible();
    await expect(page.getByText('Single Premium (10%)').first()).toBeVisible();
    await expect(page.getByText('Credit Points', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Credit Points (10%)')).toHaveCount(0);
  });

  test('FYP: gauge collected and penders are compact; its 7 breakdown rows are plain (AC-P4-02-54/55)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=FYP');

    const gauge = page.locator('.gauge-comparison .gauge-value-only');
    await expect(gauge.locator('.v')).toHaveText(COMPACT);
    await expect(gauge.locator('.v2')).toHaveText(COMPACT);
    const rows = page.locator('table.table tbody tr');
    await expect(rows).toHaveCount(8);
    for (let i = 0; i < 7; i++) await expect(rows.nth(i).locator('td.colval')).toHaveText(PLAIN);
    await expect(rows.nth(7).locator('td.colval.total')).toHaveText(COMPACT);
  });

  test('TPC TEAM Penders card keeps its COUNT format, untouched by money compaction (AC-P4-02-54)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=TPC&scope=TEAM');
    // v1.19.0 (AC-P4-02-56) wraps the count in "{count} Cases"; the count itself stays formatCount.
    await expect(page.locator('.penders-card .penders-link')).toHaveText(/^\d{1,3}(,\d{3})* Cases$/);
  });

  for (const code of ['TPC', 'PTPC']) {
    test(`${code} TEAM Penders value reads "{count} Cases" with an external-link icon (AC-P4-02-56)`, async ({ context, page }) => {
      await setPersona(context, 'LEADER_P2');
      const watch = watchConsole(page);
      await page.goto(`/insights/metric-detail?metricCode=${code}&scope=TEAM`);

      const penders = page.locator('.penders-card');
      await expect(penders.locator('.k')).toHaveText('Penders');
      const value = penders.locator('.penders-link');
      await expect(value).toHaveText(/^\d{1,3}(,\d{3})* Cases$/);
      if (code === 'TPC') await expect(value).toHaveText('6 Cases'); // pa-be-dev TEAM stub count
      const icon = value.locator('.icon');
      await expect(icon).toHaveCount(1);
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).toHaveCSS('mask-image', /open-in-new\.svg/); // Figma's own glyph (closes OQ-76)

      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

  test('CASE_COUNT TEAM Penders card keeps the bare count, no Cases unit or link face (AC-P4-02-56)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT&scope=TEAM');

    const penders = page.locator('.penders-card');
    await expect(penders).toBeVisible();
    await expect(penders.locator('.penders-link')).toHaveCount(0);
    await expect(penders).not.toContainText('Cases');
    await expect(penders.locator('.v')).toHaveText(/^\d{1,3}(,\d{3})*$/);
  });

  test('TPC TEAM Penders value is not a link while the BFF omits nav (AC-P4-02-57)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=TPC&scope=TEAM');

    const value = page.locator('.penders-card .penders-link');
    await expect(value).toHaveText('6 Cases');
    await expect(page.locator('.penders-card a')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Cases/ })).toHaveCount(0);
    await expect(value).not.toHaveAttribute('href', /.*/);
    await expect(value).not.toHaveAttribute('tabindex', /.*/);
  });

  test('TPC TEAM Penders value links to href(nav) when the VM supplies nav (AC-P4-02-57)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    // Test-only nav: OQ-30 keeps the real destination unconfirmed, so the BFF
    // never sends one. Inject it into the real BFF response.
    const nav = { route: 'insights/history', params: { metricCode: 'TPC' } };
    await page.route('**/api/bff/v1/performance/metrics/TPC?*', async (route) => {
      const response = await route.fetch();
      const vm = await response.json();
      for (const s of vm.sections) if (s.type === 'PENDERS') s.nav = nav;
      await route.fulfill({ response, json: vm });
    });
    await page.goto('/insights/metric-detail?metricCode=TPC&scope=TEAM');

    const link = page.getByRole('link', { name: '6 Cases' });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/insights/history?metricCode=TPC');
    await expect(link.locator('.icon')).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(/\/insights\/history\?metricCode=TPC/);
  });
  // ── Figma 1:16115 (Metric Detail › Mobile, TPC; the same frame serves PTPC and FYP) ──────────────
  // Sizes are the Figma frame's own numbers: back row 24h 20px below the host header, title 28h, chips
  // 28h, drill-down cards 312 / 128 / 56 high, breakdown cards 312 high with a 44px row pitch.
  test('Figma 1:16115: header row, title and chips (TPC)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const back = (await page.locator('.detail-appbar .back').boundingBox())!;
    expect([back.y, back.height]).toEqual([20, 24]);
    const arrow = page.locator('.detail-appbar .back .back-icon-mobile img');
    await expect(arrow).toHaveAttribute('src', '/icons/arrow-back.svg');
    expect((await arrow.boundingBox())!).toMatchObject({ width: 24, height: 24 });
    await expect(page.locator('.detail-appbar .back-label')).toHaveCSS('color', 'rgb(82, 82, 91)');
    // "As of dd/MM/yyyy" (not "27 Jul 2026"), 11/16 in #7C7C7C.
    const asOf = page.locator('.detail-appbar .detail-asof');
    await expect(asOf).toHaveText(/^As of \d{2}\/\d{2}\/\d{4}$/);
    await expect(asOf).toHaveCSS('color', 'rgb(124, 124, 124)');
    await expect(asOf).toHaveCSS('font-size', '11px');

    const title = page.locator('h1.page-title');
    expect((await title.boundingBox())!.y).toBe(56);
    await expect(title).toHaveCSS('letter-spacing', '-0.25px');

    const chips = page.locator('.dd-chips .filter-pill');
    await expect(chips).toHaveCount(2);
    await expect(chips.first()).toHaveAttribute('aria-label', 'Product: Both');
    await expect(chips.last()).toHaveAttribute('aria-label', 'Time: YTD');
    const [first, second] = [(await chips.first().boundingBox())!, (await chips.last().boundingBox())!];
    expect([first.y, first.height, second.y]).toEqual([96, 28, 96]);
    expect(Math.round(second.x - (first.x + first.width))).toBe(12);
    await expect(chips.first()).toHaveCSS('color', 'rgb(113, 113, 122)');
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('Figma 1:16160/16247/16248: Without repricing, With repricing and Penders cards (TPC)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const cards = page.locator('.card.dd-card:not(.dd-breakdown)');
    await expect(cards).toHaveCount(3);
    const boxes = [];
    for (const card of await cards.all()) boxes.push((await card.boundingBox())!);
    expect(boxes.map((b) => [b.x, b.width, b.height])).toEqual([[16, 343, 312], [16, 343, 128], [16, 343, 56]]);
    expect(boxes.map((b) => b.y)).toEqual([136, 460, 600]); // 12px between boxes
    await expect(cards.first()).toHaveCSS('border-radius', '16px');

    // Heading 5 (18/24 Bold, #1A1A1A), sentence case, on both repricing cards.
    for (const [i, text] of ['Without repricing', 'With repricing'].entries()) {
      const heading = cards.nth(i).locator('.dd-card-title');
      await expect(heading).toHaveText(text);
      await expect(heading).toHaveCSS('font-size', '18px');
      await expect(heading).toHaveCSS('line-height', '24px');
      await expect(heading).toHaveCSS('color', 'rgb(26, 26, 26)');
    }
    // 24px between the heading and the Collected panel; the hairline sits 24px below it with nothing between the year rows.
    const combined = page.locator('.gauge-comparison');
    const heading = (await combined.locator('.dd-card-title').boundingBox())!;
    const panel = (await combined.locator('.gauge-value-only').boundingBox())!;
    expect(panel.y - (heading.y + heading.height)).toBe(24);
    await expect(combined.locator('.gc-divider')).toHaveCSS('border-top-color', 'rgb(229, 231, 235)');
    await expect(combined.locator('.gc-comparison hr')).toHaveCount(0);
    // "+27% vs last year" in full, the prior-year value in Text-Subtle.
    await expect(combined.locator('.yoy-value .delta-line')).toContainText('vs last year');
    await expect(combined.locator('.yoy-value .delta-line')).not.toContainText('vs LY');
    await expect(combined.locator('.v.subtle')).toHaveCSS('color', 'rgb(82, 82, 91)');

    // Penders: "Penders" 14/20 and the 16/24 SemiBold link with Figma's open_in_new at 16×16.
    const link = cards.nth(2).locator('.penders-link');
    await expect(link).toHaveCSS('font-size', '16px');
    await expect(link).toHaveCSS('letter-spacing', '-0.15px');
    expect((await link.locator('.icon').boundingBox())!).toMatchObject({ width: 16, height: 16 });
  });

  test('Figma 1:16323/16325: Breakdown by Product — heading, rows, 44px pitch, Total (TPC)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const title = page.locator('.dd-section-title');
    await expect(title).toHaveText('Breakdown by Product');
    await expect(title).toHaveCSS('font-weight', '500');
    await expect(title).toHaveCSS('color', 'rgb(26, 26, 26)');

    const cards = page.locator('.dd-breakdown');
    await expect(cards).toHaveCount(2);
    await expect(cards.locator('.title14')).toHaveText(['Without Repricing', 'With Repricing']);
    for (const card of await cards.all()) {
      expect((await card.boundingBox())!).toMatchObject({ width: 343, height: 312 });
      await expect(card).toHaveCSS('border-top-color', 'rgb(212, 212, 216)');
      const heights = [];
      for (const row of await card.locator('tbody tr').all()) heights.push((await row.boundingBox())!.height);
      expect(heights).toEqual([32, 44, 44, 44, 44, 36]); // 20 + 11 + 1px rule, then 12 + 20 + 11 + 1; Total 12 + 24
      // The rule between rows is the #E5E7EB hairline; the Total row has none.
      await expect(card.locator('tbody tr:first-child td').first()).toHaveCSS('border-bottom-color', 'rgb(229, 231, 235)');
      await expect(card.locator('tbody tr:last-child td').first()).toHaveCSS('border-bottom-width', '0px');
      await expect(card.locator('td.colfirst').first()).toHaveCSS('color', 'rgb(82, 82, 91)');
      await expect(card.locator('td.colval.total')).toHaveCSS('font-size', '16px');
    }
  });

  test('FYP: one breakdown card headed "Product wise FYP distribution", on the same card shell (Figma 1:16325)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=FYP');
    await expect(page.locator('.dd-breakdown')).toHaveCount(1);
    await expect(page.locator('.dd-breakdown .title14')).toHaveText('Product wise FYP distribution');
    await expect(page.locator('.dd-section-title')).toHaveText('Breakdown by Product');
    // No repricing variants ⇒ no "Without repricing" heading anywhere on the page.
    await expect(page.getByText(/without repricing/i)).toHaveCount(0);
  });

});
