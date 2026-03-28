# NeverMind — פלט סידור (סטטוס פרויקט)

עודכן: 2026-03-13

---

## 1. סביבת פיתוח (חובה אצלך)

| נושא | מצב | פעולה |
|------|-----|--------|
| **Node / npm ב-PATH** | נכשל בטרמינל VS Code/Cursor | התקן [Node.js LTS](https://nodejs.org/) או הוסף את תיקיית `nodejs` ל־PATH של המשתמש והפעל מחדש את העורך |
| **בילד** | `npm run build` לא רץ בלי npm | אחרי PATH תקין: `npm install` (פעם אחת) → `npm run build` |
| **שרת מקומי** | — | `npm run dev` (פורט לפי `package.json` / Astro) |

---

## 2. מסלול שירותים (JSON + UI) — **הושלם**

| רכיב | תיאור קצר | קבצים |
|------|-----------|--------|
| גילוי נאות ארוך | מקור: `trust_elements.disclaimer` ב־`services.json` → `disclaimerLong` בפוטר (`Layout`) ובמקטע תשלום ב־`services.astro` | `src/lib/services.ts`, `src/layouts/Layout.astro`, `src/config/services.json` |
| גילוי נאות קצר | קבוע `disclaimerShort` מתחת לכפתור בכרטיס + תוספת ב־`services.astro` | `src/lib/services.ts`, `src/components/ServiceCard.astro` |
| וואטסאפ חכם | `whatsapp_template` עם `{title}`, `{price}`; `buildServiceWhatsAppHref` | `src/lib/services.ts`, `src/config/services.json` |
| Social proof | שדה `social_proof` בין כותרת משנה לתיאור | `ServiceCard.astro` |
| זמינות | `availability` (spots, updated_at, label) + legacy `availability_note`; עדכון תאריך בלקוח ב־`astro:page-load` | `ServiceCard.astro`, `Layout.astro`, `services.ts` |
| דפים | ללא `disclaimer` ארוך על `ServiceCard`; Floating CTA עם תבנית מנוי | `services.astro`, `personal-consultation.astro` |

---

## 3. פאנל אדמין — שירותים — **הושלם**

| תכונה | מיקום |
|--------|--------|
| מפת שדות אופציונליים (`details`) | `src/components/admin/ServicesControlPanel.astro` |
| תצוגת `disclaimerLong` + הסבר על `disclaimerShort` | אותו קובץ |
| תגיות על כרטיסי שירות (social / availability / wa) | אותו קובץ |
| בדיקות רכות (לא חוסמות שמירה) + ריענון בזמן הקלדה | סקריפט inline באותו קובץ |

---

## 4. איפיון `CLOUAD AI/nevermind-cursor-spec.md` — מיפוי שלבים

| שלב | נושא | הערת סטטוס |
|-----|------|------------|
| 1 | SRT → MDX | ממומש ב־`admin/generator.astro` (מקטע תמלול) |
| 2 | `audioFile` + `AudioNarrative` | Schema + רכיב + `[...slug].astro`; תיקייה `public/audio/articles/.gitkeep` |
| 3 | WhatsApp למאמרים | `buildArticleMeetingWhatsAppMessage` + `WhatsAppButton.astro` |
| 4 | RevealInsight polish | קיים |
| 5 | Glossary remark | `src/plugins/remark-glossary-links.ts` + `astro.config.ts` |
| 6 | פרומפט תמונה | מקטע בגנרטור |
| 7 | Handoff SRT → עורך | ממומש בגנרטור |
| 8–9 | QA + פרומפט AI | ממומש בגנרטור |

---

## 5. קבצים «מקור אמת» מרכזיים

```
src/config/services.json     ← שירותים, trust, תבניות wa
src/lib/services.ts          ← פורמטים, קישורי wa, disclaimerLong/Short
src/components/ServiceCard.astro
src/layouts/Layout.astro     ← פוטר + ריענון זמינות
src/content.config.ts        ← schema מאמרים (לא לשבור ללא החלטה)
astro.config.ts              ← MDX + remark glossary
```

---

## 6. מה אין לעשות ללא דיון (לפי האיפיון)

- שינוי סכימת `content.config.ts` / routing של `[...slug].astro` בלי אישור
- שבירת API של רכיבים קיימים

---

## 7. המלצות המשך (אופציונלי)

1. לוודא **Node ב-PATH** ולהריץ `npm run build` לפני דיפלוי.
2. לעדכן **תאריכי `availability.updated_at`** ב־JSON כשמשנים מלאי (הדפדפן מציג «עודכן יום …» לפי שעון מקומי).
3. אם רוצים גילוי נאות קצר ניתן לעריכה בלי קוד — להעביר את `disclaimerShort` ל־`services.json` (דורש שינוי קטן ב־`services.ts` + ייבוא בדפים).

---

*מסמך זה לסידור ומעקב; אינו מחליף את `nevermind-cursor-spec.md`.*
