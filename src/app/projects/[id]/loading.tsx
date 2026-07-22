import { Skeleton, SkeletonLines } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <div className="border-b border-secondary-100 px-6 py-4 dark:border-secondary-900">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-1/2" />
        <div className="mt-3">
          <SkeletonLines count={2} />
        </div>
        <div className="mt-8 rounded-xl border border-secondary-100 p-5 dark:border-secondary-900">
          <SkeletonLines count={4} />
        </div>
        <div className="mt-10 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
