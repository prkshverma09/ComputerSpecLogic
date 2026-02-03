"use client"

import { useSearchBox } from "react-instantsearch"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComponentType } from "@/types/components"

const placeholderExamples: Record<ComponentType, string> = {
  CPU: "e.g., Ryzen 9, Core i9, 5800X",
  GPU: "e.g., RTX 4090, RX 7900, GTX 1080",
  Motherboard: "e.g., ASUS ROG, MSI, B550",
  RAM: "e.g., Corsair, 32GB, DDR5",
  PSU: "e.g., 750W, EVGA, Corsair",
  Case: "e.g., NZXT, MasterBox, ATX",
  Cooler: "e.g., Noctua, AIO, 240mm",
  Storage: "e.g., Samsung 980, NVMe, 1TB",
}

interface SearchBoxProps {
  componentType?: ComponentType
}

export function SearchBox({ componentType }: SearchBoxProps) {
  const { query, refine, clear } = useSearchBox()
  
  const placeholder = componentType 
    ? `Search ${componentType}... (${placeholderExamples[componentType]})`
    : "Search components..."

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => refine(e.target.value)}
        className="pl-10 pr-10 h-11 text-base"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={clear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
