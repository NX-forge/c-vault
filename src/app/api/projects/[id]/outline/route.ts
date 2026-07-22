import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { generateOutlineSchema } from "@/lib/validations";
import { watsonx, buildOutlinePrompt } from "@/lib/watsonx";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return fail("Project not found.", 404);
    }

    const { allowed } = await checkRateLimit(`ai:${userId}`, 20, 60);
    if (!allowed) {
      return fail("You're generating a lot right now — wait a moment and try again.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const { beats = 8 } = generateOutlineSchema.parse(body);

    const prompt = buildOutlinePrompt({
      title: project.title,
      genre: project.genre,
      tone: project.tone,
      targetAudience: project.targetAudience,
      premise: project.premise,
      beats,
    });

    const generated = await watsonx.generateText(prompt);

    const [outline] = await prisma.$transaction([
      prisma.outline.upsert({
        where: { projectId: id },
        create: { projectId: id, content: generated, generatedByAI: true },
        update: { content: generated, generatedByAI: true },
      }),
      prisma.aiInteraction.create({
        data: {
          userId,
          projectId: id,
          type: "OUTLINE",
          input: prompt,
          output: generated,
          modelInfo: process.env.WATSONX_MODEL_ID || "ibm/granite-3-8b-instruct",
        },
      }),
    ]);

    return ok(outline);
  } catch (error) {
    return handleApiError(error);
  }
}
