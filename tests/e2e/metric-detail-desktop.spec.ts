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
    await expect(combined).toHaveCSS('flex-direction', 'row');
    // Direct-instruction value (not measured/Figma), same convention as AC-P4-01-46.
    await expect(combined).toHaveCSS('height', '336px');

    const gaugeBox = await combined.locator('.gc-gauge').boundingBox();
    const comparisonBox = await combined.locator('.gc-comparison').boundingBox();
    expect(gaugeBox && comparisonBox).toBeTruthy();
    // Gauge column left of comparison column, not stacked.
    expect(gaugeBox!.x).toBeLessThan(comparisonBox!.x);
    expect(Math.abs(gaugeBox!.y - comparisonBox!.y)).toBeLessThan(4);

    // AC-P4-02-23 as amended in v1.5.0: desktop evidence shows the same
    // value-only face, so there is no donut or penders legend at any width.
    await expect(combined.locator('.gauge-value-only')).toBeVisible();
    await expect(combined.locator('.gauge-legend')).toHaveCount(0);
    await expect(combined.locator('svg')).toHaveCount(0);

    // The "Without Repricing" heading stays top-left of its column, as
    // before; only the value below it fills and centers the remaining space.
    const gaugeTitleBox = (await combined.locator('.gc-gauge .title16').boundingBox())!;
    expect(gaugeTitleBox.y - gaugeBox!.y).toBeLessThan(4);
    expect(gaugeTitleBox.x - gaugeBox!.x).toBeLessThan(4);

    const gaugeValueBox = (await combined.locator('.gauge-value-only').boundingBox())!;
    const valueAreaTop = gaugeTitleBox.y + gaugeTitleBox.height;
    const valueAreaBottom = gaugeBox!.y + gaugeBox!.height;
    const valueAreaMid = (valueAreaTop + valueAreaBottom) / 2;
    const gaugeValueMid = gaugeValueBox.y + gaugeValueBox.height / 2;
    expect(Math.abs(gaugeValueMid - valueAreaMid)).toBeLessThan(6);
    // Horizontally centered too — the value block's midpoint matches the column's.
    const gaugeColumnMidX = gaugeBox!.x + gaugeBox!.width / 2;
    const gaugeValueMidX = gaugeValueBox.x + gaugeValueBox.width / 2;
    expect(Math.abs(gaugeValueMidX - gaugeColumnMidX)).toBeLessThan(4);

    // Comparison content still centers vertically within its column — both
    // measured against the division's own top/bottom, not the viewport.
    const divisionMid = gaugeBox!.y + gaugeBox!.height / 2;

    const comparisonTitleBox = (await combined.locator('.gc-comparison .title14').first().boundingBox())!;
    const comparisonLastRowBox = (await combined.locator('.gc-comparison .yoy-row').last().boundingBox())!;
    const comparisonContentMid = (comparisonTitleBox.y + (comparisonLastRowBox.y + comparisonLastRowBox.height)) / 2;
    expect(Math.abs(comparisonContentMid - divisionMid)).toBeLessThan(4);

    // Every other section keeps its own independent card (AC-P4-02-01/21).
    await expect(page.locator('.card').filter({ hasText: 'With Repricing' })).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });
});
