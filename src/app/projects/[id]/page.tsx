import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { OutlinePanel } from "@/components/projects/outline-panel";
import { NewChapterForm } from "@/components/projects/new-chapter-form";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      outline: true,
      chapters: {
        orderBy: { order: "asc" },
        include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!project || project.userId !== userId) notFound();

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-secondary-500">
              {project.genre || "No genre"} {project.tone ? `· ${project.tone}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.title}</h1>
            <p className="mt-2 max-w-xl text-sm text-secondary-600 dark:text-secondary-400">
              {project.premise}
            </p>
          </div>
          <Link
            href={`/projects/${project.id}/settings`}
            className="shrink-0 rounded-full border border-secondary-200 px-4 py-1.5 text-sm font-medium hover:border-secondary-300 dark:border-secondary-700"
          >
            Settings
          </Link>
        </div>

        <div className="mt-8">
          <OutlinePanel projectId={project.id} initialContent={project.outline?.content ?? null} />
        </div>

        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium">Chapters</h2>
            <NewChapterForm projectId={project.id} />
          </div>

          {project.chapters.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No chapters yet"
                description="Add your first chapter above — start blank or let AI draft it, then review before it's saved."
              />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-secondary-100 dark:divide-secondary-900">
              {project.chapters.map((chapter) => {
                const latest = chapter.versions[0];
                return (
                  <li key={chapter.id} className="py-3">
                    <Link
                      href={`/projects/${project.id}/chapters/${chapter.id}`}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {chapter.title}
                          {chapter.isPremium && (
                            <span className="ml-2 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                              Premium
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-xs text-secondary-500">
                          {latest
                            ? `Last saved · v${latest.versionNumber} · ${latest.authorType.toLowerCase()} · ${latest.chainHash.slice(0, 10)}`
                            : "No content saved yet"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-primary-600">Open &rarr;</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
