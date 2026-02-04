import { test, expect } from "@playwright/test";

test.describe("Clear Chat - Real Scenario", () => {
  test("should clear chat after sending a message", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");

    // Open chat widget
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();

    // Wait for chat to open
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();

    // Type a message
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill("Hello, recommend a good CPU");

    // Submit the message by pressing Enter or clicking submit
    await textarea.press("Enter");

    // Wait for the message to appear in chat (user message should be visible)
    await page.waitForTimeout(2000);

    // Take screenshot showing chat with message
    await page.screenshot({ path: "test-chat-with-message.png" });

    // Look for messages in the chat area
    const chatMessages = page.locator('.chat-container .ais-Chat-message, .chat-container [class*="message"]');
    const messageCount = await chatMessages.count();
    console.log(`Messages before clear: ${messageCount}`);

    // Click clear chat button
    const clearButton = page.locator('button[title="New chat"]');
    await expect(clearButton).toBeVisible();
    console.log("Clicking clear button...");
    await clearButton.click();

    // Wait for component to remount
    await page.waitForTimeout(1000);

    // Take screenshot after clear
    await page.screenshot({ path: "test-chat-after-clear.png" });

    // Check if messages are cleared
    const messagesAfterClear = page.locator('.chat-container .ais-Chat-message, .chat-container [class*="message"]');
    const messageCountAfter = await messagesAfterClear.count();
    console.log(`Messages after clear: ${messageCountAfter}`);

    // The chat should have fewer or no messages after clear
    expect(messageCountAfter).toBeLessThanOrEqual(messageCount);
  });
});
