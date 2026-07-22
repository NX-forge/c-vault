import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { chapterGenerateSchema } from "@/lib/validations";
import { watsonx, buildChapterActionPrompt } from "@/lib/watsonx";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

const ACTION_TO_TYPE: Record<string, string> = {
  draft: "CHAPTER_DRAFT",
  continue: "CHAPTER_DRAFT",
  rewrite: "REWRITE",
  review: "REVIEW",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { project: { include: { outline: true } } },
    });
    if (!chapter || chapter.project.userId !== userId) {
      return fail("Chapter not found.", 404);
    }

    const { allowed } = await checkRateLimit(`ai:${userId}`, 20, 60);
    if (!allowed) {
      return fail("You're generating a lot right now — wait a moment and try again.", 429);
    }

    const body = await req.json();
    const input = chapterGenerateSchema.parse(body);

    const prompt = buildChapterActionPrompt({
      action: input.action,
      projectTitle: chapter.project.title,
      outline: chapter.project.outline?.content,
      chapterTitle: chapter.title,
      currentContent: input.currentContent,
      instruction: input.instruction,
    });

    const generated = await watsonx.generateText(prompt);

    await prisma.aiInteraction.create({
      data: {
        userId,
        projectId: chapter.project.id,
        chapterId: chapter.id,
        type: ACTION_TO_TYPE[input.action] ?? "REWRITE",
        input: prompt,
        output: generated,
        modelInfo: process.env.WATSONX_MODEL_ID || "ibm/granite-3-8b-instruct",
      },
    });

    // A suggestion only — the creator must explicitly save it (PUT /api/chapters/:id)
    // before it becomes part of the chapter's version history.
    return ok({ suggestion: generated, action: input.action });
  } catch (error) {
    return handleApiError(error);
  }
}
