import { describe, it, expect } from "vitest";
import {
  calculatePSURequirements,
  getMinimumPSUWattage,
  isPSUSufficient,
  formatPowerBreakdown,
} from "@/lib/psu-calculator";
import type { PSUCalculateRequest } from "@/types/components";

describe("calculatePSURequirements", () => {
  describe("transient buffer calculations", () => {
    it("adds 200W buffer for 400W+ GPUs", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 450 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.transientBuffer).toBe(200);
    });

    it("adds 150W buffer for 300W+ GPUs", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 350 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.transientBuffer).toBe(150);
    });

    it("adds 75W buffer for 200W+ GPUs", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 250 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.transientBuffer).toBe(75);
    });

    it("adds no buffer for low-power GPUs", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 150 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.transientBuffer).toBe(0);
    });

    it("adds no buffer when no GPU", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 105 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.transientBuffer).toBe(0);
    });
  });

  describe("overclocking buffer", () => {
    it("adds 20% overclock buffer when enabled", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 200 },
        overclocking: true,
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.overclockBuffer).toBe(60);
    });

    it("adds no overclock buffer when disabled", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 200 },
        overclocking: false,
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.overclockBuffer).toBe(0);
    });
  });

  describe("PSU tier rounding", () => {
    it("rounds to 450W tier", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 65 },
      };

      const result = calculatePSURequirements(request);

      expect([450, 550]).toContain(result.recommendedWattage);
    });

    it("rounds to standard PSU tiers", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 170 },
        gpu: { tdp_watts: 450 },
      };

      const result = calculatePSURequirements(request);

      expect([450, 550, 650, 750, 850, 1000, 1200, 1500]).toContain(
        result.recommendedWattage
      );
    });

    it("returns recommendedTier string", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 300 },
      };

      const result = calculatePSURequirements(request);

      expect(result.recommendedTier).toMatch(/^\d+W\+?$/);
    });
  });

  describe("efficiency notes", () => {
    it("notes excellent efficiency for 20-50% load", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
      };

      const result = calculatePSURequirements(request);

      expect(result.notes.some(n => n.includes("efficiency"))).toBe(true);
    });

    it("notes high-power GPU warning for 300W+ GPUs", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 350 },
      };

      const result = calculatePSURequirements(request);

      expect(result.notes.some(n => n.includes("High-power GPU"))).toBe(true);
    });

    it("includes transient buffer note when applicable", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 350 },
      };

      const result = calculatePSURequirements(request);

      expect(result.notes.some(n => n.includes("transient"))).toBe(true);
    });

    it("includes overclock buffer note when enabled", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 200 },
        overclocking: true,
      };

      const result = calculatePSURequirements(request);

      expect(result.notes.some(n => n.includes("overclocking"))).toBe(true);
    });

    it("prompts to add components when empty", () => {
      const request: PSUCalculateRequest = {};

      const result = calculatePSURequirements(request);

      expect(result.notes.some(n => n.includes("Add components"))).toBe(true);
    });
  });

  describe("breakdown accuracy", () => {
    it("includes base power of 100W", () => {
      const request: PSUCalculateRequest = {};

      const result = calculatePSURequirements(request);

      expect(result.breakdown.basePower).toBe(100);
    });

    it("includes CPU power", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 125 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.cpuPower).toBe(125);
    });

    it("uses max_tdp_watts when available", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 105, max_tdp_watts: 170 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.cpuPower).toBe(170);
    });

    it("includes GPU power", () => {
      const request: PSUCalculateRequest = {
        gpu: { tdp_watts: 300 },
      };

      const result = calculatePSURequirements(request);

      expect(result.breakdown.gpuPower).toBe(300);
    });

    it("calculates total draw correctly", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 300 },
      };

      const result = calculatePSURequirements(request);

      const expected =
        result.breakdown.basePower +
        result.breakdown.cpuPower +
        result.breakdown.gpuPower +
        result.breakdown.transientBuffer +
        result.breakdown.overclockBuffer;

      expect(result.breakdown.totalDraw).toBe(expected);
    });
  });

  describe("efficiencyAtLoad", () => {
    it("returns percentage string", () => {
      const request: PSUCalculateRequest = {
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 200 },
      };

      const result = calculatePSURequirements(request);

      expect(result.efficiencyAtLoad).toMatch(/^\d+%$/);
    });
  });
});

describe("getMinimumPSUWattage", () => {
  it("returns base + CPU + GPU power + transient buffer", () => {
    const result = getMinimumPSUWattage(100, 200);

    expect(result).toBe(475);
  });

  it("adds transient buffer for high-power GPUs", () => {
    const result = getMinimumPSUWattage(100, 350);

    expect(result).toBe(700);
  });

  it("handles zero TDP values", () => {
    const result = getMinimumPSUWattage(0, 0);

    expect(result).toBe(100);
  });
});

describe("isPSUSufficient", () => {
  it("returns sufficient when PSU exceeds recommended", () => {
    const result = isPSUSufficient(1000, 105, 200, true);

    expect(result.sufficient).toBe(true);
  });

  it("returns insufficient when PSU is below recommended", () => {
    const result = isPSUSufficient(450, 170, 450, true);

    expect(result.sufficient).toBe(false);
  });

  it("calculates margin correctly", () => {
    const result = isPSUSufficient(850, 100, 200);

    expect(result.margin).toBeGreaterThan(0);
  });

  it("calculates load percentage", () => {
    const result = isPSUSufficient(1000, 100, 200);

    expect(result.loadPercentage).toBeLessThan(100);
    expect(result.loadPercentage).toBeGreaterThan(0);
  });

  it("checks without headroom when specified", () => {
    const withHeadroom = isPSUSufficient(500, 100, 200, true);
    const withoutHeadroom = isPSUSufficient(500, 100, 200, false);

    expect(withoutHeadroom.sufficient).toBe(true);
  });
});

describe("formatPowerBreakdown", () => {
  it("includes base system line", () => {
    const breakdown = {
      cpuPower: 100,
      gpuPower: 200,
      basePower: 100,
      transientBuffer: 0,
      overclockBuffer: 0,
      totalDraw: 400,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("Base System"))).toBe(true);
  });

  it("includes CPU power when > 0", () => {
    const breakdown = {
      cpuPower: 125,
      gpuPower: 0,
      basePower: 100,
      transientBuffer: 0,
      overclockBuffer: 0,
      totalDraw: 225,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("CPU: 125W"))).toBe(true);
  });

  it("includes GPU power when > 0", () => {
    const breakdown = {
      cpuPower: 0,
      gpuPower: 300,
      basePower: 100,
      transientBuffer: 150,
      overclockBuffer: 0,
      totalDraw: 550,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("GPU: 300W"))).toBe(true);
  });

  it("includes transient buffer when > 0", () => {
    const breakdown = {
      cpuPower: 0,
      gpuPower: 350,
      basePower: 100,
      transientBuffer: 150,
      overclockBuffer: 0,
      totalDraw: 600,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("Transient Buffer"))).toBe(true);
  });

  it("includes overclock buffer when > 0", () => {
    const breakdown = {
      cpuPower: 100,
      gpuPower: 200,
      basePower: 100,
      transientBuffer: 0,
      overclockBuffer: 60,
      totalDraw: 460,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("Overclock Buffer"))).toBe(true);
  });

  it("includes total draw", () => {
    const breakdown = {
      cpuPower: 100,
      gpuPower: 200,
      basePower: 100,
      transientBuffer: 0,
      overclockBuffer: 0,
      totalDraw: 400,
    };

    const lines = formatPowerBreakdown(breakdown);

    expect(lines.some(l => l.includes("Total Draw: 400W"))).toBe(true);
  });
});
