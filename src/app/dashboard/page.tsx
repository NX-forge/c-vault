import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { chapters: { select: { id: true } } },
  });

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <Navbar />
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Your projects</h1>
          <NewProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No projects yet"
              description="Start one above and generate an outline to get going — your first save begins the provenance chain."
            />
          </div>
        ) : (
          <ul className="mt-8 flex flex-col divide-y divide-secondary-100 dark:divide-secondary-900">
            {projects.map((project) => (
              <li key={project.id} className="py-4">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.title}</p>
                    <p className="mt-1 text-sm text-secondary-500">
                      {project.genre || "No genre set"} &middot; {project.chapters.length}{" "}
                      chapter{project.chapters.length === 1 ? "" : "s"}
                      {project.isPublic ? " · Public" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-primary-600">Open &rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
