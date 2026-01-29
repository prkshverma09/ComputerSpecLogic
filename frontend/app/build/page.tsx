"use client"

import { useState } from "react"
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
import { Cpu } from "lucide-react"
import Link from "next/link"

export default function BuildPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <TooltipProvider>
      <InstantSearch
        searchClient={searchClient}
        indexName={COMPONENTS_INDEX}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={12} />
        
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
