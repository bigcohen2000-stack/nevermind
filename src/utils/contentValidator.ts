/**
 * ולידציית שפה (פסילה) + זיהוי נושאים רגישים (המלצה לפרימיום).
 * מקור האמת היחיד כאן — אין content-forbidden-phrases.json; כל הרשימות בקובץ TS זה.
 */

/** ביטויים שנתפסים כשפה גנרית/רובוטית — פגיעה = valid: false (כשל בילד) */
export const ROBOTIC_BLOCKLIST = [
  "methodology",
  "paradigm",
  "dive deep",
  "deep dive",
  "leverage",
  "synergy",
  "game-changer",
  "cutting-edge",
  "revolutionary",
  "unlock the power",
  "comprehensive guide",
  "unlock your potential",
  "in today's digital landscape",
  "in today\u2019s digital landscape",
  "it's important to note",
  "it\u2019s important to note",
  "harnessing the power of",
  "בעולם המודרני של היום",
  "חשוב לציין ש",
  "לסיכום,",
  "ראוי לציין",
  "כאמור",
] as const;

/**
 * מילים וביטויים שמצדיקים סיווג פרימיום — פגיעה = recommendPremium / אזהרה, לא כשל בילד.
 * לאנגלית: גבול מילה (שקול ל־\\b): sex מתאים, section / essex לא.
 */
export const PREMIUM_SENSITIVE_TRIGGERS = [
  "סמים",
  "מין",
  "פורנו",
  "הימורים",
  "התמכרות",
  "sex",
  "porn",
  "drugs",
  "heroin",
  "cocaine",
  "gambling",
  "casino",
  "addiction",
  "suicide",
] as const;

export const ROBOTIC_LANGUAGE_ERROR = "השפה רובוטית מדי";

export const SENSITIVE_TOPIC_WARNING = "נושא רגיש זוהה - המאמר סווג כפרימיום";

export type ValidateAndClassifyResult = {
  /** false אם נמצאה התאמה לפסילה */
  valid: boolean;
  /** הודעת שגיאה קבועה אם valid === false */
  error: string | null;
  /** התראה אם נמצאה רגישות */
  warning: string | null;
  /** true אם יש התאמה לרשימת הרגישות */
  recommendPremium: boolean;
  matchedBlocklist: string[];
  matchedSensitive: string[];
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * ביטוי עם רווח: substring case-insensitive.
 * מילה ASCII בודדת (אותיות, ספרות, מקף): גבול מילה — לא בתוך מילה ארוכה (שקול ל־\\b לטוקנים לטיניים; תומך ב־game-changer).
 * עברית קצרה (עד 5 תווים): התאמת טוקן מלא בלבד (מונע "מין" ב"מינים").
 */
export function textMatchesPhrase(haystackRaw: string, phraseRaw: string): boolean {
  const phrase = String(phraseRaw).trim();
  if (!phrase) return false;
  const haystack = String(haystackRaw ?? "");
  const lowerHay = haystack.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();

  if (phrase.includes(" ")) {
    return lowerHay.includes(lowerPhrase);
  }

  const isAsciiToken = /^[a-z0-9-]+$/i.test(phrase);
  if (isAsciiToken) {
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(phrase)}(?![A-Za-z0-9])`, "i");
    return re.test(haystack);
  }

  const hasHebrew = /[\u0590-\u05FF]/.test(phrase);
  if (hasHebrew && phrase.length <= 5) {
    const parts = haystack.split(/[^\u0590-\u05FFa-zA-Z0-9]+/).filter(Boolean);
    return parts.some((part) => part.toLowerCase() === lowerPhrase);
  }

  return lowerHay.includes(lowerPhrase);
}

function collectMatches(text: string, needles: readonly string[]): string[] {
  const haystack = String(text ?? "");
  const out: string[] = [];
  for (const raw of needles) {
    const phrase = String(raw).trim();
    if (!phrase) continue;
    if (textMatchesPhrase(haystack, phrase)) out.push(phrase);
  }
  return out;
}

/**
 * בודקת פסילה (שפה רובוטית) ורגישות (המלצת isPremium).
 * פסילה → valid: false. רגישות בלבד → recommendPremium, בלי כשל.
 */
export function validateAndClassify(content: string): ValidateAndClassifyResult {
  const matchedBlocklist = collectMatches(content, ROBOTIC_BLOCKLIST);
  const matchedSensitive = collectMatches(content, PREMIUM_SENSITIVE_TRIGGERS);
  const valid = matchedBlocklist.length === 0;
  return {
    valid,
    error: valid ? null : ROBOTIC_LANGUAGE_ERROR,
    warning: matchedSensitive.length > 0 ? SENSITIVE_TOPIC_WARNING : null,
    recommendPremium: matchedSensitive.length > 0,
    matchedBlocklist,
    matchedSensitive,
  };
}

/**
 * מספרי שורות (1-based) שבהם מופיע הביטוי, לפי אותה לוגיקה כמו בפסילה.
 */
export function findPhraseLineOccurrences(content: string, phrase: string): number[] {
  const p = phrase.trim();
  if (!p) return [];
  const linesOut = new Set<number>();

  if (p.includes(" ")) {
    const lowerFull = content.toLowerCase();
    const lowerP = p.toLowerCase();
    let start = 0;
    while (true) {
      const idx = lowerFull.indexOf(lowerP, start);
      if (idx === -1) break;
      const lineNum = content.slice(0, idx).split(/\n/).length;
      linesOut.add(lineNum);
      start = idx + Math.max(1, lowerP.length);
    }
    return [...linesOut].sort((a, b) => a - b);
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (textMatchesPhrase(line, p)) linesOut.add(i + 1);
  });
  return [...linesOut].sort((a, b) => a - b);
}
