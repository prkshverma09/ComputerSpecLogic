import { NextRequest, NextResponse } from "next/server"
import { Build, ValidationResult, ValidationIssue, ComponentType } from "@/types/components"

/**
 * POST /api/build/validate
 *
 * Validates a PC build for compatibility issues.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { components } = body as { components: Partial<Build> }

    if (!components || typeof components !== "object") {
      return NextResponse.json(
        { error: "Invalid request body. Expected { components: {...} }" },
        { status: 400 }
      )
    }

    const issues: ValidationIssue[] = []
    const missingComponents: ComponentType[] = []

    // Check for missing components
    const componentTypeMap: Record<string, ComponentType> = {
      cpu: "CPU",
      motherboard: "Motherboard",
      gpu: "GPU",
      ram: "RAM",
      psu: "PSU",
      case: "Case",
      cooler: "Cooler",
    }

    Object.entries(componentTypeMap).forEach(([key, type]) => {
      if (!components[key as keyof Build]) {
        missingComponents.push(type)
      }
    })

    const { cpu, motherboard, gpu, ram, psu, case: pcCase, cooler } = components

    // === Hard Compatibility Checks (Errors) ===

    // CPU ↔ Motherboard Socket
    if (cpu && motherboard) {
      if (cpu.socket !== motherboard.socket) {
        issues.push({
          type: "error",
          code: "SOCKET_MISMATCH",
          message: `CPU socket (${cpu.socket}) doesn't match motherboard socket (${motherboard.socket})`,
          affectedComponents: ["CPU", "Motherboard"],
          suggestion: `Select a ${cpu.socket} motherboard or a ${motherboard.socket} CPU`,
        })
      }
    }

    // RAM ↔ Motherboard Memory Type
    if (ram && motherboard) {
      const supportedMemoryTypes = motherboard.memory_type || []
      if (!supportedMemoryTypes.includes(ram.memory_type)) {
        issues.push({
          type: "error",
          code: "MEMORY_TYPE_MISMATCH",
          message: `RAM type (${ram.memory_type}) doesn't match motherboard support (${supportedMemoryTypes.join(", ")})`,
          affectedComponents: ["RAM", "Motherboard"],
          suggestion: `Select ${supportedMemoryTypes.join(" or ")} RAM`,
        })
      }
    }

    // === Soft Compatibility Checks (Warnings) ===

    // GPU ↔ Case Clearance
    if (gpu && pcCase) {
      const gpuLength = gpu.length_mm || 0
      const caseGpuClearance = pcCase.max_gpu_length_mm || 999

      if (gpuLength > caseGpuClearance) {
        issues.push({
          type: "warning",
          code: "GPU_CLEARANCE",
          message: `GPU length (${gpuLength}mm) exceeds case GPU clearance (${caseGpuClearance}mm)`,
          affectedComponents: ["GPU", "Case"],
          suggestion: "Consider a shorter GPU or a larger case",
        })
      } else if (gpuLength > caseGpuClearance - 10) {
        issues.push({
          type: "warning",
          code: "GPU_CLEARANCE_TIGHT",
          message: `GPU length (${gpuLength}mm) is very close to case clearance (${caseGpuClearance}mm)`,
          affectedComponents: ["GPU", "Case"],
          suggestion: "Verify exact clearance before purchasing",
        })
      }
    }

    // Cooler ↔ Case Clearance
    if (cooler && pcCase) {
      const coolerHeight = cooler.height_mm || 0
      const caseCoolerClearance = pcCase.max_cooler_height_mm || 999

      if (coolerHeight > caseCoolerClearance) {
        issues.push({
          type: "warning",
          code: "COOLER_CLEARANCE",
          message: `Cooler height (${coolerHeight}mm) exceeds case clearance (${caseCoolerClearance}mm)`,
          affectedComponents: ["Cooler", "Case"],
          suggestion: "Consider a lower profile cooler or a larger case",
        })
      }
    }

    // PSU Wattage Check
    if (psu && (cpu || gpu)) {
      const cpuTdp = cpu?.tdp_watts || 0
      const gpuTdp = gpu?.tdp_watts || 0
      const basePower = 100 // For other components
      const transientBuffer = gpuTdp >= 300 ? 150 : 0
      const totalDraw = basePower + cpuTdp + gpuTdp + transientBuffer
      const recommendedPsu = Math.ceil(totalDraw * 1.2 / 50) * 50

      if (psu.wattage && psu.wattage < recommendedPsu) {
        issues.push({
          type: "warning",
          code: "PSU_INSUFFICIENT",
          message: `PSU wattage (${psu.wattage}W) may be insufficient. Recommended: ${recommendedPsu}W`,
          affectedComponents: ["PSU"],
          suggestion: `Consider a ${recommendedPsu}W or higher PSU`,
        })
      }
    }

    // Cooler ↔ CPU Socket Compatibility
    if (cooler && cpu) {
      const coolerSockets = cooler.socket_support || []
      if (coolerSockets.length > 0 && !coolerSockets.includes(cpu.socket || "")) {
        issues.push({
          type: "warning",
          code: "COOLER_SOCKET_MISMATCH",
          message: `Cooler may not support CPU socket (${cpu.socket})`,
          affectedComponents: ["Cooler", "CPU"],
          suggestion: "Verify cooler socket compatibility before purchasing",
        })
      }
    }

    // === Power Analysis ===
    const cpuPower = cpu?.tdp_watts || 0
    const gpuPower = gpu?.tdp_watts || 0
    const basePower = 100
    const totalTdp = cpuPower + gpuPower + basePower
    const recommendedPsu = Math.ceil(totalTdp * 1.5 / 50) * 50

    const powerAnalysis = {
      totalTdp,
      recommendedPsu,
      currentPsu: psu?.wattage || null,
      headroom: psu?.wattage ? psu.wattage - totalTdp : null,
    }

    // Build response
    const hasErrors = issues.some((i) => i.type === "error")
    const isComplete = missingComponents.length === 0

    const result: ValidationResult = {
      valid: !hasErrors,
      complete: isComplete,
      issues,
      powerAnalysis,
      missingComponents,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate build" },
      { status: 500 }
    )
  }
}
