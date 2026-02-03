import { test, expect } from "@playwright/test";

test.describe("Chat Suggestion Click - No Duplicates", () => {
  test("should NOT show duplicate messages when clicking a suggestion", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    // Test the dropdown functionality
    const dropdown = page.getByRole("combobox");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.click();
    
    // Select "GPU for my build" option (same as user's screenshot)
    const gpuOption = page.getByText("GPU for my build");
    await expect(gpuOption).toBeVisible();
    await gpuOption.click();
    
    // Wait a moment for the value to be set
    await page.waitForTimeout(500);
    
    // Take screenshot BEFORE submitting to see the exact state
    await page.screenshot({ path: 'chat-input-styling.png', fullPage: false });
    
    // Get textarea value to verify it was set
    const textarea = page.locator('.chat-container textarea');
    const textareaValue = await textarea.inputValue();
    console.log(`Textarea value after dropdown selection: "${textareaValue}"`);
    
    // The submit button should be enabled now
    const submitButton = page.locator('.chat-container button[type="submit"], .ais-ChatPrompt-submit');
    
    // Check if submit button is enabled AND get more details
    const isDisabled = await submitButton.isDisabled().catch(() => true);
    const buttonExists = await submitButton.count();
    console.log(`Submit button count: ${buttonExists}`);
    console.log(`Submit button disabled: ${isDisabled}`);
    
    if (isDisabled) {
      console.log("Submit button is disabled - pressing Enter directly");
      await textarea.press("Enter");
    } else {
      console.log("Submit button is enabled - clicking it");
      await submitButton.click();
    }
    
    // Wait for full response
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=Thinking...').waitFor({ state: 'hidden', timeout: 30000 });
    } catch (e) {
      // Continue
    }
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'chat-suggestion-test.png', fullPage: false });
    
    // Count assistant messages
    const assistantMessages = page.locator('[data-role="assistant"]');
    const totalCount = await assistantMessages.count();
    
    console.log(`Total assistant message elements: ${totalCount}`);
    
    // Get info on each message
    const messageInfo = await assistantMessages.evaluateAll(msgs => {
      return msgs.map((msg, i) => {
        const style = window.getComputedStyle(msg);
        const content = msg.textContent?.substring(0, 80) || '';
        return {
          index: i,
          display: style.display,
          visibility: style.visibility,
          contentPreview: content.trim(),
        };
      });
    });
    
    console.log("Message details:", JSON.stringify(messageInfo, null, 2));
    
    const visibleMessages = messageInfo.filter(m => m.display !== 'none' && m.visibility !== 'hidden');
    console.log(`Visible assistant messages: ${visibleMessages.length}`);
    
    // MUST be exactly 1 visible assistant message
    expect(visibleMessages.length).toBe(1);
  });
});

test.describe("Chat Message Duplicates", () => {
  test("should NOT show duplicate assistant messages after single query", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Open chat
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    // Wait for chat to be ready
    const textarea = page.locator('.chat-container textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    
    // Send a message
    await textarea.fill("What Intel CPUs do you have for gaming?");
    await textarea.press("Enter");
    
    // Wait for response to fully complete
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=Thinking...').waitFor({ state: 'hidden', timeout: 25000 });
    } catch (e) {
      // Continue
    }
    // Wait extra time for any streaming to complete
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'chat-duplicate-test.png', fullPage: false });
    
    // Get all assistant message elements (both visible and hidden)
    const assistantMessages = page.locator('[data-role="assistant"]');
    const totalCount = await assistantMessages.count();
    
    console.log(`Total assistant message elements: ${totalCount}`);
    
    // Get visibility status of each
    const messageInfo = await assistantMessages.evaluateAll(msgs => {
      return msgs.map((msg, i) => {
        const style = window.getComputedStyle(msg);
        const content = msg.textContent?.substring(0, 100) || '';
        return {
          index: i,
          display: style.display,
          visibility: style.visibility,
          contentPreview: content.trim(),
        };
      });
    });
    
    console.log("Message details:", JSON.stringify(messageInfo, null, 2));
    
    // Count visible messages
    const visibleMessages = messageInfo.filter(m => m.display !== 'none' && m.visibility !== 'hidden');
    console.log(`Visible assistant messages: ${visibleMessages.length}`);
    
    // CRITICAL: There should be exactly 1 visible assistant message for 1 user query
    expect(visibleMessages.length).toBe(1);
  });

  test("should not have duplicated text content within chat", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
    
    const textarea = page.locator('.chat-container textarea');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    
    await textarea.fill("What Intel CPUs do you have for gaming?");
    await textarea.press("Enter");
    
    // Wait longer for full response
    await page.waitForTimeout(3000);
    try {
      await page.locator('text=Thinking...').waitFor({ state: 'hidden', timeout: 25000 });
    } catch (e) {
      // Continue
    }
    await page.waitForTimeout(3000);
    
    // Get all text from assistant messages
    const assistantText = await page.locator('[data-role="assistant"]').evaluateAll(msgs => {
      return msgs
        .filter(m => window.getComputedStyle(m).display !== 'none')
        .map(m => m.textContent?.trim() || '')
        .join('\n');
    });
    
    // Check for obviously duplicated phrases (30+ chars appearing twice)
    const phrases = assistantText.match(/.{30,}/g) || [];
    const phraseCounts = new Map<string, number>();
    
    phrases.forEach(phrase => {
      const key = phrase.toLowerCase().trim();
      phraseCounts.set(key, (phraseCounts.get(key) || 0) + 1);
    });
    
    const duplicates = Array.from(phraseCounts.entries()).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log("DUPLICATE PHRASES FOUND:");
      duplicates.forEach(([phrase, count]) => {
        console.log(`  "${phrase.substring(0, 50)}..." appears ${count} times`);
      });
    }
    
    // Should have no significant duplicates
    expect(duplicates.length).toBe(0);
  });
});
