"use client"

import { Component, ComponentType } from "@/types/components"
import { cn, formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, AlertCircle, X } from "lucide-react"
import { useComponentCompatibility } from "@/stores/build-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ComponentRowProps {
  label: string
  type: ComponentType
  component: Component | null
  isRequired?: boolean
  onClick: () => void
  onRemove?: () => void
}

export function ComponentRow({ 
  label, 
  type, 
  component, 
  isRequired = false, 
  onClick,
  onRemove
}: ComponentRowProps) {
  const { status, message } = useComponentCompatibility(component)
  const isSelected = !!component
  const hasError = status === "incompatible"
  const hasWarning = status === "warning"

  return (
    <div 
      className={cn(
        "group relative flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
        isSelected 
          ? "bg-card border-border hover:border-primary/50" 
          : "bg-muted/30 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
        hasError && "border-red-500/50 bg-red-500/5",
        hasWarning && "border-yellow-500/50 bg-yellow-500/5"
      )}
    >
      <div 
        className="flex-1 flex items-center gap-4 cursor-pointer" 
        onClick={onClick}
      >
        <div className="min-w-[120px]">
          <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>

        <div className="flex-1">
          {component ? (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                {component.model}
              </span>
              <span className="text-xs text-muted-foreground">
                {component.brand} • {component.performance_tier}
              </span>
              
              {(hasError || hasWarning) && (
                <div className={cn(
                  "flex items-center gap-1 text-xs mt-1 font-medium",
                  hasError ? "text-red-600" : "text-yellow-600"
                )}>
                  <AlertCircle className="h-3 w-3" />
                  {message}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isRequired ? (
                <Badge variant="destructive" className="uppercase text-[10px] tracking-wider">
                  Required
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm italic">Optional</span>
              )}
              <span className="text-muted-foreground/50 text-sm">Click to select...</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 pl-4 border-l ml-4">
        <div className="text-right min-w-[80px]">
          {component ? (
            <span className="font-bold text-lg">
              {formatPrice(component.price_usd)}
            </span>
          ) : (
            <span className="text-muted-foreground/30 font-medium">
              --
            </span>
          )}
        </div>

        {component && onRemove ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground/50"
            onClick={onClick}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
