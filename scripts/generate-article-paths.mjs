/**
 * יוצר public/article-paths.json — רשימת נתיבי מאמרים לבחירה אקראית קלה (בלי inline של מאות URL בכל דף).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const articlesDir = path.resolve("src/content/articles");
const outPath = path.resolve("public/article-paths.json");

function main() {
  const paths = [];
  if (fs.existsSync(articlesDir)) {
    for (const name of fs.readdirSync(articlesDir)) {
      if (!name.endsWith(".mdx")) continue;
      const full = path.join(articlesDir, name);
      const raw = fs.readFileSync(full, "utf8");
      let data;
      try {
        data = matter(raw).data;
      } catch {
        continue;
      }
      if (data?.draft === true) continue;
      const slug = typeof data?.slug === "string" && data.slug.trim() ? data.slug.trim() : name.replace(/\.mdx$/i, "");
      paths.push(`/articles/${slug}/`);
    }
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ paths, generatedAt: new Date().toISOString() }, null, 0), "utf8");
  console.log(`generate-article-paths: ${paths.length} paths → ${outPath}`);
}

main();
