import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Returns the current session's user id, or null if unauthenticated.
 * Use in API routes/server components instead of calling getServerSession directly
 * everywhere, so the "how do we know who's asking" logic lives in one place.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHENTICATED");
  }
  return userId;
}
