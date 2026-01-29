import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price as USD currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Format wattage with unit
 */
export function formatWattage(watts: number): string {
  return `${watts}W`;
}

/**
 * Format dimensions in mm
 */
export function formatDimension(mm: number): string {
  return `${mm}mm`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Generate a slugified string for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Delay execution (for debouncing)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get initials from brand/model for avatar fallback
 */
export function getInitials(brand: string, model: string): string {
  const brandInitial = brand.charAt(0).toUpperCase();
  const modelInitial = model.charAt(0).toUpperCase();
  return `${brandInitial}${modelInitial}`;
}

/**
 * Check if a value is defined and not null
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Calculate percentage with safe division
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format component type for display
 */
export function formatComponentType(type: string): string {
  const typeMap: Record<string, string> = {
    CPU: "CPU",
    GPU: "Graphics Card",
    Motherboard: "Motherboard",
    RAM: "Memory",
    PSU: "Power Supply",
    Case: "Case",
    Cooler: "CPU Cooler",
  };
  return typeMap[type] || type;
}

/**
 * Get color class for compatibility status
 */
export function getStatusColorClass(
  status: "compatible" | "warning" | "incompatible" | "unknown"
): string {
  const colorMap = {
    compatible: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    incompatible: "text-red-600 bg-red-50 border-red-200",
    unknown: "text-gray-600 bg-gray-50 border-gray-200",
  };
  return colorMap[status];
}

/**
 * Get icon name for component type
 */
export function getComponentIcon(type: string): string {
  const iconMap: Record<string, string> = {
    CPU: "cpu",
    GPU: "monitor",
    Motherboard: "circuit-board",
    RAM: "memory-stick",
    PSU: "zap",
    Case: "box",
    Cooler: "fan",
  };
  return iconMap[type] || "package";
}

/**
 * Parse comma-separated string to array
 */
export function parseArrayString(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  return value.split(",").map((s) => s.trim());
}

/**
 * Encode build state for URL sharing
 */
export function encodeBuildState(build: Record<string, unknown>): string {
  const json = JSON.stringify(build);
  return btoa(encodeURIComponent(json));
}

/**
 * Decode build state from URL
 */
export function decodeBuildState(
  encoded: string
): Record<string, unknown> | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
