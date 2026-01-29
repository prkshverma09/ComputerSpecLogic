import type { PSUCalculateRequest, PSUCalculateResponse } from "@/types/components";

/**
 * PSU Calculator for Spec-Logic
 *
 * Calculates recommended PSU wattage based on component TDP values,
 * with appropriate buffers for transient spikes and overclocking.
 */

/**
 * Base system power consumption (motherboard, storage, fans, etc.)
 */
const BASE_POWER = 100;

/**
 * PSU wattage tiers
 */
const PSU_TIERS = [450, 550, 650, 750, 850, 1000, 1200, 1500];

/**
 * Get the recommended PSU tier based on wattage
 */
function getPSUTier(wattage: number): string {
  for (const tier of PSU_TIERS) {
    if (wattage <= tier) {
      return `${tier}W`;
    }
  }
  return "1500W+";
}

/**
 * Calculate efficiency at a given load percentage
 */
function getEfficiencyNote(loadPercentage: number): string {
  if (loadPercentage < 20) {
    return "Very low load - PSU may be oversized";
  } else if (loadPercentage >= 20 && loadPercentage <= 50) {
    return "Excellent efficiency range (20-50% load)";
  } else if (loadPercentage > 50 && loadPercentage <= 80) {
    return "Good efficiency range (50-80% load)";
  } else {
    return "High load - consider a higher wattage PSU";
  }
}

/**
 * Calculate PSU requirements based on components
 */
export function calculatePSURequirements(
  request: PSUCalculateRequest
): PSUCalculateResponse {
  const { cpu, gpu, overclocking = false } = request;

  // Calculate component power draw
  const cpuPower = cpu ? cpu.max_tdp_watts || cpu.tdp_watts : 0;
  const gpuPower = gpu?.tdp_watts || 0;

  // Add transient spike buffer for high-end GPUs
  // RTX 4090/4080 and similar can spike to 2x their TDP briefly
  let transientBuffer = 0;
  if (gpuPower >= 400) {
    transientBuffer = 200; // For extreme GPUs like RTX 4090
  } else if (gpuPower >= 300) {
    transientBuffer = 150; // For high-end GPUs
  } else if (gpuPower >= 200) {
    transientBuffer = 75; // For mid-range GPUs
  }

  // Add overclocking buffer (20% of CPU + GPU)
  const overclockBuffer = overclocking
    ? Math.round((cpuPower + gpuPower) * 0.2)
    : 0;

  // Calculate total draw
  const totalDraw =
    BASE_POWER + cpuPower + gpuPower + transientBuffer + overclockBuffer;

  // Calculate recommended wattage with 1.5x headroom for efficiency
  // PSUs are most efficient at 50-60% load
  const rawRecommended = Math.round(totalDraw * 1.5);

  // Round up to nearest PSU tier
  let recommendedWattage = PSU_TIERS[0];
  for (const tier of PSU_TIERS) {
    if (rawRecommended <= tier) {
      recommendedWattage = tier;
      break;
    }
    recommendedWattage = tier;
  }

  // Calculate efficiency at recommended load
  const loadPercentage = (totalDraw / recommendedWattage) * 100;
  const efficiencyAtLoad = `${Math.round(loadPercentage)}%`;

  // Generate notes
  const notes: string[] = [];

  if (gpuPower >= 300) {
    notes.push(
      "High-power GPU detected. Consider a PSU with 12VHPWR connector for best results."
    );
  }

  if (transientBuffer > 0) {
    notes.push(
      `Added ${transientBuffer}W buffer for GPU transient power spikes.`
    );
  }

  if (overclocking) {
    notes.push(
      `Added ${overclockBuffer}W for overclocking headroom.`
    );
  }

  notes.push(getEfficiencyNote(loadPercentage));

  if (!cpu && !gpu) {
    notes.push("Add components to get an accurate PSU recommendation.");
  }

  return {
    breakdown: {
      cpuPower,
      gpuPower,
      basePower: BASE_POWER,
      transientBuffer,
      overclockBuffer,
      totalDraw,
    },
    recommendedWattage,
    recommendedTier: getPSUTier(recommendedWattage),
    efficiencyAtLoad,
    notes,
  };
}

/**
 * Get minimum PSU wattage (without efficiency buffer)
 */
export function getMinimumPSUWattage(
  cpuTdp: number,
  gpuTdp: number
): number {
  const transientBuffer = gpuTdp >= 300 ? 150 : gpuTdp >= 200 ? 75 : 0;
  return BASE_POWER + cpuTdp + gpuTdp + transientBuffer;
}

/**
 * Check if a PSU wattage is sufficient
 */
export function isPSUSufficient(
  psuWattage: number,
  cpuTdp: number,
  gpuTdp: number,
  includeHeadroom: boolean = true
): {
  sufficient: boolean;
  margin: number;
  loadPercentage: number;
} {
  const minimum = getMinimumPSUWattage(cpuTdp, gpuTdp);
  const recommended = includeHeadroom ? Math.round(minimum * 1.5) : minimum;

  const sufficient = psuWattage >= recommended;
  const margin = psuWattage - minimum;
  const loadPercentage = (minimum / psuWattage) * 100;

  return { sufficient, margin, loadPercentage };
}

/**
 * Format power breakdown for display
 */
export function formatPowerBreakdown(
  breakdown: PSUCalculateResponse["breakdown"]
): string[] {
  const lines: string[] = [];

  lines.push(`Base System: ${breakdown.basePower}W`);

  if (breakdown.cpuPower > 0) {
    lines.push(`CPU: ${breakdown.cpuPower}W`);
  }

  if (breakdown.gpuPower > 0) {
    lines.push(`GPU: ${breakdown.gpuPower}W`);
  }

  if (breakdown.transientBuffer > 0) {
    lines.push(`Transient Buffer: ${breakdown.transientBuffer}W`);
  }

  if (breakdown.overclockBuffer > 0) {
    lines.push(`Overclock Buffer: ${breakdown.overclockBuffer}W`);
  }

  lines.push(`─────────────`);
  lines.push(`Total Draw: ${breakdown.totalDraw}W`);

  return lines;
}
