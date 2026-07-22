import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/session";
import { profileUpdateSchema } from "@/lib/validations";
import { ok, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        publicSlug: true,
        bio: true,
        avatarUrl: true,
      },
    });
    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    const body = await req.json();
    const input = profileUpdateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...input,
        avatarUrl: input.avatarUrl === "" ? null : input.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        publicSlug: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return ok(user);
  } catch (error) {
    return handleApiError(error);
  }
}
