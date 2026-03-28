/** JSON לתוך תג script inline: מונע סגירת תג מוקדמת בגלל </ בטקסט */
export function jsonLdForInlineScript(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "\\u003c/");
}
