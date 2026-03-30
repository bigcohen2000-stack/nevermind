# Cloudflare Zero Trust על נתיבי ניהול NeverMind

המטרה: לחסום גישה ל־`/dashboard/*` ול־`/api/club-admin/*` בלי אימות זהות. בלי Access, ממשק ניהול ופרוקסי מועדון חשופים לכל מי שמגיע לכתובת.

## לפני שמתחילים

- דומיין האתר מחובר ל־Cloudflare (DNS פרוקסי).
- יש לך חשבון Cloudflare עם הרשאות Zero Trust (Access).

## שלב 1: יישום Access

1. ב־Cloudflare Dashboard: **Zero Trust** → **Access** → **Applications**.
2. **Add an application** → **Self-hosted**.
3. שם: למשל `NeverMind Dashboard`.
4. **Application domain**:
   - Subdomain: `www` (או מה שמתאים לפריסה שלך).
   - Domain: `nevermind.co.il`.
   - Path: `/dashboard` — או הגדרה שמכסה את כל `/dashboard/*` (לפי ממשק הנוכחי).
5. **Policy**: Create policy — **Allow** — **Emails** — הזן את המייל המורשה בלבד (או קבוצת IdP צרה).
6. שמור.

חזור על אותו תהליך ליישום שני:

- Path: `/api/club-admin` (כיסוי ל־`/api/club-admin/*`).

אם הממשק מאפשר wildcard אחד: הגדר שני Applications נפרדים (מומלץ לבהירות בלוגים).

## שלב 2: התאמת דומיין

אם האתר בפרודקשן הוא `https://nevermind.co.il` בלי `www`, עדכן את שדה ה־hostname ב־Access בהתאם. חשוב שהכלל יתאים בדיוק לכתובת שהדפדפן פותח.

## שלב 3: בדיקה

1. מהדפדפן במצב incognito: נסה `https://www.nevermind.co.il/dashboard/` — אמור להופיע מסך התחברות Cloudflare Access.
2. אחרי התחברות עם המייל המורשה — הממשק נטען.
3. קרא ל־`/api/club-admin/health` (או נקודת קצה קיימת) — אותה מדיניות.

## פיתוח מקומי

לא לבטל Access בפרודקשן. לפיתוח: ראה `CLUB_ADMIN_PROXY_SKIP_AUTH` ב־`docs/DEPLOYMENT_CHECKLIST.md` (רק סביבת פיתוח, לא לפרודקשן).

## הפניות

- צ׳ק־ליסט פריסה: `docs/DEPLOYMENT_CHECKLIST.md`
- Webhook מועדון: `docs/NM_CLUB_WEBHOOK.md`
