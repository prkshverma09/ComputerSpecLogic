"use client"

import { useRefinementList } from "react-instantsearch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ComponentType } from "@/types/components"
import { Cpu, Monitor, CircuitBoard, MemoryStick, Zap, Box, Fan, Layers } from "lucide-react"

const categories: { value: ComponentType | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "CPU", label: "CPU", icon: Cpu },
  { value: "GPU", label: "GPU", icon: Monitor },
  { value: "Motherboard", label: "Motherboard", icon: CircuitBoard },
  { value: "RAM", label: "RAM", icon: MemoryStick },
  { value: "PSU", label: "PSU", icon: Zap },
  { value: "Case", label: "Case", icon: Box },
  { value: "Cooler", label: "Cooler", icon: Fan },
]

interface CategoryTabsProps {
  value: string
  onChange: (value: string) => void
}

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const { items, refine } = useRefinementList({
    attribute: "component_type",
  })

  // Get counts for each category
  const getCategoryCount = (category: string) => {
    if (category === "all") {
      return items.reduce((sum, item) => sum + item.count, 0)
    }
    const item = items.find((i) => i.value === category)
    return item?.count || 0
  }

  const handleChange = (newValue: string) => {
    onChange(newValue)
    
    // Clear previous refinements
    items.forEach((item) => {
      if (item.isRefined) {
        refine(item.value)
      }
    })
    
    // Apply new refinement if not "all"
    if (newValue !== "all") {
      refine(newValue)
    }
  }

  return (
    <Tabs value={value} onValueChange={handleChange} className="w-full">
      <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        {categories.map((category) => {
          const Icon = category.icon
          const count = getCategoryCount(category.value)
          const isActive = value === category.value

          return (
            <TabsTrigger
              key={category.value}
              value={category.value}
              className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.label}</span>
              {count > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {count}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
