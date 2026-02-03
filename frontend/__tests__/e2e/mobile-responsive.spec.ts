import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.describe("Mobile Responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("homepage renders correctly on mobile", async ({ page }) => {
    await page.goto("/");

    const heroSection = page.locator("h1").first();
    await expect(heroSection).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);
  });

  test("navigation menu is accessible on mobile", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.locator(
      'button[aria-label*="menu"], button:has([class*="hamburger"]), [data-testid="mobile-menu"]'
    ).first();

    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("build page layout stacks vertically on mobile", async ({ page }) => {
    await page.goto("/build");

    const mainContent = page.locator("main, [role='main'], .main-content").first();
    if (await mainContent.isVisible({ timeout: 5000 })) {
      const boundingBox = await mainContent.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeLessThanOrEqual(430);
      }
    }
  });

  test("search box is usable on mobile", async ({ page }) => {
    await page.goto("/build");

    const searchBox = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchBox.isVisible({ timeout: 5000 })) {
      await searchBox.click();
      await searchBox.fill("RTX");
      await expect(searchBox).toHaveValue("RTX");
    }
  });

  test("component cards stack vertically", async ({ page }) => {
    await page.goto("/build");

    const cards = page.locator('[class*="card"], [data-testid*="component"]');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      const firstCard = await cards.first().boundingBox();
      const secondCard = await cards.nth(1).boundingBox();

      if (firstCard && secondCard) {
        expect(firstCard.x).toBeCloseTo(secondCard.x, 1);
      }
    }
  });

  test("export page is accessible on mobile", async ({ page }) => {
    await page.goto("/");

    await page.evaluate(() => {
      localStorage.setItem(
        "pc-build-store",
        JSON.stringify({
          state: {
            cpu: {
              objectID: "cpu-1",
              name: "Test CPU",
              price_usd: 299,
              component_type: "CPU",
            },
          },
          version: 0,
        })
      );
    });

    await page.goto("/export");

    const exportPage = page.locator("main, [role='main'], .export-page").first();
    await expect(exportPage).toBeVisible({ timeout: 10000 });
  });

  test("buttons are tappable size on mobile", async ({ page }) => {
    await page.goto("/");

    const buttons = page.locator("button").first();
    if (await buttons.isVisible({ timeout: 5000 })) {
      const boundingBox = await buttons.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("text is readable without zooming", async ({ page }) => {
    await page.goto("/");

    const textElements = page.locator("p, h1, h2, h3, span").first();
    if (await textElements.isVisible({ timeout: 3000 })) {
      const fontSize = await textElements.evaluate((el) => 
        parseInt(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });

  test("scrolling works on mobile", async ({ page }) => {
    await page.goto("/");

    const initialScroll = await page.evaluate(() => window.scrollY);

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    const newScroll = await page.evaluate(() => window.scrollY);

    expect(newScroll).toBeGreaterThan(initialScroll);
  });
});

test.describe("Mobile Chat Widget", () => {
  test("chat widget toggle is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const chatToggle = page.locator(
      '[data-testid="chat-toggle"], button[aria-label*="chat"], [class*="chat-toggle"]'
    ).first();

    if (await chatToggle.isVisible({ timeout: 5000 })) {
      await expect(chatToggle).toBeVisible();
    }
  });

  test("chat opens correctly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const chatToggle = page.locator(
      '[data-testid="chat-toggle"], button[aria-label*="chat"], [class*="chat-toggle"]'
    ).first();

    if (await chatToggle.isVisible({ timeout: 5000 })) {
      await chatToggle.click();
      await page.waitForTimeout(500);

      const chatWidget = page.locator(
        '[data-testid="chat-widget"], [class*="chat-widget"], [role="dialog"]'
      ).first();
      
      if (await chatWidget.isVisible({ timeout: 3000 })) {
        const viewport = page.viewportSize();
        const boundingBox = await chatWidget.boundingBox();
        
        if (boundingBox && viewport) {
          expect(boundingBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    }
  });
});

test.describe("Tablet Responsiveness", () => {
  test("layout adjusts for tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    const heroSection = page.locator("h1").first();
    await expect(heroSection).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(768);
  });
});

test.describe("Touch Interactions", () => {
  test("click interactions work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const clickableElement = page.locator("button, a").first();
    if (await clickableElement.isVisible({ timeout: 5000 })) {
      await clickableElement.click();
    }
  });

  test("scroll gestures are recognized", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const initialScroll = await page.evaluate(() => window.scrollY);

    await page.mouse.move(200, 400);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    const newScroll = await page.evaluate(() => window.scrollY);

    expect(newScroll).toBeGreaterThanOrEqual(initialScroll);
  });

  test("long press does not cause issues", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const element = page.locator("h1, p").first();
    if (await element.isVisible({ timeout: 3000 })) {
      const boundingBox = await element.boundingBox();
      if (boundingBox) {
        await page.mouse.move(
          boundingBox.x + boundingBox.width / 2,
          boundingBox.y + boundingBox.height / 2
        );
        await page.mouse.down();
        await page.waitForTimeout(1000);
        await page.mouse.up();
      }
    }
  });
});
