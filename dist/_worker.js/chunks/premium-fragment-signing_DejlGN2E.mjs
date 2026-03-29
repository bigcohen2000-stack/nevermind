globalThis.process ??= {}; globalThis.process.env ??= {};
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = "nm_premium_sess";
const VERSION = "v1";
const DEV_FALLBACK_SECRET = "dev-only-insecure-premium-secret-change-me";
function getPremiumSessionSecret() {
  const fromProcess = typeof process !== "undefined" && typeof process.env?.PREMIUM_SESSION_SECRET === "string" ? process.env.PREMIUM_SESSION_SECRET.trim() : "";
  const s = fromProcess;
  if (s.length >= 16) return s;
  console.warn(
    "[NeverMind] PREMIUM_SESSION_SECRET חסר או קצר מדי. בפרודקשן יש להגדיר משתנה סביבה (מינימום 16 תווים). בבילד זה משתמש בברירת מחדל פיתוחית."
  );
  return DEV_FALLBACK_SECRET;
}
function getSecret() {
  return getPremiumSessionSecret();
}
function signPremiumExpiry(expMs) {
  const secret = getSecret();
  const payload = `${VERSION}.${expMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyPremiumCookieValue(raw) {
  if (!raw || typeof raw !== "string") return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== VERSION) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  let secret;
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
const premiumSessionCookieName = COOKIE;

const FRAGMENT_PAYLOAD_PREFIX = "v1|premium-fragment|";
function signPremiumFragmentForSlug(slug) {
  const secret = getPremiumSessionSecret();
  return createHmac("sha256", secret).update(FRAGMENT_PAYLOAD_PREFIX + slug, "utf8").digest("base64url");
}
function verifyPremiumFragmentSignature(slug, token) {
  if (!slug || typeof token !== "string" || token.length < 32) return false;
  let expected;
  try {
    expected = signPremiumFragmentForSlug(slug);
  } catch {
    return false;
  }
  try {
    const a = Buffer.from(token, "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { verifyPremiumFragmentSignature as a, signPremiumFragmentForSlug as b, premiumSessionCookieName as p, signPremiumExpiry as s, verifyPremiumCookieValue as v };
