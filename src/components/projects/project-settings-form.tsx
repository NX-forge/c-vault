"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  genre: string | null;
  tone: string | null;
  targetAudience: string | null;
  premise: string;
  isPublic: boolean;
};

export function ProjectSettingsForm({ project }: { project: Project }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: project.title,
    genre: project.genre ?? "",
    tone: project.tone ?? "",
    targetAudience: project.targetAudience ?? "",
    premise: project.premise,
  });
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "epub">("pdf");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setSaving(false);

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't save changes.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function togglePublic() {
    const next = !isPublic;
    setIsPublic(next);

    const requiresConfirm = next;
    if (requiresConfirm && !window.confirm(
      "Making this project public lists it on your creator profile, with non-premium chapters visible to anyone. Continue?"
    )) {
      setIsPublic(!next);
      return;
    }

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (!res.ok) {
      setIsPublic(!next);
      setError("Couldn't update visibility.");
      return;
    }
    router.refresh();
  }

  async function exportProject() {
    setExporting(true);
    setError(null);

    if (
      !window.confirm(
        `Export a ${exportFormat.toUpperCase()} of this project's current chapters? This creates a new export record.`
      )
    ) {
      setExporting(false);
      return;
    }

    const res = await fetch(`/api/projects/${project.id}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: exportFormat }),
    });
    const body = await res.json();
    setExporting(false);

    if (!res.ok || !body.success) {
      setError(body.error || "Couldn't export — add at least one saved chapter first.");
      return;
    }

    window.open(body.data.pdfUrl, "_blank");
  }

  async function deleteProject() {
    if (
      !window.confirm(
        `Delete "${project.title}" permanently? This removes all chapters and version history.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setError("Couldn't delete the project.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={save} className="flex flex-col gap-3">
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="input"
            placeholder="Genre"
            value={form.genre}
            onChange={(e) => setForm({ ...form, genre: e.target.value })}
          />
          <input
            className="input"
            placeholder="Tone"
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
          />
          <input
            className="input"
            placeholder="Target audience"
            value={form.targetAudience}
            onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
          />
        </div>
        <textarea
          className="input min-h-24"
          value={form.premise}
          onChange={(e) => setForm({ ...form, premise: e.target.value })}
        />
        {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="rounded-xl border border-secondary-200 p-5 dark:border-secondary-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Public profile visibility</p>
            <p className="mt-1 text-sm text-secondary-500">
              {isPublic
                ? "Visible on your creator profile. Premium chapters stay locked."
                : "Private — only you can see this project."}
            </p>
          </div>
          <button
            onClick={togglePublic}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              isPublic
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : "border border-secondary-200 text-secondary-700 hover:border-secondary-300 dark:border-secondary-700 dark:text-secondary-300"
            }`}
          >
            {isPublic ? "Public" : "Make public"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-secondary-200 p-5 dark:border-secondary-800">
        <p className="font-medium">Export</p>
        <p className="mt-1 text-sm text-secondary-500">
          Renders every chapter&rsquo;s latest saved version into a single file.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-secondary-200 p-0.5 text-sm dark:border-secondary-700">
            <button
              onClick={() => setExportFormat("pdf")}
              className={`rounded-full px-3 py-1 font-medium ${
                exportFormat === "pdf"
                  ? "bg-secondary-900 text-white dark:bg-secondary-50 dark:text-secondary-900"
                  : "text-secondary-600 dark:text-secondary-400"
              }`}
            >
              PDF
            </button>
            <button
              onClick={() => setExportFormat("epub")}
              className={`rounded-full px-3 py-1 font-medium ${
                exportFormat === "epub"
                  ? "bg-secondary-900 text-white dark:bg-secondary-50 dark:text-secondary-900"
                  : "text-secondary-600 dark:text-secondary-400"
              }`}
            >
              EPUB
            </button>
          </div>
          <button
            onClick={exportProject}
            disabled={exporting}
            className="rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 disabled:opacity-60 dark:border-secondary-700"
          >
            {exporting ? "Exporting…" : `Export to ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-xl border border-red-200 p-5 dark:border-red-900">
        <p className="font-medium text-red-700 dark:text-red-400">Danger zone</p>
        <p className="mt-1 text-sm text-secondary-500">
          Deleting a project removes all its chapters and version history permanently.
        </p>
        <button
          onClick={deleteProject}
          className="mt-3 rounded-full border border-red-300 px-4 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          Delete project
        </button>
      </div>
    </div>
  );
}
