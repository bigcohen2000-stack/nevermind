# מועדון NeverMind — Webhook

הטופס שולח `POST` JSON ל־`PUBLIC_NM_CLUB_WEBHOOK_URL`:

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

אופציונלי: החזר גם `"phone"` כפי שנשמר אצלך — הדפדפן ישמור אותו ב־`localStorage` לפס העליון.

במקרה של סירוב: `{ "ok": false, "error": "טקסט בעברית" }`.
