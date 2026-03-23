/**
 * Normalizes typographic characters from editors / LLMs to plain ASCII-friendly text.
 */
export function cleanHumanTouch(text: string): string {
  if (!text) return text;
  return (
    text
      // Long dashes → hyphen
      .replace(/\u2014/g, "-")
      .replace(/\u2013/g, "-")
      // Smart double quotes → "
      .replace(/\u201c/g, '"')
      .replace(/\u201d/g, '"')
      // Smart single quotes → '
      .replace(/\u2018/g, "'")
      .replace(/\u2019/g, "'")
      // Ellipsis character → three dots
      .replace(/\u2026/g, "...")
  );
}
