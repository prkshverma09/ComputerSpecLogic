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
 * Helper to check if a value is in a list (handles both string and array)
 */
function isValueInList(list: string | string[] | undefined, value: string): boolean {
  if (!value) return false;
  const normalizedList = normalizeToArray(list);
  if (normalizedList.length === 0) return true; // If no restrictions, allow
  return normalizedList.some(item => 
    item.toLowerCase() === value.toLowerCase() ||
    item.toLowerCase().includes(value.toLowerCase()) ||
    value.toLowerCase().includes(item.toLowerCase())
  );
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
        message: `Socket mismatch: CPU uses ${cpu.socket}, motherboard has ${build.motherboard.socket}`,
      };
    }
  }

  // Check cooler socket support
  if (build.cooler) {
    if (!isValueInList(build.cooler.socket_support, cpu.socket)) {
      return {
        status: "warning",
        message: `Cooler may not support ${cpu.socket} socket. Please verify compatibility.`,
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
        message: `GPU is ${diff}mm too long for case (${gpu.length_mm}mm vs ${build.case.max_gpu_length_mm}mm max)`,
      };
    }

    // Warning if close to limit
    const margin = build.case.max_gpu_length_mm - gpu.length_mm;
    if (margin < 20) {
      return {
        status: "warning",
        message: `Tight fit: only ${margin}mm clearance for GPU`,
      };
    }
  }

  // Check PSU wattage
  if (build.psu && gpu.recommended_psu_watts) {
    if (build.psu.wattage < gpu.recommended_psu_watts) {
      return {
        status: "warning",
        message: `PSU may be insufficient. GPU recommends ${gpu.recommended_psu_watts}W, you have ${build.psu.wattage}W`,
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
        message: `Socket mismatch: Motherboard has ${motherboard.socket}, CPU uses ${build.cpu.socket}`,
      };
    }
  }

  // Check RAM compatibility
  if (build.ram) {
    if (!isValueInList(motherboard.memory_type, build.ram.memory_type)) {
      return {
        status: "incompatible",
        message: `Memory mismatch: Motherboard supports ${formatArrayValues(motherboard.memory_type)}, RAM is ${build.ram.memory_type}`,
      };
    }
  }

  // Check case form factor support
  if (build.case) {
    if (!isValueInList(build.case.form_factor_support, motherboard.form_factor)) {
      return {
        status: "incompatible",
        message: `Case does not support ${motherboard.form_factor} motherboards`,
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
        message: `Memory type mismatch: Motherboard supports ${formatArrayValues(build.motherboard.memory_type)}, RAM is ${ram.memory_type}`,
      };
    }
  }

  // Check CPU memory support
  if (build.cpu) {
    if (!isValueInList(build.cpu.memory_type, ram.memory_type)) {
      return {
        status: "incompatible",
        message: `CPU does not support ${ram.memory_type} memory`,
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
    return {
      status: "warning",
      message: `PSU may be insufficient. Recommended: ${requiredWattage}W, Selected: ${psu.wattage}W (${deficit}W short)`,
    };
  }

  // Check case PSU length (if available)
  // This would require PSU length data which isn't always available

  return { status: "compatible" };
}

/**
 * Check case compatibility
 */
function checkCaseCompatibility(
  caseComponent: Case,
  build: Build
): { status: CompatibilityStatus; message?: string } {
  const issues: string[] = [];

  // Check GPU clearance
  if (build.gpu) {
    if (build.gpu.length_mm > caseComponent.max_gpu_length_mm) {
      return {
        status: "incompatible",
        message: `Case cannot fit GPU (${build.gpu.length_mm}mm vs ${caseComponent.max_gpu_length_mm}mm max)`,
      };
    }
  }

  // Check cooler clearance
  if (build.cooler) {
    if (build.cooler.height_mm > caseComponent.max_cooler_height_mm) {
      return {
        status: "incompatible",
        message: `Case cannot fit cooler (${build.cooler.height_mm}mm vs ${caseComponent.max_cooler_height_mm}mm max)`,
      };
    }
  }

  // Check motherboard form factor
  if (build.motherboard) {
    if (!isValueInList(caseComponent.form_factor_support, build.motherboard.form_factor)) {
      return {
        status: "incompatible",
        message: `Case does not support ${build.motherboard.form_factor} motherboards`,
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
        message: `Cooler does not support ${build.cpu.socket} socket`,
      };
    }
  }

  // Check case clearance
  if (build.case) {
    if (cooler.height_mm > build.case.max_cooler_height_mm) {
      const diff = cooler.height_mm - build.case.max_cooler_height_mm;
      return {
        status: "incompatible",
        message: `Cooler is ${diff}mm too tall for case (${cooler.height_mm}mm vs ${build.case.max_cooler_height_mm}mm max)`,
      };
    }

    // Warning if close to limit
    const margin = build.case.max_cooler_height_mm - cooler.height_mm;
    if (margin < 10) {
      return {
        status: "warning",
        message: `Tight fit: only ${margin}mm clearance for cooler`,
      };
    }
  }

  // Check TDP rating vs CPU TDP
  if (build.cpu && cooler.tdp_rating) {
    const cpuTdp = build.cpu.max_tdp_watts || build.cpu.tdp_watts;
    if (cooler.tdp_rating < cpuTdp) {
      return {
        status: "warning",
        message: `Cooler TDP rating (${cooler.tdp_rating}W) is lower than CPU TDP (${cpuTdp}W)`,
      };
    }
  }

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
