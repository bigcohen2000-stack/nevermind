# Cloudflare Zero Trust על נתיבי ניהול NeverMind

המטרה: לחסום גישה ל-`/admin/*`, `dashboard/*` ול-`/api/club-admin/*` בלי אימות זהות. בלי Access, ממשקי ניהול ופרוקסי מועדון חשופים לכל מי שמגיע לכתובת.

## לפני שמתחילים

- דומיין האתר מחובר ל-Cloudflare (DNS פרוקסי).
- יש לך חשבון Cloudflare עם הרשאות Zero Trust (Access).

## שלב 1: יישום Access

1. ב-Cloudflare Dashboard: **Zero Trust** → **Access** → **Applications**.
2. **Add an application** → **Self-hosted**.
3. שם: למשל `NeverMind Control Center`.
4. **Application domain**:
   - Subdomain: `www` (או מה שמתאים לפריסה שלך).
   - Domain: `nevermind.co.il`.
   - Path: `/admin` - או הגדרה שמכסה את כל `/admin/*`.
5. **Policy**: Create policy - **Allow** - **Emails** - הזן את המייל המורשה בלבד (או קבוצת IdP צרה).
6. שמור.

הוסף נתיב נוסף באותו Application (או יישום נוסף אם הממשק שלך לא תומך):

- Path: `/dashboard` (כיסוי ל-`/dashboard/*`).

חזור על התהליך ליישום API:

- Path: `/api/club-admin` (כיסוי ל-`/api/club-admin/*`).
- Path: `/api/admin` (כיסוי ל-`/api/admin/*` - ניקוי מטמון, PageSpeed וכו').

אם הממשק דורש יישומים נפרדים, אפשר ליצור שניים. מבחינת חוויית ניהול, מומלץ לשמור אותם תחת אותו דומיין ואותה מדיניות הרשאה.

## שלב 2: התאמת דומיין

אם האתר בפרודקשן הוא `https://nevermind.co.il` בלי `www`, עדכן את שדה ה-hostname ב-Access בהתאם. חשוב שהכלל יתאים בדיוק לכתובת שהדפדפן פותח.

## שלב 3: בדיקה

1. מהדפדפן במצב incognito: נסה `https://www.nevermind.co.il/admin/` וגם `https://www.nevermind.co.il/dashboard/` - אמור להופיע מסך התחברות Cloudflare Access.
2. אחרי התחברות עם המייל המורשה - הממשקים נטענים.
3. קרא ל-`/api/club-admin/health` (או נקודת קצה קיימת) - אותה מדיניות.

## פיתוח מקומי

לא לבטל Access בפרודקשן. לפיתוח: ראה `CLUB_ADMIN_PROXY_SKIP_AUTH` ב-`docs/DEPLOYMENT_CHECKLIST.md` (רק סביבת פיתוח, לא לפרודקשן).

## הפניות

- צ'ק-ליסט פריסה: `docs/DEPLOYMENT_CHECKLIST.md`
- Webhook מועדון: `docs/NM_CLUB_WEBHOOK.md`
