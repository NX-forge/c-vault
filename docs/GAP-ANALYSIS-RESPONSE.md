# Gap Analysis Response

A 140-item production-readiness review was run against this repo. This doc is the honest triage: what was actually wrong and got fixed, what the report got wrong, and what's deliberately deferred (with why) rather than silently ignored.

**Context that matters**: this is a hackathon MVP for a July 31 submission deadline, not a funded SaaS product. The report's own estimate for full remediation is 17-24 weeks and $34-48k with a full-time developer. Treating that as a pre-submission checklist would be a mistake — most of it is a legitimate *post-hackathon* roadmap.

## Fixed this pass

| Item | Fix |
|---|---|
| No `updatedAt` fields | Added to `User`, `Project`, `Outline`, `Chapter` (the mutable models). `Version` deliberately excluded — see "already correct" below. |
| Rate limiting only on AI routes | Extended to login (per-email, brute-force protection), registration, project creation, chapter save, export, and IPFS anchoring. |
| No error boundaries | Added `src/app/error.tsx` (route-level) and `src/app/global-error.tsx` (root-layout-level). |
| No auto-save | Added local draft recovery (debounced `localStorage`, restore/discard banner) — see rationale below for why this isn't server-side version autosave. |
| No word/character/reading-time count | Added under the editor. |
| Weak password minimum | Bumped from 8 to 10 characters. |
| Missing `WATSONX_MODEL_ID` in `.env.example` | Added (previous pass). |

## The report got these wrong — verified against the actual code

| Claim | Reality |
|---|---|
| "No confirmation dialogs for destructive actions" | They exist — `ProjectSettingsForm` confirms before making a project public, exporting, and deleting. |
| "No XSS sanitization for user content" | There is zero `dangerouslySetInnerHTML` anywhere in the codebase — all content renders through JSX text nodes, which React escapes by default. This isn't a real vulnerability in this app as built; it's a generic scanner finding that doesn't hold up against the actual rendering path. |
| "No loading skeletons (basic skeleton exists)" | The report contradicts itself here — skeletons exist for dashboard, project, and creator-profile routes. |

## Deliberately not done — and why

**Auto-save that creates a `Version` on every keystroke pause** was considered and rejected, not overlooked. The whole point of the hash-chain provenance feature is that each `Version` is a meaningful, human-reviewed checkpoint. Auto-saving to the provenance chain every few seconds while typing would flood the timeline with noise and undermine the feature this project is actually differentiated on. Instead: local draft recovery protects against browser crashes, and "Save version" stays the deliberate checkpoint action.

**Everything requiring an external paid service or account**: OAuth providers, email verification/password reset (needs a transactional email provider), 2FA, Stripe/payment processing, Sentry/analytics, a CDN. These need the user's own accounts and business decisions (pricing, which provider) — not something to wire up silently.

**Everything that's a business/legal decision, not a code gap**: pricing tiers, payout systems, tax handling, privacy policy, ToS, GDPR data export/deletion, cookie consent. Real requirements for a real launch; not fixable by writing code without those decisions being made first.

**Infrastructure**: Docker, Kubernetes, CI/CD pipelines, backup/disaster-recovery strategy. Legitimate for a production deployment; irrelevant to a Vercel-hosted hackathon submission.

**Testing suite (unit/integration/E2E), monitoring, log aggregation**: genuinely valuable, genuinely not done. Worth doing right after submission, not as part of it — happy to scaffold a test suite on request.

**UI polish backlog**: toast notifications, breadcrumbs, keyboard shortcuts, search, pagination, dark-mode toggle, a full accessibility (ARIA/keyboard nav) pass, rich-text/markdown editing, image upload, spell/grammar check. All reasonable v2 items. None block a demo.

**Social/monetization features**: comments, ratings, follower system, analytics dashboard, SEO/Open Graph, RSS, newsletter integration, DOCX/HTML export, cover images, DRM/watermarking. Roadmap, not MVP.

## What this means for July 31

The core 8-step flow, the hash-chain provenance mechanism, IPFS anchoring, and PDF/EPUB export are real and working (pending your local `pnpm exec prisma generate` — see `STEPS.md`). The fixes in this pass close the gaps that were genuine risks *for a live demo* (crash-on-error, brute-forceable login, no data-loss protection while typing). Everything deferred above is fairly characterized as such in `README.md`'s roadmap section, not hidden.
