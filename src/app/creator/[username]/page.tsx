import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { publicSlug: username },
    select: {
      displayName: true,
      publicSlug: true,
      bio: true,
      avatarUrl: true,
      projects: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
        include: {
          chapters: {
            orderBy: { order: "asc" },
            include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
          publishedWorks: { orderBy: { publishedAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <header className="border-b border-secondary-100 dark:border-secondary-900">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            C<span className="text-primary-600">·</span>Vault
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{user.displayName}</h1>
            <p className="text-sm text-secondary-500">@{user.publicSlug}</p>
          </div>
        </div>

        {user.bio && (
          <p className="mt-4 max-w-xl text-sm text-secondary-600 dark:text-secondary-400">
            {user.bio}
          </p>
        )}

        <div className="mt-10 flex flex-col gap-8">
          {user.projects.length === 0 ? (
            <EmptyState
              title="No public projects yet"
              description={`${user.displayName} hasn't published anything publicly yet — check back soon.`}
            />
          ) : (
            user.projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-secondary-200 p-5 dark:border-secondary-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-medium">{project.title}</h2>
                    <p className="mt-1 text-sm text-secondary-500">
                      {project.genre || "No genre"}
                    </p>
                  </div>
                  {project.publishedWorks[0] && (
                    <a
                      href={project.publishedWorks[0].pdfUrl}
                      className="shrink-0 rounded-full border border-secondary-200 px-3 py-1 text-xs font-medium hover:border-secondary-300 dark:border-secondary-700"
                    >
                      Download {project.publishedWorks[0].format.toUpperCase()}
                    </a>
                  )}
                </div>
                <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                  {project.premise}
                </p>

                <ul className="mt-4 flex flex-col gap-2">
                  {project.chapters.map((chapter) => {
                    const latest = chapter.versions[0];
                    return (
                      <li
                        key={chapter.id}
                        className="rounded-lg border border-secondary-100 p-3 text-sm dark:border-secondary-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{chapter.title}</span>
                          <div className="flex items-center gap-2">
                            {latest && (
                              <span className="text-xs uppercase tracking-wide text-secondary-400">
                                {latest.authorType === "HUMAN"
                                  ? "Human-written"
                                  : latest.authorType === "AI"
                                    ? "AI-assisted"
                                    : "Mixed"}
                              </span>
                            )}
                            {chapter.isPremium && (
                              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300">
                                Premium — locked
                              </span>
                            )}
                          </div>
                        </div>
                        {chapter.isPremium ? (
                          <p className="mt-1 text-secondary-500">
                            {(latest?.content ?? "").slice(0, 140)}
                            {(latest?.content?.length ?? 0) > 140 ? "…" : ""}
                          </p>
                        ) : (
                          <p className="mt-1 whitespace-pre-line text-secondary-600 dark:text-secondary-400">
                            {latest?.content ?? "Not yet written."}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
