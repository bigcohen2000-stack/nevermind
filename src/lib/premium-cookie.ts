import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "nm_premium_sess";
const VERSION = "v1";

/** סוד משותף לעוגיית סשן פרימיום ולחתימת בקשות fragment (רק בצד שרת / בילד) */
const DEV_FALLBACK_SECRET = "dev-only-insecure-premium-secret-change-me";

export function getPremiumSessionSecret(): string {
  const fromMeta =
    typeof import.meta.env.PREMIUM_SESSION_SECRET === "string" ? import.meta.env.PREMIUM_SESSION_SECRET.trim() : "";
  const fromProcess =
    typeof process !== "undefined" && typeof process.env?.PREMIUM_SESSION_SECRET === "string"
      ? process.env.PREMIUM_SESSION_SECRET.trim()
      : "";
  const s = fromMeta || fromProcess;
  if (s.length >= 16) return s;
  if (import.meta.env.DEV) return DEV_FALLBACK_SECRET;
  console.warn(
    "[NeverMind] PREMIUM_SESSION_SECRET חסר או קצר מדי. בפרודקשן יש להגדיר משתנה סביבה (מינימום 16 תווים). בבילד זה משתמש בברירת מחדל פיתוחית."
  );
  return DEV_FALLBACK_SECRET;
}

function getSecret(): string {
  return getPremiumSessionSecret();
}

export function signPremiumExpiry(expMs: number): string {
  const secret = getSecret();
  const payload = `${VERSION}.${expMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPremiumCookieValue(raw: string | undefined): boolean {
  if (!raw || typeof raw !== "string") return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== VERSION) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }
  const payload = `${ver}.${expStr}`;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const premiumSessionCookieName = COOKIE;
