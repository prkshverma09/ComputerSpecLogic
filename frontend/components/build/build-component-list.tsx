"use client"

import { useBuildStore } from "@/stores/build-store"
import { ComponentRow } from "./component-row"
import { ComponentType } from "@/types/components"

interface BuildComponentListProps {
  onCategorySelect: (type: ComponentType) => void
}

export function BuildComponentList({ onCategorySelect }: BuildComponentListProps) {
  const { build, removeComponent } = useBuildStore()

  const categories: { type: ComponentType; label: string; required: boolean }[] = [
    { type: "Case", label: "Case", required: true },
    { type: "CPU", label: "Processor (CPU)", required: true },
    { type: "Cooler", label: "CPU Cooling", required: true },
    { type: "Motherboard", label: "Motherboard", required: true },
    { type: "RAM", label: "Memory (RAM)", required: true },
    { type: "GPU", label: "Graphics Card", required: true },
    { type: "PSU", label: "Power Supply", required: true },
  ]

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <ComponentRow
          key={category.type}
          type={category.type}
          label={category.label}
          component={build[category.type.toLowerCase() as keyof typeof build]}
          isRequired={category.required}
          onClick={() => onCategorySelect(category.type)}
          onRemove={() => removeComponent(category.type)}
        />
      ))}

      {/* Placeholder for unsupported categories to match the "full builder" feel */}
      <div className="pt-6 border-t mt-6">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
          Peripherals & Accessories (Coming Soon)
        </h3>
        <div className="space-y-3 opacity-50 pointer-events-none grayscale">
          <div className="p-4 rounded-lg border border-dashed flex justify-between items-center">
            <span className="text-sm font-medium">Storage (SSD/HDD)</span>
            <span className="text-xs">Not available yet</span>
          </div>
          <div className="p-4 rounded-lg border border-dashed flex justify-between items-center">
            <span className="text-sm font-medium">Operating System</span>
            <span className="text-xs">Not available yet</span>
          </div>
        </div>
      </div>
    </div>
  )
}
