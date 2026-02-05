/**
 * Simple in-memory rate limiter for API routes.
 * 
 * For production with multiple instances, consider using:
 * - @upstash/ratelimit with Redis
 * - rate-limiter-flexible with Redis/Memcached
 * 
 * This implementation is suitable for single-instance deployments
 * or as a first line of defense before external rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  
  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60 * 1000 }
): RateLimitResult {
  cleanup()
  
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }
  
  entry.count++
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  const realIP = request.headers.get("x-real-ip")
  if (realIP) {
    return realIP
  }
  
  return "unknown"
}

export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  }
}
