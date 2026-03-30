# מפת נתיבים: אדמין מול משתמש

המסמך מגדיר גבולות ברורים בין אזור ניהול לאזור משתמש.

## אזור ניהול

נתיבים פנימיים:

- `/admin/`
- `/admin/generator/`
- `/admin/paradoxes/`
- `/admin/login/`
- `/admin/dashboard/` (מעביר אל `/dashboard/`)
- `/dashboard/`

כל נתיבי הניהול חייבים להיות תחת אותה מדיניות Cloudflare Zero Trust.
מומלץ להגן על הנתיבים הבאים באותו Application (או כללים מקבילים):

- `https://www.nevermind.co.il/admin/*`
- `https://www.nevermind.co.il/dashboard/*`
- `https://www.nevermind.co.il/api/admin/*`

לכל דפי הניהול יש `noIndex={true}`.

## אזור משתמש וגולש

נתיבי משתמש:

- `/me/`
- `/me/unlock/`
- `/premium-access/`

נתיבי תוכן ציבורי:

- `/articles/*`
- `/services/`
- `/library/`
- שאר דפי האתר

הפרדה היא לפי תפקיד בממשק ובאבטחה. לא לפי DNS שונה.

## הערות תפעול

- אדמין צריך אפשרות תצוגה כגולש רגיל וכחבר מועדון, בלי לעקוף אימות אמיתי.
- ניהול הרשאות כניסה נשאר בצד Access או דרך ממשק ניהול ייעודי עתידי.
