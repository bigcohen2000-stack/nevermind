import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/**
 * טקסט שטוח ל-JSON-LD articleBody: אותו אלגוריתם בבילד ובבדיקות postbuild.
 */
export function mdxContentToSeoPlain(mdxBody: string): string {
  const plainText = mdxBody.replace(/<[^>]*>/g, " ");
  return plainText.replace(/\s+/g, " ").trim();
}

const articlesDir = path.resolve("src/content/articles");

/**
 * למאמר פרימיום ה-Vite מקצץ את body בקולקציה; כאן נקרא את הקובץ המלא מהדיסק.
 */
export function getSeoArticlePlainText(entryId: string, isPremium: boolean, entryBody: string): string {
  if (!isPremium) {
    return mdxContentToSeoPlain(entryBody);
  }
  const fullPath = path.join(articlesDir, entryId);
  if (!fs.existsSync(fullPath)) {
    return mdxContentToSeoPlain(entryBody);
  }
  const raw = fs.readFileSync(fullPath, "utf8");
  const content = matter(raw).content;
  return mdxContentToSeoPlain(content);
}
