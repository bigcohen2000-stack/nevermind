import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    bottomLine: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().default("/og.jpg"),
    canonicalUrl: z.string().url().optional(),
    keywords: z.string().optional(),
    audioUrl: z.string().optional(),
    /** קובץ מקומי תחת public/audio/articles/ (ללא נתיב) */
    audioFile: z
      .string()
      .regex(/^[a-zA-Z0-9._-]+\.(mp3|m4a|ogg|wav)$/)
      .optional(),
    youtubeId: z.string().optional(),
    /** נקודות מרכזיות מהתמלול — מוצגות ב"סיכום מהיר" מתחת לנגן + SEO */
    videoSummaryPoints: z.array(z.string()).optional(),
    tallyUrl: z.string().url().optional(),
    isPremium: z.boolean().default(false),
    draft: z.boolean().default(false),
    workflowStatus: z.enum(["writing", "review", "ready", "published"]).optional(),
    difficultyLevel: z.enum(["beginner", "advanced", "deep"]).optional(),
    reflectionQuestions: z.array(z.string()).length(3).optional(),
    /** slugs או כותרות מושגים לקישור לגלוסה */
    relatedConcepts: z.array(z.string()).optional(),
    forbiddenLibrary: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { articles };
