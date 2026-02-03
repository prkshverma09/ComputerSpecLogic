"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { InstantSearch } from "react-instantsearch"
import { Chat } from "react-instantsearch"
import { useBuildStore } from "@/stores/build-store"
import { searchClient, COMPONENTS_INDEX, AGENT_ID } from "@/lib/algolia"
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

function cleanChatContent(container: HTMLElement) {
  function isProtectedElement(el: HTMLElement): boolean {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
      return true
    }
    if (el.closest('textarea, input, button, select, form, [role="combobox"], [role="listbox"]')) {
      return true
    }
    if (el.closest('.ais-Chat-prompt, [class*="prompt"]')) {
      return true
    }
    return false
  }

  const resultsPattern = /^\s*\d+\s+of\s+\d+\s+results?\s*$/i
  const resultsInlinePattern = /\d+\s+of\s+\d+\s+results?/gi

  const allElements = container.querySelectorAll('*')
  
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    
    if (isProtectedElement(htmlEl)) return
    
    const fullText = htmlEl.textContent?.trim() || ''
    const ownText = Array.from(htmlEl.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent?.trim())
      .join('')
    
    if (resultsPattern.test(ownText) || resultsPattern.test(fullText)) {
      htmlEl.style.display = 'none'
      return
    }
    
    if (/^View\s+all$/i.test(ownText) || /^View\s+all$/i.test(fullText)) {
      htmlEl.style.display = 'none'
      return
    }
  })

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement
      if (parent && isProtectedElement(parent)) {
        return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT
    }
  })
  
  const textNodes: Text[] = []
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node)
  }
  
  textNodes.forEach((textNode) => {
    if (textNode.textContent) {
      const original = textNode.textContent
      if (resultsInlinePattern.test(original)) {
        if (resultsPattern.test(original.trim())) {
          textNode.textContent = ''
          const parent = textNode.parentElement
          if (parent && !parent.textContent?.trim()) {
            parent.style.display = 'none'
          }
        } else {
          textNode.textContent = original.replace(resultsInlinePattern, '')
        }
      }
    }
  })

  removeDuplicateMessages(container)
}

function removeDuplicateMessages(container: HTMLElement) {
  function containsFormElements(el: HTMLElement): boolean {
    return el.querySelector('textarea, input, button, form, [role="combobox"]') !== null
  }
  
  const messageGroups = container.querySelectorAll('[class*="message--assistant"]')
  const seenPhrases = new Map<string, HTMLElement>()
  
  messageGroups.forEach((msg) => {
    const htmlEl = msg as HTMLElement
    
    if (containsFormElements(htmlEl)) return
    
    const fullText = htmlEl.textContent?.trim() || ''
    if (fullText.length < 50) return
    
    const phrase = fullText.substring(0, 150)
    
    if (seenPhrases.has(phrase)) {
      htmlEl.style.display = 'none'
    } else {
      seenPhrases.set(phrase, htmlEl)
    }
  })
}

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
    label: "CPU for gaming PC",
    prompt: "I'm building a gaming PC. What Intel CPUs do you have that would be good for gaming?",
  },
  {
    id: "gpu-for-build",
    label: "GPU for my build",
    prompt: "I need a GPU for my PC build. What NVIDIA graphics cards do you have available?",
  },
  {
    id: "compatible-mobo",
    label: "Find a motherboard",
    prompt: "I'm looking for a motherboard for my PC build. What motherboards do you have? Show me the socket types.",
  },
  {
    id: "psu-for-build",
    label: "PSU for my system",
    prompt: "I need a power supply for my PC build. What PSUs do you have and what wattage are they?",
  },
  {
    id: "cooling-solution",
    label: "Cooling for my CPU",
    prompt: "I need cooling for my PC build. What CPU coolers do you have available?",
  },
]

/**
 * Chat Widget Component using Algolia Agent Studio
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState(() => generateSessionId())
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return

    const cleanup = () => {
      if (chatContainerRef.current) {
        cleanChatContent(chatContainerRef.current)
      }
    }

    cleanup()
    
    const intervalId = setInterval(cleanup, 200)

    const observer = new MutationObserver(() => {
      cleanup()
      setTimeout(cleanup, 100)
      setTimeout(cleanup, 300)
    })

    observer.observe(chatContainerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      clearInterval(intervalId)
    }
  }, [isOpen, sessionId])

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
              <div className="p-2 border-b bg-muted/20 relative z-[60]">
                <Select onValueChange={handlePromptSelect}>
                  <SelectTrigger className="w-full h-9 text-xs bg-background">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Quick questions - select a topic" />
                    </div>
                  </SelectTrigger>
                  <SelectContent 
                    className="max-h-[300px]"
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    avoidCollisions={true}
                  >
                    {suggestedPrompts.map((prompt) => (
                      <SelectItem 
                        key={prompt.id} 
                        value={prompt.id}
                        className="text-xs py-2 cursor-pointer"
                      >
                        {prompt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algolia Chat Component */}
              <div ref={chatContainerRef} className="flex-1 overflow-hidden chat-container">
                <InstantSearch searchClient={searchClient} indexName={COMPONENTS_INDEX}>
                  <Chat
                    key={sessionId}
                    agentId={AGENT_ID}
                    messagesLoaderComponent={ChatLoader}
                    itemComponent={() => null}
                    classNames={{
                      root: "h-full flex flex-col",
                      container: "h-full flex flex-col",
                      header: {
                        root: "hidden",
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
                        root: "hidden",
                      },
                    }}
                    translations={{
                        header: {
                          title: "PC Build Assistant",
                        },
                        prompt: {
                          textareaPlaceholder: "Ask about PC builds, compatibility, or recommendations...",
                          disclaimer: "",
                        },
                        messages: {
                          loaderText: "Thinking...",
                        },
                      }}
                  />
                </InstantSearch>
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
        /* Hide the entire tool call display section (Arguments, Results, etc) */
        .chat-container [class*="toolCall"],
        .chat-container [class*="tool-call"],
        .chat-container [class*="ToolCall"],
        .chat-container [class*="tool_call"],
        .chat-container [class*="toolResult"],
        .chat-container [class*="tool-result"],
        .chat-container [class*="ToolResult"],
        .chat-container [class*="toolUse"],
        .chat-container [class*="tool-use"],
        .chat-container [data-tool],
        .chat-container [data-tool-call],
        .chat-container [data-tool-result] {
          display: none !important;
        }
        /* Hide details/summary elements that wrap tool calls */
        .chat-container details,
        .chat-container summary {
          display: none !important;
        }
        /* Hide "X of Y results" and "View All" elements */
        .chat-container [class*="results-count"],
        .chat-container [class*="resultsCount"],
        .chat-container [class*="view-all"],
        .chat-container [class*="viewAll"],
        .chat-container [class*="ViewAll"],
        .chat-container [class*="showMore"],
        .chat-container [class*="show-more"],
        .chat-container a[href*="view-all"],
        .chat-container a[href*="search"]:not(textarea) {
          display: none !important;
        }
        /* Hide stats */
        .chat-container .ais-Stats,
        .chat-container [class*="Stats"],
        .chat-container [class*="stats"] {
          display: none !important;
        }
        /* Hide elements containing "X of Y results" pattern - target by data attribute we'll add */
        .chat-container [data-results-count="true"] {
          display: none !important;
        }
        /* Style the message content nicely */
        .chat-container .ais-Chat-message--assistant p {
          margin-bottom: 0.5rem;
        }
        .chat-container .ais-Chat-message--assistant ul,
        .chat-container .ais-Chat-message--assistant ol {
          margin-left: 1rem;
          margin-bottom: 0.5rem;
        }
        .chat-container .ais-Chat-message--assistant li {
          margin-bottom: 0.25rem;
        }
        .chat-container .ais-Chat-message--assistant strong {
          font-weight: 600;
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
