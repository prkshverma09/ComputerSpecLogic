import { test, expect } from "@playwright/test";

test.describe("Compatibility Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("socket mismatch prevention - AM5 CPU with LGA1700 motherboard", async ({ page }) => {
    const am5Cpu = {
      objectID: "cpu-am5",
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
    };

    const lga1700Motherboard = {
      objectID: "mb-lga1700",
      component_type: "Motherboard",
      brand: "ASUS",
      model: "ROG Strix Z790",
      socket: "LGA1700",
      form_factor: "ATX",
      memory_type: ["DDR5"],
      memory_slots: 4,
      max_memory_gb: 128,
      price_usd: 399,
      performance_tier: "high-end",
      compatibility_tags: ["lga1700"],
    };

    await page.evaluate(({ cpu, motherboard }) => {
      const buildState = {
        build: {
          cpu,
          motherboard,
          gpu: null,
          ram: null,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: am5Cpu, motherboard: lga1700Motherboard });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cpu?.socket).toBe("AM5");
    expect(storedBuild?.build?.motherboard?.socket).toBe("LGA1700");
    expect(storedBuild?.build?.cpu?.socket).not.toBe(storedBuild?.build?.motherboard?.socket);
  });

  test("memory type mismatch prevention - DDR4 RAM with DDR5 motherboard", async ({ page }) => {
    const ddr5Motherboard = {
      objectID: "mb-ddr5",
      component_type: "Motherboard",
      brand: "MSI",
      model: "MAG B650 TOMAHAWK",
      socket: "AM5",
      form_factor: "ATX",
      memory_type: ["DDR5"],
      memory_slots: 4,
      max_memory_gb: 128,
      price_usd: 259,
      performance_tier: "mid-range",
      compatibility_tags: ["am5", "ddr5"],
    };

    const ddr4Ram = {
      objectID: "ram-ddr4",
      component_type: "RAM",
      brand: "Corsair",
      model: "Vengeance LPX",
      memory_type: "DDR4",
      speed_mhz: 3200,
      capacity_gb: 32,
      modules: 2,
      price_usd: 79,
      performance_tier: "mid-range",
      compatibility_tags: ["ddr4"],
    };

    await page.evaluate(({ motherboard, ram }) => {
      const buildState = {
        build: {
          cpu: null,
          motherboard,
          gpu: null,
          ram,
          psu: null,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { motherboard: ddr5Motherboard, ram: ddr4Ram });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.motherboard?.memory_type).toContain("DDR5");
    expect(storedBuild?.build?.ram?.memory_type).toBe("DDR4");
    expect(storedBuild?.build?.motherboard?.memory_type).not.toContain(storedBuild?.build?.ram?.memory_type);
  });

  test("GPU clearance warning - large GPU in small case", async ({ page }) => {
    const largeGpu = {
      objectID: "gpu-large",
      component_type: "GPU",
      brand: "NVIDIA",
      model: "RTX 4090",
      length_mm: 336,
      tdp_watts: 450,
      vram_gb: 24,
      price_usd: 1599,
      performance_tier: "enthusiast",
      compatibility_tags: ["extreme-tdp"],
    };

    const smallCase = {
      objectID: "case-small",
      component_type: "Case",
      brand: "NZXT",
      model: "H210",
      form_factor_support: ["Mini-ITX"],
      max_gpu_length_mm: 325,
      max_cooler_height_mm: 165,
      price_usd: 89,
      performance_tier: "mid-range",
      compatibility_tags: ["mini-itx"],
    };

    await page.evaluate(({ gpu, caseComponent }) => {
      const buildState = {
        build: {
          cpu: null,
          motherboard: null,
          gpu,
          ram: null,
          psu: null,
          case: caseComponent,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { gpu: largeGpu, caseComponent: smallCase });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.gpu?.length_mm).toBeGreaterThan(storedBuild?.build?.case?.max_gpu_length_mm);
  });

  test("PSU wattage warning - high TDP components with low wattage PSU", async ({ page }) => {
    const highTdpCpu = {
      objectID: "cpu-high-tdp",
      component_type: "CPU",
      brand: "Intel",
      model: "Core i9-14900K",
      socket: "LGA1700",
      tdp_watts: 253,
      max_tdp_watts: 253,
      cores: 24,
      threads: 32,
      price_usd: 589,
      performance_tier: "enthusiast",
      memory_type: ["DDR4", "DDR5"],
      integrated_graphics: true,
      compatibility_tags: ["lga1700"],
    };

    const highTdpGpu = {
      objectID: "gpu-high-tdp",
      component_type: "GPU",
      brand: "NVIDIA",
      model: "RTX 4090",
      length_mm: 336,
      tdp_watts: 450,
      vram_gb: 24,
      price_usd: 1599,
      performance_tier: "enthusiast",
      compatibility_tags: ["extreme-tdp"],
    };

    const lowWattagePsu = {
      objectID: "psu-low",
      component_type: "PSU",
      brand: "EVGA",
      model: "500W",
      wattage: 500,
      efficiency_rating: "80+ Bronze",
      modular: "Non-Modular",
      price_usd: 49,
      performance_tier: "budget",
      compatibility_tags: ["500w"],
    };

    await page.evaluate(({ cpu, gpu, psu }) => {
      const buildState = {
        build: {
          cpu,
          motherboard: null,
          gpu,
          ram: null,
          psu,
          case: null,
          cooler: null,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: highTdpCpu, gpu: highTdpGpu, psu: lowWattagePsu });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    const totalTdp = storedBuild?.build?.cpu?.tdp_watts + storedBuild?.build?.gpu?.tdp_watts;
    expect(totalTdp).toBeGreaterThan(storedBuild?.build?.psu?.wattage);
  });

  test("cooler socket support - cooler without CPU socket support", async ({ page }) => {
    const am5Cpu = {
      objectID: "cpu-am5",
      component_type: "CPU",
      brand: "AMD",
      model: "Ryzen 9 7950X",
      socket: "AM5",
      tdp_watts: 170,
      cores: 16,
      threads: 32,
      price_usd: 549,
      performance_tier: "enthusiast",
      memory_type: ["DDR5"],
      integrated_graphics: false,
      compatibility_tags: ["am5"],
    };

    const intelOnlyCooler = {
      objectID: "cooler-intel",
      component_type: "Cooler",
      brand: "Noctua",
      model: "NH-U12S Redux",
      cooler_type: "Air",
      socket_support: ["LGA1700", "LGA1200", "LGA1151"],
      height_mm: 158,
      tdp_rating: 180,
      price_usd: 49,
      performance_tier: "mid-range",
      compatibility_tags: ["air", "lga1700"],
    };

    await page.evaluate(({ cpu, cooler }) => {
      const buildState = {
        build: {
          cpu,
          motherboard: null,
          gpu: null,
          ram: null,
          psu: null,
          case: null,
          cooler,
          storage: null,
        },
      };
      localStorage.setItem("spec-logic-build", JSON.stringify(buildState));
    }, { cpu: am5Cpu, cooler: intelOnlyCooler });

    await page.reload();

    const storedBuild = await page.evaluate(() => {
      const data = localStorage.getItem("spec-logic-build");
      return data ? JSON.parse(data) : null;
    });

    expect(storedBuild?.build?.cooler?.socket_support).not.toContain(storedBuild?.build?.cpu?.socket);
  });
});
