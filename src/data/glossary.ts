export type GlossaryLink = {
  href: string;
  title: string;
  description: string;
};

export type GlossaryConcept = {
  slug: string;
  title: string;
  summary: string;
  definition: string;
  whyItMatters: string;
  tags: string[];
  keywords: string[];
  oppositeLink?: GlossaryLink;
  relatedLinks: GlossaryLink[];
};

export const glossaryConcepts: GlossaryConcept[] = [
  {
    slug: "ego",
    title: "אגו",
    summary: "המנגנון שמגן על סיפור פנימי על מי אני.",
    definition: "אגו הוא המאמץ לשמור על דמות קבועה. ברגע שמישהו מערער את הדמות, המוח מגיב כאילו הקיום עצמו הותקף.",
    whyItMatters: "כשמזהים שהתגובה מגנה על דמות ולא על עובדה, אפשר להפסיק להילחם על סיפור שלא חייב להישאר.",
    tags: ["העצמי", "מכניקת מחשבה"],
    keywords: ["אגו", "זהות", "דימוי עצמי", "הגנה"],
    oppositeLink: {
      href: "/glossary/clarity/",
      title: "הצד השני: בהירות",
      description: "אם אגו מגן על סיפור, בהירות בודקת מה ממנו באמת נכון.",
    },
    relatedLinks: [
      {
        href: "/topics/self/",
        title: "נושא: העצמי",
        description: "מאמרים על זהות, דימוי, והמאמץ לשמור על דמות יציבה.",
      },
      {
        href: "/topics/thought-mechanics/",
        title: "נושא: מכניקת מחשבה",
        description: "חקירה של הדרך שבה מחשבה הופכת לאיום, תקווה, או תגובת הגנה.",
      },
    ],
  },
  {
    slug: "choice",
    title: "בחירה",
    summary: "הנקודה שבה רואים שיש יותר מאפשרות אוטומטית אחת.",
    definition: "בחירה לא מתחילה בתחושת חופש, אלא בזיהוי של מה שמפעיל אותי. רק אחרי שהכפייה נראית, נפתח מקום לכיוון אחר.",
    whyItMatters: "בלי להבין בחירה, קל לפרש הרגל כגורל. כשמבינים את המנגנון, אפשר לזוז ממנו.",
    tags: ["בחירה", "חופש"],
    keywords: ["בחירה", "רצון", "חופש", "הרגל"],
    oppositeLink: {
      href: "/glossary/freedom/",
      title: "הצד השני: חופש",
      description: "בחירה היא הרגע המקומי. חופש הוא היכולת לא להישאר עבד של הרגע הזה.",
    },
    relatedLinks: [
      {
        href: "/topics/choice/",
        title: "נושא: בחירה",
        description: "מאמרים על רצון, הכרעה, וחיכוך מול הרגלים.",
      },
      {
        href: "/topics/freedom/",
        title: "נושא: חופש",
        description: "המשך ישיר לשאלה איפה הבחירה אמיתית ואיפה רק נדמה כך.",
      },
    ],
  },
  {
    slug: "fact-vs-interpretation",
    title: "עובדה מול פירוש",
    summary: "ההבדל בין מה שקרה בפועל לבין מה שהמוח אומר שזה אומר.",
    definition: "עובדה היא תיאור שאפשר למסור בלי עלילה. פירוש הוא המשמעות שהמוח מלביש על התיאור הזה.",
    whyItMatters: "כמעט כל סערה פנימית גדלה במקום שבו פירוש מוצג כאילו הוא עובדה. ההפרדה הזאת היא בסיס לבהירות.",
    tags: ["בהירות", "מכניקת מחשבה"],
    keywords: ["עובדה", "פירוש", "משמעות", "בהירות"],
    oppositeLink: {
      href: "/glossary/ego/",
      title: "הצד השני: אגו",
      description: "כשפירוש נדבק לעובדה, הרבה פעמים אגו הוא זה ששומר שהפירוש יישאר חי.",
    },
    relatedLinks: [
      {
        href: "/topics/clarity/",
        title: "נושא: בהירות",
        description: "מקום טוב להמשיך ממנו אם ההבחנה הזאת כבר התחילה לעבוד.",
      },
      {
        href: "/personal-consultation/",
        title: "שיחה אישית",
        description: "כשקשה להפריד לבד בין עובדה לפירוש, אפשר לעשות את זה בשיחה אחת.",
      },
    ],
  },
  {
    slug: "clarity",
    title: "בהירות",
    summary: "היכולת לראות את המבנה בלי שהרעש יניע את המסקנה.",
    definition: "בהירות היא לא רוגע. היא מצב שבו אני כבר לא מערבב עובדה, פחד, והרגל באותו משפט.",
    whyItMatters: "כשהמבנה ברור, קל יותר לדעת מה לעשות. לא כי המציאות תמיד נעימה, אלא כי היא כבר לא מעורפלת.",
    tags: ["בהירות", "בחירה"],
    keywords: ["בהירות", "דיוק", "ראייה", "החלטה"],
    oppositeLink: {
      href: "/glossary/ego/",
      title: "הצד השני: אגו",
      description: "אם בהירות בודקת, אגו ממהר להגן.",
    },
    relatedLinks: [
      {
        href: "/topics/clarity/",
        title: "נושא: בהירות",
        description: "מאמרים שעובדים על אותו חיתוך בין עובדה, פירוש, ותגובה.",
      },
      {
        href: "/articles/",
        title: "כל המאמרים",
        description: "מעבר לספריית המאמרים כדי להמשיך לחקור את אותו מנגנון מזוויות שונות.",
      },
    ],
  },
  {
    slug: "freedom",
    title: "חופש",
    summary: "לא לעשות מה שבא לי, אלא לראות מה מפעיל אותי לפני שאני מגיב.",
    definition: "חופש הוא היכולת לא להיות מופעל אוטומטית על ידי פחד, הרגל, או צורך להגן על דימוי.",
    whyItMatters: "בלי חופש, גם החלטה שנראית מודעת יכולה להיות רק המשך של אותו מנגנון ישן.",
    tags: ["חופש", "בחירה"],
    keywords: ["חופש", "אחריות", "כפייה", "הרגל"],
    oppositeLink: {
      href: "/glossary/self/",
      title: "הצד השני: העצמי",
      description: "ככל שהדמות קשיחה יותר, כך קשה יותר לזוז ממנה בחופש.",
    },
    relatedLinks: [
      {
        href: "/topics/freedom/",
        title: "נושא: חופש",
        description: "המשך לשאלה איפה אני בוחר ואיפה אני רק מגיב.",
      },
      {
        href: "/glossary/choice/",
        title: "מושג יסוד: בחירה",
        description: "הקשר הישיר בין חופש לבין נקודת הבחירה בזמן אמת.",
      },
    ],
  },
  {
    slug: "self",
    title: "העצמי",
    summary: "הדמות שאני מחזיק, ומפחד לאבד.",
    definition: "העצמי הוא לא רק מי שאני, אלא גם הסיפור שאני מתאמץ להחזיק על עצמי מול העולם.",
    whyItMatters: "כשהעצמי נדבק לסיפור אחד, כל שינוי מרגיש כמו איום. כשהסיפור נבדק, נפתח מרחב תנועה.",
    tags: ["העצמי", "בהירות"],
    keywords: ["העצמי", "זהות", "דמות", "אגו"],
    oppositeLink: {
      href: "/glossary/freedom/",
      title: "הצד השני: חופש",
      description: "אם העצמי נאחז בדמות, חופש מאפשר לראות שהדמות איננה כל המציאות.",
    },
    relatedLinks: [
      {
        href: "/topics/self/",
        title: "נושא: העצמי",
        description: "מאמרים על זהות, דמות, ופחד מאובדן שליטה פנימי.",
      },
      {
        href: "/glossary/ego/",
        title: "מושג יסוד: אגו",
        description: "המנגנון ששומר בפועל על אותו סיפור עצמי.",
      },
    ],
  },
];

export const glossaryMap = Object.fromEntries(glossaryConcepts.map((concept) => [concept.slug, concept]));
