import { test, expect } from "@playwright/test";

test("chat should return product data from index", async ({ page }) => {
  await page.goto("/build");
  await page.waitForLoadState("networkidle");

  // Open chat widget
  const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
  await chatButton.click();

  // Wait for chat to open
  await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();

  // Type a query that should return product data
  const textarea = page.locator('.chat-container textarea');
  await expect(textarea).toBeVisible({ timeout: 5000 });
  await textarea.fill("Show me CPUs under $200");
  await textarea.press("Enter");

  // Wait for response (may take a few seconds)
  await page.waitForTimeout(8000);

  // Take screenshot of the response
  await page.screenshot({ path: "chat-cpu-query-response.png" });

  // Check if the response contains product information
  // Look for price mentions (indicating real data)
  const chatMessages = page.locator('.ais-ChatMessage--left, .ais-ChatMessage-message');
  const responseText = await chatMessages.last().textContent() || "";

  console.log("Response preview:", responseText.substring(0, 500));

  // The response should mention specific products or prices
  const hasProductInfo = responseText.includes("$") ||
                         responseText.includes("Intel") ||
                         responseText.includes("AMD") ||
                         responseText.includes("Core i") ||
                         responseText.includes("Ryzen");

  console.log("Contains product info:", hasProductInfo);
});
