/**
 * תגיות מאמר מאושרות (Whitelist) — מסונכרן עם Master Prompt ועם Decap config.yml
 */
export const ARTICLE_TAG_WHITELIST = [
  "חופש",
  "מכניקת מחשבה",
  "העצמי",
  "בהירות",
  "בחירה",
  "זוגיות",
  "משפחה וחינוך",
  "פילוסופיה וחברה",
  "תודעה ורצון",
  "חשיבה ביקורתית",
  "שאלות גדולות",
  "רגשות",
  "ניסויי מחשבה",
] as const;

export type ArticleTagWhitelisted = (typeof ARTICLE_TAG_WHITELIST)[number];

export const ARTICLE_TAG_WHITELIST_SET = new Set<string>(ARTICLE_TAG_WHITELIST);

export function isWhitelistedArticleTag(tag: string): boolean {
  return ARTICLE_TAG_WHITELIST_SET.has(tag.trim());
}
