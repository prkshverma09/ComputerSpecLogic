"use client"

import { useHits, useInstantSearch } from "react-instantsearch"
import { ComponentCard } from "@/components/build/component-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Component, CompatibilityStatus } from "@/types/components"
import { useBuildStore } from "@/stores/build-store"
import { checkComponentCompatibility } from "@/lib/compatibility"
import { Package } from "lucide-react"

export function ResultsGrid() {
  const { hits } = useHits<Component>()
  const { status } = useInstantSearch()
  const { build, addComponent, removeComponent } = useBuildStore()

  const isLoading = status === "loading" || status === "stalled"

  // Check if component is in build
  const isInBuild = (component: Component) => {
    const slot = build[component.component_type.toLowerCase() as keyof typeof build]
    return slot?.objectID === component.objectID
  }

  // Get compatibility status for a component
  const getCompatibilityStatus = (component: Component): { status: CompatibilityStatus; message?: string } => {
    // checkComponentCompatibility returns { status, message? } directly
    return checkComponentCompatibility(component, build)
  }

  if (isLoading) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {hits.map((hit) => {
        const selected = isInBuild(hit)
        const { status, message } = getCompatibilityStatus(hit)

        return (
          <ComponentCard
            key={hit.objectID}
            component={hit}
            compatibilityStatus={status}
            warningMessage={message}
            isSelected={selected}
            onAdd={addComponent}
            onRemove={removeComponent}
          />
        )
      })}
    </div>
  )
}
