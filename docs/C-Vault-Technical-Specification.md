# C-Vault
## AI Co-Creation Studio for Writers, Filmmakers, Designers, and Digital Creators
Technical Specification — IBM AI Builders Challenge with IBM Bob, July 2026
Challenge theme: **Reimagine Creative Industries with AI**

---

## 1. Problem

AI can now help anyone create, but two things are still missing for independent creators across mediums:

1. **A creative partner that collaborates inside the process** — most tools either generate a finished piece for you (replacing the creator) or offer no structure at all. Creators need outlining, drafting, and rewriting help that stays inside their own creative workflow, across formats (prose, treatments, scripts, concept notes).
2. **Proof of authorship and a path to monetize.** As AI content floods every platform, a creator's own track record — what they made, when, and how much of it was AI-assisted — is a real trust and business asset. There is no lightweight way to prove it, package it, and sell it.

C-Vault is a co-creation studio: creators generate ideas and content faster with AI, every version is cryptographically chained so authorship is provable rather than claimed, and finished work can be packaged for publishing and monetization.

## 2. Who it's for

Independent creators publishing under their own name across creative mediums — novelists and essayists, filmmakers drafting treatments and scripts, designers documenting concept work, and other digital creators — who want AI assistance without losing a verifiable claim to their work, and a way to earn from it.

## 3. Core design principle: human-in-the-loop

This governs every feature, not just one section of the app:

- Every AI output (outline, draft, rewrite, review) is a **suggestion**, never a final save.
- The creator must review, edit, or explicitly approve before anything is saved or published.
- Every AI interaction (prompt + output) is logged for traceability — this is the `AiInteraction` model, not an afterthought.
- The UI labels content as AI-assisted vs. human-written; nothing publishes without explicit user confirmation.

This is a conceptual alignment with **watsonx.governance** principles: humans stay the decision-makers, outputs are labeled, ownership stays with the creator, and creative history is preserved rather than overwritten.

## 4. Scope for this submission (MVP)

Given a solo build finishing by July 31, the full long-term vision is scoped to a demoable core loop. In scope for the July submission:

1. Email/password auth (NextAuth credentials, bcrypt)
2. Create a project (title, genre, tone, target audience, premise)
3. Generate an AI-assisted outline
4. Draft a chapter with AI co-writing assistance (draft, continue/expand, rewrite in style, creative review)
5. Edit and save — each save creates a new `Version`
6. Every version is hashed and chained to the previous version (provenance)
7. Provenance timeline view for a chapter, with optional human notes per version
8. Export to PDF
9. Public creator profile (`/creator/[username]`) listing public projects and sample chapters, with premium chapters visible but locked

**Explicitly out of scope for July** (named as roadmap, not built): real payment processing for premium chapters (the lock is a UI simulation), multi-user collaboration on one project, filmmaker/designer-specific templates beyond the shared project model. EPUB export and IPFS anchoring, originally scoped as stretch goals, are now built. Naming what's left honestly is worth more to judges than an unfinished feature list.

## 5. Why this fits the challenge

- **AI creative partner, not a replacement**: outline/draft/rewrite/review are all collaborative, human-approved steps.
- **Spans creative industries**: the project model (genre, tone, target audience, premise) is deliberately medium-agnostic — it fits a novel, a film treatment, or a design brief without forcing a "book-only" shape.
- **Built with IBM Bob**: Bob is the primary development tool across the build — scaffolding, schema, API routes, and tests. Documented with specific examples in the README.
- **watsonx.ai / watsonx.governance**: watsonx.ai (Granite) powers generation; the governance principles above (labeling, logging, human approval) are the accountability layer around it.

## 6. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript, Tailwind CSS (indigo/slate) | Already scaffolded; fast to build on |
| Backend | Next.js API routes / server actions | No separate service to deploy |
| Database | Neon Postgres via Prisma | Structured relational data; already modeled |
| Auth | NextAuth, credentials provider, bcrypt | Simple, explicit auth — no magic links |
| Validation | Zod | Validate all API inputs server-side |
| AI | IBM Bob (dev), watsonx.ai (Granite, runtime generation) | Bob builds it, watsonx.ai powers it |
| Cache | Upstash Redis (optional) | AI-call rate limiting |
| PDF export | @react-pdf/renderer | Already a dependency |
| Hosting | Vercel + Neon | Zero-ops deploy |

## 7. Core mechanism: the hash chain

Each save of a chapter creates a numbered `Version` row:

```
chainHash = SHA256(SHA256(content) + previousVersion.chainHash)
versionNumber = previousVersion.versionNumber + 1  (or 1 for genesis)
```

- `previousHash` is null for the first version — genesis.
- `authorType` (`HUMAN` | `AI` | `MIXED`) records whether the save followed an AI-assisted generation, a manual edit, or both — a coarse, honest signal rather than a false-precision "% AI-written" figure.
- Because each hash depends on the prior hash, the sequence forms a chain: altering any past version invalidates every hash after it — the same idea as a Git commit chain. `(chapterId, versionNumber)` is unique at the database level, which is what actually prevents two concurrent saves from forking the chain (including two saves both racing to create "genesis") — a hash chain alone doesn't stop that on its own.
- Saving byte-identical content (same text, same author type) doesn't create a new version — it returns the existing one instead, so autosave-style saves on unchanged text don't pollute the timeline.
- A version can additionally be anchored to IPFS on demand (`ipfsCid`), giving an external record that `/verify` cross-checks against, without making that external anchor a dependency of the core provenance mechanism.
- The provenance timeline renders this chain newest-first by `versionNumber` (not `createdAt`, which isn't a reliable ordering guarantee), with a "verify" action that recomputes it, cross-checks any IPFS anchors, and reports *why* if something's broken rather than just a pass/fail.

## 8. Judging-criteria alignment (self-check before submission)

| Criterion | How this submission addresses it |
|---|---|
| Technical Execution | Working prototype, clean Next.js/Prisma structure, IBM Bob used and documented across the build |
| Innovation | Hash-chain provenance + AI-interaction logging + medium-agnostic creator studio is a distinct angle from generic AI writing tools |
| Challenge Fit | Core value is a creative co-writing workflow across mediums, governed by human-in-the-loop principles |
| Feasibility | Scoped to what's actually buildable solo by July 31; roadmap items are named, not implied as built |
| Real-World Impact | Addresses authorship trust and a monetization path for independent creators as AI content volume grows |

See `ARCHITECTURE.md` for the full data model and API surface, `../STEPS.md` for the build plan, and `../README.md` for the submission content.
