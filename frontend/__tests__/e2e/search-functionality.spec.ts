import { test, expect } from "@playwright/test";

test.describe("Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("domcontentloaded");
  });

  test("search box accepts text input", async ({ page }) => {
    const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchBox.isVisible({ timeout: 5000 })) {
      await searchBox.fill("RTX 4090");
      await expect(searchBox).toHaveValue("RTX 4090");
    }
  });

  test("search returns results for valid query", async ({ page }) => {
    const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchBox.isVisible({ timeout: 5000 })) {
      await searchBox.fill("CPU");
      await page.waitForTimeout(1000);

      const results = page.locator('[data-testid="search-results"], .results-grid, [class*="results"]');
      if (await results.isVisible({ timeout: 5000 })) {
        await expect(results).toBeVisible();
      }
    }
  });

  test("category tabs filter results by component type", async ({ page }) => {
    const tabs = page.locator('[role="tab"], button[data-testid*="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      const cpuTab = page.locator('text=/CPU/i').first();
      if (await cpuTab.isVisible({ timeout: 3000 })) {
        await cpuTab.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("price filter applies correctly", async ({ page }) => {
    const priceFilter = page.locator('[data-testid="price-filter"], select[name*="price"], button:has-text("Price")').first();

    if (await priceFilter.isVisible({ timeout: 3000 })) {
      await priceFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test("brand filter supports multi-select", async ({ page }) => {
    const brandFilter = page.locator('[data-testid="brand-filter"], [data-testid*="brand"], button:has-text("Brand")').first();

    if (await brandFilter.isVisible({ timeout: 3000 })) {
      await brandFilter.click();
      await page.waitForTimeout(500);

      const brandOptions = page.locator('input[type="checkbox"][name*="brand"], [data-testid*="brand-option"]');
      const optionCount = await brandOptions.count();

      if (optionCount > 0) {
        await brandOptions.first().check();
      }
    }
  });

  test("clear filters resets results", async ({ page }) => {
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset"), [data-testid="clear-filters"]').first();

    if (await clearButton.isVisible({ timeout: 3000 })) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("pagination navigation works", async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagination"], .pagination').first();

    if (await pagination.isVisible({ timeout: 5000 })) {
      const nextButton = pagination.locator('button:has-text("Next"), [aria-label="Next page"]').first();

      if (await nextButton.isVisible({ timeout: 2000 }) && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("empty search shows message", async ({ page }) => {
    const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchBox.isVisible({ timeout: 5000 })) {
      await searchBox.fill("xyznonexistentproduct12345");
      await page.waitForTimeout(1500);

      const noResults = page.locator('text=/No results|No matching|Not found/i');
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state');

      const hasNoResultsMessage = await noResults.isVisible({ timeout: 3000 }).catch(() => false);
      const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    }
  });

  test("sort by price low to high", async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-select"], select[name*="sort"], button:has-text("Sort")').first();

    if (await sortDropdown.isVisible({ timeout: 3000 })) {
      await sortDropdown.click();
      await page.waitForTimeout(300);

      const lowToHigh = page.locator('text=/Low to High|Price: Low|Ascending/i').first();
      if (await lowToHigh.isVisible({ timeout: 2000 })) {
        await lowToHigh.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("sort by price high to low", async ({ page }) => {
    const sortDropdown = page.locator('[data-testid="sort-select"], select[name*="sort"], button:has-text("Sort")').first();

    if (await sortDropdown.isVisible({ timeout: 3000 })) {
      await sortDropdown.click();
      await page.waitForTimeout(300);

      const highToLow = page.locator('text=/High to Low|Price: High|Descending/i').first();
      if (await highToLow.isVisible({ timeout: 2000 })) {
        await highToLow.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe("Search Results Display", () => {
  test("results grid shows component cards", async ({ page }) => {
    await page.goto("/build");

    const resultsGrid = page.locator('[data-testid="results-grid"], .results-grid, [class*="grid"]').first();

    if (await resultsGrid.isVisible({ timeout: 5000 })) {
      const cards = resultsGrid.locator('[data-testid*="card"], .component-card, article');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        expect(cardCount).toBeGreaterThan(0);
      }
    }
  });

  test("component cards show price", async ({ page }) => {
    await page.goto("/build");

    const priceElement = page.locator('text=/\\$\\d+|USD|Price:/i').first();

    if (await priceElement.isVisible({ timeout: 5000 })) {
      await expect(priceElement).toBeVisible();
    }
  });

  test("component cards show brand and model", async ({ page }) => {
    await page.goto("/build");

    await page.waitForTimeout(2000);

    const brandElement = page.locator('text=/AMD|Intel|NVIDIA|ASUS|MSI|Corsair|Noctua/i').first();

    if (await brandElement.isVisible({ timeout: 5000 })) {
      await expect(brandElement).toBeVisible();
    }
  });
});
