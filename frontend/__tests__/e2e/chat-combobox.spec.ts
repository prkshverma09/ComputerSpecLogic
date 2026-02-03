import { test, expect } from "@playwright/test";

test.describe("Chat Combobox Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    await expect(page.getByRole("heading", { name: "PC Build Assistant" })).toBeVisible();
  });

  test.describe("combobox rendering", () => {
    test("should display combobox input instead of separate dropdown", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await expect(combobox).toBeVisible();
      
      const separateDropdown = page.getByText("Quick questions...");
      await expect(separateDropdown).not.toBeVisible();
    });

    test("should have appropriate placeholder text", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      const placeholder = await combobox.getAttribute("placeholder");
      expect(placeholder).toMatch(/ask|type|question|build/i);
    });
  });

  test.describe("preset suggestions dropdown", () => {
    test("should show preset suggestions when clicking on input", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      await expect(page.getByRole("listbox")).toBeVisible();
      await expect(page.getByRole("option", { name: /cpu for gaming/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /gpu for my build/i })).toBeVisible();
    });

    test("should show preset suggestions when focusing input with keyboard", async ({ page }) => {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.focus();
      
      await expect(page.getByRole("listbox")).toBeVisible();
    });

    test("should filter suggestions as user types", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.fill("CPU");
      
      await expect(page.getByRole("option", { name: /cpu for gaming/i })).toBeVisible();
      await expect(page.getByRole("option", { name: /gpu for my build/i })).not.toBeVisible();
    });

    test("should show no suggestions message when no presets match", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.fill("xyz random unmatched text");
      
      await expect(page.getByText(/no suggestions|type your question/i)).toBeVisible();
    });
  });

  test.describe("selecting presets", () => {
    test("should populate input when clicking on a preset", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      await expect(page.getByRole("listbox")).toBeVisible();
      
      const cpuOption = page.getByRole("option", { name: /cpu for gaming/i });
      await cpuOption.click();
      
      await expect(combobox).toHaveValue(/intel.*cpu.*gaming/i);
    });

    test("should close dropdown after selecting a preset", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      const cpuOption = page.getByRole("option", { name: /cpu for gaming/i });
      await cpuOption.click();
      
      await expect(page.getByRole("listbox")).not.toBeVisible();
    });

    test("should allow user to edit the populated text before submitting", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      const cpuOption = page.getByRole("option", { name: /cpu for gaming/i });
      await cpuOption.click();
      
      await combobox.press("End");
      await combobox.type(" under $300");
      
      const value = await combobox.inputValue();
      expect(value).toContain("under $300");
    });
  });

  test.describe("keyboard navigation", () => {
    test("should navigate suggestions with arrow keys", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      await expect(page.getByRole("listbox")).toBeVisible();
      
      await page.keyboard.press("ArrowDown");
      
      const firstOption = page.getByRole("option").first();
      await expect(firstOption).toHaveAttribute("data-highlighted", "true");
    });

    test("should select suggestion with Enter after navigation", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      
      const value = await combobox.inputValue();
      expect(value.length).toBeGreaterThan(0);
      
      await expect(page.getByRole("listbox")).not.toBeVisible();
    });

    test("should close dropdown on Escape", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      await expect(page.getByRole("listbox")).toBeVisible();
      
      await page.keyboard.press("Escape");
      
      await expect(page.getByRole("listbox")).not.toBeVisible();
    });
  });

  test.describe("form submission", () => {
    test("should submit custom typed question on Enter without dropdown open", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.fill("What is the best GPU for 1440p gaming?");
      
      await page.keyboard.press("Escape");
      
      await page.keyboard.press("Enter");
      
      await page.waitForTimeout(500);
      const currentValue = await combobox.inputValue();
      expect(currentValue).toBe("");
    });

    test("should submit when clicking send button", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.fill("What motherboard should I buy?");
      
      const sendButton = page.getByRole("button", { name: /send/i });
      await sendButton.click();
      
      await page.waitForTimeout(500);
      const currentValue = await combobox.inputValue();
      expect(currentValue).toBe("");
    });

    test("should disable send button when input is empty", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await expect(combobox).toHaveValue("");
      
      const sendButton = page.getByRole("button", { name: /send/i });
      await expect(sendButton).toBeDisabled();
    });

    test("should enable send button when input has text", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.fill("test question");
      
      const sendButton = page.getByRole("button", { name: /send/i });
      await expect(sendButton).toBeEnabled();
    });
  });

  test.describe("integration with chat", () => {
    test("should display user message in chat after submission", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      const testQuestion = "What CPU should I buy?";
      
      await combobox.fill(testQuestion);
      await page.keyboard.press("Escape");
      await page.keyboard.press("Enter");
      
      await expect(page.getByText(testQuestion)).toBeVisible({ timeout: 5000 });
    });

    test("should work with presets to send questions to chat", async ({ page }) => {
      const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
      await combobox.click();
      
      const cpuOption = page.getByRole("option", { name: /cpu for gaming/i });
      await cpuOption.click();
      
      await page.keyboard.press("Escape");
      await page.keyboard.press("Enter");
      
      await expect(page.getByText(/intel.*cpu.*gaming/i)).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe("Chat Combobox - Mobile", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/build");
    await page.waitForLoadState("networkidle");
    
    const chatButton = page.locator('button:has(svg[class*="lucide-message-circle"])');
    await chatButton.click();
    
    const combobox = page.getByRole("combobox", { name: /ask|type|question/i });
    await expect(combobox).toBeVisible();
    
    await combobox.click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });
});
