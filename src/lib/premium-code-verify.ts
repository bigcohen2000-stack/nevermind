import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import appConfig from "../config/appConfig.json";

type CodeEntry = {
  valueHash: string;
  salt: string;
  iterations: number;
  expiresAt?: string;
};

export function verifyPremiumPbkdf2Code(plain: string): boolean {
  const pa = appConfig.premiumAccess;
  if (!pa?.enabled || !Array.isArray(pa.codes)) return false;
  const clean = String(plain || "").trim();
  if (!clean) return false;
  for (const entry of pa.codes as CodeEntry[]) {
    if (entry.expiresAt) {
      const t = Date.parse(entry.expiresAt);
      if (Number.isFinite(t) && t < Date.now()) continue;
    }
    try {
      const derived = pbkdf2Sync(clean, entry.salt, entry.iterations, 32, "sha256");
      const expected = Buffer.from(entry.valueHash, "hex");
      if (derived.length === expected.length && timingSafeEqual(derived, expected)) {
        return true;
      }
    } catch {
      /* invalid hex etc. */
    }
  }
  return false;
}

/**
 * אימות קוד לסשן שרת: PBKDF2 מתוך appConfig, או רשימת PUBLIC_DASHBOARD_CODES.
 * אם הרשימה ריקה (כמו בדשבורד), כל מחרוזת לא ריקה מתקבלת (מצב פתוח).
 */
export function verifyPremiumSessionCode(plain: string): boolean {
  const clean = String(plain || "").trim();
  if (!clean) return false;
  if (verifyPremiumPbkdf2Code(clean)) return true;
  const raw =
    (typeof import.meta.env.PUBLIC_DASHBOARD_CODES === "string" && import.meta.env.PUBLIC_DASHBOARD_CODES) || "";
  const list = raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (list.length > 0) return list.includes(clean);
  return true;
}
