import { defineCollection, z } from "astro:content";
import { ARTICLE_TAG_WHITELIST_SET } from "./data/article-tags";
import { articleFileSlugSchema } from "./lib/article-file-slug-schema";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const pubDateSchema = z
  .union([
    z.string().regex(isoDateRegex, "pubDate חייבת להיות מחרוזת YYYY-MM-DD"),
    z.date(),
  ])
  .superRefine((val, ctx) => {
    if (typeof val === "string") {
      const t = Date.parse(val);
      if (Number.isNaN(t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pubDate לא תאריך חוקי" });
      }
    }
  })
  .transform((val) => {
    if (val instanceof Date) return val;
    return new Date(`${val}T12:00:00`);
  });

const tagsSchema = z
  .array(z.string().trim().min(1, "תגית לא יכולה להיות ריקה"))
  .default([])
  .superRefine((arr, ctx) => {
    for (const tag of arr) {
      if (!ARTICLE_TAG_WHITELIST_SET.has(tag)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `תגית לא ברשימה המאושרת: "${tag}". רשימה: ${[...ARTICLE_TAG_WHITELIST_SET].join(", ")}`,
        });
      }
    }
  });

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    simpleSummary: z.string().optional(),
    quickTakeaways: z.array(z.string()).max(3).optional(),
    originalInsight: z.string().optional(),
    bottomLine: z.string().optional(),
    pubDate: pubDateSchema,
    updatedDate: z.coerce.date().optional(),
    author: z.string().trim().default("השם לא משנה"),
    tags: tagsSchema,
    image: z.string().trim().default("/images/logo.svg"),
    canonicalUrl: z.string().trim().url().optional(),
    keywords: z.string().trim().optional(),
    audioUrl: z.string().trim().url().optional(),
    audioFile: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]+\.(mp3|m4a|ogg|wav)$/)
      .optional(),
    youtubeId: z.string().trim().optional(),
    /** וידאו נוסף לבעלי סשן פרימיום בלבד (מאמר חינמי) */
    premiumYoutubeId: z.string().optional(),
    /** כותרת לווידאון הפרימיום (לנגן ולנגישות) */
    premiumVideoTitle: z.string().optional(),
    videoSummaryPoints: z.array(z.string()).optional(),
    tallyUrl: z.string().trim().url().optional(),
    isPremium: z.boolean().default(false),
    draft: z.boolean().default(false),
    audience: z.string().trim().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    intendedAudience: z.string().trim().optional(),
    readTime: z.coerce.number().int().positive().optional(),
    isPublic: z.boolean().default(true),
    workflowStatus: z.enum(["writing", "review", "ready", "published"]).optional(),
    difficultyLevel: z.enum(["beginner", "advanced", "deep"]).optional(),
    /** עוצמת שינוי תפיסתי לתצוגה (1-5) */
    mindShiftIntensity: z.coerce.number().int().min(1).max(5).optional(),
    /** alt לתמונה: תמונה גלויה + הקשר קונספטואלי (חיזוק סמנטי ל-SEO, לא רק תיאור פיקסלים) */
    imageAlt: z.string().optional(),
    inversionNote: z.string().optional(),
    inversionQuestion: z.string().optional(),
    finalQuestion: z.string().optional(),
    reflectionQuestions: z.array(z.string()).length(3).optional(),
    relatedConcepts: z.array(z.string()).optional(),
    /** ל־TruthBlock microdata: Question + acceptedAnswer */
    questionForSchema: z.string().trim().optional(),
    forbiddenLibrary: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          question: z.string().trim().min(1, "שאלה לא יכולה להיות ריקה"),
          answer: z.string().trim().min(1, "תשובה לא יכולה להיות ריקה"),
        })
      )
      .optional(),
    slug: articleFileSlugSchema.optional(),
    /** מרכז הקריאה ב־/blog/: כניסה מובנית בלי רשימה קשיחה בקוד */
    hubPosition: z.enum(["start", "core", "latest"]).optional(),
    /** סדר בתוך אותה קטגוריית hub (נמוך מופיע ראשון) */
    hubOrder: z.number().optional(),
    journeyTopic: z.enum(["mental-health", "general"]).optional(),
    sensitivityWarning: z.boolean().default(false),
    videoContent: z
      .object({
        hook: z.string().trim().optional(),
        questions: z.array(z.string().trim().min(1, "שאלה לא יכולה להיות ריקה")).max(10).optional(),
        visualDirection: z.string().trim().optional(),
        reelScript: z.string().trim().optional(),
        bridgeLogic: z.string().trim().optional(),
      })
      .optional(),
  }),
});

export const collections = { articles };
