import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { globSync } from "glob";

const root = process.cwd();
const distDir = path.join(root, "dist");
const site = "https://www.nevermind.co.il";

if (!fs.existsSync(distDir)) {
  console.error("generate-rss: missing dist directory");
  process.exit(1);
}

const files = globSync("src/content/articles/**/*.mdx", { cwd: root, nodir: true });

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toDate = (value) => {
  const date = new Date(value ?? Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const items = files
  .map((relativeFile) => {
    const full = path.join(root, relativeFile);
    const raw = fs.readFileSync(full, "utf8");
    const { data } = matter(raw);
    if (data.draft === true) return null;
    const slug = relativeFile
      .replace(/^src[\\/]content[\\/]articles[\\/]/, "")
      .replace(/\\/g, "/")
      .replace(/\.mdx$/i, "");
    const title = String(data.title ?? slug).trim();
    const description = String(data.description ?? "").trim();
    const pubDate = toDate(data.pubDate);
    return {
      title,
      description,
      pubDate,
      link: site + "/articles/" + slug + "/",
    };
  })
  .filter(Boolean)
  .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

const itemXml = items
  .map((item) => [
    "    <item>",
    "      <title>" + escapeXml(item.title) + "</title>",
    "      <description>" + escapeXml(item.description) + "</description>",
    "      <link>" + escapeXml(item.link) + "</link>",
    "      <guid>" + escapeXml(item.link) + "</guid>",
    "      <pubDate>" + item.pubDate.toUTCString() + "</pubDate>",
    "    </item>",
  ].join("\n"))
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<rss version="2.0">',
  '  <channel>',
  '    <title>NeverMind</title>',
  '    <description>מאמרים ותובנות מעולמות NeverMind</description>',
  '    <link>' + site + '</link>',
  '    <language>he-IL</language>',
  itemXml,
  '  </channel>',
  '</rss>',
  '',
].join("\n");

fs.writeFileSync(path.join(distDir, "rss.xml"), xml, "utf8");
console.log("generate-rss: wrote " + items.length + " items to dist/rss.xml");
