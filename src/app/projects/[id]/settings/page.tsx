import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { ProjectSettingsForm } from "@/components/projects/project-settings-form";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== userId) notFound();

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-secondary-500 hover:text-secondary-700"
        >
          &larr; Back to project
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Project settings</h1>
        <div className="mt-8">
          <ProjectSettingsForm
            project={{
              id: project.id,
              title: project.title,
              genre: project.genre,
              tone: project.tone,
              targetAudience: project.targetAudience,
              premise: project.premise,
              isPublic: project.isPublic,
            }}
          />
        </div>
      </div>
    </div>
  );
}
