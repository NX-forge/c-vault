import { Skeleton, SkeletonLines } from "@/components/ui/skeleton";

export default function CreatorProfileLoading() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <div className="border-b border-secondary-100 px-6 py-4 dark:border-secondary-900">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-secondary-100 p-5 dark:border-secondary-900">
              <Skeleton className="h-5 w-1/3" />
              <div className="mt-3">
                <SkeletonLines count={3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
