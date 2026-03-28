import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "nm_premium_sess";
const VERSION = "v1";

/** סוד משותף לעוגיית סשן פרימיום ולחתימת בקשות fragment (רק בצד שרת / בילד) */
export function getPremiumSessionSecret(): string {
  const s = import.meta.env.PREMIUM_SESSION_SECRET;
  if (typeof s === "string" && s.trim().length >= 16) return s.trim();
  if (import.meta.env.DEV) return "dev-only-insecure-premium-secret-change-me";
  throw new Error("PREMIUM_SESSION_SECRET missing or too short");
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
