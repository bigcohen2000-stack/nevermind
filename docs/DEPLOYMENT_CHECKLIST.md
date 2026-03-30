# צ׳ק־ליסט פריסה — NeverMind

מסמך זה מרכז משתני סביבה ושירותים חיצוניים שצריך להגדיר בפרודקשן כדי שהאתר יעבוד כמתוכנן בקוד.

## מועדון NeverMind

- `PUBLIC_NM_CLUB_WEBHOOK_URL` — URL פעיל ל־Worker. התגובה הצפויה כוללת `ok`, `memberName`, `expiresAt`; אם נוספו שדות `phone` / `fullName` בטופס, ה־Worker צריך לתמוך בהם.
- פירוט קונטרקט: `docs/NM_CLUB_WEBHOOK.md`.

## תוכן פרימיום במאמרים

- `PREMIUM_SESSION_SECRET` — סוד באורך מתאים בפרודקשן (הבילד מזהיר אם חסר או קצר מדי).

## חיפוש Pagefind

- `npm run build` מייצר `dist/pagefind`.
- בפיתוח עם `astro dev` צריך בנייה אחת לפחות כדי ש־`dist/pagefind` יהיה קיים (השרת בפיתוח מגיש את התיקייה משם).
- בפריסה לוודא שהנתיב `/pagefind/` נגיש מהדומיין.

## טפסי Web3Forms

- `PUBLIC_WEB3FORMS_ACCESS_KEY` (או המקור שהפרויקט משתמש בו) — מפתח גישה מלוח Web3Forms.
- אם בלוח מופעלת חובת hCaptcha:
  - `PUBLIC_HCAPTCHA_SITE_KEY` — מפתח אתר ציבורי (לא שומרים בקומיט).
  - התאמה בהגדרות הטופס בלוח Web3Forms.

## לוח ניהול (`/dashboard/`) + מי מורשה

**מה נשאר ציבורי לגולשים:** מאמרים, ספרייה, `/me/`, `/me/unlock/`, מועדון לפי סיסמה — כל מה שהאתר מציג בדרך כלל.

**מה מיועד רק לך (ניהול):** `/dashboard/` ו־`/api/club-admin/*`. אין להסתמך רק על הקוד בצד הלקוח. חובה **Cloudflare Zero Trust (Access)** על שני הנתיבים האלה, עם מדיניות **רק למייל שלך** (או לקבוצה אחת). בלי זה כל מי שמגיע לכתובת עלול לראות את ממשק הניהול או להפעיל את הפרוקסי.

### משתני סביבה — איפה מה

| משתנה | איפה |
|--------|------|
| `PUBLIC_CLUB_ADMIN_VIA_PROXY=true` | **רק Cloudflare Pages** (בנייה / Environment variables של האתר). לא ב־Worker. זה נכנס לבאנדל הדפדפן. |
| `NM_CLUB_AUTH_BASE_URL`, `NM_CLUB_ADMIN_SERVICE_KEY` | **Cloudflare Pages** — עבור **Pages Functions** (`/api/club-admin/...`). |
| `ADMIN_SERVICE_KEY` או `NM_CLUB_ADMIN_SERVICE_KEY` (אותו ערך סודי) | **Worker** `nm-club-auth` — אימות כותרת `X-NM-Admin-Service` מהפרוקסי. |

- הפרוקסי ב־Pages מוסיף את מפתח השירות **בשרת**; הגולש לא רואה אותו.
- ב־Worker אפשר להגדיר `NM_CLUB_ADMIN_SERVICE_KEY` **או** `ADMIN_SERVICE_KEY` — אותו ערך כמו ב־Pages.
- `NM_CLUB_AUTH_BASE_URL` על ה־Worker **לא נדרש** ללוגיקה של ה־Worker (הפרוקסי ב־Pages משתמש בו). אם הוגדר בטעות ב־Worker זה לא מזיק, אבל המקום הנכון לפרוקסי הוא **Pages**.

### Zero Trust

- יישום (Application) אחד או שני כללים: `https://www.nevermind.co.il/dashboard/*` ו־`https://www.nevermind.co.il/api/club-admin/*` (התאם לדומיין שלך).
- Include: **רק** המייל שלך (או IdP קבוצתי צר).
- לפיתוח מקומי בלי Access: ב־Pages Functions בלבד `CLUB_ADMIN_PROXY_SKIP_AUTH=1` (לא לפרודקשן).

### שגיאת "Project not found" ב־Wrangler / Pages

- השם בפקודה חייב להתאים בדיוק לפרויקט ב־Dashboard (למשל `nevermind`).
- לוודא ש־`wrangler whoami` מצביע על אותו חשבון Cloudflare.
- כתובת Pages תקינה נגמרת ב־`*.pages.dev` (לא `*.pages.dev.pages.dev`).

## קישורים חיצוניים

- לבדוק ידנית קישורים לטפסים, אנליטיקס, וואטסאפ, וכל URL שמוזן בקונפיג.
