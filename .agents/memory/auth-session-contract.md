---
name: Auth session contract
description: The session-user shape every auth method must satisfy, and the endpoint split between web session auth and mobile JWT auth.
---

# Auth session contract

Every backend route authorizes via `req.user.claims.sub` (and reads no other
`claims.*` field). So whatever auth mechanism is in place, the logged-in session
user MUST be shaped:

```
{ claims: { sub, email, first_name, last_name, profile_image_url }, expires_at } 
```

`server/replitAuth.ts` (name kept for import stability) implements session-based
email/password auth using passport sessions + `req.login()`. It exports
`getSession`, `setupAuth`, `isAuthenticated` — those names are imported by
`routes.ts`, `paymentRoutes.ts`, `pushRoutes.ts`, `subscriptionRoutes.ts`, so
keep them.

**Endpoint split (deliberate, to avoid collisions):**
- Web session auth: `POST /api/login`, `POST /api/register`, `GET /api/logout`,
  `POST /api/forgot-password`, `POST /api/reset-password`.
- Mobile/JWT auth (`server/mobileAuth.ts`): `/api/auth/*`.

**Password reset (forgot-password):** `forgot-password` always returns the same
generic 200 (no account enumeration). Tokens stored as sha256 hash in
`password_reset_tokens` (never plaintext); the plaintext is only emailed. Single-
use (usedAt) + 1h TTL. Email delivery in `server/email.ts` sends via Resend if
`RESEND_API_KEY` is set, otherwise logs the reset link to the server console — it
never throws, so callers can't infer delivery status. This is the migration path
for legacy OIDC-era users who have an email but no `passwordHash`.

**Why:** Replit OIDC was dropped because it does not work on the custom domain
(foulpay.co.uk). OIDC required `/api/login` GET redirects; that path is now a
JSON POST, and the landing page navigates to the client `/login` page instead.

**How to apply:**
- `SESSION_SECRET` must be set in production — `getSession()` throws on boot if
  missing in production (only dev gets a static fallback). It is already set as a
  Fly secret on app `finetrackpro`.
- Session cookie: `httpOnly`, `secure` only in production, `sameSite: 'lax'`,
  `trust proxy 1` (behind Cloudflare/Fly).
- `/api/auth/user` strips `passwordHash` before returning the user.
- Legacy OIDC-era users (no `passwordHash`) cannot log in with a password; a
  reset/migration flow would be needed if such users exist (prod DB was fresh at
  launch, so this was acceptable).
