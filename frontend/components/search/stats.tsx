"use client"

import { useStats } from "react-instantsearch"

export function SearchStats() {
  const { nbHits, processingTimeMS } = useStats()

  return (
    <p className="text-sm text-muted-foreground">
      {nbHits.toLocaleString()} results found in {processingTimeMS}ms
    </p>
  )
}
