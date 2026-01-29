"use client"

import { useBuildStore } from "@/stores/build-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PowerMeter } from "./power-meter"
import { CompatibilityBadge } from "./compatibility-badge"
import { formatPrice } from "@/lib/utils"
import { calculatePSURequirements } from "@/lib/psu-calculator"
import { ComponentType } from "@/types/components"
import {
  Cpu, Monitor, CircuitBoard, MemoryStick, Zap, Box, Fan,
  X, Trash2, Share2, Download, Check, AlertTriangle, XCircle
} from "lucide-react"
import Link from "next/link"

const componentSlots: { type: ComponentType; icon: React.ElementType; label: string }[] = [
  { type: "CPU", icon: Cpu, label: "Processor" },
  { type: "Motherboard", icon: CircuitBoard, label: "Motherboard" },
  { type: "GPU", icon: Monitor, label: "Graphics Card" },
  { type: "RAM", icon: MemoryStick, label: "Memory" },
  { type: "PSU", icon: Zap, label: "Power Supply" },
  { type: "Case", icon: Box, label: "Case" },
  { type: "Cooler", icon: Fan, label: "CPU Cooler" },
]

export function BuildSidebar() {
  const {
    build,
    totalPrice,
    totalTdp,
    componentCount,
    validationResult,
    removeComponent,
    clearBuild,
  } = useBuildStore()

  // Calculate PSU requirements
  const psuRequirements = calculatePSURequirements({
    cpu: build.cpu ? { tdp_watts: build.cpu.tdp_watts || 0 } : undefined,
    gpu: build.gpu ? { tdp_watts: build.gpu.tdp_watts || 0 } : undefined,
    overclocking: false,
  })

  // Get compatibility status summary
  const getCompatibilitySummary = () => {
    if (!validationResult) return { errors: 0, warnings: 0 }
    return {
      errors: validationResult.issues.filter((i) => i.type === "error").length,
      warnings: validationResult.issues.filter((i) => i.type === "warning").length,
    }
  }

  const { errors, warnings } = getCompatibilitySummary()

  return (
    <Card className="sticky top-4 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Build</CardTitle>
          <Badge variant="secondary">
            {componentCount}/7 Components
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Component Slots */}
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-2">
            {componentSlots.map(({ type, icon: Icon, label }) => {
              const component = build[type.toLowerCase() as keyof typeof build]
              
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 rounded-lg border p-2.5 bg-card"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {component ? (
                      <>
                        <p className="text-xs text-muted-foreground">{component.brand}</p>
                        <p className="text-sm font-medium truncate">{component.model}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select {label}</p>
                    )}
                  </div>
                  
                  {component && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">
                        {formatPrice(component.price_usd || 0)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeComponent(type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Power Analysis */}
        <PowerMeter
          estimatedDraw={psuRequirements.breakdown.totalDraw}
          psuWattage={build.psu?.wattage || null}
          recommendedWattage={psuRequirements.recommendedWattage}
        />

        <Separator />

        {/* Compatibility Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Compatibility Status</h4>
          
          {componentCount < 2 ? (
            <p className="text-sm text-muted-foreground">
              Add at least 2 components to check compatibility
            </p>
          ) : (
            <div className="space-y-1.5">
              {errors === 0 && warnings === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm">All components compatible</span>
                </div>
              ) : (
                <>
                  {errors > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">{errors} compatibility error{errors > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {warnings > 0 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{warnings} warning{warnings > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </>
              )}

              {/* Show individual issues */}
              {validationResult?.issues.slice(0, 3).map((issue, idx) => (
                <p key={idx} className="text-xs text-muted-foreground pl-6">
                  • {issue.message}
                </p>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Total Price */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Price</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(totalPrice)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1" disabled={componentCount === 0}>
            <Link href="/export">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" disabled={componentCount === 0}>
            <Link href="/export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
        </div>

        {componentCount > 0 && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={clearBuild}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Build
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
