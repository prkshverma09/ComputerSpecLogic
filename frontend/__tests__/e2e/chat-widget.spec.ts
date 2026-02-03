import { test, expect } from "@playwright/test";

test.describe("Chat Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
  });

  test("should display chat toggle button", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await expect(chatButton).toBeVisible();
  });

  test("should open chat window when clicking toggle button", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    await expect(page.getByText("Powered by Algolia AI")).toBeVisible();
  });

  test("should display combobox input instead of separate dropdown", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const combobox = page.getByRole("combobox");
    await expect(combobox).toBeVisible();

    await combobox.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByText("CPU for gaming PC")).toBeVisible();
    await expect(page.getByText("GPU for my build")).toBeVisible();
  });

  test("should minimize chat window", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const minimizeButton = page.locator('button:has(svg[class*="lucide-minimize"])');
    await minimizeButton.click();

    await expect(page.getByText("PC Build Assistant")).toBeVisible();
    const combobox = page.getByRole("combobox");
    await expect(combobox).not.toBeVisible();
  });

  test("should maximize minimized chat window", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const minimizeButton = page.locator('button:has(svg[class*="lucide-minimize"])');
    await minimizeButton.click();

    const maximizeButton = page.locator('button:has(svg[class*="lucide-maximize"])');
    await maximizeButton.click();

    const combobox = page.getByRole("combobox");
    await expect(combobox).toBeVisible();
  });

  test("should close chat window", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const closeButton = page.locator('button:has(svg[class*="lucide-x"])').last();
    await closeButton.click();

    await expect(page.getByText("PC Build Assistant")).not.toBeVisible();
    await expect(chatButton).toBeVisible();
  });

  test("should have clear chat button", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const clearButton = page.locator('button[title="New chat"]');
    await expect(clearButton).toBeVisible();
  });

  test("should have combobox with proper placeholder", async ({ page }) => {
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    const combobox = page.getByRole("combobox");
    await expect(combobox).toBeVisible();
    await expect(combobox).toHaveAttribute("placeholder", /ask.*build|compatibility/i);
  });
});

test.describe("Chat Widget - Mobile", () => {
  test("should be accessible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/build");
    await page.waitForLoadState("networkidle");

    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await expect(chatButton).toBeVisible();

    await chatButton.click();

    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    const combobox = page.getByRole("combobox");
    await expect(combobox).toBeVisible();
  });
});
