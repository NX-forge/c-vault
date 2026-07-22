"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-secondary-100 dark:border-secondary-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          C<span className="text-primary-600">·</span>Vault
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-secondary-600 dark:text-secondary-400 sm:gap-6">
          <Link href="/dashboard" className="hover:text-secondary-900 dark:hover:text-secondary-100">
            Dashboard
          </Link>
          {session?.user && (
            <Link
              href={`/creator/${session.user.publicSlug ?? ""}`}
              className="hidden hover:text-secondary-900 dark:hover:text-secondary-100 sm:inline"
            >
              My profile
            </Link>
          )}
          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-secondary-200 px-3 py-1.5 font-medium text-secondary-700 hover:border-secondary-300 dark:border-secondary-800 dark:text-secondary-300 sm:px-4"
            >
              Sign out
            </button>
          ) : (
            <Link href="/login" className="hover:text-secondary-900 dark:hover:text-secondary-100">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
