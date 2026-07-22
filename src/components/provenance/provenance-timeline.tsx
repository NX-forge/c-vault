"use client";

import { useEffect, useState, useCallback } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ipfsGatewayUrl } from "@/lib/ipfs-gateway";

type VersionEntry = {
  id: string;
  versionNumber: number;
  chainHash: string;
  previousHash: string | null;
  authorType: "HUMAN" | "AI" | "MIXED";
  note: string | null;
  ipfsCid: string | null;
  createdAt: string;
};

type VerifyResult = {
  valid: boolean;
  checkedVersions: number;
  brokenAtVersionId: string | null;
  reason: string | null;
  ipfs: { anchoredVersions: number; crossChecked: number; unreachable: string[] };
};

const REASON_COPY: Record<string, string> = {
  chain_link_mismatch: "a version's link to the one before it doesn't match",
  hash_mismatch: "a version's content no longer matches its stored hash",
  ipfs_content_mismatch: "the copy pinned on IPFS no longer matches what's in the database",
  ipfs_unreachable: "an anchored version's IPFS pin couldn't be reached to cross-check",
};

export function ProvenanceTimeline({ chapterId, refreshKey }: { chapterId: string; refreshKey: number }) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [anchoring, setAnchoring] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/chapters/${chapterId}/versions`);
    const body = await res.json();
    if (res.ok && body.success) {
      setVersions(body.data);
    }
    setLoading(false);
  }, [chapterId]);

  useEffect(() => {
    load();
    setVerifyResult(null);
  }, [load, refreshKey]);

  async function verify() {
    setVerifying(true);
    const res = await fetch(`/api/chapters/${chapterId}/verify`);
    const body = await res.json();
    if (res.ok && body.success) {
      setVerifyResult(body.data);
    }
    setVerifying(false);
  }

  async function saveNote(versionId: string) {
    const note = noteDraft[versionId] ?? "";
    const res = await fetch(`/api/chapters/${chapterId}/versions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId, note }),
    });
    if (res.ok) {
      load();
    }
  }

  async function anchorVersion(versionId: string) {
    setAnchoring(versionId);
    setAnchorError(null);
    const res = await fetch(`/api/chapters/${chapterId}/anchor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    const body = await res.json();
    setAnchoring(null);

    if (!res.ok || !body.success) {
      setAnchorError(body.error || "Couldn't anchor to IPFS.");
      return;
    }
    load();
  }

  return (
    <div className="rounded-xl border border-secondary-200 p-5 dark:border-secondary-800">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Provenance timeline</h2>
        <button
          onClick={verify}
          disabled={verifying || versions.length === 0}
          className="rounded-full border border-secondary-200 px-4 py-1.5 text-xs font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
        >
          {verifying ? "Verifying…" : "Verify chain"}
        </button>
      </div>

      {verifyResult && (
        <div
          className={`mt-3 text-sm ${
            verifyResult.valid
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          <p>
            {verifyResult.valid
              ? `Chain verified — all ${verifyResult.checkedVersions} version(s) check out.`
              : `Chain broken: ${REASON_COPY[verifyResult.reason ?? ""] ?? "an unexpected check failed"}.`}
          </p>
          {verifyResult.ipfs.anchoredVersions > 0 && (
            <p className="mt-1 text-xs text-secondary-500">
              {verifyResult.ipfs.crossChecked} of {verifyResult.ipfs.anchoredVersions} anchored
              version(s) cross-checked against IPFS.
            </p>
          )}
        </div>
      )}

      {anchorError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{anchorError}</p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-secondary-500">Loading…</p>
      ) : versions.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No saved versions yet"
            description="Save an edit above to start this chapter's provenance chain."
          />
        </div>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {versions.map((version, i) => (
            <li
              key={version.id}
              className="rounded-lg border border-secondary-100 p-3 text-sm dark:border-secondary-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-primary-600">
                  v{version.versionNumber} · {version.chainHash.slice(0, 12)}
                </span>
                <span className="text-xs text-secondary-500">
                  {i === 0 ? "latest" : ""} · {new Date(version.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-secondary-500">
                {version.authorType}
              </p>
              {version.note && (
                <p className="mt-1 text-secondary-600 dark:text-secondary-400">{version.note}</p>
              )}
              <div className="mt-2 flex gap-2">
                <input
                  className="input flex-1 text-xs"
                  placeholder="Add a note (e.g. sent to beta readers)"
                  value={noteDraft[version.id] ?? version.note ?? ""}
                  onChange={(e) =>
                    setNoteDraft({ ...noteDraft, [version.id]: e.target.value })
                  }
                />
                <button
                  onClick={() => saveNote(version.id)}
                  className="rounded-full border border-secondary-200 px-3 py-1 text-xs font-medium dark:border-secondary-700"
                >
                  Save note
                </button>
              </div>
              <div className="mt-2">
                {version.ipfsCid ? (
                  <a
                    href={ipfsGatewayUrl(version.ipfsCid)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-primary-600 hover:underline"
                  >
                    Anchored on IPFS · {version.ipfsCid.slice(0, 14)}…
                  </a>
                ) : (
                  <button
                    onClick={() => anchorVersion(version.id)}
                    disabled={anchoring === version.id}
                    className="rounded-full border border-secondary-200 px-3 py-1 text-xs font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
                  >
                    {anchoring === version.id ? "Anchoring…" : "Anchor to IPFS"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
