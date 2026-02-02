import { test, expect } from "@playwright/test";

test.describe("Clear Chat Functionality", () => {
  test("should clear chat messages when clicking clear button", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat widget
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    // Wait for chat to open
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    // Type a message in the textarea
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill("Hello, this is a test message");
    
    // Verify the text was entered
    await expect(textarea).toHaveValue("Hello, this is a test message");
    
    // Take screenshot before clear
    await page.screenshot({ path: "clear-chat-before.png" });
    
    // Click the clear chat button
    const clearButton = page.locator('button[title="New chat"]');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    
    // Wait a moment for the component to remount
    await page.waitForTimeout(500);
    
    // The textarea should be empty after clear (component remounted)
    const newTextarea = page.locator('textarea');
    await expect(newTextarea).toBeVisible({ timeout: 5000 });
    
    // Take screenshot after clear
    await page.screenshot({ path: "clear-chat-after.png" });
    
    // The textarea should be empty or have only the placeholder
    const textareaValue = await newTextarea.inputValue();
    expect(textareaValue).toBe("");
  });

  test("should reset chat key when clearing", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat widget
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    // Wait for chat to open
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    // Get the initial chat container
    const chatContainer = page.locator('.chat-container');
    await expect(chatContainer).toBeVisible();
    
    // Click clear button multiple times and verify it doesn't break
    const clearButton = page.locator('button[title="New chat"]');
    
    for (let i = 0; i < 3; i++) {
      await clearButton.click();
      await page.waitForTimeout(300);
      
      // Chat should still be functional
      await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
      const textarea = page.locator('textarea');
      await expect(textarea).toBeVisible({ timeout: 3000 });
    }
  });
});
