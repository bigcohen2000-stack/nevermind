# רשימת שלמות אתר (אבטחה, SEO, אמון)

בדיקות ידניות מומלצות בדפדפן **Google Chrome** (כלי מפתחים, Lighthouse, הטאב Network לכותרות).

| # | רכיב | למה זה חובה (עובדות) | איך מיישמים (קוד/קונפיג) | מקור |
|---|------|------------------------|---------------------------|------|
| 1 | כותרות אבטחה (Security Headers) | מצמצמות XSS, clickjacking, חשיפת סוג MIME שגוי. חשוב כשיש טפסים ונתוני משתמש. | `public/_headers`: `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Permissions-Policy`. ב־Apache/Nginx אותו עיקרון בקונפיג השרת. | [OWASP HTTP Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) |
| 2 | מבנה מובנה (Schema.org) | תוצאות עשירות (תאריך, סוג תוכן) תלויות בנתונים מובנים תקינים. | `Layout.astro`: JSON-LD (`Organization`, `WebSite`, `ProfessionalService`, מאמרים: `Article`, ועוד לפי עמוד). | [Google: מבנה נתונים](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) |
| 3 | תגיות שיתוף (Open Graph) | בלי תמונה/כותרת מדויקות, שיתוף בוואטסאפ/לינקדאין נראה שבור. | `og:title`, `og:description`, `og:url`, `og:image`, `og:image:alt`; מידות `og:image:width`/`height` כשהברירת מחדל היא רסטר ב־`public/og.jpg` (מומלץ 1200×630). | [Open Graph](https://ogp.me/) |
| 4 | תאריך «עודכן לאחרונה» | תאריך עדכון ברור תומך בסימני אמינות לתוכן (E-E-A-T). | שדה `updatedDate` בפרונט־מטר של מאמר; תצוגה ב־`[...slug].astro`. | [Google: תוכן מועיל](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) |
| 5 | מפת אתר (Sitemap) | מסייע למנועי חיפוש לאתר עמודים עמוקים במהירות. | אינטגרציית `@astrojs/sitemap` ב־`astro.config.ts`; פלט `sitemap-index.xml`. | [Sitemaps.org](https://www.sitemaps.org/) |
| 6 | קובץ robots.txt תקין | חוסך תקציב סריקה ומונע דגימה מיותרת של אזורים פנימיים. | `public/robots.txt`: `Disallow: /admin/`, שורת `Sitemap:`. | [Google: robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro) |
| 7 | תגית Canonical | מפחית סיכון לתוכן כפול (כתובות עם פרמטרים). | `<link rel="canonical" href="...">` ב־`Layout.astro`. | [Google: כתובת קנונית](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| 8 | ניטור שגיאות צד־לקוח | משתמשים רבים לא מדווחים על תקלות; לוג מוקדם חושף שברים. | משתנה סביבה `PUBLIC_CLIENT_LOG_URL`: `fetch` POST עם הודעה מקוצרת, נתיב עמוד, ללא נתונים רגישים. | [MDN: error event](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event) |
| 9 | פרטי יצירת קשר גלויים | דף בלי דרכי קשר ישירים נתפס כפחות אמין בתצפיות קלאסיות על אמינות אתר. | פוטר ב־`Layout.astro`: אימייל/טלפון מ־`appConfig.contact` + קישור וואטסאפ. | [Stanford Web Credibility](https://www.webcredibility.org/) |
| 10 | Favicon ו־Manifest (PWA) | זיהוי מותג בטאב ובמובייל; אפשרות «הוסף למסך הבית». | `link rel="icon"` + `manifest.webmanifest` + לוגו ב־`/images/LOGO.svg`. | [Web.dev: Manifest](https://web.dev/add-manifest/) |

## מצב NeverMind בקוד (נקודות עיגון)

- ניווט: לינק פעיל עם `aria-current="page"` והדגשה ויזואלית (`Layout.astro`). מסלול קודם לחזרה: `sessionStorage` (`nm-nav-current` / `nm-nav-previous`) + קישור `[data-nm-return-cta-link]` אחרי טפסים ועמוד תודה.
- כותרת טאב: אחרי מעבר עם View Transitions, `document.title` מסונכרן מ־`<title>` בכל `astro:page-load`.
- אינדקס: `siteSettings.seo.allowIndexing`. כשהוא `true`, עמודים ציבוריים מקבלים `index, follow` (חוץ מ־`/admin/`). מומלץ ש־`public/og.jpg` יהיה ב־1200×630 לפני שיתוף חברתי.
- לוגו: `siteSettings.brand.logoPath` (ברירת מחדל `/images/LOGO.svg`).
- לוג JS: הגדר `PUBLIC_CLIENT_LOG_URL` בבנייה (למשל endpoint של Worker/שירות חיצוני שמקבל POST JSON).
