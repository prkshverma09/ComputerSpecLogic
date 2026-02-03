import { describe, it, expect, beforeEach, vi } from "vitest";
import { act } from "@testing-library/react";
import type { CPU, GPU, Motherboard, RAM, PSU, Case, Cooler, Build } from "@/types/components";

vi.mock("@/lib/compatibility", () => ({
  validateBuild: vi.fn().mockReturnValue({
    valid: true,
    complete: false,
    issues: [],
    powerAnalysis: { totalTdp: 100, recommendedPsu: 450 },
    missingComponents: [],
  }),
  calculatePowerRequirements: vi.fn().mockReturnValue({
    totalTdp: 100,
    recommendedPsu: 450,
    currentPsu: null,
    headroom: null,
  }),
  deriveActiveFilters: vi.fn().mockReturnValue({
    socket: null,
    memory_type: null,
    form_factor: null,
  }),
}));

import { useBuildStore } from "@/stores/build-store";

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
  price_usd: 599,
  performance_tier: "high-end",
  compatibility_tags: ["mid-tdp"],
  ...overrides,
});

const createMotherboard = (overrides: Partial<Motherboard> = {}): Motherboard => ({
  objectID: "mb-test",
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
  ...overrides,
});

describe("useBuildStore", () => {
  beforeEach(() => {
    const { clearBuild } = useBuildStore.getState();
    clearBuild();
  });

  describe("addComponent", () => {
    it("adds CPU to build", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      const { build } = useBuildStore.getState();
      expect(build.cpu).toEqual(cpu);
    });

    it("adds GPU to build", () => {
      const gpu = createGPU();

      act(() => {
        useBuildStore.getState().addComponent(gpu);
      });

      const { build } = useBuildStore.getState();
      expect(build.gpu).toEqual(gpu);
    });

    it("replaces existing component of same type", () => {
      const cpu1 = createCPU({ objectID: "cpu-1", model: "Ryzen 5" });
      const cpu2 = createCPU({ objectID: "cpu-2", model: "Ryzen 7" });

      act(() => {
        useBuildStore.getState().addComponent(cpu1);
      });

      act(() => {
        useBuildStore.getState().addComponent(cpu2);
      });

      const { build } = useBuildStore.getState();
      expect(build.cpu?.objectID).toBe("cpu-2");
      expect(build.cpu?.model).toBe("Ryzen 7");
    });

    it("updates total price", () => {
      const cpu = createCPU({ price_usd: 299 });
      const gpu = createGPU({ price_usd: 599 });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
      });

      const { totalPrice } = useBuildStore.getState();
      expect(totalPrice).toBe(898);
    });

    it("updates component count", () => {
      const cpu = createCPU();
      const gpu = createGPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
      });

      const { componentCount } = useBuildStore.getState();
      expect(componentCount).toBe(2);
    });
  });

  describe("removeComponent", () => {
    it("removes CPU from build", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      act(() => {
        useBuildStore.getState().removeComponent("CPU");
      });

      const { build } = useBuildStore.getState();
      expect(build.cpu).toBeNull();
    });

    it("updates total price after removal", () => {
      const cpu = createCPU({ price_usd: 299 });
      const gpu = createGPU({ price_usd: 599 });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
      });

      act(() => {
        useBuildStore.getState().removeComponent("CPU");
      });

      const { totalPrice } = useBuildStore.getState();
      expect(totalPrice).toBe(599);
    });

    it("updates component count after removal", () => {
      const cpu = createCPU();
      const gpu = createGPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
      });

      act(() => {
        useBuildStore.getState().removeComponent("CPU");
      });

      const { componentCount } = useBuildStore.getState();
      expect(componentCount).toBe(1);
    });
  });

  describe("clearBuild", () => {
    it("resets all components to null", () => {
      const cpu = createCPU();
      const gpu = createGPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
      });

      act(() => {
        useBuildStore.getState().clearBuild();
      });

      const { build } = useBuildStore.getState();
      expect(build.cpu).toBeNull();
      expect(build.gpu).toBeNull();
      expect(build.motherboard).toBeNull();
      expect(build.ram).toBeNull();
      expect(build.psu).toBeNull();
      expect(build.case).toBeNull();
      expect(build.cooler).toBeNull();
      expect(build.storage).toBeNull();
    });

    it("resets total price to 0", () => {
      const cpu = createCPU({ price_usd: 299 });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      act(() => {
        useBuildStore.getState().clearBuild();
      });

      const { totalPrice } = useBuildStore.getState();
      expect(totalPrice).toBe(0);
    });

    it("resets component count to 0", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      act(() => {
        useBuildStore.getState().clearBuild();
      });

      const { componentCount } = useBuildStore.getState();
      expect(componentCount).toBe(0);
    });

    it("resets active filters", () => {
      act(() => {
        useBuildStore.getState().clearBuild();
      });

      const { activeFilters } = useBuildStore.getState();
      expect(activeFilters.socket).toBeNull();
      expect(activeFilters.memory_type).toBeNull();
      expect(activeFilters.form_factor).toBeNull();
    });
  });

  describe("replaceComponent", () => {
    it("replaces existing component (alias for addComponent)", () => {
      const cpu1 = createCPU({ objectID: "cpu-1", model: "Ryzen 5" });
      const cpu2 = createCPU({ objectID: "cpu-2", model: "Ryzen 7" });

      act(() => {
        useBuildStore.getState().addComponent(cpu1);
      });

      act(() => {
        useBuildStore.getState().replaceComponent(cpu2);
      });

      const { build } = useBuildStore.getState();
      expect(build.cpu?.objectID).toBe("cpu-2");
    });
  });

  describe("getComponent", () => {
    it("returns component by type", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      const result = useBuildStore.getState().getComponent("CPU");
      expect(result).toEqual(cpu);
    });

    it("returns null for missing component", () => {
      const result = useBuildStore.getState().getComponent("GPU");
      expect(result).toBeNull();
    });
  });

  describe("isComponentSelected", () => {
    it("returns true when component is in build", () => {
      const cpu = createCPU({ objectID: "cpu-123" });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      const result = useBuildStore.getState().isComponentSelected("cpu-123");
      expect(result).toBe(true);
    });

    it("returns false when component is not in build", () => {
      const result = useBuildStore.getState().isComponentSelected("cpu-456");
      expect(result).toBe(false);
    });

    it("returns false after component is removed", () => {
      const cpu = createCPU({ objectID: "cpu-123" });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      act(() => {
        useBuildStore.getState().removeComponent("CPU");
      });

      const result = useBuildStore.getState().isComponentSelected("cpu-123");
      expect(result).toBe(false);
    });
  });

  describe("validateCurrentBuild", () => {
    it("returns validation result", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      const result = useBuildStore.getState().validateCurrentBuild();
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("issues");
    });

    it("updates validationResult in state", () => {
      const cpu = createCPU();

      act(() => {
        useBuildStore.getState().addComponent(cpu);
      });

      act(() => {
        useBuildStore.getState().validateCurrentBuild();
      });

      const { validationResult } = useBuildStore.getState();
      expect(validationResult).not.toBeNull();
    });
  });

  describe("derived state calculations", () => {
    it("calculates totalPrice from all components", () => {
      const cpu = createCPU({ price_usd: 299 });
      const gpu = createGPU({ price_usd: 599 });
      const motherboard = createMotherboard({ price_usd: 349 });

      act(() => {
        useBuildStore.getState().addComponent(cpu);
        useBuildStore.getState().addComponent(gpu);
        useBuildStore.getState().addComponent(motherboard);
      });

      const { totalPrice } = useBuildStore.getState();
      expect(totalPrice).toBe(1247);
    });
  });
});
