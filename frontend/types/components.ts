/**
 * Type definitions for PC components in Spec-Logic
 */

export type ComponentType =
  | "CPU"
  | "GPU"
  | "Motherboard"
  | "RAM"
  | "PSU"
  | "Case"
  | "Cooler";

export type CompatibilityStatus =
  | "compatible"
  | "warning"
  | "incompatible"
  | "unknown";

export type PerformanceTier =
  | "budget"
  | "mid-range"
  | "high-end"
  | "enthusiast";

/**
 * Base component interface shared by all component types
 */
export interface BaseComponent {
  objectID: string;
  component_type: ComponentType;
  brand: string;
  model: string;
  price_usd: number;
  performance_tier: PerformanceTier;
  image_url?: string;
  compatibility_tags: string[];
}

/**
 * CPU component
 */
export interface CPU extends BaseComponent {
  component_type: "CPU";
  socket: string;
  tdp_watts: number;
  max_tdp_watts?: number;
  cores: number;
  threads: number;
  base_clock_ghz?: number;
  boost_clock_ghz?: number;
  memory_type: string[];
  pcie_version?: string;
  integrated_graphics: boolean;
  release_date?: string;
}

/**
 * GPU component
 */
export interface GPU extends BaseComponent {
  component_type: "GPU";
  length_mm: number;
  tdp_watts: number;
  vram_gb: number;
  memory_type?: string;
  memory_bandwidth_gbps?: number;
  pcie_version?: string;
  power_connectors?: string;
  recommended_psu_watts?: number;
  release_date?: string;
}

/**
 * Motherboard component
 */
export interface Motherboard extends BaseComponent {
  component_type: "Motherboard";
  socket: string;
  chipset?: string;
  form_factor: string;
  memory_type: string[];
  memory_slots: number;
  max_memory_gb: number;
  m2_slots?: number;
  wifi?: boolean;
}

/**
 * RAM component
 */
export interface RAM extends BaseComponent {
  component_type: "RAM";
  memory_type: string;
  speed_mhz: number;
  capacity_gb: number;
  modules: number;
  cas_latency?: number;
  voltage?: number;
  rgb?: boolean;
}

/**
 * PSU component
 */
export interface PSU extends BaseComponent {
  component_type: "PSU";
  wattage: number;
  efficiency_rating?: string;
  modular?: string;
  form_factor?: string;
}

/**
 * Case component
 */
export interface Case extends BaseComponent {
  component_type: "Case";
  form_factor_support: string[];
  max_gpu_length_mm: number;
  max_cooler_height_mm: number;
  max_psu_length_mm?: number;
  drive_bays_35?: number;
  drive_bays_25?: number;
  radiator_support?: string[];
}

/**
 * Cooler component
 */
export interface Cooler extends BaseComponent {
  component_type: "Cooler";
  cooler_type: string;
  socket_support: string[];
  height_mm: number;
  radiator_size_mm?: number;
  tdp_rating?: number;
  rgb?: boolean;
}

/**
 * Union type for all components
 */
export type Component = CPU | GPU | Motherboard | RAM | PSU | Case | Cooler;

/**
 * Build state containing selected components
 */
export interface Build {
  cpu: CPU | null;
  motherboard: Motherboard | null;
  gpu: GPU | null;
  ram: RAM | null;
  psu: PSU | null;
  case: Case | null;
  cooler: Cooler | null;
}

/**
 * Validation issue from compatibility check
 */
export interface ValidationIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  affectedComponents: ComponentType[];
  suggestion?: string;
}

/**
 * Power analysis result
 */
export interface PowerAnalysis {
  totalTdp: number;
  recommendedPsu: number;
  currentPsu: number | null;
  headroom: number | null;
  efficiencyAtLoad?: string;
}

/**
 * Build validation result
 */
export interface ValidationResult {
  valid: boolean;
  complete: boolean;
  issues: ValidationIssue[];
  powerAnalysis: PowerAnalysis;
  missingComponents: ComponentType[];
}

/**
 * Active filters derived from build state
 */
export interface ActiveFilters {
  socket: string | null;
  memory_type: string | null;
  form_factor: string | null;
}

/**
 * PSU calculation request
 */
export interface PSUCalculateRequest {
  cpu?: { tdp_watts: number; max_tdp_watts?: number };
  gpu?: { tdp_watts: number };
  overclocking?: boolean;
}

/**
 * PSU calculation response
 */
export interface PSUCalculateResponse {
  breakdown: {
    cpuPower: number;
    gpuPower: number;
    basePower: number;
    transientBuffer: number;
    overclockBuffer: number;
    totalDraw: number;
  };
  recommendedWattage: number;
  recommendedTier: string;
  efficiencyAtLoad: string;
  notes: string[];
}

/**
 * Export format options
 */
export type ExportFormat = "pcpartpicker" | "reddit" | "json" | "link";

/**
 * Export request
 */
export interface ExportRequest {
  build: Build;
  format: ExportFormat;
}

/**
 * Export response
 */
export interface ExportResponse {
  formatted: string;
  totalPrice: number;
  componentCount: number;
  shareUrl?: string;
}

/**
 * Component with compatibility status for display
 */
export interface ComponentWithStatus {
  component: Component;
  status: CompatibilityStatus;
  warningMessage?: string;
}

/**
 * Algolia hit with highlight info
 */
export interface AlgoliaHit extends Component {
  _highlightResult?: Record<string, { value: string; matchLevel: string }>;
}
