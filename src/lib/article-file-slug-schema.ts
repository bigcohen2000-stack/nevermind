import { z } from "astro/zod";

/**
 * slug קובץ מאמר (בלי .mdx). חייב ליישר עם `getStaticPaths` ועם מפתחות `premium-locks.json`.
 * שינוי כאן + שימוש בסכמה ב־Actions יכשיל build אם הקריאה לא תואמת.
 */
export const articleFileSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);

export type ArticleFileSlug = z.infer<typeof articleFileSlugSchema>;
