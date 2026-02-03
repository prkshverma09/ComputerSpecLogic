"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CompatibilityStatus } from "@/types/components"
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompatibilityBadgeProps {
  status: CompatibilityStatus
  message?: string
  size?: "sm" | "md"
}

export function CompatibilityBadge({ status, message, size = "md" }: CompatibilityBadgeProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  
  const config = {
    compatible: {
      icon: CheckCircle2,
      label: "Compatible",
      variant: "default" as const,
      className: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20",
    },
    warning: {
      icon: AlertTriangle,
      label: "Warning",
      variant: "default" as const,
      className: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-500/20",
    },
    incompatible: {
      icon: XCircle,
      label: "Incompatible",
      variant: "destructive" as const,
      className: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20",
    },
    unknown: {
      icon: HelpCircle,
      label: "Unknown",
      variant: "secondary" as const,
      className: "",
    },
  }

  const { icon: Icon, label, className } = config[status]

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 font-medium",
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      <Icon className={iconSize} />
      {size !== "sm" && label}
    </Badge>
  )

  if (message) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
