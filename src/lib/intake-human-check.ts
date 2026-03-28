/**
 * שאלות קצרות לטופס intake. נרמול: trim + toLowerCase (עברית כמעט לא משתנה).
 * לא מחליף שרת. משולב עם honeypot וזמן מינימלי ב-form-antispam.
 */

export type IntakeHumanChallenge = {
  id: string;
  prompt: string;
  verify: (raw: string) => boolean;
};

/** נרמול תשובה לפי המפרט */
export function normIntakeAnswer(raw: string): string {
  return raw.trim().toLowerCase();
}

function isOneOf(raw: string, accepted: string[]): boolean {
  const n = normIntakeAnswer(raw);
  return accepted.some((a) => n === normIntakeAnswer(a));
}

const CHALLENGES: IntakeHumanChallenge[] = [
  {
    id: "first-bahirut",
    prompt: "מה האות הראשונה במילה 'בהירות'?",
    verify: (raw) => normIntakeAnswer(raw) === "ב",
  },
  {
    id: "after-monday",
    prompt: "מה בא אחרי יום שני?",
    verify: (raw) => normIntakeAnswer(raw) === "שלישי",
  },
  {
    id: "black-or",
    prompt: "שחור או...?",
    verify: (raw) => normIntakeAnswer(raw) === "לבן",
  },
  {
    id: "first-emet",
    prompt: "מה האות הראשונה במילה 'אמת'?",
    verify: (raw) => normIntakeAnswer(raw) === "א",
  },
  {
    id: "israel-capital",
    prompt: "בירת ישראל היא...?",
    verify: (raw) => normIntakeAnswer(raw) === "ירושלים",
  },
  {
    id: "one-plus-one-words",
    prompt: "כמה זה אחד ועוד אחד? (במילים)",
    verify: (raw) => isOneOf(raw, ["שתיים", "שתים"]),
  },
  {
    id: "opposite-layla",
    prompt: "מה ההפך מהמילה 'לילה'?",
    verify: (raw) => normIntakeAnswer(raw) === "יום",
  },
  {
    id: "boker-tov",
    prompt: "בוקר...?",
    verify: (raw) => normIntakeAnswer(raw) === "טוב",
  },
];

export function pickIntakeHumanChallenge(): IntakeHumanChallenge {
  const idx = Math.floor(Math.random() * CHALLENGES.length);
  return CHALLENGES[idx]!;
}
