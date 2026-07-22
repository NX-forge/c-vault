import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { generateContentHash } from "@/lib/hash";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const { allowed } = await checkRateLimit(`export:${userId}`, 10, 3600);
    if (!allowed) {
      return fail("Too many exports recently — wait a bit and try again.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const format = body.format === "epub" ? "epub" : "pdf";

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });
    if (!project || project.userId !== userId) {
      return fail("Project not found.", 404);
    }
    if (project.chapters.every((c) => c.versions.length === 0)) {
      return fail("Add at least one saved chapter version before exporting.", 400);
    }

    const chainSignature = project.chapters
      .map((c) => c.versions[0]?.chainHash ?? "")
      .join(":");
    const verificationHash = generateContentHash(`${project.id}:${format}:${chainSignature}`);

    const publishedWork = await prisma.publishedWork.create({
      data: {
        projectId: project.id,
        format,
        pdfUrl: "", // set below once we know the record's id
        verificationHash,
      },
    });

    const pdfUrl = `/api/public/exports/${publishedWork.id}`;
    const updated = await prisma.publishedWork.update({
      where: { id: publishedWork.id },
      data: { pdfUrl },
    });

    return ok(updated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const publishedWorks = await prisma.publishedWork.findMany({
      where: { projectId: id },
      orderBy: { publishedAt: "desc" },
    });

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return fail("Project not found.", 404);
    }

    return ok(publishedWorks);
  } catch (error) {
    return handleApiError(error);
  }
}
