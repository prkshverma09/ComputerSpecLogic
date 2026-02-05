"use client"

import { useState } from "react"
import { useRefinementList, useRange, useSortBy } from "react-instantsearch"
import { ComponentType } from "@/types/components"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Filter, X, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSortToolbarProps {
  componentType: ComponentType
}

const SORT_OPTIONS = [
  { label: "Relevance", value: "prod_components" },
]

const COMPONENT_SPECIFIC_FILTERS: Record<ComponentType, string[]> = {
  CPU: ["socket"],
  GPU: ["vram_gb"],
  Motherboard: ["form_factor", "socket"],
  RAM: ["memory_type"],
  PSU: ["wattage"],
  Case: ["form_factor_support"],
  Cooler: ["cooler_type"],
  Storage: ["storage_type"],
}

function BrandFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "brand",
    limit: 20,
    sortBy: ["count:desc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          Brand
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={item.label}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function PriceFilter() {
  const { range, start, refine, canRefine } = useRange({
    attribute: "price_usd",
  })

  const safeMin = Number.isFinite(range.min) ? range.min : 0
  const safeMax = Number.isFinite(range.max) ? range.max : 5000
  const safeStartMin = Number.isFinite(start[0]) ? start[0] : safeMin
  const safeStartMax = Number.isFinite(start[1]) ? start[1] : safeMax

  const [minValue, setMinValue] = useState<string>(safeStartMin?.toString() || "")
  const [maxValue, setMaxValue] = useState<string>(safeStartMax?.toString() || "")
  const [isOpen, setIsOpen] = useState(false)

  if (!canRefine) return null

  const hasActiveFilter =
    (Number.isFinite(start[0]) && start[0] !== safeMin) ||
    (Number.isFinite(start[1]) && start[1] !== safeMax)

  const handleApply = () => {
    const min = minValue ? Number(minValue) : undefined
    const max = maxValue ? Number(maxValue) : undefined
    refine([min, max])
    setIsOpen(false)
  }

  const handleReset = () => {
    setMinValue("")
    setMaxValue("")
    refine([undefined, undefined])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilter && "border-primary bg-primary/10")}
        >
          Price
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              ${safeStartMin}-${safeStartMax}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="price-min" className="text-xs text-muted-foreground">
                Min
              </label>
              <Input
                id="price-min"
                type="number"
                placeholder={`$${safeMin}`}
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                className="h-8"
                aria-label="Min"
              />
            </div>
            <span className="text-muted-foreground mt-4">-</span>
            <div className="flex-1">
              <label htmlFor="price-max" className="text-xs text-muted-foreground">
                Max
              </label>
              <Input
                id="price-max"
                type="number"
                placeholder={`$${safeMax}`}
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
                className="h-8"
                aria-label="Max"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button size="sm" className="flex-1" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SortSelect() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentRefinement, options, refine, canRefine } = useSortBy({
    items: SORT_OPTIONS,
  })

  if (SORT_OPTIONS.length <= 1 || !canRefine || options.length <= 1) return null

  const currentOption = options.find((o) => o.value === currentRefinement)
  const isDefaultSort = currentRefinement === "prod_components"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", !isDefaultSort && "border-primary bg-primary/10")}
        >
          <ArrowUpDown className="h-3 w-3" />
          Sort
          {!isDefaultSort && (
            <span className="text-xs">: {currentOption?.label.replace("Price: ", "")}</span>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="space-y-0.5">
          {options.map((option) => (
            <button
              key={option.value}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded hover:bg-muted/50",
                currentRefinement === option.value && "bg-primary/10 font-medium"
              )}
              onClick={() => {
                refine(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SocketFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "socket",
    limit: 15,
    sortBy: ["count:desc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          Socket
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={item.label}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function VramFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "vram_gb",
    limit: 10,
    sortBy: ["name:asc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          VRAM
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={`${item.label}GB`}
              />
              <span className="flex-1 text-sm">{item.label}GB</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FormFactorFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "form_factor",
    limit: 10,
    sortBy: ["count:desc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          Form Factor
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={item.label}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function WattageFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "wattage",
    limit: 15,
    sortBy: ["name:asc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          Wattage
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={`${item.label}W`}
              />
              <span className="flex-1 text-sm">{item.label}W</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MemoryTypeFilter() {
  const { items, refine, canRefine } = useRefinementList({
    attribute: "memory_type",
    limit: 10,
    sortBy: ["count:desc"],
  })

  if (!canRefine || items.length === 0) return null

  const hasActiveFilters = items.some((item) => item.isRefined)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-1", hasActiveFilters && "border-primary bg-primary/10")}
        >
          Type
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {items.filter((i) => i.isRefined).length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
                aria-label={item.label}
              />
              <span className="flex-1 text-sm">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function FilterSortToolbar({ componentType }: FilterSortToolbarProps) {
  const brandFilter = useRefinementList({
    attribute: "brand",
    limit: 20,
  })

  const priceRange = useRange({
    attribute: "price_usd",
  })

  const hasActiveFilters =
    brandFilter.items.some((i) => i.isRefined) ||
    (priceRange.start[0] !== priceRange.range.min ||
      priceRange.start[1] !== priceRange.range.max)

  const handleClearAll = () => {
    brandFilter.items.filter((i) => i.isRefined).forEach((i) => brandFilter.refine(i.value))
    priceRange.refine([undefined, undefined])
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 border-b">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      <BrandFilter />
      <PriceFilter />

      {componentType === "CPU" && <SocketFilter />}
      {componentType === "GPU" && <VramFilter />}
      {componentType === "Motherboard" && (
        <>
          <FormFactorFilter />
          <SocketFilter />
        </>
      )}
      {componentType === "RAM" && <MemoryTypeFilter />}
      {componentType === "PSU" && <WattageFilter />}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleClearAll}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      <SortSelect />
    </div>
  )
}
