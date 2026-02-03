import { describe, it, expect } from "vitest";
import {
  checkComponentCompatibility,
  validateBuild,
  calculatePowerRequirements,
  deriveActiveFilters,
} from "@/lib/compatibility";
import type { Build, CPU, GPU, Motherboard, RAM, PSU, Case, Cooler, Storage } from "@/types/components";

const createEmptyBuild = (): Build => ({
  cpu: null,
  motherboard: null,
  gpu: null,
  ram: null,
  psu: null,
  case: null,
  cooler: null,
  storage: null,
});

const createCPU = (overrides: Partial<CPU> = {}): CPU => ({
  objectID: "cpu-test",
  component_type: "CPU",
  brand: "AMD",
  model: "Ryzen 5 7600X",
  socket: "AM5",
  tdp_watts: 105,
  cores: 6,
  threads: 12,
  memory_type: ["DDR5"],
  integrated_graphics: false,
  price_usd: 299,
  performance_tier: "mid-range",
  compatibility_tags: ["am5", "ddr5"],
  ...overrides,
});

const createGPU = (overrides: Partial<GPU> = {}): GPU => ({
  objectID: "gpu-test",
  component_type: "GPU",
  brand: "NVIDIA",
  model: "RTX 4070",
  length_mm: 300,
  tdp_watts: 200,
  vram_gb: 12,
  recommended_psu_watts: 650,
  price_usd: 599,
  performance_tier: "high-end",
  compatibility_tags: ["mid-tdp", "vram-12gb"],
  ...overrides,
});

const createMotherboard = (overrides: Partial<Motherboard> = {}): Motherboard => ({
  objectID: "mb-test",
  component_type: "Motherboard",
  brand: "ASUS",
  model: "ROG Strix B650E-F",
  socket: "AM5",
  chipset: "B650E",
  form_factor: "ATX",
  memory_type: ["DDR5"],
  memory_slots: 4,
  max_memory_gb: 128,
  m2_slots: 2,
  price_usd: 349,
  performance_tier: "high-end",
  compatibility_tags: ["am5", "ddr5", "atx"],
  ...overrides,
});

const createRAM = (overrides: Partial<RAM> = {}): RAM => ({
  objectID: "ram-test",
  component_type: "RAM",
  brand: "G.Skill",
  model: "Trident Z5",
  memory_type: "DDR5",
  speed_mhz: 6000,
  capacity_gb: 32,
  modules: 2,
  price_usd: 159,
  performance_tier: "high-end",
  compatibility_tags: ["ddr5"],
  ...overrides,
});

const createPSU = (overrides: Partial<PSU> = {}): PSU => ({
  objectID: "psu-test",
  component_type: "PSU",
  brand: "Corsair",
  model: "RM850x",
  wattage: 850,
  efficiency_rating: "80+ Gold",
  modular: "Full",
  price_usd: 139,
  performance_tier: "high-end",
  compatibility_tags: ["850w", "80+-gold"],
  ...overrides,
});

const createCase = (overrides: Partial<Case> = {}): Case => ({
  objectID: "case-test",
  component_type: "Case",
  brand: "Fractal Design",
  model: "Meshify C",
  form_factor_support: ["ATX", "Micro-ATX", "Mini-ITX"],
  max_gpu_length_mm: 350,
  max_cooler_height_mm: 165,
  price_usd: 109,
  performance_tier: "mid-range",
  compatibility_tags: ["atx", "micro-atx", "mini-itx"],
  ...overrides,
});

const createCooler = (overrides: Partial<Cooler> = {}): Cooler => ({
  objectID: "cooler-test",
  component_type: "Cooler",
  brand: "Noctua",
  model: "NH-D15",
  cooler_type: "Air",
  socket_support: ["AM5", "AM4", "LGA1700", "LGA1200"],
  height_mm: 165,
  tdp_rating: 250,
  price_usd: 99,
  performance_tier: "high-end",
  compatibility_tags: ["air", "am5", "lga1700"],
  ...overrides,
});

const createStorage = (overrides: Partial<Storage> = {}): Storage => ({
  objectID: "storage-test",
  component_type: "Storage",
  brand: "Samsung",
  model: "990 Pro",
  storage_type: "SSD",
  capacity_gb: 2000,
  interface: "PCIe 4.0 x4",
  form_factor: "M.2-2280",
  price_usd: 179,
  performance_tier: "high-end",
  compatibility_tags: ["ssd", "pcie-4.0"],
  ...overrides,
});

describe("checkComponentCompatibility", () => {
  describe("CPU compatibility", () => {
    it("returns compatible when motherboard socket matches", () => {
      const cpu = createCPU({ socket: "AM5" });
      const build = createEmptyBuild();
      build.motherboard = createMotherboard({ socket: "AM5" });

      const result = checkComponentCompatibility(cpu, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when motherboard socket mismatches", () => {
      const cpu = createCPU({ socket: "AM5" });
      const build = createEmptyBuild();
      build.motherboard = createMotherboard({ socket: "LGA1700" });

      const result = checkComponentCompatibility(cpu, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Socket mismatch");
    });

    it("returns compatible when no motherboard selected", () => {
      const cpu = createCPU();
      const build = createEmptyBuild();

      const result = checkComponentCompatibility(cpu, build);

      expect(result.status).toBe("compatible");
    });

    it("returns warning when cooler doesn't support socket", () => {
      const cpu = createCPU({ socket: "AM5" });
      const build = createEmptyBuild();
      build.cooler = createCooler({ socket_support: ["LGA1700"] });

      const result = checkComponentCompatibility(cpu, build);

      expect(result.status).toBe("warning");
      expect(result.message).toContain("may not support");
    });
  });

  describe("GPU compatibility", () => {
    it("returns compatible when case has sufficient clearance", () => {
      const gpu = createGPU({ length_mm: 300 });
      const build = createEmptyBuild();
      build.case = createCase({ max_gpu_length_mm: 350 });

      const result = checkComponentCompatibility(gpu, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when GPU exceeds case clearance", () => {
      const gpu = createGPU({ length_mm: 400 });
      const build = createEmptyBuild();
      build.case = createCase({ max_gpu_length_mm: 350 });

      const result = checkComponentCompatibility(gpu, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Too long");
    });

    it("returns warning when GPU has tight fit", () => {
      const gpu = createGPU({ length_mm: 340 });
      const build = createEmptyBuild();
      build.case = createCase({ max_gpu_length_mm: 350 });

      const result = checkComponentCompatibility(gpu, build);

      expect(result.status).toBe("warning");
      expect(result.message).toContain("Tight fit");
    });

    it("returns warning when PSU wattage is insufficient", () => {
      const gpu = createGPU({ recommended_psu_watts: 850 });
      const build = createEmptyBuild();
      build.psu = createPSU({ wattage: 650 });

      const result = checkComponentCompatibility(gpu, build);

      expect(result.status).toBe("warning");
      expect(result.message).toContain("may be insufficient");
    });
  });

  describe("Motherboard compatibility", () => {
    it("returns compatible when CPU socket matches", () => {
      const motherboard = createMotherboard({ socket: "AM5" });
      const build = createEmptyBuild();
      build.cpu = createCPU({ socket: "AM5" });

      const result = checkComponentCompatibility(motherboard, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when CPU socket mismatches", () => {
      const motherboard = createMotherboard({ socket: "LGA1700" });
      const build = createEmptyBuild();
      build.cpu = createCPU({ socket: "AM5" });

      const result = checkComponentCompatibility(motherboard, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Socket mismatch");
    });

    it("returns incompatible when RAM type mismatches", () => {
      const motherboard = createMotherboard({ memory_type: ["DDR5"] });
      const build = createEmptyBuild();
      build.ram = createRAM({ memory_type: "DDR4" });

      const result = checkComponentCompatibility(motherboard, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Memory mismatch");
    });

    it("returns incompatible when case form factor doesn't support motherboard", () => {
      const motherboard = createMotherboard({ form_factor: "ATX" });
      const build = createEmptyBuild();
      build.case = createCase({ form_factor_support: ["Mini-ITX"] });

      const result = checkComponentCompatibility(motherboard, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Form factor mismatch");
    });
  });

  describe("RAM compatibility", () => {
    it("returns compatible when motherboard supports memory type", () => {
      const ram = createRAM({ memory_type: "DDR5" });
      const build = createEmptyBuild();
      build.motherboard = createMotherboard({ memory_type: ["DDR5"] });

      const result = checkComponentCompatibility(ram, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when motherboard doesn't support memory type", () => {
      const ram = createRAM({ memory_type: "DDR4" });
      const build = createEmptyBuild();
      build.motherboard = createMotherboard({ memory_type: ["DDR5"] });

      const result = checkComponentCompatibility(ram, build);

      expect(result.status).toBe("incompatible");
    });

    it("returns incompatible when CPU doesn't support memory type", () => {
      const ram = createRAM({ memory_type: "DDR4" });
      const build = createEmptyBuild();
      build.cpu = createCPU({ memory_type: ["DDR5"] });

      const result = checkComponentCompatibility(ram, build);

      expect(result.status).toBe("incompatible");
    });
  });

  describe("PSU compatibility", () => {
    it("returns compatible when wattage is sufficient", () => {
      const psu = createPSU({ wattage: 850 });
      const build = createEmptyBuild();
      build.cpu = createCPU({ tdp_watts: 105 });
      build.gpu = createGPU({ tdp_watts: 200 });

      const result = checkComponentCompatibility(psu, build);

      expect(result.status).toBe("compatible");
    });

    it("returns warning when wattage is low", () => {
      const psu = createPSU({ wattage: 450 });
      const build = createEmptyBuild();
      build.cpu = createCPU({ tdp_watts: 170 });
      build.gpu = createGPU({ tdp_watts: 300 });

      const result = checkComponentCompatibility(psu, build);

      expect(result.status).toBe("warning");
      expect(result.message).toContain("Insufficient wattage");
    });
  });

  describe("Case compatibility", () => {
    it("returns compatible when GPU fits", () => {
      const caseComponent = createCase({ max_gpu_length_mm: 350 });
      const build = createEmptyBuild();
      build.gpu = createGPU({ length_mm: 300 });

      const result = checkComponentCompatibility(caseComponent, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when GPU doesn't fit", () => {
      const caseComponent = createCase({ max_gpu_length_mm: 280 });
      const build = createEmptyBuild();
      build.gpu = createGPU({ length_mm: 336 });

      const result = checkComponentCompatibility(caseComponent, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("GPU won't fit");
    });

    it("returns incompatible when cooler doesn't fit", () => {
      const caseComponent = createCase({ max_cooler_height_mm: 145 });
      const build = createEmptyBuild();
      build.cooler = createCooler({ height_mm: 165 });

      const result = checkComponentCompatibility(caseComponent, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Cooler won't fit");
    });
  });

  describe("Cooler compatibility", () => {
    it("returns compatible when socket is supported", () => {
      const cooler = createCooler({ socket_support: ["AM5", "LGA1700"] });
      const build = createEmptyBuild();
      build.cpu = createCPU({ socket: "AM5" });

      const result = checkComponentCompatibility(cooler, build);

      expect(result.status).toBe("compatible");
    });

    it("returns incompatible when socket is not supported", () => {
      const cooler = createCooler({ socket_support: ["LGA1700"] });
      const build = createEmptyBuild();
      build.cpu = createCPU({ socket: "AM5" });

      const result = checkComponentCompatibility(cooler, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Socket mismatch");
    });

    it("returns incompatible when cooler doesn't fit in case", () => {
      const cooler = createCooler({ height_mm: 170 });
      const build = createEmptyBuild();
      build.case = createCase({ max_cooler_height_mm: 160 });

      const result = checkComponentCompatibility(cooler, build);

      expect(result.status).toBe("incompatible");
      expect(result.message).toContain("Too tall");
    });

    it("returns warning when cooler TDP rating is lower than CPU TDP", () => {
      const cooler = createCooler({ tdp_rating: 150 });
      const build = createEmptyBuild();
      build.cpu = createCPU({ tdp_watts: 170 });

      const result = checkComponentCompatibility(cooler, build);

      expect(result.status).toBe("warning");
      expect(result.message).toContain("May run hot");
    });
  });

  describe("Storage compatibility", () => {
    it("returns compatible for most storage", () => {
      const storage = createStorage();
      const build = createEmptyBuild();

      const result = checkComponentCompatibility(storage, build);

      expect(result.status).toBe("compatible");
    });

    it("returns warning for M.2 when motherboard has no slots info", () => {
      const storage = createStorage({ form_factor: "M.2-2280" });
      const build = createEmptyBuild();
      build.motherboard = createMotherboard({ m2_slots: 0 });

      const result = checkComponentCompatibility(storage, build);

      expect(result.status).toBe("warning");
    });
  });
});

describe("validateBuild", () => {
  it("returns valid with no issues for compatible build", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ socket: "AM5", memory_type: ["DDR5"] });
    build.motherboard = createMotherboard({ socket: "AM5", memory_type: ["DDR5"] });
    build.ram = createRAM({ memory_type: "DDR5" });

    const result = validateBuild(build);

    expect(result.valid).toBe(true);
    expect(result.issues.filter(i => i.type === "error")).toHaveLength(0);
  });

  it("returns invalid with socket mismatch error", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ socket: "AM5" });
    build.motherboard = createMotherboard({ socket: "LGA1700" });

    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === "SOCKET_MISMATCH")).toBe(true);
  });

  it("returns invalid with memory type mismatch error", () => {
    const build = createEmptyBuild();
    build.motherboard = createMotherboard({ memory_type: ["DDR5"] });
    build.ram = createRAM({ memory_type: "DDR4" });

    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === "MEMORY_TYPE_MISMATCH")).toBe(true);
  });

  it("returns invalid with GPU clearance error", () => {
    const build = createEmptyBuild();
    build.gpu = createGPU({ length_mm: 400 });
    build.case = createCase({ max_gpu_length_mm: 350 });

    const result = validateBuild(build);

    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.code === "GPU_TOO_LONG")).toBe(true);
  });

  it("returns warning for insufficient PSU but still valid", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 170 });
    build.gpu = createGPU({ tdp_watts: 350 });
    build.psu = createPSU({ wattage: 550 });

    const result = validateBuild(build);

    expect(result.valid).toBe(true);
    expect(result.issues.some(i => i.code === "PSU_INSUFFICIENT")).toBe(true);
    expect(result.issues.find(i => i.code === "PSU_INSUFFICIENT")?.type).toBe("warning");
  });

  it("tracks missing components", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU();

    const result = validateBuild(build);

    expect(result.complete).toBe(false);
    expect(result.missingComponents).toContain("GPU");
    expect(result.missingComponents).toContain("Motherboard");
    expect(result.missingComponents).not.toContain("CPU");
  });

  it("reports multiple issues", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ socket: "AM5" });
    build.motherboard = createMotherboard({ socket: "LGA1700", memory_type: ["DDR5"] });
    build.ram = createRAM({ memory_type: "DDR4" });

    const result = validateBuild(build);

    expect(result.issues.filter(i => i.type === "error").length).toBeGreaterThanOrEqual(2);
  });
});

describe("calculatePowerRequirements", () => {
  it("includes base power of 100W", () => {
    const build = createEmptyBuild();

    const result = calculatePowerRequirements(build);

    expect(result.totalTdp).toBe(100);
  });

  it("adds CPU TDP", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 105 });

    const result = calculatePowerRequirements(build);

    expect(result.totalTdp).toBe(205);
  });

  it("adds GPU TDP", () => {
    const build = createEmptyBuild();
    build.gpu = createGPU({ tdp_watts: 200 });

    const result = calculatePowerRequirements(build);

    expect(result.totalTdp).toBe(300);
  });

  it("adds transient spike buffer for high TDP GPUs", () => {
    const build = createEmptyBuild();
    build.gpu = createGPU({ tdp_watts: 450 });

    const result = calculatePowerRequirements(build);

    expect(result.totalTdp).toBe(700);
  });

  it("uses max_tdp_watts if available", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 105, max_tdp_watts: 170 });

    const result = calculatePowerRequirements(build);

    expect(result.totalTdp).toBe(270);
  });

  it("calculates recommended PSU with 1.5x multiplier", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 100 });
    build.gpu = createGPU({ tdp_watts: 200 });

    const result = calculatePowerRequirements(build);

    expect(result.recommendedPsu).toBeGreaterThanOrEqual(600);
  });

  it("rounds recommended PSU to nearest 50W", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 65 });

    const result = calculatePowerRequirements(build);

    expect(result.recommendedPsu % 50).toBe(0);
  });

  it("calculates efficiency at load percentage", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ tdp_watts: 105 });
    build.gpu = createGPU({ tdp_watts: 200 });
    build.psu = createPSU({ wattage: 850 });

    const result = calculatePowerRequirements(build);

    expect(result.efficiencyAtLoad).toBeDefined();
    expect(result.efficiencyAtLoad).toContain("%");
  });
});

describe("deriveActiveFilters", () => {
  it("derives socket from CPU", () => {
    const build = createEmptyBuild();
    build.cpu = createCPU({ socket: "AM5" });

    const filters = deriveActiveFilters(build);

    expect(filters.socket).toBe("AM5");
  });

  it("derives socket from motherboard when no CPU", () => {
    const build = createEmptyBuild();
    build.motherboard = createMotherboard({ socket: "LGA1700" });

    const filters = deriveActiveFilters(build);

    expect(filters.socket).toBe("LGA1700");
  });

  it("derives memory type from motherboard with single type", () => {
    const build = createEmptyBuild();
    build.motherboard = createMotherboard({ memory_type: ["DDR5"] });

    const filters = deriveActiveFilters(build);

    expect(filters.memory_type).toBe("DDR5");
  });

  it("derives memory type from RAM when motherboard has multiple types", () => {
    const build = createEmptyBuild();
    build.motherboard = createMotherboard({ memory_type: ["DDR4", "DDR5"] });
    build.ram = createRAM({ memory_type: "DDR5" });

    const filters = deriveActiveFilters(build);

    expect(filters.memory_type).toBe("DDR5");
  });

  it("derives form factor from case", () => {
    const build = createEmptyBuild();
    build.case = createCase({ form_factor_support: ["ATX", "Micro-ATX"] });

    const filters = deriveActiveFilters(build);

    expect(filters.form_factor).toBe("ATX");
  });

  it("returns null when no components set filters", () => {
    const build = createEmptyBuild();

    const filters = deriveActiveFilters(build);

    expect(filters.socket).toBeNull();
    expect(filters.memory_type).toBeNull();
    expect(filters.form_factor).toBeNull();
  });
});
