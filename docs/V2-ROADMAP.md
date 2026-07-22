# C-Vault — V2 Roadmap

Everything deferred during the hackathon build, consolidated into one plan. Source material: `docs/GAP-ANALYSIS-RESPONSE.md` (the 140-item review triage) plus the smaller provenance/UX gaps noted along the way. Organized by what actually blocks real usage first, not by category size.

---

## Phase 1 — Trust & stability (do first, before inviting real users)

The MVP works for a demo. These are the gaps that matter the moment someone other than you is relying on it.

**Account security**
- [ ] Password reset flow (needs a transactional email provider — Resend, Postmark, SES)
- [ ] Email verification on signup
- [ ] OAuth providers (Google at minimum — reduces password-reset support burden too)
- [ ] Account lockout after repeated failed logins (rate limiting exists; lockout is a stronger follow-up)
- [ ] Two-factor authentication

**Data integrity**
- [ ] Soft deletes on `Project`/`Chapter` (hard deletes currently lose data permanently — add a `deletedAt` field and filter it everywhere instead of `prisma.delete`)
- [ ] Database connection pooling config for production load (PgBouncer or Prisma Accelerate)
- [ ] Migration rollback strategy documented before the first real production migration

**Provenance system follow-ups** (the core feature — worth hardening properly)
- [ ] Version diff/comparison view (side-by-side or inline diff between two versions)
- [ ] Version restore (revert a chapter to an earlier version — as a *new* version, not a mutation, to keep the chain intact)
- [ ] Version filtering in the timeline (by author type, by date range)
- [ ] Provenance export — a standalone, shareable proof document (hash chain + IPFS CIDs) independent of the app, for external verification
- [ ] CID format validation is done on the write path (`isLikelyValidCid`); add the same check anywhere a CID is read back in, defensively

**Reliability**
- [ ] Retry logic + timeout handling on watsonx.ai calls (currently a slow/flaky API call just fails the request)
- [ ] Fallback behavior when watsonx.ai is down (clear degraded-mode messaging, not a raw 500)
- [ ] Content moderation / prompt injection protection on AI inputs and outputs
- [ ] Token usage + cost tracking per user (important before opening this up beyond a controlled demo)

---

## Phase 2 — Editor & UX maturity

What separates a demo editor from one people actually write in daily.

- [ ] Undo/redo in the editor (currently only via browser-native textarea undo, which is fragile)
- [ ] Conflict resolution for concurrent edits (the version-number uniqueness constraint prevents *corruption*, but a real "someone else edited this, here's a merge view" UX is still missing)
- [ ] Rich text / Markdown rendering (editor is currently plain text)
- [ ] Image upload and embedding
- [ ] Spell check integration (can likely lean on the browser's native spellcheck first, before building anything custom)
- [ ] Toast notifications (replace the inline success/error text with a proper toast system)
- [ ] Confirmation-dialog upgrade — currently `window.confirm`; replace with in-app modals for a less jarring feel
- [ ] Accessibility pass: ARIA labels, full keyboard navigation, focus management in the editor and modals
- [ ] Search across projects/chapters
- [ ] Pagination (dashboard and creator profile will need this once anyone has more than a screenful of projects)
- [ ] Keyboard shortcuts (save, generate, navigate between chapters)
- [ ] Dark mode toggle (the CSS variables already support it — needs a UI control and persisted preference)
- [ ] Breadcrumb navigation for the projects → chapters hierarchy

---

## Phase 3 — Production infrastructure

Needed before a real deployment beyond Vercel + a Neon free tier.

- [ ] Automated tests: unit tests for `hash.ts`/`ipfs.ts`/`epub.ts`, integration tests for the API routes, at least one E2E pass through the 8-step flow
- [ ] CI/CD pipeline (GitHub Actions: lint + typecheck + test on every PR)
- [ ] Error tracking (Sentry) — `error.tsx`/`global-error.tsx` currently only `console.error`
- [ ] Analytics (product usage, not just errors)
- [ ] Uptime monitoring + alerting
- [ ] Health check endpoint (`/api/health`) for uptime monitors and deploy checks
- [ ] Backup strategy for the Postgres database
- [ ] API request size limits and basic DoS protections beyond the per-route rate limiting already in place
- [ ] Performance: image optimization, code splitting audit, query optimization pass (watch for N+1s as data grows), ISR/static generation where pages allow it

---

## Phase 4 — Monetization (the actual business model)

Premium chapters currently lock content in the UI only — no money moves. This is the phase that makes the product a business.

- [ ] Payment gateway integration (Stripe is the obvious default)
- [ ] Subscription management (creators subscribing readers, or a platform-level plan)
- [ ] Pricing tier configuration
- [ ] Payout system for creators
- [ ] Revenue tracking + a creator-facing analytics dashboard
- [ ] Refund handling
- [ ] Invoice generation, tax calculation (jurisdiction-dependent — needs real legal/accounting input, not just code)
- [ ] Affiliate/referral program (optional, lower priority within this phase)

---

## Phase 5 — Growth & social

Not required for the product to work — required for it to grow.

- [ ] Creator profile enhancements: social links, portfolio customization
- [ ] Follower/following system
- [ ] Comments/reviews on published work
- [ ] Ratings
- [ ] SEO: Open Graph tags, sitemap, structured data on public creator/project pages
- [ ] RSS feed per creator
- [ ] Newsletter integration for creator updates
- [ ] Additional export formats: DOCX, HTML
- [ ] Export polish: cover image support, TOC customization, DRM/watermarking, export history + download link expiration, export queue (so a very large book doesn't time out the request)

---

## Phase 6 — Compliance

Legal/business decisions first, code second. Don't start the code side until these are decided:

- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR: data export + account/data deletion flow
- [ ] Cookie consent (only needed once analytics/tracking cookies are actually added)
- [ ] Content moderation policy for public creator profiles

---

## Explicitly not planned

- **Auto-save into the provenance chain on every keystroke** — considered and rejected during the hackathon build, not an oversight. It would flood the version timeline and undermine the "meaningful checkpoint" design the whole feature depends on. Local draft recovery (already built) stays the answer to data loss; version restore (Phase 1) is the answer to "I want an old version back."

---

## Suggested next step after submission

Start with Phase 1's provenance follow-ups (diff, restore, filtering) — they extend the feature that actually differentiates this product — alongside the account-security items, since those two groups are what "real users, not just demo judges" most immediately need.
