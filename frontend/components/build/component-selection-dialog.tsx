"use client"

import { ComponentType } from "@/types/components"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InstantSearch, Configure } from "react-instantsearch"
import { searchClient, COMPONENTS_INDEX } from "@/lib/algolia"
import { SearchBox } from "@/components/search/search-box"
import { FilterSortToolbar } from "@/components/search/filter-sort-toolbar"
import { ResultsGrid } from "@/components/search/results-grid"
import { Pagination } from "@/components/search/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ComponentSelectionDialogProps {
  isOpen: boolean
  onClose: () => void
  category: ComponentType | null
}

export function ComponentSelectionDialog({ isOpen, onClose, category }: ComponentSelectionDialogProps) {
  if (!category) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <InstantSearch searchClient={searchClient} indexName={COMPONENTS_INDEX}>
          <Configure
            filters={`component_type:${category}`}
            hitsPerPage={12}
          />

          <DialogHeader className="px-6 pt-6 pb-0 bg-background z-10">
            <DialogTitle className="text-2xl mb-4">Select {category}</DialogTitle>
            <SearchBox componentType={category} />
            <FilterSortToolbar componentType={category} />
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <ResultsGrid onSelection={onClose} />
              <div className="mt-8">
                <Pagination />
              </div>
            </div>
          </ScrollArea>
        </InstantSearch>
      </DialogContent>
    </Dialog>
  )
}
