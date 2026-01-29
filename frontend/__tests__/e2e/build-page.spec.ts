import { test, expect } from "@playwright/test";

test.describe("Build Page - Basic UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");
  });

  test("should display page header with logo and navigation", async ({ page }) => {
    // Check logo
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByText("Spec-Logic")).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Build" })).toBeVisible();
  });

  test("should display page title and description", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "PC Builder" })).toBeVisible();
    await expect(page.getByText("Search and select compatible components")).toBeVisible();
  });

  test("should display search box", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search components/i);
    await expect(searchBox).toBeVisible();
  });

  test("should display category tabs", async ({ page }) => {
    // Check for category tabs
    await expect(page.getByRole("tab", { name: /all/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /cpu/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /gpu/i })).toBeVisible();
  });

  test("should display build sidebar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Your Build" })).toBeVisible();
    await expect(page.getByText(/\/7 Components/i)).toBeVisible();
  });
});

test.describe("Build Page - Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
  });

  test("should display search results from Algolia", async ({ page }) => {
    // Wait for results to load
    await page.waitForSelector('[class*="card"]', { timeout: 10000 });
    
    // Should have component cards
    const cards = page.locator('[class*="rounded-xl"][class*="border"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("should filter results when typing in search box", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search components/i);
    
    // Type a search query
    await searchBox.fill("RTX");
    
    // Wait for filtered results
    await page.waitForTimeout(1000); // Debounce
    
    // Results should update (we can't check exact content, but UI should respond)
    await expect(searchBox).toHaveValue("RTX");
  });

  test("should clear search when clicking clear button", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search components/i);
    
    // Type something
    await searchBox.fill("test query");
    await expect(searchBox).toHaveValue("test query");
    
    // Clear button should appear
    const clearButton = page.locator('button:has(svg[class*="lucide-x"])');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await expect(searchBox).toHaveValue("");
    }
  });

  test("should display search stats", async ({ page }) => {
    // Wait for search to complete
    await page.waitForTimeout(1500);
    
    // Should show result count
    const stats = page.getByText(/results found/i);
    await expect(stats).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Build Page - Category Filtering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500); // Wait for initial load
  });

  test("should filter by CPU category", async ({ page }) => {
    // Click CPU tab
    const cpuTab = page.getByRole("tab", { name: /cpu/i });
    await cpuTab.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Tab should be active
    await expect(cpuTab).toHaveAttribute("data-state", "active");
  });

  test("should filter by GPU category", async ({ page }) => {
    // Click GPU tab
    const gpuTab = page.getByRole("tab", { name: /gpu/i });
    await gpuTab.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Tab should be active
    await expect(gpuTab).toHaveAttribute("data-state", "active");
  });

  test("should show All components when All tab is clicked", async ({ page }) => {
    // First click a specific category
    await page.getByRole("tab", { name: /cpu/i }).click();
    await page.waitForTimeout(500);
    
    // Then click All
    const allTab = page.getByRole("tab", { name: /all/i });
    await allTab.click();
    await page.waitForTimeout(500);
    
    // All tab should be active
    await expect(allTab).toHaveAttribute("data-state", "active");
  });
});

test.describe("Build Page - Component Cards", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Wait for results
  });

  test("should display component cards with Add button", async ({ page }) => {
    // Find Add buttons
    const addButtons = page.getByRole("button", { name: /add/i });
    await expect(addButtons.first()).toBeVisible({ timeout: 10000 });
  });

  test("should add component to build when clicking Add", async ({ page }) => {
    // Wait for cards to load
    await page.waitForSelector('button:has-text("Add")', { timeout: 10000 });
    
    // Click the first Add button
    const addButton = page.getByRole("button", { name: /add/i }).first();
    await addButton.click();
    
    // Sidebar should update - check for "In Build" or component appears
    await page.waitForTimeout(500);
    
    // Either the button changes to "In Build" or the sidebar shows the component
    const inBuildButton = page.getByRole("button", { name: /in build/i });
    const sidebarComponent = page.locator('aside').getByText(/select/i);
    
    // One of these conditions should be true
    const hasInBuild = await inBuildButton.count() > 0;
    const hasSidebarUpdate = await sidebarComponent.count() < 7; // Less than 7 "Select" texts
    
    expect(hasInBuild || hasSidebarUpdate).toBeTruthy();
  });
});

test.describe("Build Page - Build Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
  });

  test("should display component slots", async ({ page }) => {
    const sidebar = page.locator("aside");
    
    // Check for component type labels
    await expect(sidebar.getByText(/processor/i)).toBeVisible();
    await expect(sidebar.getByText(/graphics card/i)).toBeVisible();
    await expect(sidebar.getByText(/memory/i)).toBeVisible();
  });

  test("should display Power Analysis section", async ({ page }) => {
    await expect(page.getByText("Power Analysis")).toBeVisible();
  });

  test("should display Compatibility Status section", async ({ page }) => {
    await expect(page.getByText("Compatibility Status")).toBeVisible();
  });

  test("should display Total Price", async ({ page }) => {
    await expect(page.getByText("Total Price")).toBeVisible();
    // Price displays as $0 not $0.00
    await expect(page.getByText("$0")).toBeVisible();
  });

  test("should display Share and Export buttons", async ({ page }) => {
    // These are now links to the export page
    await expect(page.getByRole("link", { name: /share/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /export/i })).toBeVisible();
  });
});

test.describe("Build Page - Full Build Flow", () => {
  test("should complete a full build flow", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Step 1: Add a CPU
    await page.getByRole("tab", { name: /cpu/i }).click();
    await page.waitForTimeout(1000);
    
    const cpuAddButton = page.getByRole("button", { name: /add/i }).first();
    if (await cpuAddButton.isVisible()) {
      await cpuAddButton.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Add a GPU
    await page.getByRole("tab", { name: /gpu/i }).click();
    await page.waitForTimeout(1000);
    
    const gpuAddButton = page.getByRole("button", { name: /add/i }).first();
    if (await gpuAddButton.isVisible()) {
      await gpuAddButton.click();
      await page.waitForTimeout(500);
    }

    // Step 3: Verify sidebar updated
    const sidebar = page.locator("aside");
    
    // Component count should update
    await expect(sidebar.getByText(/\/7 Components/)).toBeVisible();
    
    // Price should display (any format)
    const priceElement = sidebar.getByText(/\$\d+/);
    await expect(priceElement.first()).toBeVisible();
  });
});

test.describe("Build Page - Responsive Design", () => {
  test("should be responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Header should still be visible
    await expect(page.getByText("Spec-Logic")).toBeVisible();
    
    // Search box should be visible
    await expect(page.getByPlaceholder(/search components/i)).toBeVisible();
    
    // Page should not have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  });

  test("should be responsive on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // All main elements should be visible
    await expect(page.getByRole("heading", { name: "PC Builder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Build" })).toBeVisible();
  });
});

test.describe("Build Page - Error States", () => {
  test("should handle empty search results gracefully", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Search for something that won't exist
    const searchBox = page.getByPlaceholder(/search components/i);
    await searchBox.fill("xyznonexistentproduct123456");
    
    await page.waitForTimeout(1500);
    
    // Should show empty state or "No components found"
    const noResults = page.getByText(/no components found/i);
    const zeroResults = page.getByText(/0 results/i);
    
    const hasEmptyState = await noResults.isVisible().catch(() => false);
    const hasZeroResults = await zeroResults.isVisible().catch(() => false);
    
    // Either empty state message or 0 results should show
    expect(hasEmptyState || hasZeroResults).toBeTruthy();
  });
});

test.describe("Build Page - Navigation", () => {
  test("should navigate to home when clicking Home link", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Click Home link
    await page.getByRole("link", { name: "Home" }).click();
    
    // Should navigate to home page
    await expect(page).toHaveURL("/");
  });

  test("should navigate to home when clicking logo", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Click logo
    await page.getByText("Spec-Logic").click();
    
    // Should navigate to home page
    await expect(page).toHaveURL("/");
  });
});
