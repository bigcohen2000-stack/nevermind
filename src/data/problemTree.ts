export type ProblemRootNode = {
  id: string;
  title: string;
  shortLabel: string;
  summary: string;
  roots: Array<{
    id: string;
    title: string;
    description: string;
    relatedHref?: string;
    relatedLabel?: string;
  }>;
};

export const problemRootNodes: ProblemRootNode[] = [
  {
    id: "business-stuck",
    title: "תקיעות בעסק",
    shortLabel: "תקיעות בעסק",
    summary:
      "הבעיה נראית עסקית, אבל ברוב המקרים היא יושבת על מבנה פנימי: פחד לשלם מחיר, צורך להיראות נכון, וקושי להפריד בין נתון לפרשנות.",
    roots: [
      {
        id: "fear-of-failure",
        title: "פחד מכישלון",
        description: "לא הפחד לטעות עוצר אותך, אלא הפחד לפגוש את התמונה שתצטייר עליך אם תטעה.",
        relatedHref: "/glossary/choice/",
        relatedLabel: "למושג: בחירה",
      },
      {
        id: "ego-protection",
        title: "אגו והגנה על דימוי",
        description: "במקום לבדוק מה עובד, אתה מגן על הסיפור שמסביר למה עדיין לא זזת.",
        relatedHref: "/glossary/ego/",
        relatedLabel: "למושג: אגו",
      },
      {
        id: "fact-vs-story",
        title: "חוסר הפרדה בין עובדה לפירוש",
        description: "המספרים הם דבר אחד. הסיפור שבנית עליהם הוא דבר אחר. ברגע שהם מתערבבים, נולדת תקיעות.",
        relatedHref: "/glossary/fact-vs-interpretation/",
        relatedLabel: "למושג: עובדה מול פירוש",
      },
    ],
  },
  {
    id: "relationship-loop",
    title: "תקיעות בזוגיות",
    shortLabel: "תקיעות בזוגיות",
    summary:
      "הוויכוח החיצוני בדרך כלל מסתיר מבנה עמוק יותר: צורך להינצל, צורך להוכיח, או הרגל לקרוא לכאב בשם \"אהבה\".",
    roots: [
      {
        id: "need-to-be-right",
        title: "צורך להיות צודק",
        description: "ברגע שהצדק חשוב יותר מהאמת, הקשר הופך לזירה ולא למרחב.",
        relatedHref: "/topics/clarity/",
        relatedLabel: "לנושא: בהירות",
      },
      {
        id: "fear-of-loss",
        title: "פחד לאבד אחיזה",
        description: "לפעמים לא מחזיקים בקשר כי הוא נכון, אלא כי מפחיד לפגוש ריק אחריו.",
        relatedHref: "/topics/self/",
        relatedLabel: "לנושא: העצמי",
      },
      {
        id: "identity-fusion",
        title: "בלבול בין זהות לקשר",
        description: "כשאתה הופך קשר להוכחה לערך שלך, כל תזוזה של האחר נחווית כאיום על מי שאתה.",
        relatedHref: "/glossary/self/",
        relatedLabel: "למושג: העצמי",
      },
    ],
  },
  {
    id: "decision-fog",
    title: "קושי להחליט",
    shortLabel: "קושי להחליט",
    summary:
      "התלבטות ממושכת היא לא תמיד חוסר מידע. לעיתים קרובות היא מנגנון שמנסה לחסוך ממך את המחיר של בחירה ברורה.",
    roots: [
      {
        id: "hidden-price",
        title: "אי-נכונות לשלם מחיר",
        description: "כל בחירה סוגרת אפשרויות. אם אתה לא מוכן לשלם את הסגירה, אתה נשאר בערפל.",
        relatedHref: "/glossary/choice/",
        relatedLabel: "למושג: בחירה",
      },
      {
        id: "false-complexity",
        title: "יצירת מורכבות מדומה",
        description: "לפעמים אתה מוסיף עוד נתונים רק כדי לא להודות שהלב כבר יודע מה נכון.",
        relatedHref: "/glossary/clarity/",
        relatedLabel: "למושג: בהירות",
      },
      {
        id: "control-addiction",
        title: "התמכרות לשליטה",
        description: "המתלבט הכרוני לא מחפש אמת. הוא מחפש עתיד בלי חיכוך, והוא לא קיים.",
        relatedHref: "/topics/freedom/",
        relatedLabel: "לנושא: חופש",
      },
    ],
  },
  {
    id: "self-confidence-drop",
    title: "ירידה בביטחון עצמי",
    shortLabel: "ביטחון עצמי",
    summary:
      "ברוב המקרים הבעיה היא לא חוסר ביטחון, אלא תלות מופרזת בתחושה פנימית לפני פעולה. אתה מחכה להרגיש מוכן, במקום לזוז ולהתבהר תוך כדי.",
    roots: [
      {
        id: "action-after-feeling",
        title: "האמונה שצריך להרגיש מוכן קודם",
        description: "ביטחון בריא נבנה אחרי מפגש עם מציאות, לא לפניו.",
        relatedHref: "/questions/#ego-vs-protection",
        relatedLabel: "למיקרו-פוסט קשור",
      },
      {
        id: "borrowed-standards",
        title: "מדדים מושאלים",
        description: "אתה בודק את הערך שלך לפי קנה מידה שלא בחרת בעצמך, ואז מתפלא למה אתה תמיד מפסיד בו.",
        relatedHref: "/topics/self/",
        relatedLabel: "לנושא: העצמי",
      },
      {
        id: "misread-fear",
        title: "פירוש שגוי של פחד",
        description: "הפחד לא תמיד אומר לעצור. לפעמים הוא רק מסמן שאתה מתקרב למקום אמיתי.",
        relatedHref: "/glossary/fact-vs-interpretation/",
        relatedLabel: "למושג: עובדה מול פירוש",
      },
    ],
  },
];
