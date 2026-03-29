import { createHmac, timingSafeEqual } from "node:crypto";
import { getPremiumSessionSecret } from "./premium-cookie";

const FRAGMENT_PAYLOAD_PREFIX = "v1|premium-fragment|";

/**
 * חתימה קנונית ל-slug מאמר (בזמן prerender). בלי הסוד אי אפשר לנחש חתימה למאמר אחר.
 * נשלפת רק בדף המאמר; ה-API דורש גם עוגיית סשן httpOnly וגם התאמת חתימה ל-slug.
 */
export function signPremiumFragmentForSlug(slug: string): string {
  const secret = getPremiumSessionSecret();
  return createHmac("sha256", secret).update(FRAGMENT_PAYLOAD_PREFIX + slug, "utf8").digest("base64url");
}

export function verifyPremiumFragmentSignature(slug: string, token: string | null | undefined): boolean {
  if (!slug || typeof token !== "string" || token.length < 32) return false;
  let expected: string;
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
