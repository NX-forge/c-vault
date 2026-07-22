import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { renderProjectPdf } from "@/lib/pdf";
import { renderProjectEpub } from "@/lib/epub";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const publishedWork = await prisma.publishedWork.findUnique({ where: { id } });
  if (!publishedWork) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: publishedWork.projectId },
    include: {
      user: { select: { id: true, displayName: true } },
      chapters: {
        orderBy: { order: "asc" },
        include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!project) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  if (!project.isPublic) {
    const userId = await getCurrentUserId();
    if (userId !== project.userId) {
      return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
    }
  }

  const exportProject = {
    title: project.title,
    genre: project.genre,
    premise: project.premise,
    authorName: project.user.displayName,
    chapters: project.chapters
      .filter((c) => c.versions.length > 0)
      .map((c) => ({
        id: c.id,
        title: c.title,
        order: c.order,
        content: c.versions[0].content,
        contentHash: c.versions[0].chainHash,
      })),
  };

  const safeTitle = project.title.replace(/[^a-z0-9\-_ ]/gi, "");

  if (publishedWork.format === "epub") {
    const epubBuffer = await renderProjectEpub(exportProject);
    return new NextResponse(new Uint8Array(epubBuffer), {
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${safeTitle}.epub"`,
      },
    });
  }

  const pdfBuffer = await renderProjectPdf(exportProject);
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
    },
  });
}
