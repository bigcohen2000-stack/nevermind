import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    originalInsight: z.string().optional(),
    bottomLine: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("השם לא משנה"),
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
    /** מזהה קונספטואלי באנגלית (מילה–שתיים) — שם קובץ מוצע / מיתוג; נתיב ה-URL נשאר משם קובץ ה-.mdx */
    slug: z.string().optional(),
    /** Work order לווידאו (מחבילת AI חלק ג') — אופציונלי */
    videoContent: z
      .object({
        hook: z.string().optional(),
        questions: z.array(z.string()).max(10).optional(),
        visualDirection: z.string().optional(),
        reelScript: z.string().optional(),
        bridgeLogic: z.string().optional(),
      })
      .optional(),
  }),
});

export const collections = { articles };
