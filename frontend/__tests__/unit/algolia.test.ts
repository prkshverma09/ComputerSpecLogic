import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildFilterString } from "@/lib/algolia";

describe("buildFilterString", () => {
  describe("single filters", () => {
    it("builds filter for socket", () => {
      const result = buildFilterString({ socket: "AM5" });
      expect(result).toBe('socket:"AM5"');
    });

    it("builds filter for memory_type", () => {
      const result = buildFilterString({ memory_type: "DDR5" });
      expect(result).toBe('memory_type:"DDR5"');
    });

    it("builds filter for form_factor", () => {
      const result = buildFilterString({ form_factor: "ATX" });
      expect(result).toBe('form_factor:"ATX"');
    });

    it("builds filter for component_type", () => {
      const result = buildFilterString({ component_type: "CPU" });
      expect(result).toBe('component_type:"CPU"');
    });
  });

  describe("price range filters", () => {
    it("builds filter for price range (min and max)", () => {
      const result = buildFilterString({ price_min: 100, price_max: 500 });
      expect(result).toBe("price_usd:100 TO 500");
    });

    it("builds filter for price minimum only", () => {
      const result = buildFilterString({ price_min: 100 });
      expect(result).toBe("price_usd >= 100");
    });

    it("builds filter for price maximum only", () => {
      const result = buildFilterString({ price_max: 500 });
      expect(result).toBe("price_usd <= 500");
    });
  });

  describe("multiple filters", () => {
    it("combines multiple filters with AND", () => {
      const result = buildFilterString({
        socket: "AM5",
        memory_type: "DDR5",
      });
      expect(result).toBe('socket:"AM5" AND memory_type:"DDR5"');
    });

    it("combines socket, memory_type, and form_factor", () => {
      const result = buildFilterString({
        socket: "LGA1700",
        memory_type: "DDR4",
        form_factor: "ATX",
      });
      expect(result).toBe(
        'socket:"LGA1700" AND memory_type:"DDR4" AND form_factor:"ATX"'
      );
    });

    it("combines component_type with other filters", () => {
      const result = buildFilterString({
        component_type: "CPU",
        socket: "AM5",
      });
      expect(result).toBe('socket:"AM5" AND component_type:"CPU"');
    });

    it("combines all filter types", () => {
      const result = buildFilterString({
        socket: "AM5",
        memory_type: "DDR5",
        form_factor: "ATX",
        component_type: "Motherboard",
        price_min: 200,
        price_max: 400,
      });
      expect(result).toContain('socket:"AM5"');
      expect(result).toContain('memory_type:"DDR5"');
      expect(result).toContain('form_factor:"ATX"');
      expect(result).toContain('component_type:"Motherboard"');
      expect(result).toContain("price_usd:200 TO 400");
    });
  });

  describe("empty/null filters", () => {
    it("returns empty string for empty filters", () => {
      const result = buildFilterString({});
      expect(result).toBe("");
    });

    it("ignores null socket", () => {
      const result = buildFilterString({ socket: null });
      expect(result).toBe("");
    });

    it("ignores null memory_type", () => {
      const result = buildFilterString({ memory_type: null });
      expect(result).toBe("");
    });

    it("ignores undefined values", () => {
      const result = buildFilterString({
        socket: "AM5",
        memory_type: undefined,
      });
      expect(result).toBe('socket:"AM5"');
    });
  });

  describe("special characters handling", () => {
    it("handles socket with numbers", () => {
      const result = buildFilterString({ socket: "LGA1700" });
      expect(result).toBe('socket:"LGA1700"');
    });

    it("handles form_factor with hyphen", () => {
      const result = buildFilterString({ form_factor: "Micro-ATX" });
      expect(result).toBe('form_factor:"Micro-ATX"');
    });

    it("handles memory_type with number", () => {
      const result = buildFilterString({ memory_type: "DDR5" });
      expect(result).toBe('memory_type:"DDR5"');
    });
  });
});

describe("defaultSearchParams", () => {
  it("should be exported and contain expected attributes", async () => {
    const { defaultSearchParams } = await import("@/lib/algolia");

    expect(defaultSearchParams).toBeDefined();
    expect(defaultSearchParams.hitsPerPage).toBe(20);
    expect(defaultSearchParams.attributesToRetrieve).toContain("objectID");
    expect(defaultSearchParams.attributesToRetrieve).toContain("component_type");
    expect(defaultSearchParams.attributesToRetrieve).toContain("brand");
    expect(defaultSearchParams.attributesToRetrieve).toContain("model");
    expect(defaultSearchParams.attributesToRetrieve).toContain("price_usd");
    expect(defaultSearchParams.facets).toContain("component_type");
    expect(defaultSearchParams.facets).toContain("brand");
    expect(defaultSearchParams.facets).toContain("socket");
  });
});

describe("COMPONENTS_INDEX", () => {
  it("should be exported and have a value", async () => {
    const { COMPONENTS_INDEX } = await import("@/lib/algolia");

    expect(COMPONENTS_INDEX).toBeDefined();
    expect(typeof COMPONENTS_INDEX).toBe("string");
  });
});
