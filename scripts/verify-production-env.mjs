#!/usr/bin/env node
/**
 * בדיקת משתני סביבה קריטיים לפרודקשן.
 * להרצה לפני דיפלוי כשמשתני Pages/Build זמינים באותה סשן.
 *
 * שימוש: NM_VERIFY_PROD_ENV=1 npm run verify:prod-env
 */

const shouldRun = process.env.NM_VERIFY_PROD_ENV === "1";

if (!shouldRun) {
  console.log("[verify-production-env] דילוג. להרצה: NM_VERIFY_PROD_ENV=1 npm run verify:prod-env");
  process.exit(0);
}

const errors = [];
const warns = [];

const s = (k) => (typeof process.env[k] === "string" ? process.env[k].trim() : "");

const premium = s("PREMIUM_SESSION_SECRET");
if (premium.length < 16) {
  errors.push("PREMIUM_SESSION_SECRET חייב להיות באורך מינימום 16 תווים בפרודקשן.");
}

const resendApiKey = s("RESEND_API_KEY");
if (!resendApiKey) {
  errors.push("חסר RESEND_API_KEY לטפסי המייל.");
}

const resendFrom = s("RESEND_FROM_EMAIL");
if (!resendFrom) {
  errors.push("חסר RESEND_FROM_EMAIL לטפסי המייל.");
}

const resendTo = s("RESEND_TO_EMAIL");
if (!resendTo) {
  warns.push("חסר RESEND_TO_EMAIL. הטפסים יישלחו לכתובת השולח שהוגדרה ב־RESEND_FROM_EMAIL.");
}

const clubUrl = s("PUBLIC_NM_CLUB_WEBHOOK_URL");
if (!clubUrl) {
  warns.push("חסר PUBLIC_NM_CLUB_WEBHOOK_URL והחיבור למועדון לא יאומת מול ה־Worker.");
} else if (!/^https:\/\//i.test(clubUrl)) {
  errors.push("PUBLIC_NM_CLUB_WEBHOOK_URL חייב להתחיל ב־https://");
}

const hcaptcha = s("PUBLIC_HCAPTCHA_SITE_KEY");
if (hcaptcha.length > 0 && hcaptcha.length < 10) {
  warns.push("PUBLIC_HCAPTCHA_SITE_KEY נראה קצר מדי. כדאי לבדוק את מפתח hCaptcha.");
}

const clubProxy = s("PUBLIC_CLUB_ADMIN_VIA_PROXY");
if (clubProxy === "true") {
  const base = s("NM_CLUB_AUTH_BASE_URL");
  const key = s("NM_CLUB_ADMIN_SERVICE_KEY");
  if (!base) warns.push("PUBLIC_CLUB_ADMIN_VIA_PROXY=true אבל חסר NM_CLUB_AUTH_BASE_URL.");
  if (!key) warns.push("PUBLIC_CLUB_ADMIN_VIA_PROXY=true אבל חסר NM_CLUB_ADMIN_SERVICE_KEY ב־Pages.");
}

const psiKey = s("PSI_API_KEY") || s("GOOGLE_PAGESPEED_API_KEY");
if (!psiKey) {
  warns.push("חסר PSI_API_KEY או GOOGLE_PAGESPEED_API_KEY. בדיקת PageSpeed בדשבורד לא תעבוד עד שיוגדר.");
}

const cfZone = s("CF_ZONE_ID");
const cfTok = s("CF_API_TOKEN");
if (!cfZone || !cfTok) {
  warns.push("חסר CF_ZONE_ID או CF_API_TOKEN. כפתור ניקוי מטמון בדשבורד ייכשל עד שיוגדרו.");
}

if (warns.length) {
  console.warn("\n[verify-production-env] אזהרות:");
  warns.forEach((w) => console.warn(`  - ${w}`));
}

if (errors.length) {
  console.error("\n[verify-production-env] שגיאות:");
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("[verify-production-env] בדיקת משתני סביבה קריטיים עברה.");
