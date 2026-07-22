import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { versionNoteSchema } from "@/lib/validations";
import { ok, fail, handleApiError } from "@/lib/api-response";

async function assertOwnsChapter(chapterId: string, userId: string) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { project: true },
  });
  if (!chapter || chapter.project.userId !== userId) return false;
  return true;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    if (!(await assertOwnsChapter(id, userId))) {
      return fail("Chapter not found.", 404);
    }

    const versions = await prisma.version.findMany({
      where: { chapterId: id },
      orderBy: { versionNumber: "desc" },
    });

    return ok(versions);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Attach a human note to the latest version, e.g. "sent to beta readers". */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    if (!(await assertOwnsChapter(id, userId))) {
      return fail("Chapter not found.", 404);
    }

    const body = await req.json();
    const { note } = versionNoteSchema.parse(body);
    const { versionId } = body as { versionId?: string };

    if (!versionId) return fail("versionId is required.", 400);

    const version = await prisma.version.findUnique({ where: { id: versionId } });
    if (!version || version.chapterId !== id) {
      return fail("Version not found.", 404);
    }

    const updated = await prisma.version.update({
      where: { id: versionId },
      data: { note },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
