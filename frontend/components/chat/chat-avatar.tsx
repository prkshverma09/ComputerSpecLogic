"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatAvatarProps {
  role: "user" | "assistant"
  className?: string
}

export function ChatAvatar({ role, className }: ChatAvatarProps) {
  const isAssistant = role === "assistant"

  return (
    <Avatar
      className={cn(
        "h-8 w-8 shrink-0",
        isAssistant
          ? "bg-gradient-to-br from-primary to-primary/80"
          : "bg-gradient-to-br from-slate-600 to-slate-700",
        className
      )}
    >
      <AvatarFallback
        className={cn(
          "text-white",
          isAssistant
            ? "bg-gradient-to-br from-primary to-primary/80"
            : "bg-gradient-to-br from-slate-600 to-slate-700"
        )}
      >
        {isAssistant ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  )
}
