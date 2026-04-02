/**
 * WARNING: DO NOT MODIFY URLs WITHOUT ANALYTICS CONFIRMATION.
 * SOURCE OF TRUTH FOR SEO MIGRATION.
 */

/** HIGH-PRIORITY PAGES (Must preserve SEO) */
export const CORE_REDIRECTS = {
  // Services (110 combined views)
  "/שירותים/": "/services/",
  "/ייעוץ-זוגי-ואישי/": "/services/couples/",

  // Shop (11 views)
  "/shop/": "/products/",

  // Podcast (2 views)
  "/פודקאסט-מרפסת/": "/podcast/",

  // Products/Courses (2 views each)
  "/product/אהבה-ב-20-עמודים/": "/products/אהבה-ב-20-עמודים/",
  "/course/קורס-התמכרויות/": "/courses/קורס-התמכרויות/",



  // אנליטיקס - ייבוא אוטומטי (CORE)
  // GA4: עדיפות גבוהה 10+ צפיות
  "/שיטת-nevermind-שכל-שמרגיש-רגש-שחושב/": "/method/", // 34 צפיות // high priority
  "/מי-אני/": "/about/", // 27 צפיות // high priority
  "/cart/": "/products/", // 20 צפיות // high priority
  // GA4: מתחת ל-10 צפיות
  "/חדש-באתר/": "/", // 6 צפיות
  "/ייעוץ-אישי/": "/personal-consultation/", // 6 צפיות
  "/יצירת-קשר/": "/intake/", // 6 צפיות
  "/love-attraction-relationship-success/": "/archive/", // 5 צפיות
  "/product/לרכישת-הספר-אהבה-ב-20-עמודים/": "/products/אהבה-ב-20-עמודים/", // 5 צפיות
  "/עמוד-התוכן-המרכזי-של-nevermind-צוהר-לחקירה-עצמ/": "/articles/", // 4 צפיות
  "/📄-זכויות-יוצרים-והפניות/": "/terms/", // 4 צפיות
  "/lama-bali/": "/archive/", // 3 צפיות
  "/product/התמכרויות-וגמילה-מהתמכרות-קורס-תודע/": "/courses/קורס-התמכרויות/", // 3 צפיות
  "/קורסים/": "/archive/", // 3 צפיות
  "/what-is-consciousness/": "/glossary/self/", // 2 צפיות
  "/lesson-tag/איך-להירגע-ממחשבות/": "/archive/", // 1 צפיות
  "/product-tag/ליווי-אישי/": "/products/", // 1 צפיות
  "/product-tag/מודעות-מתקדמת/": "/products/", // 1 צפיות
  "/product-tag/קורסים-תודעתיים/": "/products/", // 1 צפיות
  "/product/להבין-את-המציאות/": "/products/להבין-את-המציאות/", // 1 צפיות
  "/product/פודקאסט-מהמרפסת-הרהורים-על-החיים-לנש/": "/products/פודקאסט-מהמרפסת-הרהורים-על-החיים-לנש/", // 1 צפיות
  "/product/קורס-זוגיות/": "/products/קורס-זוגיות/", // 1 צפיות
  "/tag/יקיר-כהן/": "/articles/", // 1 צפיות
  "/אבטחת-מידע-ותשלומים/": "/privacy/", // 1 צפיות
  "/פוסטים-אחרונים-ותכני-האתר/": "/articles/", // 1 צפיות
  "/שיטות-טיפול/": "/services/", // 1 צפיות
  "/תנאי-שימוש-והחזרים/": "/terms/", // 1 צפיות
  "/תרמו-לאתר-נתינה-שמתחילה-במקום-עמוק-י/": "/", // 1 צפיות
} as const;

/** BLOG POSTS (WordPress /%postname%/ → Astro /blog/[slug]) */
export const BLOG_REDIRECTS = {
  // High-traffic posts (5+ views)
  "/טוב-ורע-האם-הם-באמת-נפרדים/": "/blog/טוב-ורע-האם-הם-באמת-נפרדים/",
  "/מה-זה-אהבה-טהורה/": "/blog/מה-זה-אהבה-טהורה/",

  // Medium-traffic (3-4 views)
  "/איך-אלוהים-נראה/": "/blog/איך-אלוהים-נראה/",
  "/מה-זה-נימוס-מה-זה-כבוד/": "/blog/מה-זה-נימוס-מה-זה-כבוד/",
  "/מהו-אגו-באמת/": "/blog/מהו-אגו-באמת/",
  "/7-הרגלים-מוזרים-שמגלים-עליכם-את-כל-האמת/": "/blog/7-הרגלים-מוזרים-שמגלים-עליכם-את-כל-האמת/",
  "/איך-להבדיל-בין-עובדה-לפירוש/": "/blog/איך-להבדיל-בין-עובדה-לפירוש/",
  "/הילד-שלי-פוחד-משדים/": "/blog/הילד-שלי-פוחד-משדים/",
  "/סבא-וסבתא-יקרים-בואו-נדבר-על-לילה-מתוק/": "/blog/סבא-וסבתא-יקרים-בואו-נדבר-על-לילה-מתוק/",

  // Low-traffic but preserve anyway (2 views)
  "/איך-לבחור-חברים-בצורה-חכמה/": "/blog/איך-לבחור-חברים-בצורה-חכמה/",
  "/איך-לזהות-מניפולציה-בשפה/": "/blog/איך-לזהות-מניפולציה-בשפה/",
  "/האם-להתגרש-או-להישאר/": "/blog/האם-להתגרש-או-להישאר/",

  // בלוג: מפתחות קנוניים (ידני; לא בלוק GA4)
  "/5-זיכרונות-ילדות-שמנהלים-את-חייכם/": "/blog/5-זיכרונות-ילדות-שמנהלים-את-חייכם/",
  "/6-חלומות-ילדות-שרודפים-אחריכם/": "/blog/6-חלומות-ילדות-שרודפים-אחריכם/",
  "/7-משפטים-שהרסו-לכם-את-החיים/": "/blog/7-משפטים-שהרסו-לכם-את-החיים/",
  "/איך-לדעת-למה-מישהו-לא-אוהב-אותך/": "/blog/איך-לדעת-למה-מישהו-לא-אוהב-אותך/",
  "/איך-להיות-שלם-באמת/": "/blog/איך-להיות-שלם-באמת/",
  "/איך-להתמודד-עם-לקוחות-שמבטלים-פגישות/": "/blog/איך-להתמודד-עם-לקוחות-שמבטלים-פגישות/",
  "/איך-נוצר-אלוהים/": "/blog/איך-נוצר-אלוהים/",
  "/דחיינות-למה-אנחנו-מושכים-זמן/": "/blog/דחיינות-למה-אנחנו-מושכים-זמן/",
  "/האם-דיאטת-קיטו-באמת-עובדת/": "/blog/האם-דיאטת-קיטו-באמת-עובדת/",
  "/האם-הזמן-והמקום-הם-רק-אשליה/": "/blog/האם-הזמן-והמקום-הם-רק-אשליה/",
  "/האם-להגיד-למישהו-שאתה-אוהב-אותו/": "/blog/האם-להגיד-למישהו-שאתה-אוהב-אותו/",
  "/האם-צריך-זוגיות-כדי-להיות-מאושרים/": "/blog/האם-צריך-זוגיות-כדי-להיות-מאושרים/",
  "/חושב-שאתה-המשיח/": "/blog/חושב-שאתה-המשיח/",
  "/כיצד-לגרום-למישהו-להתאהב-בך/": "/blog/כיצד-לגרום-למישהו-להתאהב-בך/",
  "/למה-אמון-עצמי-הוא-המפתח/": "/blog/למה-אמון-עצמי-הוא-המפתח/",
  "/לתכנן-דייט-ראשון-מוצלח/": "/blog/לתכנן-דייט-ראשון-מוצלח/",
  "/רגעי-תובנה-60-שניות-לתובנה-חדשה/": "/blog/רגעי-תובנה-60-שניות-לתובנה-חדשה/",



  // אנליטיקס - ייבוא אוטומטי (BLOG)
  // GA4: עדיפות גבוהה 10+ צפיות
  "/mahu-ego/": "/blog/mahu-ego/", // 12 צפיות // high priority
  // GA4: מתחת ל-10 צפיות
  "/מה-זה-אהבה-טהורה-המשמעות-האמיתית-שמאחו/": "/blog/מה-זה-אהבה-טהורה/", // 8 צפיות
  "/מה-זה-נימוס-מה-זה-כבוד-האם-יש-הבדל-בין-כב/": "/blog/מה-זה-נימוס-מה-זה-כבוד/", // 8 צפיות
  "/האם-להתגרש-או-להישאר-🤔-זה-מתחיל-מהבנה/": "/blog/האם-להתגרש-או-להישאר/", // 6 צפיות
  "/איך-לבחור-חברים/": "/blog/איך-לבחור-חברים-בצורה-חכמה/", // 4 צפיות
  "/מה-ההבדל-בין-רובוט-לבן-אדם-ומה-המשמעות/": "/blog/מה-ההבדל-בין-רובוט-לבן-אדם-ומה-המשמעות/", // 4 צפיות
  "/איך-להבדיל-בין-עובדה-לפירוש-ניתוח-הנחו/": "/blog/איך-להבדיל-בין-עובדה-לפירוש/", // 3 צפיות
  "/למטפלים-ומאמנים-להפוך-למטפלים-ומאמני/": "/blog/למטפלים-ומאמנים-להפוך-למטפלים-ומאמני/", // 3 צפיות
  "/מתוקים-בלילה/": "/blog/מתוקים-בלילה/", // 3 צפיות
  "/אהבה-עצמית-אמיתית-10-עצות-לאהוב-את-עצמך-ל/": "/blog/אהבה-עצמית-אמיתית-10-עצות-לאהוב-את-עצמך-ל/", // 2 צפיות
  "/איך-לזהות-מניפולציה-בשפה-ללמוד-לפרק-א/": "/blog/איך-לזהות-מניפולציה-בשפה/", // 2 צפיות
  "/האם-הזמן-והמקום-הם-רק-אשליה-של-התודעה-ה/": "/blog/האם-הזמן-והמקום-הם-רק-אשליה/", // 2 צפיות
  "/לקוחות-שמבטלים-פגישות/": "/blog/איך-להתמודד-עם-לקוחות-שמבטלים-פגישות/", // 2 צפיות
  "/פיצול-אישיות-תסמינים-ריבוי-זהויות-זה-ק/": "/blog/פיצול-אישיות-תסמינים-ריבוי-זהויות-זה-ק/", // 2 צפיות
  "/%d7%99%d7%99%d7%a2%d7%95%d7-a5-%d7-90%d7-99%d7-a9%d7-99/": "/blog/%d7%99%d7%99%d7%a2%d7%95%d7-a5-%d7-90%d7-99%d7-a9%d7-99/", // 1 צפיות
  "/5-זיכרונות-ילדות-שמנהלים-את-חייכם-בלי-ש/": "/blog/5-זיכרונות-ילדות-שמנהלים-את-חייכם/", // 1 צפיות
  "/6-חלומות-ילדות-שרודפים-אחריכם-וטוב-שכך/": "/blog/6-חלומות-ילדות-שרודפים-אחריכם/", // 1 צפיות
  "/7-משפטים-שהרסו-לכם-את-החיים-ואתם-עדיין-מ/": "/blog/7-משפטים-שהרסו-לכם-את-החיים/", // 1 צפיות
  "/איך-לדעת-למה-מישהו-לא-אוהב-אותך-שיטות-מ/": "/blog/איך-לדעת-למה-מישהו-לא-אוהב-אותך/", // 1 צפיות
  "/איך-להיות-שלם-באמת-למה-אנחנו-מרגישים-שח/": "/blog/איך-להיות-שלם-באמת/", // 1 צפיות
  "/איך-לעצור-מחבל-מתאבד-לפני-שהוא-פועל/": "/blog/איך-לעצור-מחבל-מתאבד-לפני-שהוא-פועל/", // 1 צפיות
  "/דייט-ראשון/": "/blog/לתכנן-דייט-ראשון-מוצלח/", // 1 צפיות
  "/האם-דיאטת-קיטו-באמת-עובדת-או-שמדובר-רק/": "/blog/האם-דיאטת-קיטו-באמת-עובדת/", // 1 צפיות
  "/התמודדות-עם-דחיינות/": "/blog/דחיינות-למה-אנחנו-מושכים-זמן/", // 1 צפיות
  "/חושב-שאתה-המשיח-הסיפור-האישי-והמטלטל-ש/": "/blog/חושב-שאתה-המשיח/", // 1 צפיות
  "/להגיד-למישהו-שאתה-אוהב/": "/blog/האם-להגיד-למישהו-שאתה-אוהב-אותו/", // 1 צפיות
  "/למה-אמון-עצמי-הוא-המפתח-לכל-קשר-רומנטי-מ/": "/blog/למה-אמון-עצמי-הוא-המפתח/", // 1 צפיות
  "/למה-אני-מרגיש/": "/blog/למה-אני-מרגיש/", // 1 צפיות
  "/מדריך-להתבודדות-עמוקה-60-דקות-שישנו-את-ה/": "/blog/מדריך-להתבודדות-עמוקה-60-דקות-שישנו-את-ה/", // 1 צפיות
  "/רגעי-תובנה-60-שניות-לתובנה-חדשה-🌟/": "/blog/רגעי-תובנה-60-שניות-לתובנה-חדשה/", // 1 צפיות
  "/תרגיל-חשיפה-מה-הארנק-שלכם-מגלה-על-הפחדי/": "/blog/תרגיל-חשיפה-מה-הארנק-שלכם-מגלה-על-הפחדי/", // 1 צפיות
} as const;

/** SEO CONSTANTS (From Yoast settings) */
export const SEO = {
  siteName: "NeverMind - כלים מעשיים לשיפור החיים",
  defaultTitleTemplate: "%%title%%",
  defaultDescription: "NeverMind - חקירה זוגית ואישית %%sep%% %%title%%",
  defaultImage: "https://www.nevermind.co.il/og.jpg",
  googleVerify: "M2ujWgqETy_44tp8wSVOKsZ0PyQVfpu-zy4MCN5-Tm0",
} as const;

/** Export combined map for redirect generation (CORE גובר על BLOG אם אותו מפתח) */
export const MIGRATION_MAP = {
  ...BLOG_REDIRECTS,
  ...CORE_REDIRECTS,
} as const;

/** תאימות: sitemap, validate-links, getRedirect */
export const MIGRATION_REDIRECTS: Readonly<Record<string, string>> = Object.freeze(
  { ...(MIGRATION_MAP as unknown as Record<string, string>) },
);

/** Yoast %%title%% → אותו התנהגות כמו TITLE עם %s ב-SEO.astro */
export const TITLE_TEMPLATE = "%s";

export const SITE_NAME = SEO.siteName;
export const DEFAULT_DESCRIPTION = SEO.defaultDescription;
export const OG_IMAGE_DEFAULT = SEO.defaultImage;
export const GOOGLE_SITE_VERIFICATION = SEO.googleVerify;

/** תאימות לאובייקט קודם */
export const SITE_SEO_CONFIG = {
  SITE_NAME,
  TITLE_TEMPLATE,
  DEFAULT_DESCRIPTION,
  OG_IMAGE_DEFAULT,
} as const;

export interface MigrationConfig {
  readonly redirects: Readonly<Record<string, string>>;
  readonly siteName: string;
  readonly defaultDescription: string;
  readonly titleTemplate: string;
  readonly ogImageDefault: string;
}

export const migrationConfig: MigrationConfig = Object.freeze({
  redirects: MIGRATION_REDIRECTS,
  siteName: SITE_NAME,
  defaultDescription: DEFAULT_DESCRIPTION,
  titleTemplate: TITLE_TEMPLATE,
  ogImageDefault: OG_IMAGE_DEFAULT,
});

function stripQueryAndHash(input: string): string {
  let s = input.trim();
  const q = s.indexOf("?");
  if (q >= 0) s = s.slice(0, q);
  const h = s.indexOf("#");
  if (h >= 0) s = s.slice(0, h);
  return s;
}

export function normalizeMigrationPath(raw: string): string {
  let segment = stripQueryAndHash(raw);

  try {
    segment = decodeURI(segment);
  } catch {
    /* מחרוזת אחוזים שבורה */
  }

  if (segment.startsWith("http://") || segment.startsWith("https://")) {
    try {
      segment = new URL(segment).pathname;
    } catch {
      return "/";
    }
  }

  if (!segment.startsWith("/")) {
    segment = `/${segment}`;
  }

  if (segment.length > 1 && !segment.endsWith("/")) {
    segment = `${segment}/`;
  }

  return segment === "" ? "/" : segment;
}

export function getRedirect(path: string): string | null {
  const key = normalizeMigrationPath(path);
  const direct = MIGRATION_REDIRECTS[key];
  if (direct) return direct;
  const noTrail = key.length > 1 ? key.replace(/\/+$/, "") : key;
  const withTrail = noTrail === "/" ? "/" : `${noTrail}/`;
  return MIGRATION_REDIRECTS[withTrail] ?? MIGRATION_REDIRECTS[noTrail] ?? null;
}
