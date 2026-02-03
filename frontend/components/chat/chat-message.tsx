"use client"

import { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChatAvatar } from "./chat-avatar"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
  content: string
  role: "user" | "assistant"
  isLoading?: boolean
}

export function ChatMessage({ content, role, isLoading }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isAssistant = role === "assistant"

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [content])

  if (isLoading) {
    return (
      <div className="flex gap-3 items-start">
        <ChatAvatar role="assistant" />
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="chat-message-assistant rounded-2xl rounded-tl-md p-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAssistant) {
    return (
      <div className="flex gap-3 items-start justify-end">
        <div className="chat-message-user rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        <ChatAvatar role="user" />
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start group">
      <ChatAvatar role="assistant" />
      <div className="flex-1 space-y-2 overflow-hidden min-w-0">
        <div className="chat-message-assistant rounded-2xl rounded-tl-md p-4 relative">
          <div className="chat-markdown prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-primary">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 ml-4 space-y-1 list-disc marker:text-primary/70">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 ml-4 space-y-1 list-decimal marker:text-primary/70">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-1">{children}</li>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className={cn("block p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto", className)} {...props}>
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="my-3 rounded-lg overflow-hidden">{children}</pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h3>
                ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 bg-muted font-medium text-left">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">{children}</td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          
          <div className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-background shadow-sm border"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
