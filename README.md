# NeverMind | הבנה לפני תגובה

> שיטה שמפרידה בין עובדה, פירוש ותגובה כדי לראות מה באמת מפעיל אותך

## 🌟 מה זה NeverMind?

NeverMind היא פלטפורמה דיגיטלית המסייעת לאנשים להבין את המנגנונים הפנימיים שמנהלים את התגובות שלהם. באמצעות הפרדה ברורה בין עובדה, פירוש ותגובה, המשתמשים לומדים לראות את המציאות כפי שהיא - בלי רעש, בלי דרמה.

## 🚀 תכונות עיקריות

### ✨ חוויית משתמש מתקדמת
- **עברית טבעית**: תוכן בעברית אידיומטית וברורה
- **תמיכה מלאה ב־RTL**: עיצוב מותאם לכתיבה מימין לשמאל
- **מצב כהה**: חיסכון בעיניים עם ניגודיות מותאמת
- **PWA מלאה**: עבודה לא מקוונת ואפשרות התקנה

### 🎯 ביצועים מתקדמים
- **Core Web Vitals**: LCP < 800ms, INP < 200ms, CLS < 0.05
- **טעינה עצלה**: תמונות ותוכן נטענים לפי צורך
- **קאש חכם**: אסטרטגיית רשת-ראשונה עם Service Worker
- **דחיסת תמונות**: WebP אוטומטי עם Sharp

### ♿ נגישות מלאה (WCAG 2.2 AAA)
- **ניווט מקלדת**: גישה מלאה ללא עכבר
- **קוראי מסך**: תמיכה ב־NVDA, JAWS, VoiceOver
- **ניגודיות צבעים**: 76% במצב אור, 72% במצב כהה
- **גופנים קריאים**: Inter + Heebo עם גודל מינימלי 18px

### 🧪 בדיקות אוטומטיות
- **יחידות**: Vitest עם React Testing Library
- **E2E**: Playwright עם בדיקות נגישות
- **נגישות**: Axe-core לבדיקות WCAG
- **ביצועים**: Lighthouse CI

## 🛠️ התקנה ופיתוח

### דרישות מקדימות
- Node.js 24+
- npm 11+

### התקנה
```bash
# התקנת תלויות
npm install

# הפעלת שרת פיתוח
npm run dev

# בניית הפרויקט
npm run build
```

### בדיקות
```bash
# בדיקות יחידה
npm test

# בדיקות E2E
npm run test:e2e

# בדיקות נגישות
npm run test:accessibility

# בדיקת Lighthouse
npm run lighthouse
```

### אופטימיזציה
```bash
# אופטימיזציה של תמונות
npm run optimize:images

# ולידציה מלאה
npm run validate
```

## 📊 נתוני ביצועים

- **Lighthouse Performance**: 95+
- **Lighthouse Accessibility**: 100
- **Lighthouse SEO**: 100
- **Lighthouse Best Practices**: 95+
- **Web Vitals**: כל המדדים בירוק

## 🏗️ ארכיטקטורה

### טכנולוגיות
- **Framework**: Astro 5.x (Static + Islands)
- **Styling**: Tailwind CSS v4
- **Content**: Astro Collections + Zod validation
- **Search**: Pagefind (Hebrew support)
- **CMS**: Decap CMS (GitHub backend)
- **Deployment**: Cloudflare Pages

### מבנה הפרויקט
```
src/
├── components/     # רכיבי Astro
├── layouts/        # תבניות עמוד
├── pages/          # עמודים סטטיים
├── content/        # תוכן דינמי
├── styles/         # עיצוב גלובלי
└── utils/          # כלים וולידציה

public/
├── admin/          # הגדרות CMS
├── images/         # תמונות
└── manifest.json   # PWA

scripts/            # סקריפטי בנייה
__tests__/          # בדיקות יחידה
e2e/               # בדיקות E2E
```

## 📚 תיעוד

- **[ROADMAP-2026.md](./ROADMAP-2026.md)** - מפת דרכים לפיתוח
- **[TESTING.md](./TESTING.md)** - מדריך בדיקות
- **[PERFORMANCE.md](./PERFORMANCE.md)** - אופטימיזציית ביצועים
- **[ACCESSIBILITY.md](./ACCESSIBILITY.md)** - מדריך נגישות
- **[ANALYTICS.md](./ANALYTICS.md)** - אנליטיקס ומעקב

## 🤝 תרומה

אנו מקבלים בברכה תרומות! אנא:

1. פתח issue לתיאור הבעיה/השיפור
2. צור branch עבור השינויים
3. הוסף בדיקות רלוונטיות
4. וודא שכל הבדיקות עוברות
5. שלח Pull Request

## 📄 רישיון

הפרויקט פתוח לקהילה תחת רישיון MIT.

## 🙏 תודות

- **Astro** - עבור ה-framework המתקדם
- **Tailwind CSS** - עבור המערכת המודולרית
- **Pagefind** - עבור חיפוש מהיר בעברית
- **Decap CMS** - עבור ממשק ניהול תוכן

---

**בנוי לעתיד עם מצוינות עברית** 🇮🇱

[השם לא משנה](https://nevermind.co.il) | [דוקומנטציה](./docs/)