import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireCurrentUserId } from "@/lib/session";
import { saveChapterSchema, updateChapterMetaSchema } from "@/lib/validations";
import { generateContentHash, generateChainHash } from "@/lib/hash";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

async function loadOwnedChapter(chapterId: string, userId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      project: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!chapter || chapter.project.userId !== userId) return null;
  return chapter;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const chapter = await loadOwnedChapter(id, userId);
    if (!chapter) return fail("Chapter not found.", 404);
    return ok(chapter);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Human (or AI-suggested-then-approved) save: creates a new, hash-chained,
 * numbered version.
 *
 * Two safety nets here that are easy to miss:
 * - Deduplication: if the content is byte-identical to the last saved version
 *   (same author type too), we don't create a pointless new version — we just
 *   return the existing one with `deduplicated: true`. Autosave-style saves
 *   firing on unchanged content is the common case this guards against.
 * - Race protection: versionNumber is unique per chapter at the DB level
 *   (see schema). If two saves race — including two concurrent *first* saves,
 *   which is the "genesis fork" scenario — one insert wins and the other gets
 *   a unique-constraint violation (Prisma P2002), which we turn into a clear
 *   409 asking the client to reload and retry, instead of silently forking
 *   the chain.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const chapter = await loadOwnedChapter(id, userId);
    if (!chapter) return fail("Chapter not found.", 404);

    const { allowed } = await checkRateLimit(`save-chapter:${userId}`, 60, 60);
    if (!allowed) {
      return fail("Saving too quickly — wait a moment and try again.", 429);
    }

    const body = await req.json();
    const input = saveChapterSchema.parse(body);

    const previousVersion = chapter.versions[0] ?? null;

    if (
      previousVersion &&
      previousVersion.content === input.content &&
      previousVersion.authorType === input.authorType
    ) {
      return ok({ ...previousVersion, deduplicated: true });
    }

    const rawContentHash = generateContentHash(input.content);
    const chainHash = generateChainHash(rawContentHash, previousVersion?.chainHash ?? null);
    const nextVersionNumber = (previousVersion?.versionNumber ?? 0) + 1;

    try {
      const version = await prisma.version.create({
        data: {
          chapterId: id,
          versionNumber: nextVersionNumber,
          content: input.content,
          chainHash,
          previousHash: previousVersion?.chainHash ?? null,
          authorType: input.authorType,
          note: input.note,
        },
      });
      return ok(version, 201);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return fail(
          "Someone else saved a newer version of this chapter while you were editing. Reload and try again.",
          409
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/** Metadata-only update: title, order, status, premium flag. Does not touch content/versions. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const chapter = await loadOwnedChapter(id, userId);
    if (!chapter) return fail("Chapter not found.", 404);

    const body = await req.json();
    const input = updateChapterMetaSchema.parse(body);

    const updated = await prisma.chapter.update({ where: { id }, data: input });
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const chapter = await loadOwnedChapter(id, userId);
    if (!chapter) return fail("Chapter not found.", 404);

    await prisma.chapter.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
