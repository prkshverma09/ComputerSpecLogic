import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/psu/calculate/route";

function createMockRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as NextRequest;
}

describe("POST /api/psu/calculate", () => {
  describe("valid requests", () => {
    it("returns PSU calculation for CPU only", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.breakdown).toBeDefined();
      expect(data.breakdown.cpuPower).toBe(105);
      expect(data.breakdown.basePower).toBe(100);
      expect(data.recommendedWattage).toBeGreaterThan(0);
      expect(data.recommendedTier).toBeDefined();
    });

    it("returns PSU calculation for CPU and GPU", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 125 },
        gpu: { tdp_watts: 300 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.breakdown.cpuPower).toBe(125);
      expect(data.breakdown.gpuPower).toBe(300);
      expect(data.breakdown.transientBuffer).toBe(150);
    });

    it("uses max_tdp_watts when available", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105, max_tdp_watts: 170 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.breakdown.cpuPower).toBe(170);
    });

    it("adds transient buffer for high-power GPUs (300W+)", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 350 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.breakdown.transientBuffer).toBe(150);
    });

    it("adds smaller transient buffer for mid-power GPUs (200W+)", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 250 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.breakdown.transientBuffer).toBe(75);
    });

    it("adds no transient buffer for low-power GPUs", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 150 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.breakdown.transientBuffer).toBe(0);
    });

    it("adds overclock buffer when enabled", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 200 },
        overclocking: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.breakdown.overclockBuffer).toBe(60);
      expect(data.notes.some((n: string) => n.includes("Overclocking"))).toBe(true);
    });

    it("calculates totalDraw correctly", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 100 },
        gpu: { tdp_watts: 300 },
      });

      const response = await POST(request);
      const data = await response.json();

      const expected =
        data.breakdown.basePower +
        data.breakdown.cpuPower +
        data.breakdown.gpuPower +
        data.breakdown.transientBuffer +
        data.breakdown.overclockBuffer;

      expect(data.breakdown.totalDraw).toBe(expected);
    });

    it("returns recommendedTier based on wattage", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 170 },
        gpu: { tdp_watts: 450 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(["550W", "650W", "750W", "850W", "1000W", "1200W+"]).toContain(
        data.recommendedTier
      );
    });

    it("returns efficiencyAtLoad string", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 200 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.efficiencyAtLoad).toContain("%");
    });

    it("returns notes array", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.notes)).toBe(true);
      expect(data.notes.length).toBeGreaterThan(0);
    });

    it("includes high-power GPU note for 300W+ GPUs", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 350 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.notes.some((n: string) => n.includes("High-power GPU"))).toBe(true);
    });

    it("includes high-power build note for 800W+ total", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 170 },
        gpu: { tdp_watts: 450 },
        overclocking: true,
      });

      const response = await POST(request);
      const data = await response.json();

      if (data.breakdown.totalDraw > 800) {
        expect(data.notes.some((n: string) => n.includes("High-power build"))).toBe(
          true
        );
      }
    });
  });

  describe("error handling", () => {
    it("returns 400 for missing CPU", async () => {
      const request = createMockRequest({
        gpu: { tdp_watts: 200 },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("CPU TDP is required");
    });

    it("returns 400 for invalid CPU TDP type", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: "invalid" },
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("returns 400 for null CPU", async () => {
      const request = createMockRequest({
        cpu: null,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("handles missing GPU gracefully", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.breakdown.gpuPower).toBe(0);
    });

    it("handles missing overclocking flag (defaults to false)", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.breakdown.overclockBuffer).toBe(0);
    });
  });

  describe("response format", () => {
    it("returns all required fields", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 200 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("breakdown");
      expect(data).toHaveProperty("recommendedWattage");
      expect(data).toHaveProperty("recommendedTier");
      expect(data).toHaveProperty("efficiencyAtLoad");
      expect(data).toHaveProperty("notes");

      expect(data.breakdown).toHaveProperty("cpuPower");
      expect(data.breakdown).toHaveProperty("gpuPower");
      expect(data.breakdown).toHaveProperty("basePower");
      expect(data.breakdown).toHaveProperty("transientBuffer");
      expect(data.breakdown).toHaveProperty("overclockBuffer");
      expect(data.breakdown).toHaveProperty("totalDraw");
    });

    it("returns numeric values for power calculations", async () => {
      const request = createMockRequest({
        cpu: { tdp_watts: 105 },
        gpu: { tdp_watts: 200 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(typeof data.breakdown.cpuPower).toBe("number");
      expect(typeof data.breakdown.gpuPower).toBe("number");
      expect(typeof data.breakdown.basePower).toBe("number");
      expect(typeof data.breakdown.totalDraw).toBe("number");
      expect(typeof data.recommendedWattage).toBe("number");
    });
  });
});
