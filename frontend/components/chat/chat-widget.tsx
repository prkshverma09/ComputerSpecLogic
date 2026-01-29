"use client"

import { useState, useMemo } from "react"
import { Chat } from "react-instantsearch"
import { useBuildStore } from "@/stores/build-store"
import { AGENT_ID } from "@/lib/algolia"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Cpu,
  Zap,
  HelpCircle,
  ChevronUp,
  Sparkles,
} from "lucide-react"

interface SuggestedPrompt {
  icon: React.ElementType
  label: string
  prompt: string
}

const suggestedPrompts: SuggestedPrompt[] = [
  {
    icon: Cpu,
    label: "Gaming CPU",
    prompt: "What CPU should I get for gaming under $300?",
  },
  {
    icon: Zap,
    label: "PSU Check",
    prompt: "Do I have enough PSU wattage for my build?",
  },
  {
    icon: HelpCircle,
    label: "Compatibility",
    prompt: "Is my current build compatible?",
  },
]

/**
 * Chat Widget Component using Algolia Agent Studio
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  // Don't render if no agent configured
  if (!AGENT_ID) {
    return null
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border rounded-xl shadow-2xl transition-all duration-300 overflow-hidden",
            isMinimized
              ? "bottom-4 right-4 w-72 h-14"
              : "bottom-4 right-4 w-[400px] h-[600px] max-h-[80vh]"
          )}
        >
          {/* Custom Header */}
          <div className="flex items-center justify-between p-3 border-b bg-background">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium">PC Build Assistant</h3>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">Powered by Algolia AI</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="h-[calc(100%-60px)] flex flex-col">
              {/* Suggested Prompts */}
              {showSuggestions && (
                <div className="p-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Quick questions</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          // Find the textarea and fill it
                          const textarea = document.querySelector('[class*="ais-Chat"] textarea') as HTMLTextAreaElement
                          if (textarea) {
                            textarea.value = prompt.prompt
                            textarea.dispatchEvent(new Event('input', { bubbles: true }))
                            textarea.focus()
                          }
                        }}
                      >
                        <prompt.icon className="h-3 w-3 mr-1" />
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Algolia Chat Component */}
              <div className="flex-1 overflow-hidden chat-container">
                <Chat
                  agentId={AGENT_ID}
                  classNames={{
                    root: "h-full flex flex-col",
                    container: "h-full flex flex-col",
                    header: {
                      root: "hidden", // We use our custom header
                    },
                    messages: {
                      root: "flex-1 overflow-hidden",
                      content: "p-3 space-y-3",
                      scroll: "h-full overflow-y-auto",
                    },
                    message: {
                      root: "max-w-[85%] rounded-lg p-3 text-sm",
                    },
                    prompt: {
                      root: "p-3 border-t",
                      textarea: "w-full min-h-[40px] max-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none",
                      submit: "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50",
                    },
                    toggleButton: {
                      root: "hidden", // We use our custom toggle
                    },
                  }}
                  translations={{
                    header: {
                      title: "PC Build Assistant",
                    },
                    prompt: {
                      textareaPlaceholder: "Ask about PC builds, compatibility, or recommendations...",
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global styles for chat */}
      <style jsx global>{`
        .chat-container .ais-Chat {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .chat-container .ais-Chat-messages {
          flex: 1;
          overflow-y: auto;
        }
        .chat-container .ais-Chat-message--user {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          margin-left: auto;
        }
        .chat-container .ais-Chat-message--assistant {
          background-color: hsl(var(--muted));
        }
        .chat-container .ais-Chat-prompt {
          border-top: 1px solid hsl(var(--border));
        }
      `}</style>
    </>
  )
}

/**
 * Build Context Provider for chat - provides current build info to agent
 */
export function useBuildContextForChat() {
  const { build, totalPrice, totalTdp, validationResult, componentCount } = useBuildStore()

  return useMemo(() => {
    const components: string[] = []
    
    if (build.cpu) {
      components.push(`CPU: ${build.cpu.brand} ${build.cpu.model}`)
    }
    if (build.motherboard) {
      components.push(`Motherboard: ${build.motherboard.brand} ${build.motherboard.model}`)
    }
    if (build.gpu) {
      components.push(`GPU: ${build.gpu.brand} ${build.gpu.model}`)
    }
    if (build.ram) {
      components.push(`RAM: ${build.ram.brand} ${build.ram.model}`)
    }
    if (build.psu) {
      components.push(`PSU: ${build.psu.brand} ${build.psu.model}`)
    }
    if (build.case) {
      components.push(`Case: ${build.case.brand} ${build.case.model}`)
    }
    if (build.cooler) {
      components.push(`Cooler: ${build.cooler.brand} ${build.cooler.model}`)
    }

    return {
      components,
      totalPrice,
      totalTdp,
      issues: validationResult?.issues || [],
      componentCount,
    }
  }, [build, totalPrice, totalTdp, validationResult, componentCount])
}
