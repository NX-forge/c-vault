import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit } from "./redis";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Rate limit by email, not IP — cheap to implement without middleware,
        // and it's what actually matters for credential-stuffing against one
        // account. 10 attempts per 5 minutes is generous for a real user,
        // tight for a script.
        const { allowed } = await checkRateLimit(
          `login:${credentials.email.toLowerCase()}`,
          10,
          300
        );
        if (!allowed) {
          throw new Error("Too many attempts — wait a few minutes and try again.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          publicSlug: user.publicSlug,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — explicit rather than relying on the library default
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.publicSlug = (user as { publicSlug?: string }).publicSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.publicSlug = token.publicSlug as string;
      }
      return session;
    },
  },
};

// Made with Bob
