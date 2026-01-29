"use client"

import { useSearchBox } from "react-instantsearch"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SearchBox() {
  const { query, refine, clear } = useSearchBox()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search components... (e.g., RTX 4090, Ryzen 9)"
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
