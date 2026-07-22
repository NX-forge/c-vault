import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Turns a caught error into a consistent API error response.
 * Zod errors become 400s with a readable message; an "UNAUTHENTICATED" marker
 * (thrown by requireCurrentUserId) becomes a 401; anything else is a 500.
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((i) => i.message).join("; ");
    return fail(message, 400);
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED") {
      return fail("You need to be signed in to do that.", 401);
    }
    return fail(error.message, 500);
  }
  return fail("Something went wrong.", 500);
}
