export type MicroPost = {
  slug: string;
  question: string;
  answer: string;
  relatedHref?: string;
  relatedLabel?: string;
  tag?: string;
};

export const microPosts: MicroPost[] = [
  {
    slug: "ego-vs-protection",
    question: "איך אני יודע אם מה שנפגע בי זה אני או רק האגו?",
    answer:
      "אם אתה עסוק בעיקר בלהחזיר לעצמך ערך, לנצח את הצד השני או להוכיח משהו, כנראה שלא נפגעת בעובדה אלא בדימוי. הפגיעה האמיתית לרוב יושבת במה שהסיפור שלך על עצמך לא מוכן לשמוע.",
    relatedHref: "/glossary/ego/",
    relatedLabel: "למושג: אגו",
    tag: "העצמי",
  },
  {
    slug: "choice-with-price",
    question: "איך מזהים בחירה אמיתית כשכל האפשרויות מרגישות לא טובות?",
    answer:
      "בחירה אמיתית לא תמיד מרגישה נוחה. היא בדרך כלל האפשרות שאתה מוכן לשלם עליה מחיר מודע, במקום להמשיך לשלם מחיר נסתר דרך דחייה, בלבול או המתנה.",
    relatedHref: "/glossary/choice/",
    relatedLabel: "למושג: בחירה",
    tag: "בחירה",
  },
  {
    slug: "fact-vs-interpretation-fast",
    question: "איך מפרידים מהר בין עובדה לפירוש כשאני מוצף רגשית?",
    answer:
      "קודם כותבים רק מה קרה בלי הסברים. אחר כך כותבים בנפרד מה זה אומר עליך, עליו או על העתיד. עצם ההפרדה מורידה עומס, כי המחשבה מפסיקה להתחפש למציאות.",
    relatedHref: "/glossary/fact-vs-interpretation/",
    relatedLabel: "למושג: עובדה מול פירוש",
    tag: "בהירות",
  },
];
