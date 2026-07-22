"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, wire this to an error-tracking service (Sentry, etc).
    // Logged to console for now so it's at least visible during the demo.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white px-6 py-24 text-center dark:bg-secondary-950">
      <p className="text-lg font-semibold tracking-tight">Something went wrong</p>
      <p className="max-w-sm text-sm text-secondary-500">
        That's on us, not something you did. You can try again, or head back to your dashboard.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-full border border-secondary-200 px-5 py-2 text-sm font-medium text-secondary-700 hover:border-secondary-300 dark:border-secondary-700 dark:text-secondary-300"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
