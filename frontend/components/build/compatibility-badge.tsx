"use client"

import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Check, AlertTriangle, X, HelpCircle } from "lucide-react"
import { CompatibilityStatus } from "@/types/components"

interface CompatibilityBadgeProps {
  status: CompatibilityStatus
  message?: string
  showIcon?: boolean
  size?: "sm" | "default"
}

const statusConfig = {
  compatible: {
    variant: "compatible" as const,
    icon: Check,
    label: "Compatible",
  },
  warning: {
    variant: "warning" as const,
    icon: AlertTriangle,
    label: "Warning",
  },
  incompatible: {
    variant: "incompatible" as const,
    icon: X,
    label: "Incompatible",
  },
  unknown: {
    variant: "outline" as const,
    icon: HelpCircle,
    label: "Unknown",
  },
}

export function CompatibilityBadge({
  status,
  message,
  showIcon = true,
  size = "default",
}: CompatibilityBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const badge = (
    <Badge
      variant={config.variant}
      className={size === "sm" ? "text-xs px-1.5 py-0" : ""}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1"} />}
      {config.label}
    </Badge>
  )

  if (message) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">{message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
