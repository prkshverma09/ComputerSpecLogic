import { test, expect } from "@playwright/test";

test.describe("Budget Presets", () => {
  test("Budget Gaming preset should filter components", async ({ page }) => {
    // Navigate to budget gaming preset
    await page.goto("/build?budget=1000");
    await page.waitForLoadState("networkidle");
    
    // Should show the budget banner
    await expect(page.getByText("Budget Gaming Build")).toBeVisible();
    await expect(page.getByText("~$1000")).toBeVisible();
    await expect(page.getByText("Showing components up to $200 each")).toBeVisible();
    
    // Should have Clear Filter button
    await expect(page.getByRole("button", { name: /Clear Filter/i })).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: "budget-preset-1000.png", fullPage: true });
  });

  test("Mid-Range preset should filter components", async ({ page }) => {
    await page.goto("/build?budget=1500");
    await page.waitForLoadState("networkidle");
    
    await expect(page.getByText("Mid-Range Beast Build")).toBeVisible();
    await expect(page.getByText("~$1500")).toBeVisible();
  });

  test("High-End preset should filter components", async ({ page }) => {
    await page.goto("/build?budget=2500");
    await page.waitForLoadState("networkidle");
    
    await expect(page.getByText("High-End Gaming Build")).toBeVisible();
    await expect(page.getByText("~$2500")).toBeVisible();
  });

  test("Workstation preset should filter components", async ({ page }) => {
    await page.goto("/build?budget=4000");
    await page.waitForLoadState("networkidle");
    
    await expect(page.getByText("Workstation Pro Build")).toBeVisible();
    await expect(page.getByText("~$4000")).toBeVisible();
  });

  test("Clear Filter button should remove budget filter", async ({ page }) => {
    await page.goto("/build?budget=1000");
    await page.waitForLoadState("networkidle");
    
    // Verify banner is shown
    await expect(page.getByText("Budget Gaming Build")).toBeVisible();
    
    // Click clear filter
    await page.getByRole("button", { name: /Clear Filter/i }).click();
    
    // Banner should be gone
    await expect(page.getByText("Budget Gaming Build")).not.toBeVisible();
    
    // URL should not have budget param
    await expect(page).toHaveURL("/build");
  });

  test("Invalid budget param should not show banner", async ({ page }) => {
    await page.goto("/build?budget=9999");
    await page.waitForLoadState("networkidle");
    
    // Should not show any budget banner (no Clear Filter button)
    await expect(page.getByRole("heading", { name: "PC Builder" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Clear Filter/i })).not.toBeVisible();
  });

  test("No budget param should show all components", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Should not show any budget banner
    await expect(page.getByRole("button", { name: /Clear Filter/i })).not.toBeVisible();
    
    // Should show all 1940 results
    await expect(page.getByText(/1,940 results/i)).toBeVisible();
  });

  test("Home page presets should link correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Click Budget Gaming preset
    await page.getByText("Budget Gaming").click();
    
    // Should navigate to build page with budget param
    await expect(page).toHaveURL(/\/build\?budget=1000/);
    await expect(page.getByText("Budget Gaming Build")).toBeVisible();
  });
});
