import { test, expect } from "@playwright/test";

test("clear chat button should clear conversation", async ({ page }) => {
  await page.goto("/build");
  await page.waitForLoadState("networkidle");
  
  // Open chat widget
  const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
  await chatButton.click();
  
  // Wait for chat to open
  await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
  
  // Type and send a message
  const textarea = page.locator('.chat-container textarea');
  await expect(textarea).toBeVisible({ timeout: 5000 });
  await textarea.fill("Hello testing clear");
  await textarea.press("Enter");
  
  // Wait for message to appear
  await page.waitForTimeout(3000);
  
  // Take screenshot before clear
  await page.screenshot({ path: "final-clear-before.png" });
  
  // Click our clear button (the one with title="New chat")
  const clearButton = page.locator('button[title="New chat"]');
  await expect(clearButton).toBeVisible();
  await clearButton.click();
  
  // Wait for clear to take effect
  await page.waitForTimeout(1000);
  
  // Take screenshot after clear
  await page.screenshot({ path: "final-clear-after.png" });
  
  // The chat should now be empty - the message text should be gone from the chat
  // After clearing, the chat resets so old messages won't be visible
  const userMessage = page.locator('.ais-Chat-message--user:has-text("Hello testing clear")');
  await expect(userMessage).toHaveCount(0);
});
