import { expect, test } from "@playwright/test";
import { setPersona } from "../support/personas";
import { watchConsole } from "../support/console";

test.describe("Performance dashboard (S-P4-01) on the 375 mobile shell", () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, "LEADER_P2");
  });

  test("default config hides the whole milestones region for SELF and TEAM", async ({
    page,
  }) => {
    const watch = watchConsole(page);
    await page.goto("/insights/performance");

    await expect(
      page.getByRole("heading", { name: "Performance" }),
    ).toBeVisible();
    await expect(page.getByText("Metric Tracking")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Quick links" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Introducer Drilldown" }),
    ).toHaveCount(0);

    const panel = page
      .locator(".metric-panel")
      .filter({ has: page.getByRole("button", { name: "Priority Metric" }) });
    await expect(
      panel
        .getByRole("button", { name: "Priority Metric" })
        .locator(".count-badge"),
    ).toHaveText(/^\d+$/);

    await expect(page.getByText("Priority Milestones")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Set Goal" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Add milestone" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: "View MOC" })).toHaveCount(0);

    await page.getByLabel("Scope switcher").click();
    await page.locator(".sheet").getByRole("radio", { name: "Team" }).click();
    await page.locator(".sheet").getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("link", { name: "Team Drilldown" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Introducer Drilldown" }),
    ).toHaveCount(0);
    await expect(page.getByText("Priority Milestones")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Set Goal" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Add milestone" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: "View MOC" })).toHaveCount(0);

    expect(watch.errors, watch.errors.join("\n")).toEqual([]);
    expect(watch.warnings, watch.warnings.join("\n")).toEqual([]);
  });

  test("locally enabled milestones.visible=true keeps the full section and actions visible for SELF and TEAM", async ({
    page,
  }) => {
    await page.route("**/api/bff/v1/performance/dashboard**", async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.milestones = {
        ...body.milestones,
        visible: true,
        addEnabled: true,
        setGoalEnabled: true,
      };
      await route.fulfill({
        response,
        body: JSON.stringify(body),
      });
    });

    await page.goto("/insights/performance");
    await expect(page.getByText("Priority Milestones")).toBeVisible();
    await expect(page.getByRole("link", { name: "Set Goal" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add milestone" }),
    ).toBeVisible();

    await page.getByLabel("Scope switcher").click();
    await page.locator(".sheet").getByRole("radio", { name: "Team" }).click();
    await page.locator(".sheet").getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Priority Milestones")).toBeVisible();
    await expect(page.getByRole("link", { name: "Set Goal" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add milestone" }),
    ).toBeVisible();
  });

  test("tablet keeps the visible Filter label while preserving icon-only mobile behavior (AC-P4-01-49/50)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.goto("/insights/performance");

    const filterButton = page.getByRole("button", { name: "Filter" });
    await expect(filterButton).toBeVisible();
    await expect(filterButton.locator(".filter-btn-label")).toBeVisible();
    await expect(page.locator(".more-actions-btn")).toBeVisible();
  });

  test("summary pills are read-only labels and the filter sheet still opens from the header chrome (AC-P4-01-49/51)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const filterButton = page.getByRole("button", { name: "Filter" });
    await expect(filterButton).toBeVisible();
    await expect(filterButton.locator(".filter-btn-label")).toBeHidden();

    const productPill = page
      .locator(".filter-pill")
      .filter({ hasText: "Product" })
      .first();
    const timePill = page
      .locator(".filter-pill")
      .filter({ hasText: "Time" })
      .first();
    await expect(productPill).toContainText("Both");
    await expect(timePill).toContainText("YTD");
    await expect(productPill.locator("button")).toHaveCount(0);
    await expect(timePill.locator("button")).toHaveCount(0);

    await filterButton.click();
    const sheet = page.locator(".sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveAttribute("aria-label", "Filter & Selection");
    // Below 768px, stays a full-width bottom sheet (AC-P4-01-71), unchanged.
    // Compared against the actual layout viewport, not page.viewportSize():
    // this page has a pre-existing ~16px horizontal overflow (unrelated to
    // this sheet — the same gap shows up on the untouched More-actions
    // sheet), so the layout viewport is wider than the requested 375px.
    const box = await sheet.boundingBox();
    const layoutWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerHeight = await page.evaluate(() => window.innerHeight);
    expect(box!.x).toBe(0);
    expect(box!.width).toBeCloseTo(layoutWidth, 0);
    expect(box!.y + box!.height).toBeCloseTo(innerHeight, 0);
    await expect(
      sheet.getByRole("radio").filter({ hasText: "Takaful" }),
    ).toBeVisible();
    await expect(
      sheet.getByRole("radio").filter({ hasText: "MTD" }),
    ).toBeVisible();

    await sheet.getByRole("radio").filter({ hasText: "Takaful" }).click();
    await sheet.getByRole("radio").filter({ hasText: "MTD" }).click();
    await sheet.getByRole("button", { name: "Apply" }).click();

    await expect(productPill).toContainText("Takaful");
    await expect(timePill).toContainText("MTD");
  });

  test("Priority Metric panel shows a count badge and collapses (AC-P4-01-29, unified v1.5.6)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const panel = page
      .locator(".metric-panel")
      .filter({ has: page.getByRole("button", { name: "Priority Metric" }) });
    const toggle = panel.getByRole("button", { name: "Priority Metric" });
    await expect(toggle).toBeVisible();
    await expect(toggle.locator(".count-badge")).toHaveText(/^\d+$/);

    const collapseBtn = panel.getByRole("button", { name: "Collapse" });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await expect(panel.getByRole("button", { name: "Expand" })).toBeVisible();
  });

  test("Priority Metric cards stack in a single column below breakpoint.desktop, no carousel dots (AC-P4-01-43)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const track = page.locator(".carousel-track.priority-grid");
    await expect(track).toBeVisible();
    const cardCount = await track.locator(".mcard").count();
    expect(cardCount).toBeGreaterThan(0);

    // Stacked, not side-by-side: each card after the first starts below the
    // one before it, and every card spans the track's full width.
    const trackBox = await track.boundingBox();
    const first = await track.locator(".mcard").nth(0).boundingBox();
    const second = await track.locator(".mcard").nth(1).boundingBox();
    expect(trackBox && first && Math.round(first.width)).toBe(
      trackBox && Math.round(trackBox.width),
    );
    expect(second && first && second.y).toBeGreaterThan(first!.y);

    // No pagination dots for this row at this breakpoint.
    const panel = page
      .locator(".metric-panel")
      .filter({ has: page.getByRole("button", { name: "Priority Metric" }) });
    await expect(panel.locator(".dots")).toHaveCount(0);
  });

  test("priority card face has no goal row/progress bar or nav icon, delta beside the value (AC-P4-01-44)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    // TPC has a goal SET today; PTPC is configured showGoal=false. Both must
    // render identically now: title+subtitle inline, no goal line, no icon,
    // value and delta on the same row.
    for (const title of ["TPC", "PTPC"]) {
      const card = page
        .locator(".carousel-track.priority-grid .mcard")
        .filter({ hasText: title })
        .first();
      await expect(card).toBeVisible();
      await expect(card.locator(".name")).toHaveText(title);
      await expect(card.locator(".variant")).toContainText("(");
      await expect(card.locator(".goal-line")).toHaveCount(0);
      await expect(card.locator(".progress")).toHaveCount(0);
      await expect(card.locator(".icon")).toHaveCount(0);

      const value = card.locator(".value");
      const delta = card.locator(".delta-line");
      await expect(value).toBeVisible();
      const valueBox = await value.boundingBox();
      const deltaBox = await delta.boundingBox();
      expect(
        deltaBox && valueBox && Math.abs(deltaBox.y - valueBox.y),
      ).toBeLessThan(10);
    }
  });

  test("AI recommendations bar ships collapsed and expands on tap (S-P23-01)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const recoBar = page.locator("button.reco-bar");
    await expect(recoBar).toBeVisible();
    await expect(recoBar).toHaveAttribute("aria-expanded", "false");

    await recoBar.click();
    await expect(recoBar).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".reco-panel")).toBeVisible();
  });

  test("more-actions sheet uses the vertical menu icon and links to Historical Data (AC-P4-01-22, AC-P4-01-50)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    const moreActions = page.getByRole("button", { name: "More actions" });
    await expect(moreActions).toBeVisible();
    await expect(moreActions).toHaveClass(/more-actions-btn/);

    await moreActions.click();

    const sheet = page.locator(".sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: /Historical Data/i }).click();

    await expect(page).toHaveURL(/insights\/history/);
  });

  test("applied filters survive leaving the dashboard and coming back (S-P4-01)", async ({
    page,
  }) => {
    const pills = page.locator(".filter-row");
    await page.goto("/insights/performance");

    await page.getByRole("button", { name: "Filter" }).click();
    const sheet = page.locator(".sheet");
    await sheet.getByRole("radio").filter({ hasText: "Takaful" }).click();
    await sheet.getByRole("radio").filter({ hasText: "MTD" }).click();
    await sheet.getByRole("button", { name: "Apply" }).click();
    await expect(pills).toContainText("Takaful");
    await expect(pills).toContainText("MTD");

    await page.locator(".mcard").first().click();
    await expect(page).toHaveURL(/insights\/metric-detail/);
    await page.locator("button.back").click();
    await expect(pills).toContainText("Takaful");
    await expect(pills).toContainText("MTD");

    await page.goto("/insights/performance");
    await expect(pills).toContainText("Takaful");
    await expect(pills).toContainText("MTD");
  });

  test("Customize Metrics opens in place as a bottom sheet on mobile, no navigation (AC-P4-01-58)", async ({
    page,
  }) => {
    await page.goto("/insights/performance");

    await page.getByRole("button", { name: "More actions" }).click();
    await page.locator(".sheet").getByRole("button", { name: "Customize Metrics" }).click();

    const surface = page.locator(".cust-surface");
    await expect(surface).toBeVisible();
    await expect(page).toHaveURL(/insights\/performance/);
    const box = await surface.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.width).toBeCloseTo(viewport.width, 0);
    expect(box!.y + box!.height).toBeCloseTo(viewport.height, 0);

    await surface.locator(".cust-close").click();
    await expect(surface).toHaveCount(0);
    await expect(page).toHaveURL(/insights\/performance/);
    await expect(page.getByRole("heading", { name: "Performance" })).toBeVisible();
  });
});
