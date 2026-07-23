import type {
  User,
  Project,
  Chapter,
  Version,
  Outline,
  AiInteraction,
  PublishedWork
} from "@/generated/prisma/client";

// Re-export Prisma types
export type { User, Project, Chapter, Version, Outline, AiInteraction, PublishedWork };

// Extended types for API responses
export type UserWithProjects = User & {
  projects: Project[];
};

export type ProjectWithDetails = Project & {
  outline: Outline | null;
  chapters: Chapter[];
  user: User;
};

export type ChapterWithVersions = Chapter & {
  versions: Version[];
};

// API response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// AI Generation types
export type GenerateOutlineInput = {
  projectId: string;
  genre: string;
  premise: string;
};

export type GenerateChapterInput = {
  projectId: string;
  chapterId: string;
  prompt: string;
};

// NextAuth extended types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      publicSlug: string;
    };
  }

  interface User {
    id: string;
    publicSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    publicSlug?: string;
  }
}

// Made with Bob
