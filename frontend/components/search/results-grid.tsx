"use client"

import { useMemo, useEffect, useRef } from "react"
import { useInfiniteHits, useInstantSearch } from "react-instantsearch"
import { ComponentCard } from "@/components/build/component-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Component, CompatibilityStatus } from "@/types/components"
import { useBuildStore } from "@/stores/build-store"
import { checkComponentCompatibility } from "@/lib/compatibility"
import { Package, FilterX, Loader2 } from "lucide-react"

export type SortOrder = "relevance" | "price_asc" | "price_desc"

interface ResultsGridProps {
  onSelection?: () => void
  hideIncompatible?: boolean
  sortOrder?: SortOrder
}

export function ResultsGrid({ onSelection, hideIncompatible = false, sortOrder = "relevance" }: ResultsGridProps) {
  const { hits, isLastPage, showMore } = useInfiniteHits<Component>()
  const { status } = useInstantSearch()
  const { build, addComponent, removeComponent } = useBuildStore()
  const sentinelRef = useRef<HTMLDivElement>(null)
  
  const handleRemove = (component: Component) => {
    removeComponent(component.component_type)
  }

  const handleAdd = (component: Component) => {
    addComponent(component)
    onSelection?.()
  }

  const isLoading = status === "loading" || status === "stalled"

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLastPage) {
            showMore()
          }
        })
      },
      { rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isLastPage, showMore])

  // Check if component is in build
  const isInBuild = (component: Component) => {
    const slot = build[component.component_type.toLowerCase() as keyof typeof build]
    return slot?.objectID === component.objectID
  }

  // Get compatibility status for a component
  const getCompatibilityStatus = (component: Component): { status: CompatibilityStatus; message?: string } => {
    return checkComponentCompatibility(component, build)
  }

  // Get price from component (handles different price field names)
  const getPrice = (component: Component): number => {
    return (component as { price_usd?: number }).price_usd ?? 
           (component as { price?: number }).price ?? 
           Number.MAX_SAFE_INTEGER
  }

  // Filter and sort hits
  const filteredHits = useMemo(() => {
    let result = hideIncompatible 
      ? hits.filter((hit) => {
          const { status } = getCompatibilityStatus(hit)
          return status !== "incompatible"
        })
      : [...hits]
    
    if (sortOrder === "price_asc") {
      result = result.sort((a, b) => getPrice(a) - getPrice(b))
    } else if (sortOrder === "price_desc") {
      result = result.sort((a, b) => getPrice(b) - getPrice(a))
    }
    
    return result
  }, [hits, hideIncompatible, sortOrder, build])

  // Count of hidden incompatible items
  const hiddenCount = hits.length - filteredHits.length

  if (isLoading && hits.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (hits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No components found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  if (filteredHits.length === 0 && hideIncompatible) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FilterX className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No compatible components</h3>
        <p className="text-muted-foreground max-w-md">
          All {hits.length} loaded components are incompatible with your current build.
          Try searching for different models or click "Show All" to see incompatible options.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hideIncompatible && hiddenCount > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Hiding {hiddenCount} incompatible component{hiddenCount !== 1 ? 's' : ''}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHits.map((hit) => {
          const selected = isInBuild(hit)
          const { status, message } = getCompatibilityStatus(hit)

          return (
            <ComponentCard
              key={hit.objectID}
              component={hit}
              compatibilityStatus={status}
              warningMessage={message}
              isSelected={selected}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          )
        })}
      </div>
      
      {/* Sentinel element for infinite scroll - only needed if more pages exist */}
      {!isLastPage && <div ref={sentinelRef} className="h-4" />}
      
      {/* Loading indicator - only show when actively loading more */}
      {!isLastPage && isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {isLastPage && hits.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Showing all {filteredHits.length}{hideIncompatible && hiddenCount > 0 ? ` compatible (of ${hits.length} total)` : ''} components
        </div>
      )}
    </div>
  )
}
