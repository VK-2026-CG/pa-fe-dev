import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/**
 * Desktop viewport parity (A7 chrome, unified across breakpoints since
 * v1.5.6 — the Filter action + summary pills + collapsible metric panels
 * are the same DOM/markup as tests/e2e/performance.spec.ts, just rendered
 * at 1440×1000). This file only checks the unification actually holds at
 * this viewport; the interaction coverage itself lives in performance.spec.ts.
 */
test.describe('Performance dashboard (S-P4-01) at desktop viewport (≥1024px)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('renders the same unified chrome as mobile, no console errors', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/performance');

    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();

    // Exactly one "More actions" trigger — no duplicate hidden copy at either breakpoint.
    await expect(page.getByRole('button', { name: 'More actions' })).toHaveCount(1);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('Other Focus Metric header stays visible even when empty, with a "+" add affordance (AC-P4-01-26/27)', async ({ page }) => {
    await page.goto('/insights/performance');

    const panel = page.locator('.metric-panel').filter({ has: page.getByRole('button', { name: 'Other Focus Metric' }) });
    const toggle = panel.getByRole('button', { name: 'Other Focus Metric' });
    await expect(toggle).toBeVisible();
    const count = await toggle.locator('.count-badge').innerText();

    if (count === '0') {
      await expect(panel.getByRole('link', { name: 'Add focus metric' })).toBeVisible();
    } else {
      await expect(panel.getByRole('button', { name: 'Collapse' })).toBeVisible();
    }
  });
});
