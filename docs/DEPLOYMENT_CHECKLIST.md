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

## קישורים חיצוניים

- לבדוק ידנית קישורים לטפסים, אנליטיקס, וואטסאפ, וכל URL שמוזן בקונפיג.
