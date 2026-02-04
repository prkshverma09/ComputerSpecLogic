import { test, expect } from "@playwright/test";

test.describe("Chat Widget Loading", () => {
  test("should show proper loading indicator when sending message", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat widget by clicking the floating button
    const chatToggle = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatToggle.click();
    
    // Wait for chat window to appear via heading
    await expect(page.getByRole('heading', { name: 'PC Build Assistant' })).toBeVisible({ timeout: 5000 });
    
    // Take screenshot of open chat
    await page.screenshot({ path: "chat-open.png", fullPage: true });
    
    // Find textarea and type a message
    const textarea = page.locator('.chat-container textarea');
    await textarea.fill("What CPUs do you have under $200?");
    
    // Submit the message
    await textarea.press("Enter");
    
    // Take screenshot immediately after submit to capture loading state
    await page.waitForTimeout(500);
    await page.screenshot({ path: "chat-loading.png", fullPage: true });
    
    // Wait for response (with timeout)
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "chat-response.png", fullPage: true });
  });

  test("should not show oversized spinner", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat
    const chatToggle = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatToggle.click();
    
    // Wait for chat window
    await expect(page.getByRole('heading', { name: 'PC Build Assistant' })).toBeVisible();
    
    // Check that any SVG in the chat container is reasonably sized
    const chatContainer = page.locator('.chat-container');
    const chatSvgs = chatContainer.locator('svg');
    const count = await chatSvgs.count();
    
    for (let i = 0; i < count; i++) {
      const svg = chatSvgs.nth(i);
      const box = await svg.boundingBox();
      if (box) {
        // No SVG should be larger than 100px (oversized spinner was ~300px)
        expect(box.width).toBeLessThan(100);
        expect(box.height).toBeLessThan(100);
      }
    }
  });
});
