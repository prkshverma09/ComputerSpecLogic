"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CompatibilityBadge } from "./compatibility-badge"
import { cn, formatPrice, getComponentIcon } from "@/lib/utils"
import { Component, CompatibilityStatus, ComponentType } from "@/types/components"
import { Plus, Check, Cpu, Monitor, CircuitBoard, MemoryStick, Zap, Box, Fan } from "lucide-react"

interface ComponentCardProps {
  component: Component
  compatibilityStatus?: CompatibilityStatus
  warningMessage?: string
  isSelected?: boolean
  onAdd?: (component: Component) => void
  onRemove?: (component: Component) => void
  compact?: boolean
}

const componentIcons: Record<ComponentType, React.ElementType> = {
  CPU: Cpu,
  GPU: Monitor,
  Motherboard: CircuitBoard,
  RAM: MemoryStick,
  PSU: Zap,
  Case: Box,
  Cooler: Fan,
}

function getKeySpecs(component: Component): { label: string; value: string }[] {
  const specs: { label: string; value: string }[] = []
  
  switch (component.component_type) {
    case "CPU":
      if (component.socket) specs.push({ label: "Socket", value: component.socket })
      if (component.cores) specs.push({ label: "Cores", value: `${component.cores}C/${component.threads || component.cores * 2}T` })
      if (component.tdp_watts) specs.push({ label: "TDP", value: `${component.tdp_watts}W` })
      if (component.boost_clock_ghz) specs.push({ label: "Boost", value: `${component.boost_clock_ghz}GHz` })
      break
    case "GPU":
      if (component.vram_gb) specs.push({ label: "VRAM", value: `${component.vram_gb}GB` })
      if (component.tdp_watts) specs.push({ label: "TDP", value: `${component.tdp_watts}W` })
      if (component.length_mm) specs.push({ label: "Length", value: `${component.length_mm}mm` })
      break
    case "Motherboard":
      if (component.socket) specs.push({ label: "Socket", value: component.socket })
      if (component.form_factor) specs.push({ label: "Form", value: component.form_factor })
      if (component.memory_type) specs.push({ label: "Memory", value: component.memory_type })
      break
    case "RAM":
      if (component.memory_type) specs.push({ label: "Type", value: component.memory_type })
      if (component.capacity_gb) specs.push({ label: "Size", value: `${component.capacity_gb}GB` })
      if (component.speed_mhz) specs.push({ label: "Speed", value: `${component.speed_mhz}MHz` })
      break
    case "PSU":
      if (component.wattage) specs.push({ label: "Wattage", value: `${component.wattage}W` })
      if (component.efficiency_rating) specs.push({ label: "Rating", value: component.efficiency_rating })
      if (component.modular) specs.push({ label: "Modular", value: component.modular })
      break
    case "Case":
      if (component.form_factor) specs.push({ label: "Form", value: component.form_factor })
      if (component.max_gpu_length_mm) specs.push({ label: "GPU Clear", value: `${component.max_gpu_length_mm}mm` })
      if (component.max_cooler_height_mm) specs.push({ label: "Cooler Clear", value: `${component.max_cooler_height_mm}mm` })
      break
    case "Cooler":
      if (component.cooler_type) specs.push({ label: "Type", value: component.cooler_type })
      if (component.height_mm) specs.push({ label: "Height", value: `${component.height_mm}mm` })
      if (component.tdp_rating) specs.push({ label: "TDP Rating", value: `${component.tdp_rating}W` })
      break
  }
  
  return specs.slice(0, 4) // Limit to 4 specs
}

export function ComponentCard({
  component,
  compatibilityStatus = "unknown",
  warningMessage,
  isSelected = false,
  onAdd,
  onRemove,
  compact = false,
}: ComponentCardProps) {
  const Icon = componentIcons[component.component_type] || Box
  const keySpecs = getKeySpecs(component)
  const isIncompatible = compatibilityStatus === "incompatible"

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary",
        isIncompatible && "opacity-60"
      )}
    >
      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Header with icon and compatibility */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10",
              compact && "h-6 w-6"
            )}>
              <Icon className={cn("h-4 w-4 text-primary", compact && "h-3 w-3")} />
            </div>
            <Badge variant="secondary" className="text-xs">
              {component.component_type}
            </Badge>
          </div>
          {compatibilityStatus !== "unknown" && (
            <CompatibilityBadge
              status={compatibilityStatus}
              message={warningMessage}
              size="sm"
            />
          )}
        </div>

        {/* Brand and Model */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground">{component.brand}</p>
          <h3 className={cn(
            "font-semibold line-clamp-2",
            compact ? "text-sm" : "text-base"
          )}>
            {component.model}
          </h3>
        </div>

        {/* Key Specs */}
        <div className={cn(
          "grid gap-1 text-xs text-muted-foreground mb-3",
          compact ? "grid-cols-2" : "grid-cols-2"
        )}>
          {keySpecs.map((spec) => (
            <div key={spec.label} className="flex justify-between">
              <span>{spec.label}:</span>
              <span className="font-medium text-foreground">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className={cn(
            "font-bold text-primary",
            compact ? "text-base" : "text-lg"
          )}>
            {component.price_usd ? formatPrice(component.price_usd) : "N/A"}
          </span>
          
          {isSelected ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove?.(component)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Check className="h-4 w-4 mr-1" />
              In Build
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onAdd?.(component)}
              disabled={isIncompatible}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardContent>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      )}
    </Card>
  )
}
