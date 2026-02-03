import { test, expect } from "@playwright/test";

test("chat should find Intel Core i3 CPUs", async ({ page }) => {
  await page.goto("/build");
  await page.waitForLoadState("networkidle");

  // Open chat widget
  const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
  await chatButton.click();

  // Wait for chat to open
  await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();

  // Type a simpler query - just ask for CPUs
  const textarea = page.locator('.chat-container textarea');
  await expect(textarea).toBeVisible({ timeout: 5000 });
  await textarea.fill("What Intel Core i3 CPUs do you have?");
  await textarea.press("Enter");

  // Wait for response
  await page.waitForTimeout(10000);

  // Take screenshot
  await page.screenshot({ path: "chat-i3-query.png" });

  // Get response text
  const chatMessages = page.locator('.ais-ChatMessage');
  const count = await chatMessages.count();
  console.log("Message count:", count);

  if (count > 1) {
    const lastMessage = chatMessages.last();
    const text = await lastMessage.textContent() || "";
    console.log("Response:", text.substring(0, 800));
  }
});
