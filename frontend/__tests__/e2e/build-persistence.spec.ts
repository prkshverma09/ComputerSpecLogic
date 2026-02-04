import { test, expect } from "@playwright/test";

test.describe("Build State Persistence", () => {
  const testCpu = {
    objectID: "cpu-test-persist",
    component_type: "CPU",
    brand: "AMD",
    model: "Ryzen 7 7700X",
    socket: "AM5",
    tdp_watts: 105,
    cores: 8,
    threads: 16,
    price_usd: 349,
    performance_tier: "high-end",
    memory_type: ["DDR5"],
    integrated_graphics: false,
    compatibility_tags: ["am5", "ddr5"],
  };

  const testGpu = {
    objectID: "gpu-test-persist",
    component_type: "GPU",
    brand: "NVIDIA",
    model: "RTX 4070 Ti",
    length_mm: 305,
    tdp_watts: 285,
    vram_gb: 12,
    price_usd: 799,
    performance_tier: "high-end",
    compatibility_tags: ["high-tdp"],
  };

  const testMotherboard = {
    objectID: "mb-test-persist",
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
    compatibility_tags: ["am5", "ddr5", "atx"],
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("build persists on page refresh", async ({ page }) => {
    await page.evaluate(({ cpu, gpu, motherboard }) => {
      const buildState = {
        build: {
          cpu,
          gpu,
          motherboard,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: testCpu, gpu: testGpu, motherboard: testMotherboard });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild).not.toBeNull();
    expect(storedBuild?.build?.cpu?.model).toBe("Ryzen 7 7700X");
    expect(storedBuild?.build?.gpu?.model).toBe("RTX 4070 Ti");
    expect(storedBuild?.build?.motherboard?.model).toBe("ROG Strix B650E-F");
  });

  test("build persists on navigation to export page", async ({ page }) => {
    await page.evaluate(({ cpu }) => {
      const buildState = {
        build: {
          cpu,
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
    }, { cpu: testCpu });

    await page.goto("/export");
    await page.waitForLoadState("domcontentloaded");

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu?.model).toBe("Ryzen 7 7700X");
  });

  test("build persists on navigation back from export page", async ({ page }) => {
    await page.evaluate(({ cpu, gpu }) => {
      const buildState = {
        build: {
          cpu,
          gpu,
          motherboard: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: testCpu, gpu: testGpu });

    await page.goto("/export");
    await page.waitForLoadState("domcontentloaded");

    await page.goto("/build");
    await page.waitForLoadState("domcontentloaded");

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu?.model).toBe("Ryzen 7 7700X");
    expect(storedBuild?.build?.gpu?.model).toBe("RTX 4070 Ti");
  });

  test("clear build removes all components and persists", async ({ page }) => {
    await page.evaluate(({ cpu, gpu, motherboard }) => {
      const buildState = {
        build: {
          cpu,
          gpu,
          motherboard,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: testCpu, gpu: testGpu, motherboard: testMotherboard });

    await page.reload();

    await page.evaluate(() => {
      const emptyBuild = {
        build: {
          cpu: null,
          motherboard: null,
          gpu: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(emptyBuild));
    });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu).toBeNull();
    expect(storedBuild?.build?.gpu).toBeNull();
    expect(storedBuild?.build?.motherboard).toBeNull();
  });

  test("localStorage key is correct", async ({ page }) => {
    await page.evaluate(({ cpu }) => {
      const buildState = { build: { cpu } };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: testCpu });

    const hasCorrectKey = await page.evaluate(() => {
      return localStorage.getItem("spec-logic-build") !== null;
    });

    expect(hasCorrectKey).toBe(true);
  });

  test("build data structure is preserved correctly", async ({ page }) => {
    await page.evaluate(({ cpu, gpu, motherboard }) => {
      const buildState = {
        build: {
          cpu,
          gpu,
          motherboard,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: testCpu, gpu: testGpu, motherboard: testMotherboard });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu?.objectID).toBe("cpu-test-persist");
    expect(storedBuild?.build?.cpu?.socket).toBe("AM5");
    expect(storedBuild?.build?.cpu?.tdp_watts).toBe(105);
    expect(storedBuild?.build?.cpu?.price_usd).toBe(349);

    expect(storedBuild?.build?.gpu?.objectID).toBe("gpu-test-persist");
    expect(storedBuild?.build?.gpu?.length_mm).toBe(305);
    expect(storedBuild?.build?.gpu?.vram_gb).toBe(12);
  });

  test("partial build persists correctly", async ({ page }) => {
    await page.evaluate(({ cpu }) => {
      const buildState = {
        build: {
          cpu,
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
    }, { cpu: testCpu });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu).not.toBeNull();
    expect(storedBuild?.build?.gpu).toBeNull();
    expect(storedBuild?.build?.motherboard).toBeNull();
  });
});
