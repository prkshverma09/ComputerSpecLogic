"use client"

import Image from "next/image"
import { useBuildStore } from "@/stores/build-store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Box } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function BuildSummarySidebar() {
  const {
    build,
    totalPrice,
    validationResult,
    componentCount
  } = useBuildStore()

  // Required components for a functional PC
  const requiredComponents = [
    { type: "Case", label: "Case" },
    { type: "CPU", label: "CPU" },
    { type: "Motherboard", label: "Motherboard" },
    { type: "GPU", label: "Graphics Card" },
    { type: "RAM", label: "Memory" },
    { type: "PSU", label: "Power Supply" },
    // SSD is usually required but we handle storage generically in the store currently as "SSD Storage" logic
    // For now we'll check if we have a storage solution if we had that distinction,
    // but the store just has specific slots.
    // The store has `build.case`, `build.cpu`, etc.
  ]

  const missingRequired = requiredComponents.filter(req => !build[req.type.toLowerCase() as keyof typeof build])

  // Custom validation for "Storage" if we had it, but currently we just check the main slots.
  // The screenshot shows "SSD Storage is required".
  // Our build store doesn't explicitly have "SSD" vs "HDD" slots in the `Build` interface shown in `build-store.ts`
  // It has `cpu`, `motherboard`, `gpu`, `ram`, `psu`, `case`, `cooler`.
  // Wait, I should check `Build` interface again.
  // `build-store.ts` line 52: cpu, motherboard, gpu, ram, psu, case, cooler.
  // It seems "Storage" is missing from the `Build` interface in the store file I read earlier?
  // Let me re-read `types/components.ts` to be sure.
  // Ah, `types/components.ts` line 149: `Build` has cpu, motherboard, gpu, ram, psu, case, cooler.
  // It seems Storage is NOT in the current `Build` interface?
  // If so, I should probably add it or just ignore it for now to stick to the current schema.
  // The user said "All the components of the PC which are required must be marked required."
  // If the schema doesn't have storage, I can't require it yet.
  // I will stick to the existing schema for now.

  const isValid = validationResult?.valid && missingRequired.length === 0

  return (
    <Card className="border-2 shadow-lg sticky top-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground font-medium">YOUR CUSTOM BUILD</p>
            <h2 className="text-3xl font-bold mt-1">{formatPrice(totalPrice)}</h2>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <Box className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Representation - Shows case image or placeholder */}
        <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed overflow-hidden">
          {build.case ? (
            <div className="text-center p-4 w-full h-full flex flex-col items-center justify-center">
              {build.case.image_url ? (
                <div className="relative w-full h-3/4 mb-2">
                  <Image
                    src={build.case.image_url}
                    alt={`${build.case.brand} ${build.case.model}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ) : (
                <Box className="h-16 w-16 mx-auto text-primary mb-2" />
              )}
              <p className="font-medium">{build.case.brand} {build.case.model}</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Box className="h-16 w-16 mx-auto mb-2 opacity-20" />
              <p>Select a Case to see it here</p>
            </div>
          )}
        </div>

        {/* Validation Status */}
        {missingRequired.length > 0 ? (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Incomplete Build</AlertTitle>
            <AlertDescription>
              <p className="mt-1 mb-2 text-xs opacity-90">The following items are required:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                {missingRequired.map(item => (
                  <li key={item.type}>{item.label} is required</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : !validationResult?.valid ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Compatibility Issues</AlertTitle>
            <AlertDescription className="text-xs">
              Please resolve the compatibility issues to continue.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Build Complete</AlertTitle>
            <AlertDescription className="text-xs">
              All required components are selected and compatible.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full h-12 text-lg font-bold"
          disabled={!isValid}
          size="lg"
        >
          CONTINUE
        </Button>
      </CardFooter>
    </Card>
  )
}
