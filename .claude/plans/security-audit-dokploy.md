# Security Audit & Dokploy Deployment Plan

## Current Status
The RPNMore website is functionally complete (blog, CMS, Telegram bot, multi-page frontend, Docker). Before Dokploy deployment, a security hardening pass is required.

---

## CRITICAL Vulnerabilities Found (Must Fix)

### 1. XSS (Cross-Site Scripting) — SEVERITY: CRITICAL
**Files:** `main.js`, `backend/admin/dashboard.js`
**Issue:** All `render*` functions (`renderBlogPost`, `renderCarCard`, `renderPropertyCard`, `renderTestimonial`, `renderBook`, `formatCell`) use `innerHTML` with unsanitized database content. A malicious blog post like `<img src=x onerror=alert(document.cookie)>` would execute JavaScript in every visitor's browser.
**Fix:** Add an HTML escape function and sanitize all injected values before `innerHTML`.

### 2. No Rate Limiting — SEVERITY: CRITICAL
**Files:** `server.js`, `routes/leads.js`
**Issue:** No rate limits on `/api/auth/login`, `/api/leads/*`, or CMS endpoints. Attackers can:
- Brute-force the admin password
- Spam thousands of fake leads (DoS + database bloat)
- Flood Telegram bot webhooks
**Fix:** Install `express-rate-limit` and apply strict limits to auth (5 attempts/15 min) and leads (20 submissions/hour per IP).

### 3. CORS Too Permissive — SEVERITY: HIGH
**File:** `server.js:24`
**Issue:** `cors({ origin: true, credentials: true })` allows ANY website to make authenticated requests using the user's session cookies.
**Fix:** Restrict CORS to the production domain only. For a public API with no cross-origin needs, remove CORS entirely or set `origin` to the exact domain.

### 4. Missing Security Headers — SEVERITY: HIGH
**File:** `server.js`
**Issue:** No Helmet.js. Missing:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `Referrer-Policy`
**Fix:** Install `helmet` middleware.

### 5. Session Cookie Security — SEVERITY: HIGH
**File:** `server.js:59-70`
**Issue:**
- `resave: true` — unnecessary session writes
- `saveUninitialized: true` — creates sessions for every visitor
- Missing `sameSite` attribute — enables CSRF attacks
- Weak default `SESSION_SECRET: 'default-secret-change-me'`
**Fix:** Set `resave: false`, `saveUninitialized: false`, add `sameSite: 'strict'`, enforce a strong SESSION_SECRET in production.

### 6. No Input Validation — SEVERITY: MEDIUM
**Files:** `routes/leads.js`, `routes/cms.js`
**Issue:** `req.body` is passed directly to Prisma without validation. Attackers can inject extra fields, malformed data, or extremely long strings.
**Fix:** Add basic validation — required fields, max length checks, type coercion for booleans.

### 7. Error Information Leakage — SEVERITY: MEDIUM
**Files:** `routes/leads.js`, `routes/cms.js`, `server.js`
**Issue:** Raw Prisma/database error messages are returned to the client (e.g., `res.status(500).json({ error: err.message })`). This leaks database schema and internal paths.
**Fix:** Return generic "Internal server error" to clients, log the real error server-side.

### 8. Default Admin Credentials — SEVERITY: MEDIUM
**File:** `middleware/auth.js:19-20`
**Issue:** Falls back to `admin` / `admin` if `ADMIN_PASSWORD_HASH` is not set.
**Fix:** Remove the fallback. If credentials are not configured, return 401 with a clear message.

---

## Deployment Plan (Dokploy UI)

### Step 1: Fix all vulnerabilities (this session)
- Fix XSS in `main.js` and `dashboard.js`
- Add rate limiting to `server.js`
- Restrict CORS
- Add Helmet security headers
- Harden session cookies
- Add input validation
- Sanitize error responses
- Remove default admin fallback

### Step 2: Environment Variables for Dokploy
Required env vars to set in Dokploy UI:
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — 64+ character random string
- `ADMIN_USERNAME` — admin login username
- `ADMIN_PASSWORD_HASH` — bcrypt hash (generate with `node scripts/hash-password.js`)
- `TELEGRAM_BOT_TOKEN` — bot token from BotFather
- `APP_URL` — production domain (e.g., `https://rpnmore.com`)
- `TELEGRAM_WEBHOOK_SECRET` — random string for webhook validation
- `NODE_ENV=production`
- `SECURE_COOKIES=true`

### Step 3: Dokploy UI Setup
1. Create new project → select "Git" source → paste repo URL
2. Add PostgreSQL service (or use external DB)
3. Set all environment variables above
4. Build command: Docker Compose or Dockerfile
5. Expose port 3000
6. Set domain/SSL
7. Deploy

### Step 4: Post-Deployment
- Run migrations via Dokploy console or init script
- Verify Telegram webhook auto-registered
- Test admin login
- Verify SSL/HTTPS

---

## Files to Modify
1. `main.js` — add `escapeHtml()` helper, sanitize all render functions
2. `backend/admin/dashboard.js` — add `escapeHtml()`, sanitize table/form output
3. `backend/src/server.js` — add helmet, rate-limit, CORS fix, session hardening, error sanitization
4. `backend/src/middleware/auth.js` — remove default admin fallback
5. `backend/src/routes/leads.js` — add input validation, sanitize errors
6. `backend/src/routes/cms.js` — add input validation, sanitize errors
7. `backend/src/routes/telegram.js` — add input sanitization for title/content
8. `docker-compose.yml` — remove hardcoded secrets (keep only for local dev reference)
9. `package.json` (backend) — add `express-rate-limit` and `helmet` dependencies
