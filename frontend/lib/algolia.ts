import algoliasearch from "algoliasearch";

/**
 * Algolia client configuration for Spec-Logic
 */

// Environment variables
const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "";
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
const ALGOLIA_INDEX_NAME =
  process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "prod_components";

// Validate configuration
if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) {
  console.warn(
    "Algolia credentials not configured. Search functionality will not work."
  );
}

/**
 * Algolia search client (client-side safe)
 */
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

/**
 * Index name for components
 */
export const COMPONENTS_INDEX = ALGOLIA_INDEX_NAME;

/**
 * Agent Studio agent ID
 */
export const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || "";

/**
 * Default search parameters
 */
export const defaultSearchParams = {
  hitsPerPage: 20,
  attributesToRetrieve: [
    "objectID",
    "component_type",
    "brand",
    "model",
    "socket",
    "form_factor",
    "memory_type",
    "tdp_watts",
    "wattage",
    "vram_gb",
    "length_mm",
    "height_mm",
    "max_gpu_length_mm",
    "max_cooler_height_mm",
    "price_usd",
    "performance_tier",
    "image_url",
    "compatibility_tags",
    "cores",
    "threads",
    "speed_mhz",
    "capacity_gb",
  ],
  attributesToHighlight: ["model", "brand"],
  facets: [
    "component_type",
    "brand",
    "socket",
    "form_factor",
    "memory_type",
    "performance_tier",
    "compatibility_tags",
  ],
};

/**
 * Build filter string from active filters
 */
export function buildFilterString(filters: {
  socket?: string | null;
  memory_type?: string | null;
  form_factor?: string | null;
  component_type?: string | null;
  price_min?: number;
  price_max?: number;
}): string {
  const parts: string[] = [];

  if (filters.socket) {
    parts.push(`socket:"${filters.socket}"`);
  }

  if (filters.memory_type) {
    parts.push(`memory_type:"${filters.memory_type}"`);
  }

  if (filters.form_factor) {
    parts.push(`form_factor:"${filters.form_factor}"`);
  }

  if (filters.component_type) {
    parts.push(`component_type:"${filters.component_type}"`);
  }

  if (filters.price_min !== undefined && filters.price_max !== undefined) {
    parts.push(`price_usd:${filters.price_min} TO ${filters.price_max}`);
  } else if (filters.price_min !== undefined) {
    parts.push(`price_usd >= ${filters.price_min}`);
  } else if (filters.price_max !== undefined) {
    parts.push(`price_usd <= ${filters.price_max}`);
  }

  return parts.join(" AND ");
}

/**
 * Search components with filters
 */
export async function searchComponents(
  query: string,
  options?: {
    filters?: string;
    facetFilters?: string[][];
    hitsPerPage?: number;
    page?: number;
  }
) {
  const index = searchClient.initIndex(COMPONENTS_INDEX);

  const results = await index.search(query, {
    ...defaultSearchParams,
    ...options,
  });

  return results;
}

/**
 * Get component by ID
 */
export async function getComponentById(objectID: string) {
  const index = searchClient.initIndex(COMPONENTS_INDEX);

  try {
    const result = await index.getObject(objectID);
    return result;
  } catch {
    return null;
  }
}

/**
 * Get facet values for filtering
 */
export async function getFacetValues(
  facet: string,
  options?: { maxFacetHits?: number }
) {
  const index = searchClient.initIndex(COMPONENTS_INDEX);

  const results = await index.searchForFacetValues(facet, "", {
    maxFacetHits: options?.maxFacetHits || 100,
  });

  return results.facetHits;
}
