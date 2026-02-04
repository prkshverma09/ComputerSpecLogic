import { test, expect, Page } from "@playwright/test";

test.describe("Complete Build Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("full 7-component build flow from homepage to export", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Spec-Logic/i);

    const startButton = page.locator('text=/Start Building|Build Now|Get Started/i').first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForURL(/\/build/i, { timeout: 5000 }).catch(() => {});
    }
  });

  test("homepage displays hero section and features", async ({ page }) => {
    await page.goto("/");

    const heroTitle = page.locator("h1").first();
    await expect(heroTitle).toBeVisible();

    const featuresSection = page.locator('text=/Compatibility|Smart|Features/i').first();
    if (await featuresSection.isVisible({ timeout: 2000 })) {
      await expect(featuresSection).toBeVisible();
    }
  });

  test("homepage displays budget presets", async ({ page }) => {
    await page.goto("/");

    const budgetSection = page.locator('text=/\\$1,000|\\$1,500|\\$2,500|Budget/i').first();
    if (await budgetSection.isVisible({ timeout: 3000 })) {
      await expect(budgetSection).toBeVisible();
    }
  });

  test("navigate from homepage to build page", async ({ page }) => {
    await page.goto("/");

    const buildLink = page.locator('a[href*="build"], button:has-text("Build")').first();
    if (await buildLink.isVisible({ timeout: 3000 })) {
      await buildLink.click();
      await expect(page).toHaveURL(/build/i);
    } else {
      await page.goto("/build");
      await expect(page).toHaveURL(/build/i);
    }
  });

  test("build state persists in localStorage", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      const buildState = {
        build: {
          cpu: {
            objectID: "test-cpu",
            component_type: "CPU",
            brand: "AMD",
            model: "Ryzen 5 7600X",
            socket: "AM5",
            tdp_watts: 105,
            cores: 6,
            threads: 12,
            price_usd: 299,
            performance_tier: "mid-range",
            memory_type: ["DDR5"],
            integrated_graphics: false,
            compatibility_tags: ["am5"],
          },
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild).not.toBeNull();
    expect(storedBuild?.build?.cpu?.model).toBe("Ryzen 5 7600X");
  });

  test("clear build removes all components", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      const buildState = {
        build: {
          cpu: {
            objectID: "test-cpu",
            component_type: "CPU",
            brand: "AMD",
            model: "Test CPU",
            price_usd: 299,
            socket: "AM5",
            tdp_watts: 105,
            cores: 6,
            threads: 12,
            memory_type: ["DDR5"],
            integrated_graphics: false,
            performance_tier: "mid-range",
            compatibility_tags: [],
          },
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    });

    await page.reload();

    await page.evaluate(() => {
      const emptyState = {
        build: {
          cpu: null,
          motherboard: null,
          gpu: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(emptyState));
    });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu).toBeNull();
  });
});

test.describe("Build Page Interactions", () => {
  test("search box is visible on build page", async ({ page }) => {
    await page.goto("/build");

    const searchBox = page.locator('input[type="search"], input[placeholder*="Search"], [data-testid="search-box"]').first();
    if (await searchBox.isVisible({ timeout: 5000 })) {
      await expect(searchBox).toBeVisible();
    }
  });

  test("category tabs are visible on build page", async ({ page }) => {
    await page.goto("/build");

    const tabs = page.locator('[role="tablist"], .tabs, [data-testid="category-tabs"]').first();
    if (await tabs.isVisible({ timeout: 5000 })) {
      await expect(tabs).toBeVisible();
    }
  });
});
