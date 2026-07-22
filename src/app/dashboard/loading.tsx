import { Skeleton, SkeletonLines } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-secondary-950">
      <div className="border-b border-secondary-100 px-6 py-4 dark:border-secondary-900">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-secondary-100 p-4 dark:border-secondary-900">
              <Skeleton className="h-4 w-1/3" />
              <div className="mt-2">
                <SkeletonLines count={1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
