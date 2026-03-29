/**
 * JSON לתוך תג script inline.
 * JSON.stringify מבריח מחרוזות (", \\, בקרה) כך שתוכן משתמש לא ישבור את ה-JSON.
 * ההחלפה של <\/ ל־\\u003c/ מונעת סגירת תג script מוקדמת אם במחרוזת מופיע רצף דמוי </script>.
 */
export function jsonLdForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "\\u003c/");
}
