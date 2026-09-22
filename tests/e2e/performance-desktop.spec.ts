import { expect, test } from "@playwright/test";
import { setPersona } from "../support/personas";
import { watchConsole } from "../support/console";

/**
 * Desktop viewport parity (A7 chrome, unified across breakpoints since
 * v1.5.6 — the Filter action + summary pills + collapsible metric panels
 * are the same DOM/markup as tests/e2e/performance.spec.ts, just rendered
 * at 1440×1000). This file only checks the unification actually holds at
 * this viewport; the interaction coverage itself lives in performance.spec.ts.
 */
test.describe("Performance dashboard (S-P4-01) at desktop viewport (≥1024px)", () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, "LEADER_P2");
  });

  test("renders the same unified chrome as mobile, no console errors", async ({
    page,
  }) => {
    const watch = watchConsole(page);
    await page.goto("/insights/performance");

    await expect(
      page.getByRole("heading", { name: "Performance" }),
    ).toBeVisible();
    const filterButton = page.getByRole("button", { name: "Filter" });
    await expect(filterButton).toBeVisible();
    await expect(filterButton.locator(".filter-btn-label")).toBeVisible();

    // Exactly one "More actions" trigger — no duplicate hidden copy at either breakpoint.
    await expect(
      page.getByRole("button", { name: "More actions" }),
    ).toHaveCount(1);

    expect(watch.errors, watch.errors.join("\n")).toEqual([]);
    expect(watch.warnings, watch.warnings.join("\n")).toEqual([]);
  });

  test("scope switcher shows icon + label at breakpoint.tablet/desktop (AC-P4-01-42)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const scopeSwitcher = page.getByLabel("Scope switcher");
    await expect(scopeSwitcher).toBeVisible();
    await expect(page.locator(".scope-pill-label")).toBeVisible();
    await expect(page.locator(".scope-pill-label")).toHaveText("Self");
  });

  test('Other Focus Metric header stays visible even when empty, with a "+" add affordance (AC-P4-01-26/27)', async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const panel = page.locator(".metric-panel").filter({
      has: page.getByRole("button", { name: "Other Focus Metric" }),
    });
    const toggle = panel.getByRole("button", { name: "Other Focus Metric" });
    await expect(toggle).toBeVisible();
    const count = await toggle.locator(".count-badge").innerText();

    if (count === "0") {
      await expect(
        panel.getByRole("link", { name: "Add focus metric" }),
      ).toBeVisible();
    } else {
      await expect(
        panel.getByRole("button", { name: "Collapse" }),
      ).toBeVisible();
      // Other Focus Metrics keeps its own carousel-track class, independent of
      // the Priority Metrics-only layout change (AC-P4-01-43 / AC-P4-01-47).
      await expect(panel.locator(".carousel-track.focus-grid")).toBeVisible();
      await expect(panel.locator(".carousel-track.priority-grid")).toHaveCount(
        0,
      );
    }
  });

  test("Priority Metric cards keep the 2-column grid at breakpoint.desktop, unchanged (AC-P4-01-43)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const track = page.locator(".carousel-track.priority-grid");
    await expect(track).toBeVisible();
    await expect(track).toHaveCSS("display", "grid");

    const cards = track.locator(".mcard");
    const count = await cards.count();
    if (count >= 2) {
      const first = await cards.nth(0).boundingBox();
      const second = await cards.nth(1).boundingBox();
      // Second card sits beside the first (same row), not below it.
      expect(second && first && Math.abs(second.y - first!.y)).toBeLessThan(5);
    }
  });

  test("priority card face has no goal row/progress bar or nav icon at breakpoint.desktop (AC-P4-01-44)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    for (const title of ["TPC", "PTPC"]) {
      const card = page
        .locator(".carousel-track.priority-grid .mcard")
        .filter({ hasText: title })
        .first();
      await expect(card).toBeVisible();
      await expect(card.locator(".variant")).toContainText("(");
      await expect(card.locator(".goal-line")).toHaveCount(0);
      await expect(card.locator(".progress")).toHaveCount(0);
      await expect(card.locator(".icon")).toHaveCount(0);
    }
  });

  test('"More actions" opens an anchored popover, not the mobile sheet, with no dimmed backdrop (AC-P4-01-59/60)', async ({
    page,
  }) => {
    const watch = watchConsole(page);
    await page.goto("/insights/performance");

    const moreActions = page.getByRole("button", { name: "More actions" });
    await moreActions.click();

    const menu = page.locator(".menu");
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("role", "menu");
    // The mobile bottom-sheet chrome must not render at this breakpoint.
    await expect(page.locator(".sheet")).toHaveCount(0);
    await expect(page.locator(".sheet-backdrop")).toHaveCount(0);

    // Anchored directly under the trigger, not full-width/bottom-pinned.
    const triggerBox = await moreActions.boundingBox();
    const menuBox = await menu.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeLessThan(400);
    expect(menuBox!.y).toBeGreaterThan(triggerBox!.y);

    // No visible X close control on this variant (AC-P4-01-60).
    await expect(menu.getByRole("button", { name: "Close" })).toHaveCount(0);

    // "Set Goals" still navigates (<Link>); "Customize Metrics" is
    // intercepted to open in place (a <button>, AC-P4-01-58).
    await expect(
      menu.getByRole("link", { name: "Set Goals" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("button", { name: "Customize Metrics" }),
    ).toBeVisible();
    await expect(
      menu.getByRole("link", { name: "Historical Data" }),
    ).toBeVisible();

    expect(watch.errors, watch.errors.join("\n")).toEqual([]);
    expect(watch.warnings, watch.warnings.join("\n")).toEqual([]);
  });

  test('"More actions" popover dismisses via outside click and Escape (AC-P4-01-60)', async ({
    page,
  }) => {
    await page.goto("/insights/performance");
    const moreActions = page.getByRole("button", { name: "More actions" });

    await moreActions.click();
    await expect(page.locator(".menu")).toBeVisible();
    await page.mouse.click(20, 20);
    await expect(page.locator(".menu")).toHaveCount(0);

    await moreActions.click();
    await expect(page.locator(".menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".menu")).toHaveCount(0);
  });
});
