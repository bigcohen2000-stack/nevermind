# מועדון NeverMind - Webhook

הטופס שולח `POST` JSON ל-`PUBLIC_NM_CLUB_WEBHOOK_URL`:

```json
{
  "phone": "050-…",
  "fullName": "…",
  "password": "…",
  "path": "/services/"
}
```

תגובה מוצלחת (200) עם גוף JSON:

```json
{ "ok": true, "memberName": "שם לתצוגה", "expiresAt": "2026-12-31T23:59:59.000Z" }
```

אופציונלי: החזר גם `"phone"` כפי שנשמר אצלך - הדפדפן ישמור אותו ב-`localStorage` לפס העליון.

במקרה של סירוב:

```json
{ "ok": false, "errorCode": "wrong_password", "error": "טקסט בעברית" }
```

קודי שגיאה מומלצים:

- `wrong_password` - סיסמה לא תואמת רשומה קיימת.
- `unknown_member` - לא נמצאה רשומה תואמת.
- `expired_membership` - הרשמה הסתיימה.

## ביקון צפייה במאמרים (Deep File)

אחרי פריסת Worker מעודכן, הדפדפן קורא ל-`POST {מקור ה-webhook}/log/club-page` עם JSON `{ "path": "/articles/foo/" }` כשיש סשן חבר פעיל והמשתמש בכתובת מאמר. זה לא מחליף את לוג הכניסה בטופס; זה רושם גלישה לעמוד מאמר בנפרד.
