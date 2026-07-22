import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  displayName: z.string().min(2, "Name must be at least 2 characters").max(80),
  publicSlug: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(160),
  genre: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
  premise: z.string().min(1, "Give a short premise so AI has something to work with").max(4000),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  genre: z.string().max(80).optional(),
  tone: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
  premise: z.string().min(1).max(4000).optional(),
  isPublic: z.boolean().optional(),
});

export const generateOutlineSchema = z.object({
  beats: z.number().int().min(3).max(20).optional(),
});

export const createChapterSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Chapter title is required").max(160),
  order: z.number().int().min(0).optional(),
  aiDraft: z.boolean().optional(),
  instruction: z.string().max(2000).optional(),
});

export const updateChapterMetaSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  order: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "FINAL"]).optional(),
  isPremium: z.boolean().optional(),
});

export const saveChapterSchema = z.object({
  content: z.string().min(1, "Content can't be empty"),
  authorType: z.enum(["HUMAN", "AI", "MIXED"]),
  note: z.string().max(280).optional(),
});

export const chapterGenerateSchema = z.object({
  action: z.enum(["draft", "continue", "rewrite", "review"]),
  currentContent: z.string().max(20000).optional(),
  instruction: z.string().max(2000).optional(),
});

export const versionNoteSchema = z.object({
  note: z.string().max(280),
});
