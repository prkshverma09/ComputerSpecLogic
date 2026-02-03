import type {
  Build,
  Component,
  ComponentType,
  CompatibilityStatus,
  ValidationIssue,
  ValidationResult,
  PowerAnalysis,
  CPU,
  GPU,
  Motherboard,
  RAM,
  PSU,
  Case,
  Cooler,
  Storage,
} from "@/types/components";

/**
 * Helper to normalize array fields that might be string or array
 * Handles both string and array inputs from different data sources
 */
function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

/**
 * Normalize a string for comparison (lowercase, remove hyphens/spaces variations)
 */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().replace(/[-\s]/g, '');
}

/**
 * Helper to check if a value is in a list (handles both string and array)
 * Also handles variations like "Micro-ATX" vs "Micro ATX"
 * Uses exact match after normalization to avoid "ATX" matching "Micro-ATX"
 */
function isValueInList(list: string | string[] | undefined, value: string): boolean {
  if (!value) return false;
  const normalizedList = normalizeToArray(list);
  if (normalizedList.length === 0) return true; // If no restrictions, allow
  
  const normalizedValue = normalizeForComparison(value);
  
  return normalizedList.some(item => {
    const normalizedItem = normalizeForComparison(item);
    // Exact match after normalization (handles "Micro-ATX" vs "Micro ATX")
    return normalizedItem === normalizedValue;
  });
}

/**
 * Helper to format array values for display
 */
function formatArrayValues(value: string | string[] | undefined): string {
  const items = normalizeToArray(value);
  return items.length > 0 ? items.join("/") : "Unknown";
}

/**
 * Check compatibility of a component with the current build
 */
export function checkComponentCompatibility(
  component: Component,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  const type = component.component_type;

  switch (type) {
    case "CPU":
      return checkCPUCompatibility(component as CPU, build);
    case "GPU":
      return checkGPUCompatibility(component as GPU, build);
    case "Motherboard":
      return checkMotherboardCompatibility(component as Motherboard, build);
    case "RAM":
      return checkRAMCompatibility(component as RAM, build);
    case "PSU":
      return checkPSUCompatibility(component as PSU, build);
    case "Case":
      return checkCaseCompatibility(component as Case, build);
    case "Cooler":
      return checkCoolerCompatibility(component as Cooler, build);
    case "Storage":
      return checkStorageCompatibility(component as Storage, build);
    default:
      return { status: "unknown" };
  }
}

/**
 * Check CPU compatibility
 */
function checkCPUCompatibility(
  cpu: CPU,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check motherboard socket compatibility
  if (build.motherboard) {
    if (cpu.socket !== build.motherboard.socket) {
      return {
        status: "incompatible",
        message: `Socket mismatch: This CPU uses ${cpu.socket}, but your motherboard (${build.motherboard.model}) has ${build.motherboard.socket}`,
      };
    }
  }

  // Check cooler socket support
  if (build.cooler) {
    if (!isValueInList(build.cooler.socket_support, cpu.socket)) {
      return {
        status: "warning",
        message: `Your cooler (${build.cooler.model}) may not support ${cpu.socket} socket`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check GPU compatibility
 */
function checkGPUCompatibility(
  gpu: GPU,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check case GPU clearance
  if (build.case) {
    if (gpu.length_mm > build.case.max_gpu_length_mm) {
      const diff = gpu.length_mm - build.case.max_gpu_length_mm;
      return {
        status: "incompatible",
        message: `Too long: This GPU is ${gpu.length_mm}mm, but your case (${build.case.model}) only fits ${build.case.max_gpu_length_mm}mm (${diff}mm over)`,
      };
    }

    // Warning if close to limit
    const margin = build.case.max_gpu_length_mm - gpu.length_mm;
    if (margin < 20) {
      return {
        status: "warning",
        message: `Tight fit: Only ${margin}mm clearance in your case (${build.case.model})`,
      };
    }
  }

  // Check PSU wattage
  if (build.psu && gpu.recommended_psu_watts) {
    if (build.psu.wattage < gpu.recommended_psu_watts) {
      return {
        status: "warning",
        message: `Your PSU (${build.psu.model}, ${build.psu.wattage}W) may be insufficient. This GPU recommends ${gpu.recommended_psu_watts}W`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check motherboard compatibility
 */
function checkMotherboardCompatibility(
  motherboard: Motherboard,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check CPU socket compatibility
  if (build.cpu) {
    if (motherboard.socket !== build.cpu.socket) {
      return {
        status: "incompatible",
        message: `Socket mismatch: This motherboard has ${motherboard.socket}, but your CPU (${build.cpu.model}) uses ${build.cpu.socket}`,
      };
    }
  }

  // Check RAM compatibility
  if (build.ram) {
    if (!isValueInList(motherboard.memory_type, build.ram.memory_type)) {
      return {
        status: "incompatible",
        message: `Memory mismatch: This motherboard supports ${formatArrayValues(motherboard.memory_type)}, but your RAM (${build.ram.model}) is ${build.ram.memory_type}`,
      };
    }
  }

  // Check case form factor support
  if (build.case) {
    if (!isValueInList(build.case.form_factor_support, motherboard.form_factor)) {
      return {
        status: "incompatible",
        message: `Form factor mismatch: This ${motherboard.form_factor} motherboard won't fit in your case (${build.case.model})`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check RAM compatibility
 */
function checkRAMCompatibility(
  ram: RAM,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check motherboard memory type
  if (build.motherboard) {
    if (!isValueInList(build.motherboard.memory_type, ram.memory_type)) {
      return {
        status: "incompatible",
        message: `Memory mismatch: This ${ram.memory_type} RAM won't work with your motherboard (${build.motherboard.model}) which supports ${formatArrayValues(build.motherboard.memory_type)}`,
      };
    }
  }

  // Check CPU memory support
  if (build.cpu) {
    if (!isValueInList(build.cpu.memory_type, ram.memory_type)) {
      return {
        status: "incompatible",
        message: `Memory mismatch: Your CPU (${build.cpu.model}) doesn't support ${ram.memory_type} memory`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check PSU compatibility
 */
function checkPSUCompatibility(
  psu: PSU,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Calculate power requirements
  const analysis = calculatePowerRequirements(build);
  const requiredWattage = analysis.recommendedPsu;

  if (psu.wattage < requiredWattage) {
    const deficit = requiredWattage - psu.wattage;
    const components = [];
    if (build.cpu) components.push(build.cpu.model);
    if (build.gpu) components.push(build.gpu.model);
    const componentStr = components.length > 0 ? ` for your ${components.join(" + ")}` : "";
    return {
      status: "warning",
      message: `Insufficient wattage: This ${psu.wattage}W PSU is ${deficit}W below the recommended ${requiredWattage}W${componentStr}`,
    };
  }

  return { status: "compatible" };
}

/**
 * Check case compatibility
 */
function checkCaseCompatibility(
  caseComponent: Case,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check GPU clearance
  if (build.gpu) {
    if (build.gpu.length_mm > caseComponent.max_gpu_length_mm) {
      const diff = build.gpu.length_mm - caseComponent.max_gpu_length_mm;
      return {
        status: "incompatible",
        message: `GPU won't fit: Your GPU (${build.gpu.model}) is ${build.gpu.length_mm}mm, but this case only fits ${caseComponent.max_gpu_length_mm}mm (${diff}mm over)`,
      };
    }
  }

  // Check cooler clearance
  if (build.cooler) {
    if (build.cooler.height_mm > caseComponent.max_cooler_height_mm) {
      const diff = build.cooler.height_mm - caseComponent.max_cooler_height_mm;
      return {
        status: "incompatible",
        message: `Cooler won't fit: Your cooler (${build.cooler.model}) is ${build.cooler.height_mm}mm tall, but this case only fits ${caseComponent.max_cooler_height_mm}mm (${diff}mm over)`,
      };
    }
  }

  // Check motherboard form factor
  if (build.motherboard) {
    if (!isValueInList(caseComponent.form_factor_support, build.motherboard.form_factor)) {
      return {
        status: "incompatible",
        message: `Form factor mismatch: Your motherboard (${build.motherboard.model}) is ${build.motherboard.form_factor}, which this case doesn't support`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check cooler compatibility
 */
function checkCoolerCompatibility(
  cooler: Cooler,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check socket support
  if (build.cpu) {
    if (!isValueInList(cooler.socket_support, build.cpu.socket)) {
      return {
        status: "incompatible",
        message: `Socket mismatch: This cooler doesn't support ${build.cpu.socket} socket used by your CPU (${build.cpu.model})`,
      };
    }
  }

  // Check case clearance
  if (build.case) {
    if (cooler.height_mm > build.case.max_cooler_height_mm) {
      const diff = cooler.height_mm - build.case.max_cooler_height_mm;
      return {
        status: "incompatible",
        message: `Too tall: This ${cooler.height_mm}mm cooler won't fit in your case (${build.case.model}) which allows ${build.case.max_cooler_height_mm}mm max (${diff}mm over)`,
      };
    }

    // Warning if close to limit
    const margin = build.case.max_cooler_height_mm - cooler.height_mm;
    if (margin < 10) {
      return {
        status: "warning",
        message: `Tight fit: Only ${margin}mm clearance in your case (${build.case.model})`,
      };
    }
  }

  // Check TDP rating vs CPU TDP
  if (build.cpu && cooler.tdp_rating) {
    const cpuTdp = build.cpu.max_tdp_watts || build.cpu.tdp_watts;
    if (cooler.tdp_rating < cpuTdp) {
      return {
        status: "warning",
        message: `May run hot: This cooler is rated for ${cooler.tdp_rating}W, but your CPU (${build.cpu.model}) draws ${cpuTdp}W`,
      };
    }
  }

  return { status: "compatible" };
}

/**
 * Check storage compatibility
 */
function checkStorageCompatibility(
  storage: Storage,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  // Check if motherboard has M.2 slots for NVMe drives
  if (build.motherboard && storage.form_factor === "M.2-2280") {
    const m2Slots = build.motherboard.m2_slots || 0;
    if (m2Slots === 0) {
      return {
        status: "warning",
        message: `M.2 slot availability unknown: Verify your motherboard (${build.motherboard.model}) has M.2 slots`,
      };
    }
  }

  // Storage is generally compatible with all builds
  return { status: "compatible" };
}

/**
 * Calculate power requirements for the build
 */
export function calculatePowerRequirements(build: Build): PowerAnalysis {
  const BASE_POWER = 100; // Motherboard, storage, fans, etc.

  const cpuPower = build.cpu
    ? build.cpu.max_tdp_watts || build.cpu.tdp_watts
    : 0;
  const gpuPower = build.gpu?.tdp_watts || 0;

  // Add transient spike buffer for high-end GPUs
  const transientBuffer = gpuPower >= 300 ? 150 : 0;

  const totalTdp = BASE_POWER + cpuPower + gpuPower + transientBuffer;

  // 1.5x multiplier for headroom and efficiency sweet spot
  const recommendedPsu = Math.ceil((totalTdp * 1.5) / 50) * 50;

  const currentPsu = build.psu?.wattage || null;
  const headroom = currentPsu ? currentPsu - totalTdp : null;

  let efficiencyAtLoad: string | undefined;
  if (currentPsu) {
    const loadPercentage = (totalTdp / currentPsu) * 100;
    efficiencyAtLoad = `${Math.round(loadPercentage)}%`;
  }

  return {
    totalTdp,
    recommendedPsu,
    currentPsu,
    headroom,
    efficiencyAtLoad,
  };
}

/**
 * Validate entire build
 */
export function validateBuild(build: Build): ValidationResult {
  const issues: ValidationIssue[] = [];
  const missingComponents: ComponentType[] = [];

  // Check for missing components
  const componentTypes: ComponentType[] = [
    "CPU",
    "GPU",
    "Motherboard",
    "RAM",
    "PSU",
    "Case",
    "Cooler",
  ];

  componentTypes.forEach((type) => {
    const key = type.toLowerCase() as keyof Build;
    if (!build[key]) {
      missingComponents.push(type);
    }
  });

  // Hard compatibility checks (errors)

  // CPU ↔ Motherboard socket
  if (build.cpu && build.motherboard) {
    if (build.cpu.socket !== build.motherboard.socket) {
      issues.push({
        type: "error",
        code: "SOCKET_MISMATCH",
        message: `CPU socket (${build.cpu.socket}) does not match motherboard socket (${build.motherboard.socket})`,
        affectedComponents: ["CPU", "Motherboard"],
        suggestion: `Select a motherboard with ${build.cpu.socket} socket`,
      });
    }
  }

  // RAM ↔ Motherboard memory type
  if (build.ram && build.motherboard) {
    if (!isValueInList(build.motherboard.memory_type, build.ram.memory_type)) {
      issues.push({
        type: "error",
        code: "MEMORY_TYPE_MISMATCH",
        message: `RAM type (${build.ram.memory_type}) is not supported by motherboard (${formatArrayValues(build.motherboard.memory_type)})`,
        affectedComponents: ["RAM", "Motherboard"],
        suggestion: `Select ${formatArrayValues(build.motherboard.memory_type)} RAM`,
      });
    }
  }

  // GPU ↔ Case clearance
  if (build.gpu && build.case) {
    if (build.gpu.length_mm > build.case.max_gpu_length_mm) {
      issues.push({
        type: "error",
        code: "GPU_TOO_LONG",
        message: `GPU (${build.gpu.length_mm}mm) exceeds case clearance (${build.case.max_gpu_length_mm}mm)`,
        affectedComponents: ["GPU", "Case"],
        suggestion: "Select a shorter GPU or a larger case",
      });
    }
  }

  // Cooler ↔ Case clearance
  if (build.cooler && build.case) {
    if (build.cooler.height_mm > build.case.max_cooler_height_mm) {
      issues.push({
        type: "error",
        code: "COOLER_TOO_TALL",
        message: `Cooler (${build.cooler.height_mm}mm) exceeds case clearance (${build.case.max_cooler_height_mm}mm)`,
        affectedComponents: ["Cooler", "Case"],
        suggestion: "Select a lower profile cooler or a larger case",
      });
    }
  }

  // Cooler socket support
  if (build.cooler && build.cpu) {
    if (!isValueInList(build.cooler.socket_support, build.cpu.socket)) {
      issues.push({
        type: "error",
        code: "COOLER_SOCKET_MISMATCH",
        message: `Cooler does not support ${build.cpu.socket} socket`,
        affectedComponents: ["Cooler", "CPU"],
        suggestion: `Select a cooler that supports ${build.cpu.socket}`,
      });
    }
  }

  // Motherboard ↔ Case form factor
  if (build.motherboard && build.case) {
    if (!isValueInList(build.case.form_factor_support, build.motherboard.form_factor)) {
      issues.push({
        type: "error",
        code: "FORM_FACTOR_MISMATCH",
        message: `Case does not support ${build.motherboard.form_factor} motherboards`,
        affectedComponents: ["Motherboard", "Case"],
      });
    }
  }

  // Soft checks (warnings)

  // PSU wattage
  const powerAnalysis = calculatePowerRequirements(build);
  if (build.psu && powerAnalysis.recommendedPsu > build.psu.wattage) {
    issues.push({
      type: "warning",
      code: "PSU_INSUFFICIENT",
      message: `PSU wattage (${build.psu.wattage}W) is below recommended (${powerAnalysis.recommendedPsu}W)`,
      affectedComponents: ["PSU"],
      suggestion: `Consider a ${powerAnalysis.recommendedPsu}W or higher PSU`,
    });
  }

  // Determine overall validity
  const hasErrors = issues.some((issue) => issue.type === "error");
  const isComplete = missingComponents.length === 0;

  return {
    valid: !hasErrors,
    complete: isComplete,
    issues,
    powerAnalysis,
    missingComponents,
  };
}

/**
 * Derive active filters from current build
 */
export function deriveActiveFilters(build: Build): {
  socket: string | null;
  memory_type: string | null;
  form_factor: string | null;
} {
  let socket: string | null = null;
  let memory_type: string | null = null;
  let form_factor: string | null = null;

  // Lock socket from CPU or Motherboard
  if (build.cpu) {
    socket = build.cpu.socket;
  } else if (build.motherboard) {
    socket = build.motherboard.socket;
  }

  // Lock memory type from Motherboard or RAM
  const memTypes = normalizeToArray(build.motherboard?.memory_type);
  if (memTypes.length === 1) {
    memory_type = memTypes[0];
  } else if (build.ram) {
    memory_type = build.ram.memory_type;
  }

  // Derive form factor from Case
  if (build.case) {
    const ffSupport = normalizeToArray(build.case.form_factor_support);
    // If case supports ATX, that's likely the target
    if (ffSupport.some(ff => ff.toUpperCase() === "ATX")) {
      form_factor = "ATX";
    } else if (ffSupport.some(ff => ff.toUpperCase() === "MICRO-ATX")) {
      form_factor = "Micro-ATX";
    } else if (ffSupport.some(ff => ff.toUpperCase() === "MINI-ITX")) {
      form_factor = "Mini-ITX";
    }
  }

  return { socket, memory_type, form_factor };
}
