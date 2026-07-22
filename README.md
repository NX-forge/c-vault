# C-Vault

An AI co-creation studio for writers, filmmakers, designers, and digital creators — generate ideas and content faster with AI, protect ownership with cryptographic provenance, and package finished work for publishing and monetization.

Built for the **AI Builders Challenge with IBM Bob** — July 2026 challenge theme: **Reimagine Creative Industries with AI**.

## Problem statement

AI can now help anyone create, but two things are still missing for independent creators: a partner that collaborates *inside* the creative process rather than replacing it or offering an unstructured chat box, and a lightweight way to prove authorship as AI-generated content floods every platform — plus a path to actually monetize the work once it's made.

## Solution

C-Vault lets a creator sign up, start a project (book, treatment, design brief — the model is medium-agnostic), generate an AI-assisted outline, and draft with AI help via the editor. Every AI output is a suggestion the creator must review and approve. Every save is hashed and chained to the version before it, so the full history of a piece is tamper-evident. Creators can review that provenance timeline, export to PDF, and publish a public creator profile with premium chapters locked for supporters.

## Core design principle: human-in-the-loop

AI suggests, the human decides — on every single action:
- Every AI output (outline, draft, rewrite, review) is a draft, never a final save.
- The creator must review, edit, or approve before anything is saved or published.
- Every AI interaction is logged (`AiInteraction`) for traceability, conceptually aligned with **watsonx.governance**.
- The UI labels content AI-assisted vs. human-written; export/publish requires explicit confirmation.

## AI approach and architecture

- **watsonx.ai (Granite model)** generates outlines, chapter drafts, scene continuations, style rewrites, and creative reviews — additive assistance inside the editor, never autogeneration of a finished, unreviewed piece.
- **Hash chain provenance**: each version has a numbered, unique `versionNumber` and a `chainHash = SHA256(SHA256(content) + previousVersion.chainHash)`. Each version depends on the one before it, so tampering with history is detectable. Unchanged saves are deduplicated instead of creating a pointless new version, and a unique DB constraint on `(chapterId, versionNumber)` prevents two concurrent saves from forking the chain. Versions can optionally be anchored to IPFS (via Pinata) for an external cross-check independent of Postgres.
- **Stack**: Next.js (TypeScript, App Router) + Tailwind, NextAuth (credentials + bcrypt), Prisma + Neon Postgres, Zod validation, Upstash Redis for AI-call rate limiting, `@react-pdf/renderer` + a hand-built JSZip-based EPUB3 writer for export, Pinata for optional IPFS anchoring.

Full data model and API surface: see `docs/ARCHITECTURE.md`. Build plan: see `STEPS.md`.

## Selected challenge theme

Reimagine Creative Industries with AI — the "AI creative partners" and "storytelling and content creation tools" categories, extended across writers, filmmakers, designers, and digital creators.

## How IBM Bob was used

IBM Bob is the primary development tool throughout this build:

- Scaffolded the initial Next.js + Prisma project structure (folders, configs, `.env.example`).
- Generated the base Prisma schema and NextAuth credentials setup.
- Generated `src/lib/hash.ts` (hash-chain logic) and `src/lib/prisma.ts`/`src/lib/redis.ts`/`src/lib/watsonx.ts` scaffolding.
- Used for the landing page structure and iteration.

*(Keep 2-3 concrete before/after prompt examples ready — judges score effective, documented use of Bob specifically, not just that watsonx.ai was used at runtime.)*

## What's built vs. roadmap

**Built for this submission**: full auth (register/login/session via NextAuth credentials + bcrypt), project CRUD, AI-assisted outline generation, chapter creation with optional AI first draft, in-editor AI actions (draft/continue/rewrite/review) as review-before-save suggestions, autosave-to-version with hash-chain provenance, a provenance timeline with verify and human notes, **PDF and EPUB export** (pick a format, download streams live from current chapter content), **IPFS anchoring** (pin any version's content externally via Pinata and get back a CID + gateway link, independent of the internal hash chain), and a public creator profile with premium-chapter locking. Every AI call logs an `AiInteraction` regardless of whether its output is ever saved. Routes and pages ship with loading skeletons, empty states, and a responsive layout down to small phone widths.

**Roadmap, not built**: real payment processing for premium chapters (the lock is a UI simulation), multi-user collaboration, medium-specific templates beyond the shared project model.

**One local step required**: this round of work added several fields to the Prisma schema. Run `pnpm exec prisma generate` (details in `STEPS.md`) before your first local build — the previously generated client doesn't know about them yet.

## Running locally

```bash
git clone <your-repo-url>
cd c-vault
pnpm install
cp .env.example .env   # fill in DATABASE_URL, NEXTAUTH_SECRET, WATSONX_API_KEY, etc.
pnpm exec prisma migrate dev
pnpm dev
```

## Demo video

<link to your 3-minute demo video>
