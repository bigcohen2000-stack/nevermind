/**
 * ולידציית שפה וזיהוי נושאים רגישים.
 * מקור האמת נמצא כאן כדי שהמחולל, הוולידציה והאדמין יעבדו לפי אותו קו.
 */

export const ROBOTIC_BLOCKLIST = [
  "\u0021",
  "methodology",
  "paradigm",
  "revolutionary",
  "empower",
  "journey",
  "comprehensive",
  "unlock",
  "dive deep",
  "deep dive",
  "בעולם המודרני של היום",
  "חשוב לציין ש",
  "לסיכום,",
  "ראוי לציין",
  "כאמור",
] as const;

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
export const SENSITIVE_TOPIC_WARNING = "נושא רגיש זוהה. כדאי לשקול אם הוא שייך למסלול פרימיום";

export type ValidateAndClassifyResult = {
  valid: boolean;
  error: string | null;
  warning: string | null;
  recommendPremium: boolean;
  matchedBlocklist: string[];
  matchedSensitive: string[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function textMatchesPhrase(haystackRaw: string, phraseRaw: string): boolean {
  const phrase = String(phraseRaw).trim();
  if (!phrase) return false;
  const haystack = String(haystackRaw ?? "");
  const lowerHay = haystack.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  const emphaticMark = "\u0021";

  if (phrase === emphaticMark) {
    return haystack.includes(emphaticMark);
  }

  if (phrase.includes(" ")) {
    return lowerHay.includes(lowerPhrase);
  }

  const isAsciiToken = /^[a-z0-9-]+$/i.test(phrase);
  if (isAsciiToken) {
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(phrase)}(?![A-Za-z0-9])`, "i");
    return re.test(haystack);
  }

  const hasHebrew = /[\u0590-\u05FF]/.test(phrase);
  if (hasHebrew && phrase.length <= 8) {
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

export function findPhraseLineOccurrences(content: string, phrase: string): number[] {
  const target = phrase.trim();
  if (!target) return [];
  const linesOut = new Set<number>();
  const emphaticMark = "\u0021";

  if (target.includes(" ") || target === emphaticMark) {
    const lowerFull = content.toLowerCase();
    const lowerTarget = target.toLowerCase();
    let start = 0;
    while (true) {
      const idx = lowerFull.indexOf(lowerTarget, start);
      if (idx === -1) break;
      const lineNum = content.slice(0, idx).split(/\n/).length;
      linesOut.add(lineNum);
      start = idx + Math.max(1, lowerTarget.length);
    }
    return [...linesOut].sort((a, b) => a - b);
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (textMatchesPhrase(line, target)) linesOut.add(index + 1);
  });
  return [...linesOut].sort((a, b) => a - b);
}
