"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewChapterForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [aiDraft, setAiDraft] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, title, aiDraft }),
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't create the chapter.");
      setLoading(false);
      return;
    }

    router.push(`/projects/${projectId}/chapters/${body.data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 dark:border-secondary-700"
      >
        Add chapter
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
      <input
        required
        autoFocus
        placeholder="Chapter title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input"
      />
      <label className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
        <input
          type="checkbox"
          checked={aiDraft}
          onChange={(e) => setAiDraft(e.target.checked)}
          className="h-4 w-4 rounded border-secondary-300"
        />
        Start with an AI first draft (you&rsquo;ll review it before it&rsquo;s final)
      </label>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create chapter"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-secondary-200 px-5 py-2 text-sm font-medium text-secondary-700 dark:border-secondary-800 dark:text-secondary-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
