"use client"

import { useRefinementList, useSortBy, useRange } from "react-instantsearch"
import { ComponentType } from "@/types/components"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown, ChevronDown, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { COMPONENTS_INDEX } from "@/lib/algolia"

interface FiltersToolbarProps {
  componentType: ComponentType
  sortOrder: "relevance" | "price_asc" | "price_desc"
  onSortChange: (sort: "relevance" | "price_asc" | "price_desc") => void
}

function BrandFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "brand",
    limit: 50,
    sortBy: ["count:desc", "name:asc"]
  })

  const selectedCount = items.filter(item => item.isRefined).length

  if (items.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Brand
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={item.isRefined}
                  onCheckedChange={() => refine(item.value)}
                />
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function PriceRangeFilter() {
  const { range, start, refine } = useRange({ attribute: "price_usd" })
  
  const hasFilter = start[0] !== range.min || start[1] !== range.max
  const minPrice = range.min ?? 0
  const maxPrice = range.max ?? 1000

  if (minPrice === maxPrice || maxPrice === 0) return null

  const presets = [
    { label: "Under $100", min: minPrice, max: 100 },
    { label: "$100 - $250", min: 100, max: 250 },
    { label: "$250 - $500", min: 250, max: 500 },
    { label: "Over $500", min: 500, max: maxPrice },
  ].filter(p => p.min < maxPrice && p.max > minPrice)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Price
          {hasFilter && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              1
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <button
            onClick={() => refine([minPrice, maxPrice])}
            className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted ${!hasFilter ? 'bg-muted font-medium' : ''}`}
          >
            All Prices
          </button>
          {presets.map((preset) => {
            const isActive = start[0] === preset.min && start[1] === preset.max
            return (
              <button
                key={preset.label}
                onClick={() => refine([preset.min, preset.max])}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-muted ${isActive ? 'bg-muted font-medium' : ''}`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ComponentSpecificFilters({ componentType }: { componentType: ComponentType }) {
  switch (componentType) {
    case "CPU":
      return <CoresFilter />
    case "GPU":
      return <VramFilter />
    case "RAM":
      return <RamCapacityFilter />
    case "PSU":
      return <WattageFilter />
    case "Storage":
      return <StorageTypeFilter />
    default:
      return null
  }
}

function CoresFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "cores",
    limit: 20,
    sortBy: ["name:asc"]
  })

  if (items.length === 0) return null
  const selectedCount = items.filter(item => item.isRefined).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Cores
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <ScrollArea className="h-48">
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={item.isRefined}
                  onCheckedChange={() => refine(item.value)}
                />
                <span className="flex-1">{item.value} cores</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function VramFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "vram_gb",
    limit: 20,
    sortBy: ["name:asc"]
  })

  if (items.length === 0) return null
  const selectedCount = items.filter(item => item.isRefined).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          VRAM
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <ScrollArea className="h-48">
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={item.isRefined}
                  onCheckedChange={() => refine(item.value)}
                />
                <span className="flex-1">{item.value} GB</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function RamCapacityFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "capacity_gb",
    limit: 20,
    sortBy: ["name:asc"]
  })

  if (items.length === 0) return null
  const selectedCount = items.filter(item => item.isRefined).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Capacity
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <ScrollArea className="h-48">
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={item.isRefined}
                  onCheckedChange={() => refine(item.value)}
                />
                <span className="flex-1">{item.value} GB</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function WattageFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "wattage",
    limit: 20,
    sortBy: ["name:asc"]
  })

  if (items.length === 0) return null
  const selectedCount = items.filter(item => item.isRefined).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Wattage
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
        <ScrollArea className="h-48">
          <div className="p-2 space-y-1">
            {items.map((item) => (
              <label
                key={item.value}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={item.isRefined}
                  onCheckedChange={() => refine(item.value)}
                />
                <span className="flex-1">{item.value}W</span>
                <span className="text-xs text-muted-foreground">({item.count})</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function StorageTypeFilter() {
  const { items, refine } = useRefinementList({ 
    attribute: "storage_type",
    limit: 10
  })

  if (items.length === 0) return null
  const selectedCount = items.filter(item => item.isRefined).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          Type
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-2" align="start">
        <div className="space-y-1">
          {items.map((item) => (
            <label
              key={item.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
              />
              <span className="flex-1">{item.value}</span>
              <span className="text-xs text-muted-foreground">({item.count})</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ActiveFilters() {
  const brandList = useRefinementList({ attribute: "brand" })
  const coresList = useRefinementList({ attribute: "cores" })
  const vramList = useRefinementList({ attribute: "vram_gb" })
  const capacityList = useRefinementList({ attribute: "capacity_gb" })
  const wattageList = useRefinementList({ attribute: "wattage" })
  const storageTypeList = useRefinementList({ attribute: "storage_type" })

  const allRefinements = [
    ...brandList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: brandList.refine, type: 'Brand' })),
    ...coresList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: coresList.refine, type: 'Cores' })),
    ...vramList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: vramList.refine, type: 'VRAM' })),
    ...capacityList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: capacityList.refine, type: 'Capacity' })),
    ...wattageList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: wattageList.refine, type: 'Wattage' })),
    ...storageTypeList.items.filter(i => i.isRefined).map(i => ({ ...i, refine: storageTypeList.refine, type: 'Type' })),
  ]

  if (allRefinements.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {allRefinements.map((item) => (
        <Badge
          key={`${item.type}-${item.value}`}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
          onClick={() => item.refine(item.value)}
        >
          {item.type}: {item.label}
          <X className="h-3 w-3" />
        </Badge>
      ))}
    </div>
  )
}

export function FiltersToolbar({ componentType, sortOrder, onSortChange }: FiltersToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <BrandFilter />
        <PriceRangeFilter />
        <ComponentSpecificFilters componentType={componentType} />
        
        <div className="ml-auto">
          <Select value={sortOrder} onValueChange={(v) => onSortChange(v as typeof sortOrder)}>
            <SelectTrigger className="w-[160px] h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 opacity-50" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <ActiveFilters />
    </div>
  )
}
