import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { generateContentHash, verifyHashChain } from "@/lib/hash";
import { fetchPinnedVersion } from "@/lib/ipfs";
import { ok, fail, handleApiError } from "@/lib/api-response";

type BreakReason = "chain_link_mismatch" | "hash_mismatch" | "ipfs_content_mismatch" | "ipfs_unreachable";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!chapter || chapter.project.userId !== userId) {
      return fail("Chapter not found.", 404);
    }

    const versions = await prisma.version.findMany({
      where: { chapterId: id },
      orderBy: { versionNumber: "asc" },
    });

    let previousChainHash: string | null = null;
    let brokenAt: string | null = null;
    let reason: BreakReason | null = null;
    let ipfsChecked = 0;
    const ipfsMismatched: string[] = [];

    for (const version of versions) {
      // The link to the prior version must match what's actually stored.
      if (version.previousHash !== previousChainHash) {
        brokenAt = version.id;
        reason = "chain_link_mismatch";
        break;
      }
      // And the version's own hash must be reproducible from its content + that link.
      const rawContentHash = generateContentHash(version.content);
      const isValid = verifyHashChain(rawContentHash, version.previousHash, version.chainHash);
      if (!isValid) {
        brokenAt = version.id;
        reason = "hash_mismatch";
        break;
      }
      previousChainHash = version.chainHash;
    }

    // Independent cross-check: for any version anchored to IPFS, re-fetch the
    // pinned copy and confirm its chainHash still matches what's in Postgres.
    // This catches tampering with the database itself, which the internal
    // chain check above can't detect on its own.
    if (brokenAt === null) {
      const anchoredVersions = versions.filter((v) => v.ipfsCid);
      for (const version of anchoredVersions) {
        const pinned = await fetchPinnedVersion(version.ipfsCid!);
        if (!pinned) {
          ipfsMismatched.push(version.id);
          reason = reason ?? "ipfs_unreachable";
          continue;
        }
        ipfsChecked++;
        if (pinned.chainHash !== version.chainHash) {
          brokenAt = version.id;
          reason = "ipfs_content_mismatch";
          break;
        }
      }
    }

    return ok({
      valid: brokenAt === null,
      checkedVersions: versions.length,
      brokenAtVersionId: brokenAt,
      reason,
      ipfs: {
        anchoredVersions: versions.filter((v) => v.ipfsCid).length,
        crossChecked: ipfsChecked,
        unreachable: ipfsMismatched,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
