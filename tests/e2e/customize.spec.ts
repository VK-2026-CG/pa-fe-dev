import { expect, test } from '@playwright/test';
import { PERSONAS, setPersona } from '../support/personas';
import { watchConsole } from '../support/console';
import { bffUrl } from '../support/bff';

/** Mutates saved preferences — keep serial so ordering assertions stay deterministic. */
test.describe.serial('Customize metrics (S-P4-04)', () => {
  test.beforeAll(async ({ request }) => {
    await request.put(bffUrl('/api/bff/v1/performance/customize?scope=SELF'), { headers: { 'x-persona': PERSONAS.AGENT_P4 }, data: { priorityMetricCodes: ['TPC', 'PTPC', 'CASE_COUNT', 'FYP'], focusMetricCodes: ['FYC', 'PERSISTENCY_Y1'] } });
  });

  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'AGENT_P4');
  });

  test('sheet header shows the title and a Close action', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/customize-metrics');

    await expect(page.getByRole('heading', { name: 'Customize Metrics', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('matches the screenshot-derived 375-base geometry', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    const row = page.locator('.cust-row').first();
    await expect(row).toBeVisible();
    await expect(row).toHaveCSS('min-height', '56px');
    await expect(row).toHaveCSS('border-radius', '18px');

    const box = row.locator('.cust-box');
    await expect(box).toHaveCSS('width', '20px');
    await expect(box).toHaveCSS('height', '20px');

    await page.screenshot({ path: 'test-results/customize-metrics-reference.png', fullPage: true });
  });

  test('both sections show their heading and supporting description', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    await expect(page.getByRole('heading', { name: 'Priority Metrics', level: 2 })).toBeVisible();
    await expect(page.getByText('Shown on homepage, in this order')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Other Focus Metrics', level: 2 })).toBeVisible();
    await expect(page.getByText('Tap to add to other focus metrics')).toBeVisible();
  });

  test('priority rows are locked, checked, and label the variant (AC-P4-04-01)', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    // "TPC without repricing" — title + variant, no parentheses.
    // Exact match: "TPC …" is a substring of "PTPC …".
    const tpc = page.getByRole('checkbox', { name: 'TPC without repricing', exact: true });
    await expect(tpc).toBeVisible();
    await expect(tpc).toBeDisabled();
    await expect(tpc).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('checkbox', { name: 'PTPC without repricing', exact: true })).toBeDisabled();
  });

  test('only priority rows carry a reorder grip', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    const grips = page.getByRole('button', { name: /^Reorder / });
    await expect(grips).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Reorder TPC without repricing', exact: true })).toBeVisible();
    // Focus metrics are selectable but never reorderable.
    await expect(page.getByRole('button', { name: /^Reorder (FYC|Current Year Persistency)$/ })).toHaveCount(0);
  });

  test('keyboard ArrowDown on the grip reorders priority metrics', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    const priorityRows = page.locator('.cust-section').first().locator('.cust-row');
    await expect(priorityRows).toHaveCount(4);
    const labels = () => priorityRows.locator('.lbl').allInnerTexts();
    expect(await labels()).toEqual(['TPC without repricing', 'PTPC without repricing', 'Case Count', 'FYP']);

    await page.getByRole('button', { name: 'Reorder TPC without repricing', exact: true }).focus();
    await page.keyboard.press('ArrowDown');

    expect(await labels()).toEqual(['PTPC without repricing', 'TPC without repricing', 'Case Count', 'FYP']);
  });

  test('dragging the six-dot grip moves a priority metric up and down', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    const rows = page.locator('.cust-section').first().locator('.cust-row');
    await expect(rows).toHaveCount(4);
    const labels = () => rows.locator('.lbl').allInnerTexts();

    // Move TPC down over Case Count using the same pointer sequence as a user.
    const tpcGrip = page.getByRole('button', { name: 'Reorder TPC without repricing', exact: true });
    const caseRow = rows.filter({ hasText: 'Case Count' });
    const from = await tpcGrip.boundingBox();
    const down = await caseRow.boundingBox();
    expect(from).not.toBeNull();
    expect(down).not.toBeNull();
    await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
    await page.mouse.down();
    await page.mouse.move(down!.x + down!.width / 2, down!.y + down!.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await labels()).toEqual(['PTPC without repricing', 'Case Count', 'TPC without repricing', 'FYP']);

    // Move TPC back up to the first position.
    const movedGrip = page.getByRole('button', { name: 'Reorder TPC without repricing', exact: true });
    const firstRow = rows.first();
    const moved = await movedGrip.boundingBox();
    const up = await firstRow.boundingBox();
    expect(moved).not.toBeNull();
    expect(up).not.toBeNull();
    await page.mouse.move(moved!.x + moved!.width / 2, moved!.y + moved!.height / 2);
    await page.mouse.down();
    await page.mouse.move(up!.x + up!.width / 2, up!.y + up!.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await labels()).toEqual(['TPC without repricing', 'PTPC without repricing', 'Case Count', 'FYP']);
  });

  test('focus metrics toggle on tap', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    const fyc = page.getByRole('checkbox', { name: 'FYC' });
    const before = await fyc.getAttribute('aria-checked');
    expect(['true', 'false']).toContain(before);
    await fyc.click();
    await expect(fyc).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true');
  });

  test('Close discards without saving', async ({ page }) => {
    await page.goto('/insights/performance');
    await page.goto('/insights/customize-metrics');

    await page.getByRole('checkbox', { name: 'Second Year Persistency' }).click();
    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page).toHaveURL(/insights\/performance/);
    // No save toast — nothing was persisted.
    await expect(page.locator('.toast')).toHaveCount(0);
  });

  test('Save Changes persists and returns to the dashboard with a toast (AC-P4-04-03)', async ({ page }) => {
    await page.goto('/insights/customize-metrics');

    await page.getByRole('checkbox', { name: 'FYC' }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page).toHaveURL(/insights\/performance/);
    await expect(page.getByRole('status').first()).toBeVisible();
  });
});
