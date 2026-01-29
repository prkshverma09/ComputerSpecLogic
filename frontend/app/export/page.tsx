"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useBuildStore } from "@/stores/build-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Cpu,
  ArrowLeft,
  Copy,
  Check,
  Download,
  Link as LinkIcon,
  FileText,
  Code,
  ExternalLink,
  Share2,
  AlertCircle,
} from "lucide-react"

type ExportFormat = "pcpartpicker" | "reddit" | "json" | "link"

interface ExportResult {
  formatted: string
  totalPrice: number
  componentCount: number
  shareUrl?: string
}

const formatInfo = {
  pcpartpicker: {
    label: "PCPartPicker",
    icon: FileText,
    description: "Markdown table format compatible with PCPartPicker",
  },
  reddit: {
    label: "Reddit",
    icon: ExternalLink,
    description: "Markdown table format perfect for Reddit posts",
  },
  json: {
    label: "JSON",
    icon: Code,
    description: "Full build data in JSON format for developers",
  },
  link: {
    label: "Share Link",
    icon: LinkIcon,
    description: "Generate a shareable URL to share your build",
  },
}

export default function ExportPage() {
  const { build, componentCount, totalPrice } = useBuildStore()
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("pcpartpicker")
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch export when format changes
  useEffect(() => {
    if (componentCount === 0) return

    const fetchExport = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/build/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ build, format: activeFormat }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to export build")
        }

        const result = await response.json()
        setExportResult(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to export build")
      } finally {
        setLoading(false)
      }
    }

    fetchExport()
  }, [build, activeFormat, componentCount])

  const handleCopy = async () => {
    if (!exportResult?.formatted) return

    try {
      await navigator.clipboard.writeText(exportResult.formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = exportResult.formatted
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!exportResult?.formatted) return

    const extension = activeFormat === "json" ? "json" : "md"
    const mimeType = activeFormat === "json" ? "application/json" : "text/markdown"
    const blob = new Blob([exportResult.formatted], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `spec-logic-build.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Component type labels
  const componentLabels: Record<string, string> = {
    cpu: "CPU",
    motherboard: "Motherboard",
    gpu: "Graphics Card",
    ram: "Memory",
    psu: "Power Supply",
    case: "Case",
    cooler: "CPU Cooler",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Spec-Logic</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/build" className="text-sm text-muted-foreground hover:text-foreground">
              Build
            </Link>
            <Link href="/export" className="text-sm font-medium">
              Export
            </Link>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        {/* Back Link */}
        <Link
          href="/build"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Builder
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Export Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Export Your Build</h1>
              <p className="text-muted-foreground mt-2">
                Share your build with friends or save it for later.
              </p>
            </div>

            {componentCount === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Components Selected</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add components to your build before exporting.
                  </p>
                  <Button asChild>
                    <Link href="/build">Go to Builder</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Format Tabs */}
                <Tabs
                  value={activeFormat}
                  onValueChange={(v) => setActiveFormat(v as ExportFormat)}
                >
                  <TabsList className="grid w-full grid-cols-4">
                    {(Object.keys(formatInfo) as ExportFormat[]).map((format) => {
                      const Icon = formatInfo[format].icon
                      return (
                        <TabsTrigger
                          key={format}
                          value={format}
                          className="flex items-center gap-1.5"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{formatInfo[format].label}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {(Object.keys(formatInfo) as ExportFormat[]).map((format) => (
                    <TabsContent key={format} value={format} className="mt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2">
                            {formatInfo[format].label} Format
                          </CardTitle>
                          <CardDescription>
                            {formatInfo[format].description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {loading ? (
                            <div className="animate-pulse space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4" />
                              <div className="h-4 bg-muted rounded w-1/2" />
                              <div className="h-4 bg-muted rounded w-2/3" />
                            </div>
                          ) : error ? (
                            <div className="text-destructive text-sm">{error}</div>
                          ) : exportResult ? (
                            <>
                              {format === "link" ? (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                    <input
                                      type="text"
                                      readOnly
                                      value={exportResult.formatted}
                                      className="flex-1 bg-transparent text-sm truncate focus:outline-none"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCopy}
                                    >
                                      {copied ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Anyone with this link can view your build configuration.
                                  </p>
                                </div>
                              ) : (
                                <ScrollArea className="h-[300px] w-full rounded-md border">
                                  <pre className="p-4 text-sm">
                                    <code>{exportResult.formatted}</code>
                                  </pre>
                                </ScrollArea>
                              )}
                            </>
                          ) : null}

                          {/* Action Buttons */}
                          {!loading && !error && exportResult && (
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                onClick={handleCopy}
                                variant="outline"
                                className="flex-1"
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy to Clipboard
                                  </>
                                )}
                              </Button>
                              {format !== "link" && (
                                <Button onClick={handleDownload} variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </>
            )}
          </div>

          {/* Build Summary Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Build Summary
                  <Badge variant="outline">{componentCount}/7 Components</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Component List */}
                <div className="space-y-3">
                  {(["cpu", "motherboard", "gpu", "ram", "psu", "case", "cooler"] as const).map(
                    (type) => {
                      const component = build[type]
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {componentLabels[type]}
                            </span>
                          </div>
                          {component ? (
                            <div className="text-right">
                              <p className="text-sm truncate max-w-[150px]">
                                {component.brand} {component.model}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${component.price_usd?.toFixed(2) || "N/A"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      )
                    }
                  )}
                </div>

                <Separator />

                {/* Total Price */}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Price</span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>

                <Separator />

                {/* Share Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => setActiveFormat("link")}
                    className="w-full"
                    variant={activeFormat === "link" ? "default" : "outline"}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Get Share Link
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/build">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Edit Build
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
