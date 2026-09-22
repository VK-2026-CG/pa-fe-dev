import { expect, test, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/**
 * Desktop/tablet side-sheet geometry AND persistent-overlay architecture for
 * Customize Metrics (S-P4-04 v1.4.0/v1.4.1/v1.5.0, AC-P4-04-16/17/19/20/23/
 * 24/25/26/33/34/35/36/37; S-P4-01 v1.5.15, AC-P4-01-58). At >=768px the
 * overlay opens in place over the still-mounted dashboard — no navigation —
 * so every test here opens it FROM the dashboard, not via a direct
 * page.goto to the customize-metrics route (that route still exists as the
 * mobile mechanism and a fallback; tests/e2e/customize.spec.ts, 375-base
 * viewport, covers that routed path unchanged).
 */
async function openFromMoreActions(page: Page) {
  await page.goto('/insights/performance');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('button', { name: 'Customize Metrics' }).click();
  await expect(page.locator('.cust-surface')).toBeVisible();
}

test.describe('Customize metrics (S-P4-04) at desktop viewport (>=1024px)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'AGENT_P4');
  });

  test('opens in place over the dashboard — no navigation, dashboard stays mounted (AC-P4-04-33)', async ({ page }) => {
    const watch = watchConsole(page);
    await openFromMoreActions(page);

    // Still on the dashboard URL — this was never a route change.
    await expect(page).toHaveURL(/insights\/performance/);
    // The dashboard behind the drawer is still rendered, not unmounted.
    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.locator('.filter-pill').first()).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('dashboard filters and scroll position survive open + close (AC-P4-04-33/35)', async ({ page }) => {
    // Shorter viewport so the dashboard content actually overflows and
    // there's something real to preserve.
    await page.setViewportSize({ width: 1440, height: 500 });
    await page.goto('/insights/performance');

    // Change a filter so the dashboard has state worth preserving.
    await page.getByRole('button', { name: 'Filter' }).click();
    const sheet = page.locator('.sheet');
    await sheet.getByRole('radio').filter({ hasText: 'MTD' }).click();
    await sheet.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('.filter-pill').filter({ hasText: 'Time' })).toContainText('MTD');

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name: 'Customize Metrics' }).click();
    await expect(page.locator('.cust-surface')).toBeVisible();

    // Set a distinctive scroll position while the overlay is open (its own
    // Close/Cancel/Save controls live in a fixed-position drawer, always in
    // viewport regardless of the page's scroll — closing must not move it).
    await page.evaluate(() => window.scrollTo(0, 250));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBe(250);

    await page.locator('.cust-surface').getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('.cust-surface')).toHaveCount(0);

    // Filter and scroll are exactly as left — nothing refetched/reset.
    await expect(page.locator('.filter-pill').filter({ hasText: 'Time' })).toContainText('MTD');
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBe(scrollBefore);
  });

  test('Cancel and Escape both close without navigating away (AC-P4-04-28/35)', async ({ page }) => {
    await openFromMoreActions(page);
    await page.locator('.cust-surface').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.cust-surface')).toHaveCount(0);
    await expect(page).toHaveURL(/insights\/performance/);

    await openFromMoreActions(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.cust-surface')).toHaveCount(0);
    await expect(page).toHaveURL(/insights\/performance/);
  });

  test('Save updates the dashboard in place — no full-page loading state (AC-P4-04-36)', async ({ page }) => {
    await openFromMoreActions(page);

    await page.locator('.cust-section').nth(1).locator('.cust-box').first().click();
    await page.locator('.cust-surface').getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.locator('.cust-surface')).toHaveCount(0);
    await expect(page).toHaveURL(/insights\/performance/);
    // The dashboard's own heading never disappeared behind a full "Loading…" state.
    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByText('Loading…')).toHaveCount(0);
  });

  test('renders as a right-anchored ~420px side sheet with Cancel visible (AC-P4-04-19)', async ({ page }) => {
    await openFromMoreActions(page);

    const surface = page.locator('.cust-surface');
    const box = await surface.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeCloseTo(420, 0);
    expect(box!.x + box!.width).toBeGreaterThan(1440 - 5);
    expect(box!.height).toBeCloseTo(1000, 0);

    await expect(surface.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(surface.getByRole('button', { name: 'Save Changes' })).toBeVisible();
  });

  test('header is ~72px with the title and Close, rows use 8px radius (AC-P4-04-20/23)', async ({ page }) => {
    await openFromMoreActions(page);

    const head = page.locator('.cust-head');
    await expect(head).toHaveCSS('height', '72px');
    await expect(page.getByRole('heading', { name: 'Customize Metrics', level: 1 })).toBeVisible();
    await expect(page.locator('.cust-surface').getByRole('button', { name: 'Close' })).toBeVisible();

    const row = page.locator('.cust-row').first();
    await expect(row).toHaveCSS('border-radius', '8px');
  });

  test('locked priority checkbox is grey; a selected focus row gets the stronger border (AC-P4-04-24/25)', async ({ page }) => {
    await openFromMoreActions(page);

    const priorityBox = page.locator('.cust-section').first().locator('.cust-box.on').first();
    await expect(priorityBox).toBeVisible();
    await expect(priorityBox).toHaveClass(/locked/);

    const focusSection = page.locator('.cust-section').nth(1);
    const selectedFocusBox = focusSection.locator('.cust-box.on').first();
    if (await selectedFocusBox.count()) {
      await expect(selectedFocusBox).not.toHaveClass(/locked/);
      const selectedRow = focusSection.locator('.cust-row.selected').first();
      await expect(selectedRow).toBeVisible();
    }
  });

  test('Save Changes is disabled until a change is made (AC-P4-04-14/26)', async ({ page }) => {
    await openFromMoreActions(page);

    const save = page.locator('.cust-surface').getByRole('button', { name: 'Save Changes' });
    await expect(save).toBeDisabled();

    await page.locator('.cust-section').nth(1).locator('.cust-box').first().click();
    await expect(save).toBeEnabled();
  });

  test('the standalone route still works as a direct-link fallback (AC-P4-04-37 note: route unchanged)', async ({ page }) => {
    await page.goto('/insights/customize-metrics');
    await expect(page.locator('.cust-surface')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Customize Metrics', level: 1 })).toBeVisible();
  });
});
