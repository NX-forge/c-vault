import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { createChapterSchema } from "@/lib/validations";
import { watsonx, buildChapterActionPrompt } from "@/lib/watsonx";
import { generateContentHash, generateChainHash } from "@/lib/hash";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    const body = await req.json();
    const input = createChapterSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: { outline: true, chapters: { select: { id: true } } },
    });
    if (!project || project.userId !== userId) {
      return fail("Project not found.", 404);
    }

    const order = input.order ?? project.chapters.length;

    const chapter = await prisma.chapter.create({
      data: { projectId: input.projectId, title: input.title, order },
    });

    if (!input.aiDraft) {
      return ok(chapter, 201);
    }

    const { allowed } = await checkRateLimit(`ai:${userId}`, 20, 60);
    if (!allowed) {
      return ok(chapter, 201); // chapter exists; AI draft can be requested again from the editor
    }

    const prompt = buildChapterActionPrompt({
      action: "draft",
      projectTitle: project.title,
      outline: project.outline?.content,
      chapterTitle: chapter.title,
      instruction: input.instruction,
    });

    const generated = await watsonx.generateText(prompt);

    const rawContentHash = generateContentHash(generated);
    const chainHash = generateChainHash(rawContentHash, null);

    const [version] = await prisma.$transaction([
      prisma.version.create({
        data: {
          chapterId: chapter.id,
          versionNumber: 1,
          content: generated,
          chainHash,
          previousHash: null,
          authorType: "AI",
        },
      }),
      prisma.aiInteraction.create({
        data: {
          userId,
          projectId: project.id,
          chapterId: chapter.id,
          type: "CHAPTER_DRAFT",
          input: prompt,
          output: generated,
          modelInfo: process.env.WATSONX_MODEL_ID || "ibm/granite-3-8b-instruct",
        },
      }),
    ]);

    return ok({ ...chapter, versions: [version] }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
