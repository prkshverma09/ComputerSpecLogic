"use client"

import { cn } from "@/lib/utils"
import { Zap, AlertTriangle } from "lucide-react"

interface PowerMeterProps {
  estimatedDraw: number
  psuWattage: number | null
  recommendedWattage: number
  className?: string
}

export function PowerMeter({
  estimatedDraw,
  psuWattage,
  recommendedWattage,
  className,
}: PowerMeterProps) {
  const maxWattage = psuWattage || recommendedWattage || 1 // Prevent division by zero
  const percentage = maxWattage > 0 ? Math.min((estimatedDraw / maxWattage) * 100, 100) : 0
  
  // Determine color based on load percentage
  const getColorClass = () => {
    if (percentage < 60) return "text-green-500"
    if (percentage < 80) return "text-yellow-500"
    return "text-red-500"
  }

  const getProgressColor = () => {
    if (percentage < 60) return "bg-green-500"
    if (percentage < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  const isInsufficient = psuWattage !== null && psuWattage < recommendedWattage

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={cn("h-5 w-5", getColorClass())} />
          <span className="font-medium">Power Analysis</span>
        </div>
        <span className={cn("text-2xl font-bold", getColorClass())}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out rounded-full",
            getProgressColor()
          )}
          style={{ width: `${percentage}%` }}
        />
        {/* Recommended threshold marker */}
        {psuWattage && psuWattage > recommendedWattage && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-400"
            style={{ left: `${(recommendedWattage / psuWattage) * 100}%` }}
          />
        )}
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Estimated Draw</p>
          <p className="font-semibold">{estimatedDraw}W</p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">
            {psuWattage ? "Your PSU" : "Recommended"}
          </p>
          <p className="font-semibold">
            {psuWattage || recommendedWattage}W
          </p>
        </div>
      </div>

      {/* Recommendations */}
      {psuWattage && (
        <div className="text-sm">
          <p className="text-muted-foreground">
            Headroom: {psuWattage - estimatedDraw}W (
            {Math.round(((psuWattage - estimatedDraw) / psuWattage) * 100)}%)
          </p>
        </div>
      )}

      {!psuWattage && (
        <p className="text-sm text-muted-foreground">
          Recommended PSU: <span className="font-semibold">{recommendedWattage}W</span>
        </p>
      )}

      {/* Warning for insufficient PSU */}
      {isInsufficient && (
        <div className="flex items-center gap-2 rounded-md bg-red-100 dark:bg-red-900/20 p-2 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Your PSU ({psuWattage}W) may be insufficient. Consider upgrading to at
            least {recommendedWattage}W.
          </span>
        </div>
      )}
    </div>
  )
}
