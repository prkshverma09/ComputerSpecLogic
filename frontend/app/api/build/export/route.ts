import { NextRequest, NextResponse } from "next/server"
import { Build, Component } from "@/types/components"
import { rateLimit, getClientIP, createRateLimitHeaders } from "@/lib/rate-limit"

interface ExportRequest {
  build: Partial<Build>
  format: "pcpartpicker" | "reddit" | "json" | "link"
}

const MAX_REQUEST_SIZE = 100 * 1024
const MAX_BUILD_JSON_SIZE = 50 * 1024
const VALID_FORMATS = ["pcpartpicker", "reddit", "json", "link"] as const

/**
 * POST /api/build/export
 * 
 * Exports a build in various formats.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`export:${clientIP}`, {
      maxRequests: 20,
      windowMs: 60 * 1000,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: createRateLimitHeaders(rateLimitResult) }
      )
    }

    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      )
    }

    const body = (await request.json()) as ExportRequest
    const { build, format } = body

    if (!build || typeof build !== "object" || Array.isArray(build)) {
      return NextResponse.json(
        { error: "Build object is required" },
        { status: 400 }
      )
    }

    if (!format || !VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
      return NextResponse.json(
        { error: "Valid format is required (pcpartpicker, reddit, json, link)" },
        { status: 400 }
      )
    }

    const allowedKeys = ["cpu", "motherboard", "gpu", "ram", "psu", "case", "cooler", "storage"]
    const buildKeys = Object.keys(build)
    if (buildKeys.some(key => !allowedKeys.includes(key))) {
      return NextResponse.json(
        { error: "Invalid build keys in request" },
        { status: 400 }
      )
    }

    // Get components in order
    const componentOrder = ["cpu", "motherboard", "gpu", "ram", "psu", "case", "cooler"]
    const components: { type: string; component: Component }[] = []

    componentOrder.forEach((type) => {
      const component = build[type as keyof Build]
      if (component) {
        components.push({ type, component })
      }
    })

    if (components.length === 0) {
      return NextResponse.json(
        { error: "Build is empty" },
        { status: 400 }
      )
    }

    // Calculate total price
    const totalPrice = components.reduce(
      (sum, { component }) => sum + (component.price_usd || 0),
      0
    )

    let formatted: string
    let shareUrl: string | undefined

    switch (format) {
      case "pcpartpicker":
        formatted = generatePCPartPickerFormat(components, totalPrice)
        break
      case "reddit":
        formatted = generateRedditFormat(components, totalPrice)
        break
      case "json":
        formatted = JSON.stringify({ components: build, totalPrice }, null, 2)
        break
      case "link":
        const buildJson = JSON.stringify(build)
        if (buildJson.length > MAX_BUILD_JSON_SIZE) {
          return NextResponse.json(
            { error: "Build data too large for link format" },
            { status: 400 }
          )
        }
        const encoded = Buffer.from(buildJson).toString("base64url")
        shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/build?state=${encoded}`
        formatted = shareUrl
        break
      default:
        formatted = ""
    }

    return NextResponse.json({
      formatted,
      totalPrice,
      componentCount: components.length,
      shareUrl,
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export build" },
      { status: 500 }
    )
  }
}

function getComponentLabel(type: string): string {
  const labels: Record<string, string> = {
    cpu: "CPU",
    motherboard: "Motherboard",
    gpu: "Video Card",
    ram: "Memory",
    psu: "Power Supply",
    case: "Case",
    cooler: "CPU Cooler",
  }
  return labels[type] || type
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

function generatePCPartPickerFormat(
  components: { type: string; component: Component }[],
  totalPrice: number
): string {
  const lines = [
    "[PCPartPicker Build List]",
    "",
    "Type|Item|Price",
    ":----|:----|:----",
  ]

  components.forEach(({ type, component }) => {
    const label = getComponentLabel(type)
    const name = `${component.brand} ${component.model}`
    const price = component.price_usd
      ? formatPrice(component.price_usd)
      : "N/A"
    lines.push(`${label}|${name}|${price}`)
  })

  lines.push(`**Total**||**${formatPrice(totalPrice)}**`)
  lines.push("")
  lines.push("*Generated by Spec-Logic PC Builder*")

  return lines.join("\n")
}

function generateRedditFormat(
  components: { type: string; component: Component }[],
  totalPrice: number
): string {
  const lines = [
    "| Component | Selection | Price |",
    "|:----------|:----------|------:|",
  ]

  components.forEach(({ type, component }) => {
    const label = getComponentLabel(type)
    const name = `${component.brand} ${component.model}`
    const price = component.price_usd
      ? formatPrice(component.price_usd)
      : "N/A"
    lines.push(`| ${label} | ${name} | ${price} |`)
  })

  lines.push(`| **Total** | | **${formatPrice(totalPrice)}** |`)
  lines.push("")
  lines.push("*Built with [Spec-Logic](https://spec-logic.vercel.app)*")

  return lines.join("\n")
}
