export type TopicMediaItem = {
  type: "video" | "playlist";
  title: string;
  youtubeId?: string;
  url?: string;
  access: "public" | "members";
  order?: number;
};

export type VideoTopic = {
  key: string;
  label: string;
  intro: string;
  tags: string[];
  items: TopicMediaItem[];
};

export const videoTopics: VideoTopic[] = [
  {
    key: "self",
    label: "מי אני ופירוק הזהות",
    intro: "כאן ממשיכים לפרק את הדמות, את תחושת ה'אני' ואת הבלבול בין מחשבה לבין מי שרואה אותה.",
    tags: ["העצמי", "שאלות גדולות", "תודעה ורצון"],
    items: [
      {
        type: "playlist",
        title: "פירוק הזהות שלי - המשך לחברי המועדון",
        url: "https://www.youtube.com/watch?v=SyD_ZCrktZ8&list=PLwkkuwNJAgMjyfNW_XxXRf0Vr5OsHX1pt",
        access: "members",
        order: 1,
      },
    ],
  },
  {
    key: "parenting",
    label: "הדרכת הורים וחינוך ילדים",
    intro: "כאן נפתחת שכבת ההמשך של הורות, אכילה, גבולות, פחדים והתנגדויות של ילדים, בלי מניפולציה ובלי שפה מרככת.",
    tags: ["חינוך ילדים", "משפחה וחינוך"],
    items: [
      {
        type: "playlist",
        title: "הדרכת הורים - פלייליסט לחברי המועדון",
        url: "https://www.youtube.com/watch?v=Nw3fVy9FxdY&list=PLwkkuwNJAgMjvtv3UaXS9KeLf-5oJ43Vn",
        access: "members",
        order: 1,
      },
    ],
  },
  {
    key: "consultation",
    label: "שיחה, ייעוץ ופירוק",
    intro: "למי שרוצה להבין איך נראית שכבת ההעמקה סביב שיחה, ייעוץ ופירוק, כאן נפתח רצף נוסף לחברי המועדון.",
    tags: ["בהירות", "מכניקת מחשבה", "חשיבה ביקורתית"],
    items: [
      {
        type: "playlist",
        title: "פלייליסט ייעוץ לחברי המועדון",
        url: "https://youtu.be/Sxf7C8bbA58?si=ln6QOHHoHh4_K07U",
        access: "members",
        order: 1,
      },
    ],
  },
  {
    key: "love",
    label: "אהבה אמיתית",
    intro: "כאן מפרקים את מנגנון האהבה בלי רומנטיקה ובלי קישוט. רק נפרדות, תלות, רצון ואשליית האחר.",
    tags: ["אהבה אמיתית", "אהבה ללא תנאים", "אהבה טהורה", "העצמי", "תודעה ורצון"],
    items: [
      { type: "video", title: "מהי אהבה אמיתית", youtubeId: "uRF7UKpJgss", access: "public", order: 1 },
      { type: "video", title: "אהבה ללא תנאים", youtubeId: "_zGh4GrOx3w", access: "public", order: 2 },
      { type: "video", title: "אהבה אמיתית - פירוק נוסף", youtubeId: "sCxbMyHPnj4", access: "public", order: 3 },
      { type: "video", title: "האשליה של האחר", youtubeId: "XelQFZ_XN-k", access: "members", order: 4 },
      {
        type: "playlist",
        title: "פלייליסט ההמשך לחברי המועדון",
        url: "https://youtu.be/FOJ0qz7n0Oc?si=pbbuzeoQlbL1MG3O",
        access: "members",
        order: 5,
      },
    ],
  },
  {
    key: "desire",
    label: "רצון, כסף והרגלים",
    intro: "כאן עוקבים אחרי אותו מנגנון מזוויות שונות: כסף, עישון, רצון והשאלה מה באמת חסר מתחת לדחף החיצוני.",
    tags: ["תודעה ורצון", "מכניקת מחשבה", "בחירה", "בהירות"],
    items: [
      { type: "video", title: "האם אני באמת רוצה כסף", youtubeId: "8WYaDWfFGq4", access: "public", order: 1 },
      { type: "video", title: "איך לגלות מה אני באמת רוצה", youtubeId: "JI1bnawxOfU", access: "public", order: 2 },
      { type: "video", title: "הדרך להיגמל מעישון", youtubeId: "O-kGBO5E8j8", access: "public", order: 3 },
    ],
  },
  {
    key: "existence",
    label: "אינסוף, מציאות ונפרדות",
    intro: "זה אותו ציר עומק: האינסוף, הנפרדות, המוות, התקווה והשאלה איך בכלל נולד הרעיון של אלוהים בתוך תודעה שמחפשת גבול.",
    tags: ["שאלות גדולות", "פילוסופיה וחברה", "העצמי", "תודעה ורצון"],
    items: [
      { type: "video", title: "האם ניתן לדמיין את הבורא", youtubeId: "2xJASewsEmQ", access: "public", order: 1 },
      { type: "video", title: "האם אנחנו חיים בחלום", youtubeId: "Gia5VlxCtQA", access: "public", order: 2 },
      { type: "video", title: "חיי נצח", youtubeId: "aBmoxvevOyg", access: "public", order: 3 },
      { type: "video", title: "גיהנום, תקווה ורק טוב", youtubeId: "ckSRpQQYN4A", access: "public", order: 4 },
      { type: "video", title: "האשליה של האחר", youtubeId: "0xJFsfLMR5w", access: "public", order: 5 },
      {
        type: "playlist",
        title: "איך אלוהים נוצר - פלייליסט לחברי המועדון",
        url: "https://www.youtube.com/playlist?list=PLwkkuwNJAgMhlA5XmMx9CpUv94qyns9Pj",
        access: "members",
        order: 6,
      },
    ],
  },
  {
    key: "free-will",
    label: "בחירה חופשית",
    intro: "אותו נושא נפתח טוב יותר כרצף: שני סרטונים פתוחים, ואז שכבת המשך עמוקה יותר למי שכבר מחובר.",
    tags: ["בחירה חופשית", "בחירה", "חשיבה ביקורתית"],
    items: [
      { type: "video", title: "בחירה חופשית - פירוק ראשון", youtubeId: "Y-MkZhq_KA8", access: "public", order: 1 },
      { type: "video", title: "בחירה חופשית - פירוק נוסף", youtubeId: "TC28cuEZq8U", access: "public", order: 2 },
      {
        type: "playlist",
        title: "פלייליסט המשך לחברי המועדון",
        url: "https://www.youtube.com/watch?v=hWkC6-lM_z0&list=PLwkkuwNJAgMhTYON19iOzibzL2rY4NoCx",
        access: "members",
        order: 3,
      },
    ],
  },
  {
    key: "real-nothing",
    label: "כלום אמיתי",
    intro: "כאן נכון לעבוד עם רצף ארוך יותר: כמה סרטונים פתוחים להסבר, ופלייליסט עמוק יותר למי שרוצה להישאר על אותו ציר.",
    tags: ["כלום אמיתי", "אלוהים", "הכל אחד"],
    items: [
      { type: "video", title: "כלום אמיתי - פירוק ראשון", youtubeId: "0PPCXpA8KRI", access: "public", order: 1 },
      { type: "video", title: "כלום אמיתי - פירוק שני", youtubeId: "Xu34CPxQcNc", access: "public", order: 2 },
      { type: "video", title: "כלום אמיתי - פירוק שלישי", youtubeId: "id_vqnZkgGA", access: "public", order: 3 },
      { type: "video", title: "כלום אמיתי - פירוק רביעי", youtubeId: "fHMNQomXE9I", access: "public", order: 4 },
      {
        type: "playlist",
        title: "פלייליסט המשך לחברי המועדון",
        url: "https://www.youtube.com/watch?v=odWR-vBPvrg&list=PLwkkuwNJAgMgHreNSRdeOi_3YYje4xXi7",
        access: "members",
        order: 5,
      },
    ],
  },
  {
    key: "communication",
    label: "תקשורת, מילים ושפת גוף",
    intro: "החומר כאן בנוי כדי לעבור מהחוץ לפנים: קודם הגוף, אחר כך המילים, ואז מנגנון ההגדרה שמייצר את כל החוויה.",
    tags: ["תקשורת", "מכניקת מחשבה", "חשיבה ביקורתית"],
    items: [
      { type: "video", title: "שפת גוף ומימיקה", youtubeId: "PscTmjLXW1A", access: "public", order: 1 },
      { type: "video", title: "איך לדעת מה להגיד", youtubeId: "Y5f3Swcpr1M", access: "public", order: 2 },
      { type: "video", title: "איך דיבור משפיע על החיים", youtubeId: "1dBufq0zYMs", access: "public", order: 3 },
    ],
  },
  {
    key: "emotional-eating",
    label: "אכילה רגשית",
    intro: "הציר הזה מתחיל בזיהוי המנגנון עצמו, ולא באוכל. הווידאו נועד להחזיר אותך לסיבה, לא לעוד מאבק משמעת.",
    tags: ["אכילה רגשית", "תודעה ורצון", "מכניקת מחשבה"],
    items: [
      { type: "video", title: "אכילה רגשית - פירוק ראשון", youtubeId: "xbLT5S0H1Cc", access: "public", order: 1 },
      { type: "video", title: "אכילה רגשית - פירוק נוסף", youtubeId: "WqwBqiI4QyI", access: "public", order: 2 },
      { type: "video", title: "אכילה רגשית - העמקה", youtubeId: "NsV5hekxsYg", access: "public", order: 3 },
    ],
  },
];

export function getVideoTopic(key: string | null | undefined): VideoTopic | null {
  const clean = String(key || "").trim();
  if (!clean) return null;
  return videoTopics.find((topic) => topic.key === clean) ?? null;
}

export function listVideoTopics(): VideoTopic[] {
  return videoTopics.slice();
}
