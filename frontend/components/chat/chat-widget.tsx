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
  RotateCcw,
  Lightbulb,
  User,
} from "lucide-react"

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

function AssistantAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
  )
}

function UserAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
      <User className="h-4 w-4 text-white" />
    </div>
  )
}

function ChatLoader() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </div>
  )
}

function cleanChatContent(container: HTMLElement) {
  function isProtectedElement(el: HTMLElement): boolean {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'BUTTON') {
      return true
    }
    if (el.closest('textarea, input, button, select, form, [role="combobox"], [role="listbox"]')) {
      return true
    }
    if (el.closest('.ais-Chat-prompt, .ais-ChatPrompt, [class*="prompt"]')) {
      return true
    }
    return false
  }

  const resultsPattern = /^\s*\d+\s+of\s+\d+\s+results?\s*$/i
  const resultsInlinePattern = /\d+\s+of\s+\d+\s+results?/gi
  const resultsStartPattern = /^\s*\d+\s+of\s+\d+\s+results?/i

  // FIRST: Hide duplicate assistant messages (keep only the first one for each response)
  const assistantMessages = container.querySelectorAll('[data-role="assistant"]')
  const seenMessages = new Set<string>()

  assistantMessages.forEach((msg) => {
    const htmlMsg = msg as HTMLElement
    const content = htmlMsg.textContent?.trim() || ''

    // Clean the content for comparison (remove tool result prefixes)
    const cleanedContent = content
      .replace(/^\d+\s+of\s+\d+\s+results?\s*/i, '')
      .replace(/^View\s+all\s*/i, '')
      .substring(0, 100)
      .toLowerCase()

    if (cleanedContent.length < 20) return

    if (seenMessages.has(cleanedContent)) {
      // This is a duplicate - hide it
      htmlMsg.style.setProperty('display', 'none', 'important')
    } else {
      seenMessages.add(cleanedContent)
    }
  })

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

  // Hide empty list items (from itemComponent returning empty)
  const listItems = container.querySelectorAll('li, ol, ul')
  listItems.forEach((item) => {
    const htmlItem = item as HTMLElement
    if (isProtectedElement(htmlItem)) return

    const textContent = htmlItem.textContent?.trim() || ''
    const hasVisibleContent = htmlItem.querySelector('img, svg, video, canvas, iframe')

    if (!textContent && !hasVisibleContent) {
      htmlItem.style.display = 'none'
    }
  })

  // Hide numbered lists that only contain numbers (empty item content)
  const orderedLists = container.querySelectorAll('ol')
  orderedLists.forEach((ol) => {
    const htmlOl = ol as HTMLElement
    if (isProtectedElement(htmlOl)) return

    const items = htmlOl.querySelectorAll('li')
    const allEmpty = Array.from(items).every(li => {
      const text = li.textContent?.trim() || ''
      return !text || /^\d+\.?\s*$/.test(text)
    })

    if (allEmpty && items.length > 0) {
      htmlOl.style.display = 'none'
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
}


interface QuickPrompt {
  id: string
  label: string
  prompt: string
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "gaming-cpu",
    label: "CPU for gaming PC",
    prompt: "What Intel CPUs do you have for gaming?",
  },
  {
    id: "gpu-for-build",
    label: "GPU for my build",
    prompt: "What NVIDIA graphics cards do you have?",
  },
  {
    id: "compatible-mobo",
    label: "Find a motherboard",
    prompt: "What motherboards are available?",
  },
  {
    id: "psu-for-build",
    label: "PSU for my system",
    prompt: "What power supplies do you have?",
  },
  {
    id: "cooling-solution",
    label: "Cooling for my CPU",
    prompt: "What CPU coolers do you have?",
  },
]

let globalSuggestionClickHandler: ((suggestion: string) => void) | null = null

function CustomSuggestions({ onSuggestionClick }: { suggestions?: string[], onSuggestionClick?: (suggestion: string) => void }) {
  useEffect(() => {
    if (onSuggestionClick) {
      globalSuggestionClickHandler = onSuggestionClick
    }
  }, [onSuggestionClick])

  return null
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [sessionId, setSessionId] = useState(() => generateSessionId())
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('instantsearch') || key.includes('chat') || key.includes(AGENT_ID)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      // Ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return

    const cleanup = () => {
      if (chatContainerRef.current) {
        cleanChatContent(chatContainerRef.current)
      }
    }

    cleanup()

    const intervalId = setInterval(cleanup, 500)

    const observer = new MutationObserver(() => {
      cleanup()
      setTimeout(cleanup, 200)
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

  const clearChat = useCallback(() => {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('instantsearch-chat') || key.includes(AGENT_ID)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {
      // Ignore storage errors
    }
    setSessionId(generateSessionId())
  }, [])

  const handlePromptSelect = useCallback((promptId: string) => {
    const selectedPrompt = QUICK_PROMPTS.find((p) => p.id === promptId)
    if (!selectedPrompt) return

    if (globalSuggestionClickHandler) {
      globalSuggestionClickHandler(selectedPrompt.prompt)
      return
    }

    const chatContainer = chatContainerRef.current
    if (!chatContainer) return

    const textarea = chatContainer.querySelector<HTMLTextAreaElement>(
      ".ais-ChatPrompt-textarea"
    )
    if (!textarea) return

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(textarea, selectedPrompt.prompt)
    } else {
      textarea.value = selectedPrompt.prompt
    }

    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.focus()
  }, [])

  if (!AGENT_ID) {
    return null
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div
          className={cn(
            "fixed z-50 bg-background border rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden",
            isMinimized
              ? "bottom-4 right-4 w-72 h-14"
              : "bottom-4 right-4 w-[420px] h-[620px] max-h-[85vh]"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">PC Build Assistant</h3>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">Powered by Algolia AI</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={clearChat}
                  title="New chat"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted"
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
                className="h-8 w-8 rounded-full hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="h-[calc(100%-60px)] flex flex-col">
              <div className="p-3 border-b bg-muted/20">
                <Select onValueChange={handlePromptSelect}>
                  <SelectTrigger className="w-full h-9 text-sm bg-background">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lightbulb className="h-4 w-4" />
                      <SelectValue placeholder="Quick questions..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_PROMPTS.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div ref={chatContainerRef} className="flex-1 overflow-hidden chat-container">
                <InstantSearch
                  key={sessionId}
                  searchClient={searchClient}
                  indexName={COMPONENTS_INDEX}
                >
                  <Chat
                    agentId={AGENT_ID}
                    messagesLoaderComponent={ChatLoader}
                    assistantMessageLeadingComponent={AssistantAvatar}
                    userMessageLeadingComponent={UserAvatar}
                    itemComponent={() => <></>}
                    suggestionsComponent={CustomSuggestions}
                    classNames={{
                      root: "ais-Chat-root h-full flex flex-col",
                      container: "ais-Chat-container h-full flex flex-col",
                      header: {
                        root: "hidden",
                      },
                      messages: {
                        root: "ais-Chat-messages flex-1 overflow-hidden",
                        content: "ais-Chat-messages-content p-4",
                        scroll: "ais-Chat-messages-scroll h-full overflow-y-auto",
                      },
                      message: {
                        root: "ais-Chat-message",
                        container: "ais-Chat-message-container",
                        leading: "ais-Chat-message-leading",
                        content: "ais-Chat-message-content",
                        message: "ais-Chat-message-text",
                      },
                      prompt: {
                        root: "ais-Chat-prompt p-3 border-t bg-background",
                        textarea: "ais-Chat-prompt-textarea",
                        submit: "ais-Chat-prompt-submit",
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
                          textareaPlaceholder: "Ask about PC builds, compatibility...",
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
    </>
  )
}

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
