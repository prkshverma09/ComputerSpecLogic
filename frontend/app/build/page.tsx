"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { InstantSearch, Configure } from "react-instantsearch"
import { searchClient, COMPONENTS_INDEX } from "@/lib/algolia"
import { SearchBox } from "@/components/search/search-box"
import { CategoryTabs } from "@/components/search/category-tabs"
import { ResultsGrid } from "@/components/search/results-grid"
import { SearchStats } from "@/components/search/stats"
import { Pagination } from "@/components/search/pagination"
import { BuildSidebar } from "@/components/build/build-sidebar"
import { ChatWidget } from "@/components/chat/chat-widget"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cpu, X } from "lucide-react"
import Link from "next/link"

// Budget presets with recommended per-component budgets
const BUDGET_PRESETS: Record<string, { name: string; emoji: string; maxPrice: number; description: string }> = {
  "1000": { name: "Budget Gaming", emoji: "🎮", maxPrice: 200, description: "Great 1080p gaming" },
  "1500": { name: "Mid-Range Beast", emoji: "⚡", maxPrice: 350, description: "Excellent 1440p gaming" },
  "2500": { name: "High-End Gaming", emoji: "🚀", maxPrice: 500, description: "4K gaming powerhouse" },
  "4000": { name: "Workstation Pro", emoji: "🏆", maxPrice: 800, description: "Professional-grade" },
}

export default function BuildPage() {
  const searchParams = useSearchParams()
  const budgetParam = searchParams.get("budget")
  
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [activeBudget, setActiveBudget] = useState<string | null>(null)
  
  // Set active budget from URL on mount
  useEffect(() => {
    if (budgetParam && BUDGET_PRESETS[budgetParam]) {
      setActiveBudget(budgetParam)
    }
  }, [budgetParam])
  
  // Get current preset info
  const currentPreset = activeBudget ? BUDGET_PRESETS[activeBudget] : null
  
  // Build the Algolia filter string for price
  const priceFilter = useMemo(() => {
    if (!currentPreset) return ""
    // Filter components that fit within the per-component budget
    return `price_usd <= ${currentPreset.maxPrice}`
  }, [currentPreset])
  
  // Clear the budget filter
  const clearBudget = () => {
    setActiveBudget(null)
    // Update URL without budget param
    window.history.replaceState({}, "", "/build")
  }

  return (
    <TooltipProvider>
      <InstantSearch
        searchClient={searchClient}
        indexName={COMPONENTS_INDEX}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure 
          hitsPerPage={12} 
          filters={priceFilter}
        />
        
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Cpu className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Spec-Logic</span>
              </Link>
              <nav className="flex items-center gap-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                  Home
                </Link>
                <Link href="/build" className="text-sm font-medium">
                  Build
                </Link>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="container py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search & Results Section */}
              <div className="flex-1 space-y-6">
                {/* Page Title */}
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">PC Builder</h1>
                  <p className="text-muted-foreground">
                    Search and select compatible components for your build
                  </p>
                </div>

                {/* Active Budget Preset Banner */}
                {currentPreset && (
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentPreset.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{currentPreset.name} Build</h3>
                          <Badge variant="secondary">~${activeBudget}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currentPreset.description} • Showing components up to ${currentPreset.maxPrice} each
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearBudget}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filter
                    </Button>
                  </div>
                )}

                {/* Search Box */}
                <SearchBox />

                {/* Category Tabs */}
                <CategoryTabs
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />

                {/* Stats */}
                <SearchStats />

                {/* Results Grid */}
                <ResultsGrid />

                {/* Pagination */}
                <Pagination />
              </div>

              {/* Build Sidebar */}
              <aside className="w-full lg:w-[380px] shrink-0">
                <BuildSidebar />
              </aside>
            </div>
          </main>

          {/* AI Chat Widget */}
          <ChatWidget />
        </div>
      </InstantSearch>
    </TooltipProvider>
  )
}
