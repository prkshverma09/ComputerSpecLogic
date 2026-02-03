"use client"

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Send, Lightbulb, Loader2 } from "lucide-react"

export interface QuickPrompt {
  id: string
  label: string
  prompt: string
}

interface ChatComboboxInputProps {
  presets: QuickPrompt[]
  onSubmit: (value: string) => void
  placeholder?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function ChatComboboxInput({
  presets,
  onSubmit,
  placeholder = "Ask about PC builds, compatibility...",
  disabled = false,
  isLoading = false,
  className,
}: ChatComboboxInputProps) {
  const [value, setValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const filteredPresets = presets.filter(
    (preset) =>
      preset.label.toLowerCase().includes(value.toLowerCase()) ||
      preset.prompt.toLowerCase().includes(value.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  const handleSelectPreset = useCallback((preset: QuickPrompt) => {
    setValue(preset.prompt)
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmedValue = value.trim()
    if (trimmedValue && !disabled && !isLoading) {
      onSubmit(trimmedValue)
      setValue("")
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }, [value, disabled, isLoading, onSubmit])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        setHighlightedIndex((prev) =>
          prev < filteredPresets.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0 && filteredPresets[highlightedIndex]) {
          handleSelectPreset(filteredPresets[highlightedIndex])
        } else if (!isOpen || highlightedIndex < 0) {
          handleSubmit()
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case "Tab":
        setIsOpen(false)
        break
    }
  }

  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!listboxRef.current?.contains(relatedTarget)) {
      setTimeout(() => setIsOpen(false), 150)
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listboxRef.current) {
      const highlightedElement = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement && typeof highlightedElement.scrollIntoView === 'function') {
        highlightedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  const isSubmitDisabled = !value.trim() || disabled || isLoading

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="preset-suggestions"
            aria-autocomplete="list"
            aria-label="Ask a question or type to filter suggestions"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full min-h-[44px] px-4 py-3 pr-10",
              "border-1.5 border-border rounded-xl",
              "bg-background text-foreground text-sm",
              "placeholder:text-muted-foreground",
              "transition-all duration-200",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          {value.length === 0 && !disabled && (
            <Lightbulb 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
              aria-hidden="true"
            />
          )}
        </div>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          aria-label="Send message"
          className={cn(
            "h-[44px] w-[44px] p-0 rounded-xl shrink-0",
            "transition-all duration-200"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" data-testid="loading-indicator" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {isOpen && !disabled && (
        <ul
          ref={listboxRef}
          id="preset-suggestions"
          role="listbox"
          aria-label="Preset question suggestions"
          className={cn(
            "absolute bottom-full left-0 right-0 mb-2",
            "max-h-[200px] overflow-y-auto",
            "bg-popover border border-border rounded-lg shadow-lg",
            "z-50"
          )}
        >
          {filteredPresets.length > 0 ? (
            filteredPresets.map((preset, index) => (
              <li
                key={preset.id}
                role="option"
                aria-selected={highlightedIndex === index}
                data-highlighted={highlightedIndex === index ? "true" : "false"}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectPreset(preset)
                }}
                className={cn(
                  "px-3 py-2.5 cursor-pointer text-sm",
                  "transition-colors duration-100",
                  highlightedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">{preset.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-5.5 truncate">
                  {preset.prompt}
                </p>
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              No suggestions found. Type your question and press Enter.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
