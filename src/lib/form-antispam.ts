/** ולידציית צד־לקוח נגד ספאם. לא מחליפה שרת. */

export const NM_ANTISPAM_MIN_MS = 4500;
export const NM_ANTISPAM_MAX_MS = 1000 * 60 * 60 * 48;
export const NM_ANTISPAM_MAX_URLS_IN_MESSAGE = 6;

export type AntispamResult = { ok: true } | { ok: false; userMessage: string };

export function countUrlLikeSequences(text: string): number {
  if (!text) return 0;
  const m = text.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi);
  return m ? m.length : 0;
}

/** תו אחד חוזר ברוב הטקסט (בוטים) */
export function looksLikeRepeatedCharSpam(text: string): boolean {
  const t = text.replace(/\s/g, "");
  if (t.length < 24) return false;
  const counts = new Map<string, number>();
  for (const ch of t) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  const max = Math.max(...counts.values());
  return max / t.length > 0.72;
}

export function validateAntispamFields(params: {
  botcheckValue: string;
  honeypotWebsiteValue: string;
  startedAtMs: number;
  messageTexts: string[];
}): AntispamResult {
  if (params.botcheckValue.trim().length > 0) {
    return { ok: false, userMessage: "לא נשלח. רענן את העמוד ונסה שוב." };
  }
  if (params.honeypotWebsiteValue.trim().length > 0) {
    return { ok: false, userMessage: "לא נשלח. רענן את העמוד ונסה שוב." };
  }

  const now = Date.now();
  const t0 = params.startedAtMs;
  if (!Number.isFinite(t0) || t0 <= 0) {
    return { ok: false, userMessage: "נדרש טעינת עמוד מלאה. רענן ונסה שוב." };
  }
  if (now - t0 < NM_ANTISPAM_MIN_MS) {
    return {
      ok: false,
      userMessage: "רגע קצר לפני שליחה: וודא שמילאת את הטופס ברצף ואז שלח.",
    };
  }
  if (now - t0 > NM_ANTISPAM_MAX_MS) {
    return { ok: false, userMessage: "הטופס פתוח זמן רב. רענן את העמוד ושלח שוב." };
  }

  const combined = params.messageTexts.filter(Boolean).join("\n");
  if (countUrlLikeSequences(combined) > NM_ANTISPAM_MAX_URLS_IN_MESSAGE) {
    return { ok: false, userMessage: "יותר מדי קישורים בטקסט. צמצם ונסה שוב." };
  }
  if (looksLikeRepeatedCharSpam(combined)) {
    return {
      ok: false,
      userMessage: "הטקסט נחסם אוטומטית. כתוב במשפטים רגילים ושלח שוב.",
    };
  }

  return { ok: true };
}

export function readAntispamFromForm(form: HTMLFormElement): {
  botcheckValue: string;
  honeypotWebsiteValue: string;
  startedAtMs: number;
} {
  const botEl = form.elements.namedItem("botcheck");
  const hpEl = form.elements.namedItem("nm_hp_website");
  const tsEl = form.elements.namedItem("nm_form_started_ms");

  const botcheckValue =
    botEl instanceof HTMLInputElement || botEl instanceof HTMLTextAreaElement ? botEl.value : "";
  const honeypotWebsiteValue =
    hpEl instanceof HTMLInputElement || hpEl instanceof HTMLTextAreaElement ? hpEl.value : "";
  const rawTs = tsEl instanceof HTMLInputElement ? tsEl.value.trim() : "";
  const startedAtMs = rawTs ? Number(rawTs) : 0;

  return { botcheckValue, honeypotWebsiteValue, startedAtMs };
}

export function stampFormStartTime(form: HTMLFormElement): void {
  const el = form.elements.namedItem("nm_form_started_ms");
  if (el instanceof HTMLInputElement) {
    el.value = String(Date.now());
  }
}
