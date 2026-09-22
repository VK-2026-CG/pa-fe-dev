import { expect, test, type Page } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

const dashboardPath = '/api/bff/v1/performance/dashboard';
const view = (page: Page) => page.getByRole('dialog', { name: 'View', exact: true });

async function applyView(page: Page, scope: string, teamView?: string) {
  const response = page.waitForResponse((r) => {
    const url = new URL(r.url());
    return url.pathname === dashboardPath && url.searchParams.get('scope') === scope &&
      url.searchParams.get('teamView') === (teamView ?? null);
  });
  await view(page).getByRole('button', { name: 'Apply', exact: true }).click();
  const result = await response;
  expect(result.ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'Scope switcher' })).toBeVisible();
  return result;
}

test.describe('Mobile View sheet — S-P4-01', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('P2 stages TEAM/GROUP from SELF, applies once, and preserves same-scope filters (AC-P4-01-65/66/67)', async ({ page }, testInfo) => {
    const watch = watchConsole(page);
    const requests: string[] = [];
    page.on('request', (r) => { if (new URL(r.url()).pathname === dashboardPath) requests.push(r.url()); });
    await page.goto('/insights/performance');
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    const initialCount = requests.length;
    await expect(view(page).getByRole('button', { name: /^Team view:/ })).toHaveCount(0);
    await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
    await view(page).getByRole('button', { name: 'Team view: Direct' }).click();
    const group = view(page).getByRole('radiogroup', { name: 'Team view', exact: true });
    await expect(group.getByRole('radio', { name: 'Direct', exact: true })).toBeChecked();
    await expect(group.getByRole('radio', { name: 'Group', exact: true })).not.toBeChecked();
    await page.screenshot({ path: testInfo.outputPath('p2-team-direct-menu.png') });
    await group.getByText('Group', { exact: true }).click();
    await expect(view(page).getByRole('button', { name: 'Team view: Group' })).toBeVisible();
    expect(requests).toHaveLength(initialCount);
    await applyView(page, 'TEAM', 'GROUP');
    expect(requests).toHaveLength(initialCount + 1);

    // Set a non-default period; Direct/Group-only changes must not reset it.
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    const filter = page.getByRole('dialog', { name: 'Filter & Selection' });
    await filter.getByRole('radio', { name: 'MTD', exact: true }).click();
    const filterResponse = page.waitForResponse(r => r.url().includes(dashboardPath) && new URL(r.url()).searchParams.get('period') === 'MTD');
    await filter.getByRole('button', { name: 'Apply', exact: true }).click();
    expect((await filterResponse).ok()).toBe(true);
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await view(page).getByRole('button', { name: 'Team view: Group' }).click();
    await view(page).getByRole('radiogroup', { name: 'Team view' }).getByText('Direct', { exact: true }).click();
    const direct = await applyView(page, 'TEAM', 'DIRECT');
    expect(new URL(direct.url()).searchParams.get('period')).toBe('MTD');

    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await view(page).getByRole('radio', { name: 'Self', exact: true }).click();
    await expect(view(page).getByRole('button', { name: /^Team view:/ })).toHaveCount(0);
    await applyView(page, 'SELF');
    expect(watch.errors).toEqual([]);
    expect(watch.warnings).toEqual([]);
  });

  test('Cancel, Close, backdrop and Escape discard drafts; nested Escape closes only the menu (AC-P4-01-68/69)', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', r => { if (r.url().includes(dashboardPath)) requests.push(r.url()); });
    await page.goto('/insights/performance');
    const trigger = page.getByRole('button', { name: 'Scope switcher' });
    await expect(trigger).toBeVisible();
    const count = requests.length;
    for (const dismiss of ['Cancel', 'Close', 'Backdrop', 'Escape']) {
      await trigger.click();
      await expect(view(page).getByRole('radio', { name: 'Self', exact: true })).toHaveAttribute('aria-checked', 'true');
      await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
      await view(page).getByRole('button', { name: 'Team view: Direct' }).click();
      await page.keyboard.press('Escape');
      await expect(view(page)).toBeVisible();
      await expect(view(page).getByRole('button', { name: 'Team view: Direct' })).toBeFocused();
      await view(page).getByRole('button', { name: 'Team view: Direct' }).click();
      await view(page).getByRole('radiogroup', { name: 'Team view' }).getByText('Group', { exact: true }).click();
      if (dismiss === 'Backdrop') await page.mouse.click(4, 4);
      else if (dismiss === 'Escape') await page.keyboard.press('Escape');
      else await view(page).getByRole('button', { name: dismiss, exact: true }).click();
      await expect(view(page)).toHaveCount(0);
      expect(requests).toHaveLength(count);
    }
    await trigger.click();
    await expect(view(page).getByRole('radio', { name: 'Self', exact: true })).toHaveAttribute('aria-checked', 'true');
  });

  test('P3 Team shows a disabled Direct-only trigger and P4 has no scope switcher (AC-P4-01-65/70)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P3');
    await page.goto('/insights/performance');
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
    const trigger = view(page).getByRole('button', { name: 'Team view: Direct' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await expect(view(page).getByRole('radiogroup', { name: 'Team view' })).toHaveCount(0);
    await applyView(page, 'TEAM', 'DIRECT');
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await expect(view(page).getByRole('button', { name: 'Team view: Direct' })).toBeDisabled();
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/performance');
    await expect(page.getByRole('navigation', { name: 'Quick links' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scope switcher' })).toHaveCount(0);
  });

  test('dropdown stays inside narrow mobile screens with reachable actions (AC-P4-01-66/69)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/insights/performance');
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
    await view(page).getByRole('button', { name: 'Team view: Direct' }).click();
    const menu = await view(page).getByRole('radiogroup', { name: 'Team view' }).boundingBox();
    const apply = await view(page).getByRole('button', { name: 'Apply' }).boundingBox();
    expect(menu!.x).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(320);
    expect(menu!.y + menu!.height).toBeLessThan(apply!.y);
    expect(apply!.y + apply!.height).toBeLessThanOrEqual(568);
  });

  test('keyboard selection, applied Group restoration and open-menu footer actions (AC-P4-01-67/68/69)', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', r => { if (r.url().includes(dashboardPath)) requests.push(r.url()); });
    await page.goto('/insights/performance');
    const trigger = page.getByRole('button', { name: 'Scope switcher' });
    await trigger.click();
    const initialCount = requests.length;
    await view(page).getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(view(page)).toHaveCount(0);
    expect(requests).toHaveLength(initialCount);

    await trigger.click();
    await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
    const direct = view(page).getByRole('button', { name: 'Team view: Direct' });
    await direct.focus();
    await page.keyboard.press('ArrowDown');
    await expect(view(page).getByRole('radio', { name: 'Direct', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(view(page).getByRole('button', { name: 'Team view: Group' })).toBeFocused();
    await view(page).getByRole('button', { name: 'Team view: Group' }).click();
    await applyView(page, 'TEAM', 'GROUP'); // Apply works with the menu open.

    await trigger.click();
    await expect(view(page).getByRole('button', { name: 'Team view: Group' })).toBeVisible();
    await view(page).getByRole('button', { name: 'Team view: Group' }).click();
    await view(page).getByRole('radiogroup', { name: 'Team view' }).getByText('Direct', { exact: true }).click();
    await view(page).getByRole('button', { name: 'Team view: Direct' }).click();
    const appliedCount = requests.length;
    await view(page).getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(view(page)).toHaveCount(0);
    await trigger.click();
    await expect(view(page).getByRole('button', { name: 'Team view: Group' })).toBeVisible();
    await view(page).getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(view(page)).toHaveCount(0);
    expect(requests).toHaveLength(appliedCount);
  });

  test('missing BFF capability does not infer Group access from the client P2 persona (AC-P4-01-65/70)', async ({ page }) => {
    await page.route(`**${dashboardPath}**`, async route => {
      const response = await route.fetch();
      const body = await response.json();
      delete body.scopeSwitcher.teamViewOptions;
      await route.fulfill({ response, json: body });
    });
    await page.goto('/insights/performance');
    await page.getByRole('button', { name: 'Scope switcher' }).click();
    await view(page).getByRole('radio', { name: 'Team', exact: true }).click();
    await expect(view(page).getByRole('button', { name: 'Team view: Direct' })).toBeDisabled();
    await expect(view(page).getByRole('radiogroup', { name: 'Team view' })).toHaveCount(0);
    await applyView(page, 'TEAM', 'DIRECT');
  });
});