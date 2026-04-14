export const brandVoiceProfile = {
  name: "NeverMind",
  positioning: "חקירה לוגית ללא פשרות שמפרידה בין עובדה, פירוש ותגובה.",
  tone: {
    primary: "ישיר",
    secondary: "אנליטי",
    avoid: ["ריכוך מלאכותי", "סיסמאות עזרה עצמית", "נחמה לא מבוססת"],
  },
  aiGuidance: {
    objective: "להוביל לחקירה לוגית של הנחת היסוד ולא לשכך תחושה באופן רגשי.",
    diagnosticQuestions: [
      "למה המחשבה הזו עולה עכשיו?",
      "מהי הנחת היסוד שעומדת בבסיסה?",
      "האם ההנחה הזו נכונה, מלאה, ובריאה לוגית?",
    ],
    framing:
      "הכוונה היא לאמת, לא לעידוד. סבל נתפס כאי-התאמה בין ציפייה לבין המציאות בפועל, ולכן הפתרון הוא בירור ההנחה ולא אילחוש הרגש.",
  },
} as const;

export const unlockTone = {
  loadingClubData: "טוען נתוני מועדון...",
  checkingClubData: "מזקק את נתוני המועדון...",
  liveCounter: {
    unavailableCount: "--",
    unavailableCopy: "כרגע אין כאן מונה חי זמין. כשהחיבור יפעל נחזיר אותו בלי לנחש מספרים.",
    unavailableNote: "בינתיים אפשר להישאר כאן בשקט, לקרוא, ולתת לתוכן לעבוד בלי רעש מסביב.",
    zeroCopy: "כרגע אין כאן תנועה חיה שנמדדה. זה עדיין מקום טוב להישאר בו רגע.",
    oneCopy: "כרגע יש כאן אדם אחד עם הטקסט הזה. זה יכול להיות רק אתה, וזה עדיין מספיק.",
    manyFallbackMood: "יש כאן תנועה שקטה",
    zeroNote: "אפשר להמשיך לקרוא גם בלי קהל מסביב. מה שחשוב כאן הוא מה נפתח אצלך.",
    oneNote: "גם אם זה רק אתה, המקום הזה עדיין פתוח בשבילך.",
    manyNote: "כל אחד מגיע בקצב שלו. אתה יכול להישאר כאן בלי למהר.",
    waiting: "הספירה החיה ממתינה לחיבור",
  },
  join: {
    activeTitle: "החיבור שלך פעיל",
    inactiveTitle: "החיבור שלך עוד לא פעיל",
    activeLabel: "נורה ירוקה",
    inactiveLabel: "נורה אדומה",
    activeCopy: "יש כבר גישה פעילה במכשיר הזה. אפשר להמשיך ישר לאזור האישי או לקרוא בלי להיתקע בדרך.",
    inactiveCopy: (price: number) =>
      `אפשר לפתוח חודש ראשון במחיר השקה של ${price} ש\"ח, להיכנס בשקט, ולקבל גישה למה שנשמר לחברים.`,
    activeCta: "להיכנס לאזור האישי",
    inactiveCta: (price: number) => `בקשה להצטרף לחודש ראשון ב-${price} ש\"ח`,
  },
  session: {
    active: "פעיל",
    pending: "ממתין",
    activeLine: "הכניסה פעילה",
    activePersonalized: (name: string) => `${name}, הכניסה פתוחה עכשיו`,
    codeAccepted: "הקוד זוהה. נשאר רק שם וטלפון כדי להשלים כניסה",
    missingPersonalCode: "צריך לפתוח קודם את הקוד האישי",
    missingName: "צריך לכתוב שם כדי להמשיך",
    missingPhone: "צריך לכתוב טלפון תקין כדי להמשיך",
    saving: "שומר את הכניסה השקטה שלך",
    saved: (name: string) => `${name}, הכניסה נשמרה`,
    saveFailed: "לא הצלחנו לשמור את הכניסה כרגע. אפשר לנסות שוב בעוד רגע",
  },
  stats: {
    zeroMinutes: "0 דקות",
    hourAndMinutes: (hours: number, rest: number) => `${hours} שעות ו-${rest} דקות`,
    hoursOnly: (hours: number) => `${hours} שעות`,
    minutesOnly: (minutes: number) => `${minutes} דקות`,
  },
} as const;
