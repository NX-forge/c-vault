"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProvenanceTimeline } from "@/components/provenance/provenance-timeline";

type AuthorType = "HUMAN" | "AI" | "MIXED";
type Action = "draft" | "continue" | "rewrite" | "review";

function draftKey(chapterId: string) {
  return `cvault-draft:${chapterId}`;
}

export function ChapterEditor({
  chapterId,
  chapterTitle,
  initialContent,
}: {
  chapterId: string;
  chapterTitle: string;
  initialContent: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [authorType, setAuthorType] = useState<AuthorType>("HUMAN");
  const [instruction, setInstruction] = useState("");
  const [suggestion, setSuggestion] = useState<{ action: Action; text: string } | null>(null);
  const [generating, setGenerating] = useState<Action | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [recoveredDraft, setRecoveredDraft] = useState<string | null>(null);
  const hasMountedRef = useRef(false);

  // On first mount, check for a local draft newer than what the server has —
  // protects against browser crashes/accidental tab closes between explicit
  // "Save version" checkpoints, without creating a provenance entry for it.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(draftKey(chapterId));
      if (stored) {
        const parsed = JSON.parse(stored) as { content: string };
        if (parsed.content && parsed.content !== initialContent) {
          setRecoveredDraft(parsed.content);
        }
      }
    } catch {
      // Corrupt or inaccessible localStorage — not worth surfacing an error for this.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced local draft save — separate from "Save version" on purpose, so
  // typing doesn't flood the hash-chain timeline with meaningless checkpoints.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey(chapterId),
          JSON.stringify({ content, savedAt: new Date().toISOString() })
        );
      } catch {
        // Storage full or unavailable — local draft safety net is best-effort.
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [content, chapterId]);

  const stats = useMemo(() => {
    const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/).length;
    const readingMinutes = Math.max(1, Math.round(words / 200));
    return { words, characters: content.length, readingMinutes };
  }, [content]);

  function restoreDraft() {
    if (recoveredDraft) {
      setContent(recoveredDraft);
      setAuthorType("MIXED");
    }
    setRecoveredDraft(null);
  }

  function dismissDraft() {
    setRecoveredDraft(null);
    try {
      window.localStorage.removeItem(draftKey(chapterId));
    } catch {
      // ignore
    }
  }

  async function generate(action: Action) {
    setGenerating(action);
    setError(null);
    setSuggestion(null);

    const res = await fetch(`/api/chapters/${chapterId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, currentContent: content, instruction }),
    });
    const body = await res.json();
    setGenerating(null);

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't generate a suggestion.");
      return;
    }

    setSuggestion({ action, text: body.data.suggestion });
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    const hadContentBefore = content.trim().length > 0;

    if (suggestion.action === "continue") {
      setContent((c) => `${c}\n\n${suggestion.text}`.trim());
    } else {
      setContent(suggestion.text);
    }

    setAuthorType(hadContentBefore ? "MIXED" : "AI");
    setSuggestion(null);
  }

  function discardSuggestion() {
    setSuggestion(null);
  }

  function handleManualEdit(value: string) {
    setContent(value);
    setAuthorType((prev) => (prev === "AI" ? "MIXED" : prev === "MIXED" ? "MIXED" : "HUMAN"));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/chapters/${chapterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, authorType }),
    });
    const body = await res.json();
    setSaving(false);

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't save.");
      return;
    }

    setMessage("Saved — new version added to the provenance timeline.");
    setAuthorType("HUMAN");
    setRefreshKey((k) => k + 1);
    try {
      window.localStorage.removeItem(draftKey(chapterId));
    } catch {
      // ignore
    }
    router.refresh();
  }

  const isReview = suggestion?.action === "review";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{chapterTitle}</h1>
          <span className="rounded-full border border-secondary-200 px-3 py-1 text-xs font-medium text-secondary-600 dark:border-secondary-700 dark:text-secondary-400">
            Currently: {authorType === "HUMAN" ? "Human-written" : authorType === "AI" ? "AI-assisted" : "Mixed (human + AI)"}
          </span>
        </div>

        <textarea
          value={content}
          onChange={(e) => handleManualEdit(e.target.value)}
          placeholder="Start writing, or generate an AI draft below…"
          className="input mt-4 min-h-[360px] font-serif text-base leading-7"
        />

        <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-secondary-500">
          <span>{stats.words} words</span>
          <span>{stats.characters} characters</span>
          <span>~{stats.readingMinutes} min read</span>
        </div>

        {recoveredDraft && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm dark:border-amber-900 dark:bg-amber-950">
            <span className="text-amber-800 dark:text-amber-300">
              We found an unsaved local draft that&rsquo;s different from what&rsquo;s currently loaded.
            </span>
            <div className="flex gap-2">
              <button
                onClick={restoreDraft}
                className="rounded-full bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
              >
                Restore it
              </button>
              <button
                onClick={dismissDraft}
                className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-800 dark:text-amber-300"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => generate("draft")}
            disabled={generating !== null}
            className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
          >
            {generating === "draft" ? "Drafting…" : "AI draft"}
          </button>
          <button
            onClick={() => generate("continue")}
            disabled={generating !== null}
            className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
          >
            {generating === "continue" ? "Continuing…" : "Continue scene"}
          </button>
          <button
            onClick={() => generate("rewrite")}
            disabled={generating !== null}
            className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
          >
            {generating === "rewrite" ? "Rewriting…" : "Rewrite in style"}
          </button>
          <button
            onClick={() => generate("review")}
            disabled={generating !== null}
            className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
          >
            {generating === "review" ? "Reviewing…" : "Creative review"}
          </button>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Style instruction for rewrite (optional)"
            className="input max-w-xs flex-1 text-sm"
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {suggestion && (
          <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-900 dark:bg-primary-950">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-700 dark:text-primary-300">
              AI suggestion &middot; {suggestion.action} &middot; review before it counts
            </p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary-800 dark:text-secondary-200">
              {suggestion.text}
            </p>
            {!isReview && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={acceptSuggestion}
                  className="rounded-full bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  {suggestion.action === "continue" ? "Append to chapter" : "Use this draft"}
                </button>
                <button
                  onClick={discardSuggestion}
                  className="rounded-full border border-primary-300 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:text-primary-300"
                >
                  Discard
                </button>
              </div>
            )}
            {isReview && (
              <button
                onClick={discardSuggestion}
                className="mt-3 rounded-full border border-primary-300 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:text-primary-300"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {message && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{message}</p>}

        <button
          onClick={save}
          disabled={saving || content.trim().length === 0}
          className="mt-4 rounded-full bg-secondary-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-secondary-800 disabled:opacity-60 dark:bg-secondary-50 dark:text-secondary-900"
        >
          {saving ? "Saving…" : "Save version"}
        </button>
      </div>

      <ProvenanceTimeline chapterId={chapterId} refreshKey={refreshKey} />
    </div>
  );
}
