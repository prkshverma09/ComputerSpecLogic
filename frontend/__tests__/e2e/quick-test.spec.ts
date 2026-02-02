import { test, expect } from "@playwright/test";

test.describe("Quick Frontend Tests", () => {
  test.setTimeout(15000);

  test("Home page loads and has single Start Building button", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check header has single Start Building button (not duplicate)
    const navLinks = page.locator('header nav a');
    await expect(navLinks).toHaveCount(1);
    await expect(navLinks.first()).toHaveText("Start Building");
    
    // Screenshot
    await page.screenshot({ path: "test-home.png" });
  });

  test("Footer links work", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // GitHub link should exist with correct href
    const githubLink = page.locator('a[href*="github.com"]');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("target", "_blank");
    
    // About link should scroll to features
    const aboutLink = page.locator('footer a[href="#features"]');
    await expect(aboutLink).toBeVisible();
  });

  test("Budget preset shows banner and filters results", async ({ page }) => {
    await page.goto("/build?budget=1000");
    await page.waitForLoadState("networkidle");
    
    // Wait for page to fully hydrate
    await page.waitForSelector('text=PC Builder', { timeout: 15000 });
    
    // Take screenshot to see what's there
    await page.screenshot({ path: "test-budget.png", fullPage: true });
    
    // Budget banner should show
    await expect(page.getByText("Budget Gaming Build")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("~$1000")).toBeVisible();
    
    // Clear filter button should exist
    await expect(page.getByRole("button", { name: /Clear Filter/i })).toBeVisible();
  });

  test("Chat widget opens with dropdown", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Wait for page to hydrate
    await page.waitForSelector('text=PC Builder', { timeout: 15000 });
    
    // Take screenshot first
    await page.screenshot({ path: "test-chat-before.png", fullPage: true });
    
    // Click chat toggle button (the floating button)
    const chatToggle = page.locator('button').filter({ hasText: '' }).locator('svg.lucide-message-circle').locator('..');
    await expect(chatToggle).toBeVisible({ timeout: 5000 });
    await chatToggle.click();
    
    // Chat window should open
    await expect(page.getByRole('heading', { name: 'PC Build Assistant' })).toBeVisible({ timeout: 5000 });
    
    // Quick questions dropdown should exist
    await expect(page.getByText("Quick questions - select a topic")).toBeVisible();
    
    // Clear chat button should exist (the rotate icon)
    const clearButton = page.locator('button[title="New chat"]');
    await expect(clearButton).toBeVisible();
    
    await page.screenshot({ path: "test-chat.png", fullPage: true });
  });

  test("Chat dropdown shows questions", async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    // Wait for page to hydrate
    await page.waitForSelector('text=PC Builder', { timeout: 15000 });
    
    // Open chat
    const chatToggle = page.locator('button').filter({ hasText: '' }).locator('svg.lucide-message-circle').locator('..');
    await expect(chatToggle).toBeVisible({ timeout: 5000 });
    await chatToggle.click();
    await expect(page.getByRole('heading', { name: 'PC Build Assistant' })).toBeVisible({ timeout: 5000 });
    
    // Click dropdown
    const dropdown = page.getByRole("combobox");
    await dropdown.click();
    
    // Check some options exist
    await expect(page.getByText("Show me Intel CPUs you have")).toBeVisible();
    await expect(page.getByText("Help me build a budget gaming PC")).toBeVisible();
    await expect(page.getByText("High-end gaming build")).toBeVisible();
    
    await page.screenshot({ path: "test-chat-dropdown.png", fullPage: true });
  });
});
