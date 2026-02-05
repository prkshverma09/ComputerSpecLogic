# Security Guide for Spec-Logic

This document outlines security measures implemented and recommendations for production deployment.

## Security Measures Implemented

### 1. Environment Variables & Secrets

- **No hardcoded secrets**: All sensitive credentials (API keys, tokens) are loaded from environment variables
- **`.env` files ignored**: All `.env` files except `.env.example` are in `.gitignore`
- **Admin keys separated**: `ALGOLIA_ADMIN_KEY` is only used in the backend; frontend uses read-only search keys

### 2. HTTP Security Headers

The following security headers are configured in `next.config.js`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-XSS-Protection` | `1; mode=block` | XSS filter (legacy browsers) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | Restricts camera, microphone, geolocation | Limits browser features |
| `Content-Security-Policy` | Restricts script/style/connect sources | Prevents XSS and data injection |

### 3. API Security

- **Rate limiting**: All API routes implement rate limiting (30-60 requests/minute per IP)
- **Input validation**: Request bodies are validated for structure, types, and size limits
- **Request size limits**: Maximum request body size enforced (100KB)
- **Error handling**: Generic error messages returned to clients; detailed errors logged server-side

### 4. Backend Security

- **Dependency pinning**: All Python dependencies have pinned versions in `requirements.txt`
- **Path validation**: File output paths are validated to prevent directory traversal
- **No unsafe operations**: No use of `eval()`, `exec()`, `pickle`, or shell commands with user input

## Pre-Deployment Checklist

Before deploying to production, verify the following:

### Environment Variables

```bash
# Backend (.env)
ALGOLIA_APP_ID=<your-app-id>
ALGOLIA_ADMIN_KEY=<your-admin-key>  # NEVER expose this publicly
ALGOLIA_INDEX_NAME=prod_components
EXA_API_KEY=<your-exa-key>          # Optional, for image enrichment

# Frontend (.env.local)
NEXT_PUBLIC_ALGOLIA_APP_ID=<your-app-id>
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=<your-search-key>  # Read-only key only
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=prod_components
NEXT_PUBLIC_AGENT_ID=<your-agent-id>
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Security Verification

- [ ] No `.env` files committed to repository
- [ ] All secrets rotated if previously exposed
- [ ] `ALGOLIA_ADMIN_KEY` not present in frontend environment
- [ ] HTTPS enforced in production
- [ ] CSP header allows only necessary domains
- [ ] Rate limiting configured appropriately for expected traffic

## Production Recommendations

### 1. Upgrade Dependencies

Before deployment, update to the latest secure versions:

```bash
# Frontend - update Next.js (addresses CVE-2025-29927)
cd frontend
npm update next react react-dom

# Backend - verify no vulnerabilities
cd backend
pip install pip-audit
pip-audit
```

### 2. Enhanced Rate Limiting

For high-traffic production deployments, replace the in-memory rate limiter with a distributed solution:

```bash
# Option 1: Upstash Redis (recommended for serverless)
npm install @upstash/ratelimit @upstash/redis

# Option 2: Redis with rate-limiter-flexible
npm install rate-limiter-flexible ioredis
```

### 3. Authentication (If Needed)

For user-specific features, consider adding:

- NextAuth.js for authentication
- JWT validation for API routes
- CSRF token validation for state-changing operations

### 4. Monitoring

Set up monitoring for security events:

- Failed authentication attempts
- Rate limit violations
- Unusual API usage patterns
- Error rate spikes

### 5. Additional Security Layers

Consider adding:

- **WAF (Web Application Firewall)**: Cloudflare, AWS WAF, or similar
- **DDoS protection**: Cloudflare, AWS Shield
- **Dependency scanning**: Dependabot, Snyk, or npm audit in CI/CD
- **SAST scanning**: CodeQL, Semgrep, or similar in CI/CD

## Security Contacts

If you discover a security vulnerability, please report it responsibly by:

1. Opening a private security advisory on GitHub
2. Emailing the maintainers directly

Do not open public issues for security vulnerabilities.

## Changelog

| Date | Change |
|------|--------|
| 2026-02-05 | Initial security implementation |
| 2026-02-05 | Added rate limiting to all API routes |
| 2026-02-05 | Added security headers to Next.js config |
| 2026-02-05 | Pinned Python dependencies |
| 2026-02-05 | Fixed path traversal in report script |
