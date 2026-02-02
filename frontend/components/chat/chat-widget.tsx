"use client"

import { useState, useMemo, useCallback } from "react"
import { Chat } from "react-instantsearch"
import { useBuildStore } from "@/stores/build-store"
import { AGENT_ID } from "@/lib/algolia"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  RotateCcw,
  Lightbulb,
} from "lucide-react"

// Generate a unique session ID
const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

/**
 * Custom loading component for chat messages
 */
function ChatLoader() {
  return (
    <div className="flex items-center gap-2 p-4 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm">Thinking...</span>
    </div>
  )
}

interface SuggestedPrompt {
  id: string
  label: string
  prompt: string
}

const suggestedPrompts: SuggestedPrompt[] = [
  {
    id: "gaming-cpu",
    label: "Best CPU for 1440p gaming under $350",
    prompt: "What's the best CPU for 1440p gaming under $350? I want good single-thread performance for high FPS in competitive games like CS2 and Valorant.",
  },
  {
    id: "4k-gpu",
    label: "GPU for 4K gaming with ray tracing",
    prompt: "What GPU should I get for 4K gaming with ray tracing enabled? I want to play AAA games at 60+ FPS. What pairs well with a high-end CPU?",
  },
  {
    id: "budget-1000",
    label: "Complete $1000 gaming build",
    prompt: "Help me build a complete gaming PC for around $1000. What components should I prioritize? I want to play modern games at 1080p high settings.",
  },
  {
    id: "budget-1500",
    label: "Complete $1500 gaming build",
    prompt: "I have a $1500 budget for a gaming PC. Can you recommend a full build with CPU, GPU, motherboard, RAM, PSU, and case that will handle 1440p gaming?",
  },
  {
    id: "psu-calc",
    label: "How to calculate PSU wattage",
    prompt: "How do I calculate the right PSU wattage for my PC build? What's the difference between 80+ Bronze, Gold, and Platinum? Recommend some reliable PSU brands.",
  },
  {
    id: "cpu-cooler",
    label: "CPU cooler recommendation",
    prompt: "What CPU cooler should I get? When do I need an AIO liquid cooler vs air cooler? What's a good budget cooler for a mid-range build?",
  },
  {
    id: "compatibility",
    label: "Check component compatibility",
    prompt: "What compatibility factors should I check when building a PC? How do I know if my CPU, motherboard, RAM, and case will all work together?",
  },
  {
    id: "ram-speed",
    label: "RAM speed and capacity guide",
    prompt: "How much RAM do I need for gaming? Does RAM speed matter? Should I get DDR4 or DDR5? What's the sweet spot for price to performance?",
  },
  {
    id: "streaming-build",
    label: "PC build for gaming + streaming",
    prompt: "I want to build a PC for gaming and streaming at the same time. What specs do I need? Should I prioritize more CPU cores or a better GPU?",
  },
  {
    id: "first-build",
    label: "Tips for first-time PC builder",
    prompt: "I'm building my first PC. What are the most common mistakes to avoid? Any tips for cable management and installation order?",
  },
]

/**
 * Chat Widget Component using Algolia Agent Studio
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState(() => generateSessionId())

  // Clear chat by clearing sessionStorage and generating new session ID
  const clearChat = useCallback(() => {
    // Clear Algolia's sessionStorage for chat messages
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('instantsearch-chat') || key.includes(AGENT_ID)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      // Ignore storage errors
    }
    // Generate new session ID to start fresh conversation
    setSessionId(generateSessionId())
  }, [])

  // Handle prompt selection from dropdown
  const handlePromptSelect = (promptId: string) => {
    const selectedPrompt = suggestedPrompts.find(p => p.id === promptId)
    if (selectedPrompt) {
      // Small delay to ensure dropdown closes first
      setTimeout(() => {
        const textarea = document.querySelector('[class*="ais-Chat"] textarea') as HTMLTextAreaElement
        if (textarea) {
          textarea.value = selectedPrompt.prompt
          textarea.dispatchEvent(new Event('input', { bubbles: true }))
          textarea.focus()
        }
      }, 50)
    }
  }

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
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={clearChat}
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
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
              {/* Quick Questions Dropdown */}
              <div className="p-2 border-b bg-muted/20">
                <Select onValueChange={handlePromptSelect}>
                  <SelectTrigger className="w-full h-9 text-xs">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Quick questions - select a topic" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {suggestedPrompts.map((prompt) => (
                      <SelectItem 
                        key={prompt.id} 
                        value={prompt.id}
                        className="text-xs py-2"
                      >
                        {prompt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algolia Chat Component */}
              <div className="flex-1 overflow-hidden chat-container">
                <Chat
                  key={sessionId}
                  agentId={AGENT_ID}
                  messagesLoaderComponent={ChatLoader}
                    classNames={{
                      root: "h-full flex flex-col",
                      container: "h-full flex flex-col",
                      header: {
                        root: "hidden", // Hide Algolia header, we use our custom one
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
                        disclaimer: "", // Remove disclaimer text
                      },
                      messages: {
                        loaderText: "Thinking...",
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
        /* Hide scroll-to-bottom button */
        .chat-container .ais-Chat-messages-scrollToBottom,
        .chat-container [class*="scrollToBottom"] {
          display: none !important;
        }
        /* Hide disclaimer/footer */
        .chat-container .ais-Chat-prompt-footer,
        .chat-container [class*="disclaimer"],
        .chat-container [class*="footer"]:not(.ais-Chat-message-footer) {
          display: none !important;
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
