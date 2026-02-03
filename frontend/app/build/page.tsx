"use client"

import { useState } from "react"
import { useBuildStore } from "@/stores/build-store"
import { BuildSummarySidebar } from "@/components/build/build-summary-sidebar"
import { BuildComponentList } from "@/components/build/build-component-list"
import { ComponentSelectionDialog } from "@/components/build/component-selection-dialog"
import { ComponentType } from "@/types/components"

export default function BuildPage() {
  const [selectedCategory, setSelectedCategory] = useState<ComponentType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCategorySelect = (type: ComponentType) => {
    setSelectedCategory(type)
    setIsDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configure your PC</h1>
        <p className="text-muted-foreground">
          Select components to build your dream machine. We'll check compatibility as you go.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Component List - Takes up 8 columns on large screens */}
        <div className="lg:col-span-8 space-y-6">
          <BuildComponentList onCategorySelect={handleCategorySelect} />
        </div>

        {/* Sidebar Summary - Takes up 4 columns on large screens */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <BuildSummarySidebar />
          </div>
        </div>
      </div>

      {/* Selection Modal */}
      <ComponentSelectionDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        category={selectedCategory}
      />
    </div>
  )
}
