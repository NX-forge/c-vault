"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OutlinePanel({
  projectId,
  initialContent,
}: {
  projectId: string;
  initialContent: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/outline`, { method: "POST" });
    const body = await res.json();

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't generate an outline.");
      setLoading(false);
      return;
    }

    setContent(body.data.content);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-secondary-200 p-5 dark:border-secondary-800">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Outline</h2>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
        >
          {loading ? "Generating…" : content ? "Regenerate" : "Generate outline"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {content ? (
        <>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-secondary-700 dark:text-secondary-300">
            {content}
          </p>
          <p className="mt-3 text-xs font-medium text-primary-600">AI-assisted suggestion</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-secondary-500">
          No outline yet — generate one from your premise, then edit it as you see fit.
        </p>
      )}
    </div>
  );
}
