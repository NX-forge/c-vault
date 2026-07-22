import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { updateProjectSchema } from "@/lib/validations";
import { ok, fail, handleApiError } from "@/lib/api-response";

async function loadOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      outline: true,
      chapters: { orderBy: { order: "asc" } },
    },
  });
  if (!project || project.userId !== userId) return null;
  return project;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const project = await loadOwnedProject(id, userId);
    if (!project) return fail("Project not found.", 404);
    return ok(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return fail("Project not found.", 404);
    }

    const body = await req.json();
    const input = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data: input,
    });

    return ok(project);
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
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return fail("Project not found.", 404);
    }

    await prisma.project.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
