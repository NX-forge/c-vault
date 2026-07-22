import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { createProjectSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { chapters: { select: { id: true } }, outline: { select: { id: true } } },
    });
    return ok(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireCurrentUserId();

    const { allowed } = await checkRateLimit(`create-project:${userId}`, 20, 3600);
    if (!allowed) {
      return fail("You're creating projects quickly — wait a bit and try again.", 429);
    }

    const body = await req.json();
    const input = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: { ...input, userId },
    });

    return ok(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
