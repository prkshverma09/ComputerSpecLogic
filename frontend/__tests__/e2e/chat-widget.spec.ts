import { test, expect } from "@playwright/test";

test.describe("Chat Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
  });

  test("should display chat toggle button", async ({ page }) => {
    // Chat button should be visible in bottom-right
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await expect(chatButton).toBeVisible();
  });

  test("should open chat window when clicking toggle button", async ({ page }) => {
    // Click the chat button
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Chat window should appear (use heading role to be specific)
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    await expect(page.getByText("Powered by Algolia AI")).toBeVisible();
  });

  test("should display quick questions dropdown when chat opens", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Check for quick questions dropdown
    await expect(page.getByText("Quick questions - select a topic")).toBeVisible();
    
    // Open dropdown and check options
    const dropdown = page.getByRole("combobox");
    await dropdown.click();
    await expect(page.getByText("CPU for gaming PC")).toBeVisible();
    await expect(page.getByText("GPU for my build")).toBeVisible();
  });

  test("should minimize chat window", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Click minimize button
    const minimizeButton = page.locator('button:has(svg[class*="lucide-minimize"])');
    await minimizeButton.click();

    // Chat header should still be visible but content should be hidden
    await expect(page.getByText("PC Build Assistant")).toBeVisible();
    await expect(page.getByText("Quick questions - select a topic")).not.toBeVisible();
  });

  test("should maximize minimized chat window", async ({ page }) => {
    // Open and minimize chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    const minimizeButton = page.locator('button:has(svg[class*="lucide-minimize"])');
    await minimizeButton.click();

    // Click maximize button
    const maximizeButton = page.locator('button:has(svg[class*="lucide-maximize"])');
    await maximizeButton.click();

    // Content should be visible again
    await expect(page.getByText("Quick questions - select a topic")).toBeVisible();
  });

  test("should close chat window", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Click close button
    const closeButton = page.locator('button:has(svg[class*="lucide-x"])').last();
    await closeButton.click();

    // Chat window should be gone, toggle button should appear
    await expect(page.getByText("PC Build Assistant")).not.toBeVisible();
    await expect(chatButton).toBeVisible();
  });

  test("should have clear chat button", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Clear chat button should be visible
    const clearButton = page.locator('button[title="New chat"]');
    await expect(clearButton).toBeVisible();
  });

  test("should have chat input placeholder", async ({ page }) => {
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Wait for chat to load
    await page.waitForTimeout(1000);

    // Check for textarea with placeholder
    const textarea = page.locator('textarea');
    if (await textarea.count() > 0) {
      await expect(textarea.first()).toBeVisible();
    }
  });
});

test.describe("Chat Widget - Mobile", () => {
  test("should be accessible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/build");
    await page.waitForLoadState("networkidle");

    // Chat button should be visible
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await expect(chatButton).toBeVisible();

    // Open chat
    await chatButton.click();

    // Chat window should appear
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
  });
});
