import { NextRequest, NextResponse } from "next/server"

interface PSUCalculateRequest {
  cpu: { tdp_watts: number; max_tdp_watts?: number }
  gpu?: { tdp_watts: number }
  overclocking?: boolean
}

interface PSUCalculateResponse {
  breakdown: {
    cpuPower: number
    gpuPower: number
    basePower: number
    transientBuffer: number
    overclockBuffer: number
    totalDraw: number
  }
  recommendedWattage: number
  recommendedTier: string
  efficiencyAtLoad: string
  notes: string[]
}

/**
 * POST /api/psu/calculate
 * 
 * Calculates PSU requirements for a build.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PSUCalculateRequest

    if (!body.cpu || typeof body.cpu.tdp_watts !== "number") {
      return NextResponse.json(
        { error: "CPU TDP is required" },
        { status: 400 }
      )
    }

    const { cpu, gpu, overclocking = false } = body

    // Base system power (motherboard, storage, fans, etc.)
    const basePower = 100

    // CPU power (use max TDP if available, otherwise base TDP)
    const cpuPower = cpu.max_tdp_watts || cpu.tdp_watts

    // GPU power
    const gpuPower = gpu?.tdp_watts || 0

    // Transient spike buffer for high-power GPUs
    const transientBuffer = gpuPower >= 300 ? 150 : gpuPower >= 200 ? 75 : 0

    // Overclocking buffer (20% extra headroom)
    const overclockBuffer = overclocking
      ? Math.round((cpuPower + gpuPower) * 0.2)
      : 0

    // Total power draw
    const totalDraw = basePower + cpuPower + gpuPower + transientBuffer + overclockBuffer

    // Recommended wattage (50% headroom for efficiency, rounded to nearest 50W)
    const recommendedWattage = Math.ceil((totalDraw * 1.5) / 50) * 50

    // Determine recommended tier
    let recommendedTier: string
    if (recommendedWattage <= 550) {
      recommendedTier = "550W"
    } else if (recommendedWattage <= 650) {
      recommendedTier = "650W"
    } else if (recommendedWattage <= 750) {
      recommendedTier = "750W"
    } else if (recommendedWattage <= 850) {
      recommendedTier = "850W"
    } else if (recommendedWattage <= 1000) {
      recommendedTier = "1000W"
    } else {
      recommendedTier = "1200W+"
    }

    // Calculate efficiency at load (assuming 80+ Gold PSU)
    // 80+ Gold: 87% at 20% load, 90% at 50% load, 87% at 100% load
    const loadPercentage = Math.round((totalDraw / recommendedWattage) * 100)
    let efficiencyAtLoad: string
    if (loadPercentage <= 20) {
      efficiencyAtLoad = "~87% (20% load)"
    } else if (loadPercentage <= 50) {
      efficiencyAtLoad = "~90% (50% load - optimal)"
    } else if (loadPercentage <= 80) {
      efficiencyAtLoad = "~88% (80% load)"
    } else {
      efficiencyAtLoad = "~87% (high load)"
    }

    // Generate notes
    const notes: string[] = []

    if (gpuPower >= 300) {
      notes.push(
        "High-power GPU detected. Added 150W transient spike buffer for power spikes during load."
      )
    }

    if (overclocking) {
      notes.push(
        "Overclocking enabled. Added 20% buffer for additional power headroom."
      )
    }

    if (totalDraw > 800) {
      notes.push(
        "High-power build. Consider a PSU with dual EPS connectors for CPU power."
      )
    }

    if (gpuPower >= 350) {
      notes.push(
        "GPU may require multiple PCIe power connectors. Verify PSU has adequate connectors."
      )
    }

    notes.push(
      "Recommendation based on 80+ Gold efficiency. For Platinum/Titanium, you may use slightly lower wattage."
    )

    const response: PSUCalculateResponse = {
      breakdown: {
        cpuPower,
        gpuPower,
        basePower,
        transientBuffer,
        overclockBuffer,
        totalDraw,
      },
      recommendedWattage,
      recommendedTier,
      efficiencyAtLoad,
      notes,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("PSU calculation error:", error)
    return NextResponse.json(
      { error: "Failed to calculate PSU requirements" },
      { status: 500 }
    )
  }
}
