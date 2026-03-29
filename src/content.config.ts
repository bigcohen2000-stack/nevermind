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
  .array(z.string())
  .default([])
  .superRefine((arr, ctx) => {
    for (const tag of arr) {
      const t = tag.trim();
      if (!ARTICLE_TAG_WHITELIST_SET.has(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `תגית לא ברשימה המאושרת: "${t}". רשימה: ${[...ARTICLE_TAG_WHITELIST_SET].join(", ")}`,
        });
      }
    }
  });

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    originalInsight: z.string().optional(),
    bottomLine: z.string().optional(),
    pubDate: pubDateSchema,
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("השם לא משנה"),
    tags: tagsSchema,
    image: z.string().default("/images/logo.svg"),
    canonicalUrl: z.string().url().optional(),
    keywords: z.string().optional(),
    audioUrl: z.string().optional(),
    audioFile: z
      .string()
      .regex(/^[a-zA-Z0-9._-]+\.(mp3|m4a|ogg|wav)$/)
      .optional(),
    youtubeId: z.string().optional(),
    /** וידאו נוסף לבעלי סשן פרימיום בלבד (מאמר חינמי) */
    premiumYoutubeId: z.string().optional(),
    /** כותרת לווידאון הפרימיום (לנגן ולנגישות) */
    premiumVideoTitle: z.string().optional(),
    videoSummaryPoints: z.array(z.string()).optional(),
    tallyUrl: z.string().url().optional(),
    isPremium: z.boolean().default(false),
    draft: z.boolean().default(false),
    workflowStatus: z.enum(["writing", "review", "ready", "published"]).optional(),
    difficultyLevel: z.enum(["beginner", "advanced", "deep"]).optional(),
    /** עוצמת שינוי תפיסתי לתצוגה (1–5) */
    mindShiftIntensity: z.coerce.number().int().min(1).max(5).optional(),
    /** alt לתמונה: תמונה גלויה + הקשר קונספטואלי (חיזוק סמנטי ל-SEO, לא רק תיאור פיקסלים) */
    imageAlt: z.string().optional(),
    inversionNote: z.string().optional(),
    reflectionQuestions: z.array(z.string()).length(3).optional(),
    relatedConcepts: z.array(z.string()).optional(),
    /** ל־TruthBlock microdata: Question + acceptedAnswer */
    questionForSchema: z.string().optional(),
    forbiddenLibrary: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .optional(),
    slug: articleFileSlugSchema.optional(),
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
