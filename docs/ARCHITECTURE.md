# C-Vault — System Architecture

Companion to `C-Vault-Technical-Specification.md`. Reflects the schema and routes actually in this repo (`prisma/schema.prisma`, `src/app`).

## 1. System layers

```
Next.js frontend (App Router)
  editor, provenance timeline, dashboard, creator profile
        |
        v
API routes (auth, orchestration, hashing, governance logging)
        |
        +--> Postgres (Prisma / Neon) — users, projects, chapters, versions, AI interactions
        +--> Upstash Redis (optional) — AI call rate limiting
        +--> watsonx.ai (Granite) — outline / draft / rewrite / review generation
        +--> @react-pdf/renderer — PDF export
```

IBM Bob is not a runtime component — it's the tool used to build the above. Keep that distinction explicit in the README (see "How IBM Bob was used") so judges don't have to hunt for it.

## 2. Data model (Prisma — as implemented in `prisma/schema.prisma`)

Enums: `ChapterStatus` (DRAFT, FINAL), `AuthorType` (HUMAN, AI, MIXED), `Role` (CREATOR, ADMIN).

- **User** — `email`, `passwordHash` (bcrypt), `displayName`, `publicSlug` (used as the `/creator/[username]` route param), `bio`, `avatarUrl`, `role`.
- **Project** — `title`, `genre`, `tone`, `targetAudience`, `premise`, `isPublic`. Deliberately medium-agnostic: the same shape covers a novel, a film treatment, or a design brief.
- **Outline** — one per project, `content`, `generatedByAI`.
- **Chapter** — `order`, `title`, `status`, `isPremium` (drives the locked-content simulation on the public profile).
- **Version** — `content` (full snapshot), `versionNumber` (1, 2, 3... per chapter — unique per chapter, doubling as the concurrency guard described below), `chainHash` (named this rather than `contentHash` because it's a hash of the content *chained to* the previous version, not content alone), `previousHash` (forms the chain), `ipfsCid` (set once a version is anchored to IPFS via Pinata), `note` (human annotation, e.g. "sent to beta readers"), `authorType`.
- **PublishedWork** — `format` (default `"pdf"`, `"epub"` planned), `pdfUrl`, `verificationHash`.
- **AiInteraction** — `userId`, optional `projectId`/`chapterId`, `type` (`OUTLINE`, `CHAPTER_DRAFT`, `REWRITE`, `REVIEW`, ...), `input`, `output`, `modelInfo`. This is the governance log — every AI call writes one of these, independent of whether the output was ever saved into a `Version`.

All relations cascade on delete from `User`/`Project`/`Chapter` as appropriate; indexes exist on the foreign keys used for lookups (`userId`, `projectId`, `chapterId`, and `publicSlug`/`email` via `@unique`).

## 3. API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account (Zod-validated, bcrypt-hash password) |
| `/api/auth/[...nextauth]` | — | NextAuth credentials provider (login/session) |
| `/api/projects` | POST / GET | Create / list projects for the current user |
| `/api/projects/:id` | GET / PATCH / DELETE | Fetch, update, or delete a project |
| `/api/projects/:id/outline` | POST | Generate an outline via watsonx.ai; logs an `AiInteraction` (`OUTLINE`) |
| `/api/chapters` | POST | Create a chapter, optionally AI-drafted from the outline; logs `CHAPTER_DRAFT` |
| `/api/chapters/:id` | GET / PUT / PATCH / DELETE | GET fetches with latest version; PUT saves an edit as a new hash-chained `Version`; PATCH updates metadata (title, order, status, `isPremium`); DELETE removes the chapter |
| `/api/chapters/:id/generate` | POST | AI actions: draft / continue / rewrite / review — returns a suggestion only, logs the matching `AiInteraction` |
| `/api/chapters/:id/versions` | GET / PATCH | GET returns the provenance timeline; PATCH attaches a human note to a version |
| `/api/chapters/:id/anchor` | POST | Pins a version's content to IPFS via Pinata, stores the CID on `Version.ipfsCid` |
| `/api/chapters/:id/verify` | GET | Recompute the hash chain server-side, confirm it's unbroken |
| `/api/projects/:id/export` | POST / GET | POST body takes `{ format: "pdf" \| "epub" }` and creates a `PublishedWork` record; GET lists a project's export history |
| `/api/public/exports/:id` | GET | Streams a freshly rendered PDF for a `PublishedWork` (public if the project is public, owner-only otherwise) |
| `/api/profile` | GET / PATCH | Current user's own profile (bio, avatar, display name) |
| `/creator/:username` | page (server component) | Public profile — public projects, sample chapters, premium chapters flagged as locked. Rendered directly from Prisma, not via a separate API route. |

Every AI-facing route runs server-side only; `WATSONX_API_KEY` never reaches the client. Every request body is validated with Zod before touching Prisma.

## 4. Hash chain flow (sequence)

1. Creator edits a chapter in the editor.
2. On save, the API loads the chapter's most recent `Version` (ordered by `versionNumber`, not `createdAt` — see below) or null if genesis.
3. If the new content is byte-identical to the previous version's content *and* the author type matches, no new version is created — the existing one is returned with `deduplicated: true`. Otherwise:
4. Compute `rawContentHash = SHA256(content)`, then `chainHash = SHA256(rawContentHash + previousVersion.chainHash)` — see `src/lib/hash.ts`. `nextVersionNumber = previousVersion.versionNumber + 1` (or `1` for genesis).
5. Insert the new `Version` row. `(chapterId, versionNumber)` has a unique DB constraint, so if two saves race — including two concurrent *genesis* saves — one insert succeeds and the other fails with a Prisma `P2002` error, which the route turns into a `409` asking the client to reload rather than silently forking the chain.
6. The timeline queries all versions for a chapter ordered by `versionNumber` (the authoritative sequence — `createdAt` can't be trusted for ordering under clock skew or races), showing `v{n}`, a short hash, timestamp, author type, and any human `note`.
7. "Verify" recomputes every hash in sequence, checks each `previousHash` matches the prior row's `chainHash`, and — for any version anchored to IPFS — re-fetches the pinned copy and confirms its `chainHash` still matches Postgres. The response includes a `reason` (`chain_link_mismatch`, `hash_mismatch`, `ipfs_content_mismatch`, `ipfs_unreachable`) so a broken chain is actionable, not just a boolean.

This is a hash chain, not blockchain infrastructure — it gets the core tamper-evidence property without an external dependency. Optionally, any version can also be anchored externally: `POST /api/chapters/:id/anchor` pins the version's content + hash to IPFS via Pinata (`src/lib/ipfs.ts`), validates the returned CID looks like a real CID before trusting it, and stores it on `Version.ipfsCid` — giving an independent, off-Postgres record that `/verify` cross-checks against.

## 5. AI generation flow (human-in-the-loop, concretely)

1. Outline: premise + genre + tone + targetAudience → watsonx.ai (Granite) → stored as a draft `Outline.content`, `AiInteraction` logged.
2. Chapter draft / continue / rewrite / review: sent from the editor with the relevant context (outline beat, existing text, or a style instruction) → watsonx.ai → returned to the editor as a suggestion the creator can accept, edit, or discard. Nothing is written to a `Version` until the creator saves.
3. Every call — regardless of whether its output is ever saved — writes an `AiInteraction` row. This is the traceability layer the spec's governance section requires.
4. Rate-limit AI calls per user via Redis to protect against runaway cost during the demo period.

## 6. PDF export

PDF is rendered server-side with `@react-pdf/renderer` (`src/lib/pdf.tsx`). EPUB is a hand-built EPUB3 archive assembled with JSZip (`src/lib/epub.ts` — mimetype, container.xml, a nav document, one XHTML file per chapter) rather than a heavier third-party generator, so the format stays easy to inspect. `PublishedWork.format` records which was produced; `/api/public/exports/:id` serves either based on that field.

## 7. Public creator profile and monetization

Server-rendered page at `/creator/[username]`:
- Public bio, avatar, list of public projects (`Project.isPublic`).
- Sample chapters render in full; chapters with `Chapter.isPremium = true` show a locked preview (title + excerpt) instead of full content — a monetization simulation for the MVP, with real payments named as roadmap.
- A "verified" badge shows if `/api/chapters/:id/verify` passes for the underlying chapter history.
