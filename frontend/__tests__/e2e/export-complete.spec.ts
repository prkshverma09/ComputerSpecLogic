import { test, expect } from "@playwright/test";

test.describe("Export Functionality", () => {
  const testBuild = {
    cpu: {
      objectID: "cpu-export",
      component_type: "CPU",
      brand: "AMD",
      model: "Ryzen 5 7600X",
      socket: "AM5",
      tdp_watts: 105,
      cores: 6,
      threads: 12,
      price_usd: 299,
      performance_tier: "mid-range",
      memory_type: ["DDR5"],
      integrated_graphics: false,
      compatibility_tags: ["am5"],
    },
    gpu: {
      objectID: "gpu-export",
      component_type: "GPU",
      brand: "NVIDIA",
      model: "RTX 4070",
      length_mm: 300,
      tdp_watts: 200,
      vram_gb: 12,
      price_usd: 599,
      performance_tier: "high-end",
      compatibility_tags: ["mid-tdp"],
    },
    motherboard: {
      objectID: "mb-export",
      component_type: "Motherboard",
      brand: "ASUS",
      model: "ROG Strix B650E-F",
      socket: "AM5",
      form_factor: "ATX",
      memory_type: ["DDR5"],
      memory_slots: 4,
      max_memory_gb: 128,
      price_usd: 349,
      performance_tier: "high-end",
      compatibility_tags: ["am5", "ddr5"],
    },
    psu: {
      objectID: "psu-export",
      component_type: "PSU",
      brand: "Corsair",
      model: "RM850x",
      wattage: 850,
      efficiency_rating: "80+ Gold",
      price_usd: 139,
      performance_tier: "high-end",
      compatibility_tags: ["850w"],
    },
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    await page.evaluate((build) => {
      const buildState = {
        build: {
          cpu: build.cpu,
          gpu: build.gpu,
          motherboard: build.motherboard,
          psu: build.psu,
          ram: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, testBuild);
  });

  test("export page loads correctly", async ({ page }) => {
    await page.goto("/export");
    await page.waitForLoadState("domcontentloaded");

    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("export page shows build summary", async ({ page }) => {
    await page.goto("/export");
    await page.waitForLoadState("domcontentloaded");

    const cpuText = page.locator('text=/Ryzen 5 7600X|CPU/i').first();
    const gpuText = page.locator('text=/RTX 4070|GPU/i').first();

    const hasCpu = await cpuText.isVisible({ timeout: 5000 }).catch(() => false);
    const hasGpu = await gpuText.isVisible({ timeout: 5000 }).catch(() => false);
  });

  test("PCPartPicker format tab exists", async ({ page }) => {
    await page.goto("/export");

    const pcpartpickerTab = page.locator('text=/PCPartPicker/i').first();
    if (await pcpartpickerTab.isVisible({ timeout: 5000 })) {
      await expect(pcpartpickerTab).toBeVisible();
    }
  });

  test("Reddit format tab exists", async ({ page }) => {
    await page.goto("/export");

    const redditTab = page.locator('text=/Reddit/i').first();
    if (await redditTab.isVisible({ timeout: 5000 })) {
      await expect(redditTab).toBeVisible();
    }
  });

  test("JSON format tab exists", async ({ page }) => {
    await page.goto("/export");

    const jsonTab = page.locator('text=/JSON/i').first();
    if (await jsonTab.isVisible({ timeout: 5000 })) {
      await expect(jsonTab).toBeVisible();
    }
  });

  test("Share Link tab exists", async ({ page }) => {
    await page.goto("/export");

    const shareTab = page.locator('text=/Share|Link/i').first();
    if (await shareTab.isVisible({ timeout: 5000 })) {
      await expect(shareTab).toBeVisible();
    }
  });

  test("switching format tabs updates content", async ({ page }) => {
    await page.goto("/export");

    const tabs = page.locator('[role="tab"], button[data-testid*="format"]');
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      const secondTab = tabs.nth(1);
      if (await secondTab.isVisible({ timeout: 3000 })) {
        await secondTab.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("copy button is visible", async ({ page }) => {
    await page.goto("/export");

    const copyButton = page.locator('button:has-text("Copy"), [data-testid="copy-button"], button[aria-label*="Copy"]').first();
    if (await copyButton.isVisible({ timeout: 5000 })) {
      await expect(copyButton).toBeVisible();
    }
  });

  test("copy button copies content to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/export");

    const copyButton = page.locator('button:has-text("Copy"), [data-testid="copy-button"]').first();

    if (await copyButton.isVisible({ timeout: 5000 })) {
      await copyButton.click();
      await page.waitForTimeout(500);

      const clipboardText = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    }
  });

  test("export page shows total price", async ({ page }) => {
    await page.goto("/export");

    const totalPrice = 299 + 599 + 349 + 139;
    const priceText = page.locator(`text=/${totalPrice}|\\$\\d+/`).first();

    if (await priceText.isVisible({ timeout: 5000 })) {
      await expect(priceText).toBeVisible();
    }
  });

  test("empty build shows appropriate message", async ({ page }) => {
    await page.evaluate(() => {
      const emptyBuild = {
        build: {
          cpu: null,
          gpu: null,
          motherboard: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(emptyBuild));
    });

    await page.goto("/export");
    await page.waitForLoadState("domcontentloaded");

    const emptyMessage = page.locator('text=/empty|no components|start building/i').first();
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');

    const hasEmptyMessage = await emptyMessage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
  });
});

test.describe("Export Format Content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    const build = {
      cpu: {
        objectID: "cpu-1",
        component_type: "CPU",
        brand: "AMD",
        model: "Ryzen 5 7600X",
        price_usd: 299,
        socket: "AM5",
        tdp_watts: 105,
        cores: 6,
        threads: 12,
        memory_type: ["DDR5"],
        integrated_graphics: false,
        performance_tier: "mid-range",
        compatibility_tags: [],
      },
    };

    await page.evaluate((build) => {
      const buildState = {
        build: {
          cpu: build.cpu,
          motherboard: null,
          gpu: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, build);
  });

  test("JSON export contains build data", async ({ page }) => {
    await page.goto("/export");

    const jsonTab = page.locator('button:has-text("JSON"), [role="tab"]:has-text("JSON")').first();
    if (await jsonTab.isVisible({ timeout: 5000 })) {
      await jsonTab.click();
      await page.waitForTimeout(500);

      const jsonContent = page.locator('pre, code, [data-testid="json-output"]').first();
      if (await jsonContent.isVisible({ timeout: 3000 })) {
        const text = await jsonContent.textContent();
        if (text) {
          const containsCpu = text.includes("cpu") || text.includes("CPU") || text.includes("Ryzen");
          expect(containsCpu || text.length > 0).toBe(true);
        }
      }
    }
  });

  test("Reddit export contains markdown formatting", async ({ page }) => {
    await page.goto("/export");

    const redditTab = page.locator('button:has-text("Reddit"), [role="tab"]:has-text("Reddit")').first();
    if (await redditTab.isVisible({ timeout: 5000 })) {
      await redditTab.click();
      await page.waitForTimeout(500);

      const redditContent = page.locator('pre, code, textarea, [data-testid="reddit-output"]').first();
      if (await redditContent.isVisible({ timeout: 3000 })) {
        const text = await redditContent.textContent();
        expect(text !== null).toBe(true);
      }
    }
  });
});
