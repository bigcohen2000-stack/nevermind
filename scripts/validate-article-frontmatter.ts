/**
 * ולידציה לפני בילד: pubDate, תגיות whitelist, פסילת שפה (validateAndClassify).
 * הרצה: npx tsx scripts/validate-article-frontmatter.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { validateAndClassify } from "../src/utils/contentValidator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const articlesDir = path.join(root, "src", "content", "articles");

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const normalizeTag = (tag: string): string => tag.trim().normalize("NFC");
const WHITELIST = new Set([
  "חופש",
  "מכניקת מחשבה",
  "העצמי",
  "בהירות",
  "בחירה",
  "זוגיות",
  "משפחה וחינוך",
  "פילוסופיה וחברה",
  "תודעה ורצון",
  "חשיבה ביקורתית",
  "שאלות גדולות",
  "רגשות",
  "ניסויי מחשבה",
].map(normalizeTag));

function parseFrontmatter(raw: string) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { error: "חסר frontmatter עם ---" };
  try {
    const data = yaml.load(m[1], { schema: yaml.JSON_SCHEMA });
    return { data: data && typeof data === "object" ? data : {} };
  } catch (e) {
    return { error: `YAML לא תקין: ${e}` };
  }
}

const errors: string[] = [];
const metadataWarningCounts = {
  audience: 0,
  difficulty: 0,
  intendedAudience: 0,
  readTime: 0,
  isPublic: 0,
};

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

for (const name of fs.readdirSync(articlesDir)) {
  if (!name.endsWith(".mdx")) continue;
  const fp = path.join(articlesDir, name);
  const raw = fs.readFileSync(fp, "utf8");
  const parsed = parseFrontmatter(raw);
  if ("error" in parsed && parsed.error) {
    errors.push(`${name}: ${parsed.error}`);
    continue;
  }
  const { data } = parsed as { data: Record<string, unknown> };
  const pd = data.pubDate;
  if (pd == null || pd === "") {
    errors.push(`${name}: חסר pubDate`);
  } else if (pd instanceof Date) {
    const s = pd.toISOString().slice(0, 10);
    if (!ISO.test(s) || Number.isNaN(pd.getTime())) {
      errors.push(`${name}: pubDate לא תקין`);
    }
  } else if (typeof pd === "string") {
    if (!ISO.test(pd) || Number.isNaN(Date.parse(pd))) {
      errors.push(`${name}: pubDate לא בפורמט YYYY-MM-DD חוקי (מצאתי: ${pd})`);
    }
  } else {
    errors.push(`${name}: pubDate חייב מחרוזת YYYY-MM-DD או תאריך`);
  }
  const tags = Array.isArray(data.tags) ? data.tags : [];
  for (const t of tags) {
    if (typeof t === "string" && !WHITELIST.has(normalizeTag(t))) {
      errors.push(`${name}: תגית לא ברשימה המאושרת: "${t}"`);
    }
  }

  if (data.audience == null) {
    metadataWarningCounts.audience += 1;
  } else if (!hasNonEmptyString(data.audience)) {
    errors.push(`${name}: audience חייב להיות מחרוזת לא ריקה`);
  }
  if (data.difficulty == null) {
    metadataWarningCounts.difficulty += 1;
  } else if (typeof data.difficulty !== "string" || !["beginner", "intermediate", "advanced"].includes(data.difficulty)) {
    errors.push(`${name}: difficulty חייב להיות beginner/intermediate/advanced`);
  }
  if (data.intendedAudience == null) {
    metadataWarningCounts.intendedAudience += 1;
  } else if (!hasNonEmptyString(data.intendedAudience)) {
    errors.push(`${name}: intendedAudience חייב להיות מחרוזת לא ריקה`);
  }
  if (data.readTime == null) {
    metadataWarningCounts.readTime += 1;
  } else if (typeof data.readTime !== "number" || data.readTime <= 0) {
    errors.push(`${name}: readTime חייב להיות מספר חיובי`);
  }
  if (data.isPublic == null) {
    metadataWarningCounts.isPublic += 1;
  } else if (data.isPublic !== true && data.isPublic !== false) {
    errors.push(`${name}: isPublic חייב להיות true/false`);
  }

  const classified = validateAndClassify(raw);
  if (!classified.valid) {
    errors.push(`${name}: ${classified.error} - ${classified.matchedBlocklist.join(", ")}`);
  }
}

if (errors.length) {
  console.error("שגיאות ולידציה במאמרים:\n" + errors.join("\n"));
  process.exit(1);
}

const warningLines = Object.entries(metadataWarningCounts)
  .filter(([, count]) => count > 0)
  .map(([field, count]) => `- ${field}: ${count} קבצים בלי metadata משלים`);

if (warningLines.length) {
  console.warn("אזהרות metadata במאמרים קיימים (לא חוסם build):\n" + warningLines.join("\n"));
}

console.log("validate-article-frontmatter: עבר (כל קבצי המאמרים).");
