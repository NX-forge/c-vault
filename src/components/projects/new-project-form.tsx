"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    genre: "",
    tone: "",
    targetAudience: "",
    premise: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't create the project.");
      setLoading(false);
      return;
    }

    router.push(`/projects/${body.data.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
      >
        New project
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 rounded-xl border border-secondary-200 bg-white p-5 dark:border-secondary-800 dark:bg-secondary-950"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input"
        />
        <input
          placeholder="Genre (optional)"
          value={form.genre}
          onChange={(e) => setForm({ ...form, genre: e.target.value })}
          className="input"
        />
        <input
          placeholder="Tone (optional)"
          value={form.tone}
          onChange={(e) => setForm({ ...form, tone: e.target.value })}
          className="input"
        />
        <input
          placeholder="Target audience (optional)"
          value={form.targetAudience}
          onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
          className="input"
        />
      </div>
      <textarea
        required
        placeholder="Premise — a few sentences is enough for AI to work with"
        value={form.premise}
        onChange={(e) => setForm({ ...form, premise: e.target.value })}
        className="input min-h-24"
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create project"}
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
