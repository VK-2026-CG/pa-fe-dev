import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/**
 * Responsive baseline for MetricDetail_S-P4-02 v1.3.0 (AC-P4-02-21): TPC's
 * gauge.primary + comparison.primary sections combine into one card at
 * every breakpoint, but reflow from a stacked single column below
 * breakpoint.desktop to a two-column grid at breakpoint.desktop (≥1024px)
 * and above. Mobile (<768px) coverage lives in metric-detail.spec.ts on the
 * 375-base project; this file covers breakpoint.tablet and breakpoint.desktop.
 */
test.describe('Metric detail (S-P4-02) responsive gauge/comparison card', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'AGENT_P4');
  });

  test('stacks in one column below breakpoint.desktop (tablet, AC-P4-02-21)', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined).toBeVisible();
    await expect(combined.locator('.gc-gauge')).toBeVisible();
    await expect(combined.locator('.gc-comparison')).toBeVisible();
    await expect(combined).toHaveCSS('flex-direction', 'column');

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('reflows to two columns at breakpoint.desktop (AC-P4-02-21)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined).toBeVisible();
    // Figma 22:15227: a grid — heading across the card, then the 240px row (panel | divider | comparison).
    await expect(combined).toHaveCSS('display', 'grid');
    await expect(combined).toHaveCSS('height', '336px');
    const card = (await combined.boundingBox())!;

    // AC-P4-02-23 as amended in v1.5.0: desktop evidence shows the same
    // value-only face, so there is no donut or penders legend at any width.
    await expect(combined.locator('.gauge-value-only')).toBeVisible();
    await expect(combined.locator('.gauge-legend')).toHaveCount(0);
    await expect(combined.locator('svg')).toHaveCount(0);

    // The "Without repricing" heading is top-left of the whole card (24px padding), above both columns.
    const title = (await combined.locator('.dd-card-title').boundingBox())!;
    expect([title.x - card.x, title.y - card.y]).toEqual([24, 24]);

    const panel = (await combined.locator('.gauge-value-only').boundingBox())!;
    const divider = (await combined.locator('.gc-divider').boundingBox())!;
    const comparison = (await combined.locator('.gc-comparison').boundingBox())!;
    // Gauge column left of the divider, comparison right of it; the divider is 240px tall on the 24px rhythm.
    expect(panel.x + panel.width).toBeLessThan(divider.x);
    expect(divider.x + divider.width).toBeLessThan(comparison.x);
    expect([divider.width, divider.height, divider.y - card.y]).toEqual([1, 240, 72]);
    // Panel and comparison both centre vertically on the divider, and the panel centres in its half.
    const dividerMid = divider.y + divider.height / 2;
    expect(Math.abs(panel.y + panel.height / 2 - dividerMid)).toBeLessThan(1);
    expect(Math.abs(comparison.y + comparison.height / 2 - dividerMid)).toBeLessThan(1);
    const leftHalf = { x: card.x + 24, width: divider.x - 24 - (card.x + 24) };
    expect(Math.abs(panel.x + panel.width / 2 - (leftHalf.x + leftHalf.width / 2))).toBeLessThan(1);

    // Every other section keeps its own independent card (AC-P4-02-01/21).
    await expect(page.locator('.card').filter({ hasText: 'With repricing' }).filter({ hasNot: page.locator('table') })).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('SELF pairs With Repricing + Penders into one row at breakpoint.desktop (AC-P4-02-27/59)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const pair = page.locator('.section-pair', { has: page.locator('.penders-card') });
    await expect(pair).toHaveCount(1);
    const variantBox = (await pair.locator('.card:not(.penders-card)').boundingBox())!;
    const pendersBox = (await pair.locator('.penders-card').boundingBox())!;
    expect(variantBox.x).toBeLessThan(pendersBox.x);
    expect(Math.abs(variantBox.y - pendersBox.y)).toBeLessThan(4);
  });

  test('SELF stacks With Repricing above Penders below breakpoint.desktop (AC-P4-02-27/59)', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const pair = page.locator('.section-pair', { has: page.locator('.penders-card') });
    const variantBox = (await pair.locator('.card:not(.penders-card)').boundingBox())!;
    const pendersBox = (await pair.locator('.penders-card').boundingBox())!;
    expect(pendersBox.y).toBeGreaterThan(variantBox.y + variantBox.height - 1);
  });
  // ── Figma 22:15202 (Metric Detail › Desktop, TPC; the same frame serves PTPC and FYP) ────────────
  // An 800px column centred in the content area: back row 32h at y=24, title 44h at y=80, chips at y=136,
  // the 336h card at y=176, the 394+12+394 pair at y=524, Breakdown by Product, cards at y=720.
  test('Figma 22:15202: the 800px column, back row, title and chips', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    const watch = watchConsole(page);
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const column = (await page.locator('.dd-page').boundingBox())!;
    expect([column.x, column.width]).toEqual([320, 800]);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 244, 246)');

    // Back icon in a 32×32 box, a 1px #DBDBDB divider, then "Performance > TPC"; the labelled Back is mobile-only.
    const back = (await page.locator('.detail-appbar .back').boundingBox())!;
    expect([back.x, back.y, back.width, back.height]).toEqual([320, 24, 32, 32]);
    await expect(page.locator('.detail-appbar .back-label')).toBeHidden();
    const crumbs = page.locator('.detail-breadcrumb');
    await expect(crumbs).toBeVisible();
    await expect(crumbs.locator('a')).toHaveText('Performance');
    await expect(crumbs.locator('a')).toHaveCSS('color', 'rgb(102, 102, 102)');
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('TPC');
    await expect(crumbs.locator('[aria-current="page"]')).toHaveCSS('color', 'rgb(26, 26, 26)');
    const asOf = (await page.locator('.detail-asof').boundingBox())!;
    expect(Math.round(asOf.x + asOf.width)).toBe(1120); // right edge of the column

    const title = page.locator('h1.page-title');
    expect((await title.boundingBox())!).toMatchObject({ y: 80, height: 44 });
    await expect(title).toHaveCSS('font-size', '32px');
    await expect(title).not.toHaveCSS('letter-spacing', '-0.25px'); // the mobile tracking is gone (0 computes to "normal")
    await expect(title).toHaveCSS('color', 'rgb(26, 26, 26)');

    const chip = page.locator('.dd-chips .filter-pill').first();
    expect((await chip.boundingBox())!).toMatchObject({ y: 136, height: 28 });
    await expect(chip).toHaveCSS('border-top-color', 'rgb(244, 244, 245)');
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('Figma 22:15227/15228/15230: card, pair and Penders geometry and desktop colours (TPC)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const cards = page.locator('.card.dd-card:not(.dd-breakdown)');
    await expect(cards).toHaveCount(3);
    const boxes = [];
    for (const card of await cards.all()) boxes.push((await card.boundingBox())!);
    expect(boxes.map((b) => [b.x, b.y, b.width, b.height])).toEqual([[320, 176, 800, 336], [320, 524, 394, 128], [726, 524, 394, 128]]);

    const combined = page.locator('.gauge-comparison');
    // Heading 1 value (32/44 Bold) under "Collected" 14/20 Medium; no "Collected" caption under the year rows.
    await expect(combined.locator('.gauge-value-only .v')).toHaveCSS('font-size', '32px');
    await expect(combined.locator('.gauge-value-only .k')).toHaveCSS('font-weight', '500');
    await expect(combined.locator('.gc-comparison .yoy-row .sub')).toHaveCount(2);
    await expect(combined.locator('.gc-comparison .yoy-row .sub').first()).toBeHidden();
    const rows = combined.locator('.gc-comparison .yoy-row');
    expect([(await rows.first().boundingBox())!.height, (await rows.last().boundingBox())!.height]).toEqual([52, 36]);
    await expect(combined.locator('.gc-divider')).toHaveCSS('background-color', 'rgb(229, 231, 235)');

    // Desktop resolves different variable modes: success #22C55E, Text-Subtle #4B5563, link #3B82F6.
    await expect(combined.locator('.delta-line .d')).toHaveCSS('color', 'rgb(34, 197, 94)');
    await expect(combined.locator('.delta-line .d')).toHaveCSS('font-weight', '600');
    await expect(combined.locator('.v.subtle')).toHaveCSS('color', 'rgb(75, 85, 99)');
    const link = page.locator('.penders-card .penders-link');
    await expect(link).toHaveCSS('color', 'rgb(59, 130, 246)');
    await expect(link).toHaveCSS('font-size', '14px');
    // Penders: label top-left, the link bottom-left of the 128h card (16px padding).
    const penders = (await page.locator('.penders-card').boundingBox())!;
    const label = (await page.locator('.penders-card .k').boundingBox())!;
    const linkBox = (await link.boundingBox())!;
    expect([label.x - penders.x, label.y - penders.y]).toEqual([16, 16]);
    expect(penders.y + penders.height - (linkBox.y + linkBox.height)).toBe(16);
    expect(linkBox.x - penders.x).toBe(16);
    // Card shell: ring outside, no inner shadow, the softer 0 4 12 drop.
    await expect(cards.first()).toHaveCSS('box-shadow', /rgb\(229, 231, 235\) 0px 0px 0px 1px/);
    await expect(cards.first()).toHaveCSS('box-shadow', /rgba\(0, 0, 0, 0\.03\) 0px 4px 12px 1px/);
  });

  test('Figma 22:15519: Breakdown by Product — two 394px cards 12px apart, 14/20 rows at a 44px pitch (TPC)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const title = (await page.locator('.dd-section-title').boundingBox())!;
    expect([title.x, title.y]).toEqual([320, 688]);
    const cards = page.locator('.dd-breakdown');
    await expect(cards).toHaveCount(2);
    const boxes = [];
    for (const card of await cards.all()) boxes.push((await card.boundingBox())!);
    expect(boxes.map((b) => [b.x, b.y, b.width, b.height])).toEqual([[320, 720, 394, 312], [726, 720, 394, 312]]);
    for (const card of await cards.all()) {
      const heights = [];
      for (const row of await card.locator('tbody tr').all()) heights.push((await row.boundingBox())!.height);
      expect(heights).toEqual([32, 44, 44, 44, 44, 36]);
      await expect(card.locator('td.colfirst').first()).toHaveCSS('color', 'rgb(75, 85, 99)');
    }
  });

  test('FYP at desktop: the heading-less combined card is 288h on the same 24px padding', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/insights/metric-detail?metricCode=FYP');
    const card = (await page.locator('.gauge-comparison').boundingBox())!;
    expect([card.x, card.y, card.width, card.height]).toEqual([320, 176, 800, 288]);
    await expect(page.locator('.dd-breakdown .title14')).toHaveText('Product wise FYP distribution');
  });
  test('Figma 22:18658: Current Year Persistency ring card — Product chip only, 288h card, legend and 202h ring box', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto('/insights/metric-detail?metricCode=PERSISTENCY_CY');
    const card = page.locator('.dchart-ring');
    const box = (await card.boundingBox())!;
    expect([box.x, box.y, box.width, box.height]).toEqual([320, 176, 800, 288]);

    // The frame carries the Product chip only and no "As of" date.
    await expect(page.locator('.dd-chips .filter-pill')).toHaveCount(2);
    await expect(page.locator('.dd-chips .filter-pill').first()).toBeVisible();
    await expect(page.locator('.dd-chips .filter-pill').nth(1)).toBeHidden();
    await expect(page.locator('.detail-asof')).toBeHidden();

    // Metric Panel: 8×18 pills 40px apart on a 24px gap; values 16/24 Bold.
    const pills = await card.locator('.legend-pill').all();
    const [p1, p2] = [(await pills[0]!.boundingBox())!, (await pills[1]!.boundingBox())!];
    expect([p1.width, p1.height, p2.y - p1.y]).toEqual([8, 18, 64]);
    await expect(card.locator('.legend-value').first()).toHaveCSS('font-size', '16px');

    // Radial Ring: a 202px box, the 200px ring inside it, Heading 2 28/40 centre value.
    expect((await card.locator('.ring-wrap').boundingBox())!.height).toBe(202);
    await expect(card.locator('.chart-threshold-value')).toHaveCSS('font-size', '28px');
    await expect(card.locator('svg.ring-gauge circle[stroke="var(--color-surface)"]')).toHaveAttribute('r', '10');
  });
});
