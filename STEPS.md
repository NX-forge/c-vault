# C-Vault — Build steps

> **Before running locally**: this round added fields to `prisma/schema.prisma` (`passwordHash`, `role`, `avatarUrl`, `tone`, `targetAudience`, `isPublic`, `isPremium`, `ipfsCid`, `note`, `format`, plus the `PublishedWork` ↔ `Project` relation). Run `pnpm exec prisma generate` (or `pnpm exec prisma migrate dev` once `DATABASE_URL` is real) before `pnpm build` — the generated client in `src/generated/prisma` won't have these fields until you do.

Checklist form of `docs/C-Vault-Technical-Specification.md`. Ordered so each phase produces something demoable, matching the folders already scaffolded in `src/app`.

## Phase 0 — Foundations (done)
- [x] Prisma schema: User, Project, Outline, Chapter, Version, PublishedWork, AiInteraction
- [x] `src/lib/prisma.ts`, `src/lib/hash.ts` (hash-chain logic)
- [x] `src/lib/auth.ts` (NextAuth credentials config)
- [x] `src/lib/redis.ts`, `src/lib/watsonx.ts` (placeholders)
- [x] Tailwind indigo/slate theme, layout metadata
- [x] Landing page (`src/app/page.tsx`)

## Phase 1 — Auth
- [x] `src/app/api/auth/register/route.ts` — Zod-validate input, bcrypt-hash password, create `User`
- [x] `src/app/api/auth/[...nextauth]/route.ts` — wire up `authOptions` from `src/lib/auth.ts`
- [x] `src/app/(auth)/register/page.tsx` — signup form (email, password, display name, username)
- [x] `src/app/(auth)/login/page.tsx` — login form
- [x] Session-gate `/dashboard` and `/projects/*` — redirect to `/login` if unauthenticated

## Phase 2 — Projects & dashboard
- [x] `src/app/api/projects/route.ts` — POST create, GET list (current user only)
- [x] `src/app/api/projects/[id]/route.ts` — GET / PATCH / DELETE
- [x] `src/app/dashboard/page.tsx` — list the user's projects, "New project" form (title, genre, tone, targetAudience, premise)
- [x] `src/app/projects/[id]/page.tsx` — project overview: outline, chapter list, "Add chapter"

## Phase 3 — AI outline & drafting
- [x] Implement `WatsonxClient.generateText` in `src/lib/watsonx.ts` (real watsonx.ai call)
- [x] `src/app/api/projects/[id]/outline/route.ts` — generate outline, log `AiInteraction` (`OUTLINE`)
- [x] `src/app/api/chapters/route.ts` — create chapter, optional AI first draft, log `AiInteraction` (`CHAPTER_DRAFT`)
- [x] `src/app/api/chapters/[id]/generate/route.ts` — continue/expand, rewrite in style, creative review; log `REWRITE`/`REVIEW`
- [x] `src/app/projects/[id]/chapters/[chapterId]/page.tsx` — editor UI: AI suggestion panel (clearly labeled "suggestion"), accept/edit/discard before it touches the content

## Phase 4 — Hash chain & provenance
- [x] `src/app/api/chapters/[id]/route.ts` (PUT) — human save → new `Version` using `generateContentHash`/`generateChainHash`
- [x] `src/app/api/chapters/[id]/versions/route.ts` — list versions for the timeline
- [x] `src/app/api/chapters/[id]/verify/route.ts` — recompute chain, confirm unbroken
- [x] Provenance timeline component (`src/components/provenance/`) — version list with short hash, timestamp, author type, note field, "verify" action
- [x] Let a creator add a `note` to a version (e.g. "sent to beta readers")

## Phase 5 — Export & publish
- [x] `src/app/api/projects/[id]/export/route.ts` — render via `@react-pdf/renderer`, create `PublishedWork`
- [x] "Export to PDF" action in the project UI, with an explicit confirm step before export
- [x] `src/app/api/users/[id]/publish/route.ts` — toggle `Project.isPublic`, edit profile fields
- [x] `src/app/creator/[username]/page.tsx` — public profile: bio, avatar, public projects, sample chapters, premium chapters shown locked (title + excerpt only) when `Chapter.isPremium`

## Phase 6 — Governance polish
- [x] Confirm every AI-facing route writes an `AiInteraction` row, even when the suggestion is discarded
- [x] "AI-assisted" vs "human-written" label surfaced in the editor and on the public profile
- [x] Explicit confirmation dialog before save-with-AI-content, export, and publish
- [x] Rate-limit AI calls per user via `src/lib/redis.ts`

## Phase 7 — Submission prep
- [ ] Fill in the "How IBM Bob was used" section in `README.md` with 2-3 real prompt/commit examples
- [ ] Run `pnpm exec prisma generate` locally (needed after this round of schema changes — see note below) and `pnpm build` clean
- [ ] Deploy to Vercel + Neon; confirm env vars are set there, not just locally
- [ ] Record the 3-minute demo video walking the full 8-step flow
- [ ] Re-check the [eligibility checker](https://eligibility.bemyapp.com/) for your residency
