import { test, expect } from "@playwright/test";

test.describe("Motherboard Selection Fix", () => {
  test("should have Compatible Only filter button", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // First add a CPU to create incompatibilities
    await page.getByText("Processor (CPU)", { exact: true }).click();
    await page.waitForTimeout(1500);
    
    let dialog = page.getByRole("dialog");
    let addBtn = dialog.getByRole("button", { name: /add/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    
    // Now open motherboard selection
    await page.getByText("Motherboard", { exact: true }).click();
    await page.waitForTimeout(1500);
    
    dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    // Check for the Compatible Only button
    const filterButton = dialog.getByRole("button", { name: /compatible only/i });
    await expect(filterButton).toBeVisible();
    
    // Click the filter button
    await filterButton.click();
    await page.waitForTimeout(500);
    
    // Button should now say "Show All"
    await expect(dialog.getByRole("button", { name: /show all/i })).toBeVisible();
  });

  test("should display motherboard cards without memory_type.join error", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Click on motherboard row
    await page.getByText("Motherboard", { exact: true }).click();
    
    // Wait for dialog
    await page.waitForTimeout(2000);
    
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("heading", { name: "Select Motherboard" })).toBeVisible();
    
    // Should NOT have any error overlay
    const errorOverlay = page.locator('text=/TypeError|Error/i');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
    
    // Should have component cards
    const addButtons = dialog.getByRole("button", { name: /add/i });
    const count = await addButtons.count();
    expect(count).toBeGreaterThan(0);
    
    // Click add on first motherboard
    await addButtons.first().click();
    await page.waitForTimeout(500);
    
    // Dialog should close
    await expect(dialog).not.toBeVisible();
    
    // Price should update from $0
    const priceElement = page.locator('h2').filter({ hasText: /\$/ });
    await expect(priceElement).toBeVisible();
  });

  test("should add GPU without errors", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Test GPU
    await page.getByText("Graphics Card", { exact: true }).click();
    await page.waitForTimeout(2000);
    
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    const addBtn = dialog.getByRole("button", { name: /add/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    
    // Dialog should close
    await expect(dialog).not.toBeVisible();
    
    // No errors should have occurred
    const errorOverlay = page.locator('text=/TypeError|Error/i');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test("should add Case without errors", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Test Case (which uses form_factor_support array)
    await page.getByText("Case", { exact: true }).click();
    await page.waitForTimeout(2000);
    
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    const addBtn = dialog.getByRole("button", { name: /add/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(500);
    
    // Dialog should close
    await expect(dialog).not.toBeVisible();
    
    // No errors should have occurred
    const errorOverlay = page.locator('text=/TypeError|Error/i');
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });
});
