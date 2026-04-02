# Deep File - ארכיטקטורה ושלבים

המטרה: לראות מי מבקר בתוכן פרימיום, מתי, ואיזה מאמרים מושכים חברים שמשלמים. זה דורש לוג בצד שרת, לא רק בדפדפן.

## מה קיים היום

- אימות מועדון דרך `PUBLIC_NM_CLUB_WEBHOOK_URL` ב-[`PremiumClubGate`](../src/components/PremiumClubGate.astro).
- פרוקסי ניהול ב-[`functions/api/club-admin/[[path]].js`](../functions/api/club-admin/[[path]].js) מאחורי Zero Trust.
- **ביקון צפייה במאמרים:** הדפדפן שולח `POST` ל-`{origin של ה-webhook}/log/club-page` עם `{ "path": "/articles/…" }` כשיש `nm_club_session` פעיל והנתיב מתחיל ב-`/articles/`. פעם אחת לכל טאב לכל URL. הנתונים נשמרים ב-KV `CLUB_ACTIVITY` תחת המפתח `deep:page_views` (עד 200 רשומות).
- **הצגה:** `GET /admin/overview` ב-Worker מחזיר `pageViewBeacons`; ב-`/dashboard/` בלוק **Club Admin** יש רשימה "Deep File - צפיות במאמרים".

## מה עדיין אופציונלי / עתידי

1. **קישור ביקון ↔ חבר** - היום אין טלפון בשורת הביקון (רק נתיב, זמן, טביעת IP מקוצרת). אם תרצה מיפוי מפורש, צריך עיצוב אבטחה נוסף (למשל אסימון חד-פעמי אחרי login).
2. **מחולל קודי גישה** - כפתור בדשבורד שקורא ל-Worker, שומר ב-KV, מחזיר ל-clipboard.
3. **D1** - אם תרצה שאילתות מורכבות במקום רשימה ב-KV.

## סדר מומלץ לשדרוגים

1. לפרוס את ה-Worker אחרי שינויי `nm-club-auth` (ראה `workers/club-auth/`).
2. לוודא ש-`PUBLIC_NM_CLUB_WEBHOOK_URL` בפרודקשן מצביע על אותו host שמשרת את `POST /log/club-page`.

## אבטחה

- אין לחשוף רשימות חברים לציבור.
- רק נתיבים מאחורי Zero Trust + מפתח שירות לניהול.
- ביקון הצפייה הוא נתיב בלבד; אפשר להטיל Rate Limit ב-Cloudflare אם יופיע spam.
