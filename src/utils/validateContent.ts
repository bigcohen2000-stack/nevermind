import { ROBOTIC_BLOCKLIST, validateAndClassify } from "./contentValidator";

export type ContentValidationResult = {
  /** true אם לא נמצא אף ביטוי מהרשימה */
  clean: boolean;
  /** ביטויים שנמצאו (ייחודיים לפי סדר הופעה ברשימה) */
  hits: string[];
};

function normalizePhraseList(phrases: readonly string[]): string[] {
  return phrases.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
}

/**
 * סריקת Content Score: התאמות case-insensitive של ביטויים אסורים.
 * ברירת מחדל: אותה רשימה כמו ב־validateAndClassify (ROBOTIC_BLOCKLIST).
 *
 * @param content טקסט מלא לבדיקה (למשל קובץ MDX גולמי)
 * @param phrases רשימה מותאמת אישית (למשל בדיקות CI); אם לא מועברת - משתמשים ב־contentValidator
 */
export function validateContent(content: string, phrases?: readonly string[]): ContentValidationResult {
  if (phrases !== undefined) {
    const list = normalizePhraseList(phrases);
    const lower = String(content ?? "").toLowerCase();
    const hits: string[] = [];
    for (const phrase of list) {
      if (lower.includes(phrase.toLowerCase())) hits.push(phrase);
    }
    return { clean: hits.length === 0, hits };
  }
  const r = validateAndClassify(content);
  return { clean: r.valid, hits: r.matchedBlocklist };
}

/** ייצוא לסקריפטים שרוצים את רשימת ברירת המחדל בלי לייבא את כל המודול */
export const DEFAULT_CONTENT_BLOCKLIST = ROBOTIC_BLOCKLIST;
