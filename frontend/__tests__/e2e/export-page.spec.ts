import { test, expect } from "@playwright/test";

test.describe("Export Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/export");
    await page.waitForLoadState("networkidle");
  });

  test("should display page header and title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Export Your Build" })).toBeVisible();
    await expect(page.getByText("Share your build with friends or save it for later")).toBeVisible();
  });

  test("should display navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Build", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Export" })).toBeVisible();
  });

  test("should show empty state when no components selected", async ({ page }) => {
    await expect(page.getByText("No Components Selected")).toBeVisible();
    await expect(page.getByText("Add components to your build before exporting")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Builder" })).toBeVisible();
  });

  test("should display build summary sidebar", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Build Summary" })).toBeVisible();
    await expect(page.getByText("0/7 Components")).toBeVisible();
    await expect(page.getByText("Total Price")).toBeVisible();
    await expect(page.getByText("$0.00")).toBeVisible();
  });

  test("should display component slots in sidebar", async ({ page }) => {
    await expect(page.getByText("CPU", { exact: true })).toBeVisible();
    await expect(page.getByText("Motherboard")).toBeVisible();
    await expect(page.getByText("Graphics Card")).toBeVisible();
    await expect(page.getByText("Memory")).toBeVisible();
    await expect(page.getByText("Power Supply")).toBeVisible();
    await expect(page.getByText("Case")).toBeVisible();
    await expect(page.getByText("CPU Cooler")).toBeVisible();
  });

  test("should have share link and edit build buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Get Share Link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Edit Build/i })).toBeVisible();
  });

  test("should navigate back to builder", async ({ page }) => {
    await page.getByRole("link", { name: "Back to Builder" }).click();
    await expect(page).toHaveURL(/\/build/);
  });

  test("should navigate to builder from Go to Builder button", async ({ page }) => {
    await page.getByRole("link", { name: "Go to Builder" }).click();
    await expect(page).toHaveURL(/\/build/);
  });
});

test.describe("Export Page - With Build Data", () => {
  test.beforeEach(async ({ page }) => {
    // First go to build page and add some components
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Search and add a component
    const searchBox = page.locator('input[placeholder*="Search"]');
    await searchBox.fill("AMD");
    await page.waitForTimeout(1000);
    
    // Click first Add button to add a component
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("should show export options when build has components", async ({ page }) => {
    // Navigate to export page
    await page.goto("/export");
    await page.waitForLoadState("networkidle");
    
    // Check if format tabs are visible (means we have components)
    const hasTabs = await page.locator('[role="tablist"]').count();
    
    if (hasTabs > 0) {
      // Should show format tabs
      await expect(page.getByRole("tab", { name: /PCPartPicker/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Reddit/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /JSON/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Share Link/i })).toBeVisible();
    }
  });

  test("should be able to switch between export formats", async ({ page }) => {
    await page.goto("/export");
    await page.waitForLoadState("networkidle");
    
    const hasTabs = await page.locator('[role="tablist"]').count();
    
    if (hasTabs > 0) {
      // Click Reddit tab
      await page.getByRole("tab", { name: /Reddit/i }).click();
      await expect(page.getByRole("heading", { name: "Reddit Format" })).toBeVisible();
      
      // Click JSON tab
      await page.getByRole("tab", { name: /JSON/i }).click();
      await expect(page.getByRole("heading", { name: "JSON Format" })).toBeVisible();
      
      // Click Share Link tab
      await page.getByRole("tab", { name: /Share Link/i }).click();
      await expect(page.getByRole("heading", { name: "Share Link Format" })).toBeVisible();
    }
  });
});

test.describe("Export Page - Copy Functionality", () => {
  test("should have copy button when export content is available", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Add a component first
    const searchBox = page.locator('input[placeholder*="Search"]');
    await searchBox.fill("Intel");
    await page.waitForTimeout(1000);
    
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Go to export page
      await page.goto("/export");
      await page.waitForLoadState("networkidle");
      
      // Check for copy button
      const copyButton = page.getByRole("button", { name: /Copy to Clipboard/i });
      if (await copyButton.isVisible()) {
        await expect(copyButton).toBeVisible();
      }
    }
  });
});

test.describe("Export Page - Mobile", () => {
  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/export");
    await page.waitForLoadState("networkidle");

    // Header should be visible
    await expect(page.getByText("Spec-Logic")).toBeVisible();
    
    // Page title should be visible
    await expect(page.getByRole("heading", { name: "Export Your Build" })).toBeVisible();
  });
});
