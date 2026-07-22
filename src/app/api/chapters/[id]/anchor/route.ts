import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { pinVersionToIpfs, ipfsGatewayUrl, IpfsNotConfiguredError } from "@/lib/ipfs";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const { allowed } = await checkRateLimit(`anchor:${userId}`, 20, 3600);
    if (!allowed) {
      return fail("Too many anchor requests recently — wait a bit and try again.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const versionId = (body as { versionId?: string }).versionId;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!chapter || chapter.project.userId !== userId) {
      return fail("Chapter not found.", 404);
    }

    const version = versionId
      ? await prisma.version.findUnique({ where: { id: versionId } })
      : await prisma.version.findFirst({
          where: { chapterId: id },
          orderBy: { versionNumber: "desc" },
        });

    if (!version || version.chapterId !== id) {
      return fail("Version not found.", 404);
    }

    if (version.ipfsCid) {
      return ok({ versionId: version.id, cid: version.ipfsCid, url: ipfsGatewayUrl(version.ipfsCid) });
    }

    const cid = await pinVersionToIpfs({
      versionId: version.id,
      chainHash: version.chainHash,
      previousHash: version.previousHash,
      content: version.content,
      chapterTitle: chapter.title,
    });

    await prisma.version.update({ where: { id: version.id }, data: { ipfsCid: cid } });

    return ok({ versionId: version.id, cid, url: ipfsGatewayUrl(cid) });
  } catch (error) {
    if (error instanceof IpfsNotConfiguredError) {
      return fail(error.message, 501);
    }
    return handleApiError(error);
  }
}
