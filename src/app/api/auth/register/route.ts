import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/redis";
import { ok, fail, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    const { allowed } = await checkRateLimit(`register:${input.email.toLowerCase()}`, 5, 3600);
    if (!allowed) {
      return fail("Too many attempts for this email — wait a while and try again.", 429);
    }

    const [existingEmail, existingSlug] = await Promise.all([
      prisma.user.findUnique({ where: { email: input.email } }),
      prisma.user.findUnique({ where: { publicSlug: input.publicSlug } }),
    ]);

    if (existingEmail) {
      return fail("An account with that email already exists.", 409);
    }
    if (existingSlug) {
      return fail("That username is taken — try another.", 409);
    }

    const passwordHash = await hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        publicSlug: input.publicSlug,
      },
      select: { id: true, email: true, displayName: true, publicSlug: true },
    });

    return ok(user, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
