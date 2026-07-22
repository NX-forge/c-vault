import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/layout/navbar";
import { ChapterEditor } from "@/components/editor/chapter-editor";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      project: true,
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!chapter || chapter.project.userId !== userId || chapter.projectId !== id) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href={`/projects/${chapter.projectId}`}
          className="text-sm text-secondary-500 hover:text-secondary-700"
        >
          &larr; {chapter.project.title}
        </Link>
        <div className="mt-6">
          <ChapterEditor
            chapterId={chapter.id}
            chapterTitle={chapter.title}
            initialContent={chapter.versions[0]?.content ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
