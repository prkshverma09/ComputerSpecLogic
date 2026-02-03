import { test, expect } from "@playwright/test";

test("chat cleanup removes duplicates and results text", async ({ page }) => {
  await page.goto("/build");
  await page.waitForLoadState("networkidle");
  
  // Open chat
  const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
  await chatButton.click();
  await page.waitForTimeout(1000);
  
  // Verify textarea is visible before sending
  const textarea = page.locator('textarea').first();
  await expect(textarea).toBeVisible();
  console.log('Textarea visible before sending: true');
  
  // Send message
  await textarea.fill('What Intel CPUs do you have for gaming?');
  await textarea.press('Enter');
  
  // Wait for response to complete
  await page.waitForTimeout(20000);
  
  // Verify textarea is still visible after response
  const textareaAfter = page.locator('textarea').first();
  const textareaVisible = await textareaAfter.isVisible();
  console.log('Textarea visible after response:', textareaVisible);
  
  // Take screenshot of just the chat widget
  const chatWidget = page.locator('.chat-container').first();
  await chatWidget.screenshot({ path: 'chat-widget.png' });
  
  // Take full page screenshot
  await page.screenshot({ path: 'chat-final.png', fullPage: true });
  
  // Get chat text
  const chatContainer = page.locator('.chat-container');
  const chatText = await chatContainer.textContent() || '';
  
  // Check for results text
  const hasResultsText = /\d+\s+of\s+\d+\s+results/i.test(chatText);
  console.log('Has results text:', hasResultsText);
  
  // Check for duplicates - look for repeated phrases
  const phrases = chatText.match(/For gaming, I would typically recommend/gi) || [];
  console.log('Duplicate phrase count:', phrases.length);
  
  console.log('Chat preview:', chatText.substring(0, 500));
  
  expect(textareaVisible).toBe(true);
  expect(hasResultsText).toBe(false);
  expect(phrases.length).toBeLessThanOrEqual(1);
});
