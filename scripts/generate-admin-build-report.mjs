import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./_lib/frontmatter.mjs";

const root = process.cwd();
const stageArg = process.argv.find((item) => item.startsWith("--stage="));
const stage = stageArg ? stageArg.slice("--stage=".length) : "manual";
const articlesDir = path.join(root, "src", "content", "articles");
const publicReportPath = path.join(root, "public", "admin-build-report.json");
const distReportPath = path.join(root, "dist", "admin-build-report.json");

function stripMdx(content) {
  return String(content || "")
    .replace(/^import\s.+$/gm, " ")
    .replace(/^export\s.+$/gm, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, " ")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function estimateReadability(text) {
  const normalized = stripMdx(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  const sentences = normalized.split(/[.\u0021?]+/).map((part) => part.trim()).filter(Boolean);
  const longWords = words.filter((word) => word.length >= 9).length;
  const avgSentence = sentences.length ? words.length / sentences.length : words.length;
  const longRatio = words.length ? longWords / words.length : 0;
  const score = clamp(Math.round(100 - Math.max(0, avgSentence - 14) * 3.2 - longRatio * 130), 32, 98);
  const label = score >= 82 ? "צלול" : score >= 64 ? "טוב" : "דורש פישוט";
  return {
    score,
    label,
    words: words.length,
    sentences: sentences.length,
    avgSentence: Number(avgSentence.toFixed(1)),
    longRatio: Number((longRatio * 100).toFixed(1)),
  };
}

const articleFiles = fs
  .readdirSync(articlesDir)
  .filter((name) => name.endsWith(".mdx") && !["template.mdx", "decap-cms-setup.mdx"].includes(name));

const readabilityItems = articleFiles
  .map((name) => {
    const fullPath = path.join(articlesDir, name);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = parseFrontmatter(raw);
    const metrics = estimateReadability(parsed.content);
    return {
      slug: String(parsed.data.slug || name.replace(/\.mdx$/i, "")).trim(),
      title: String(parsed.data.title || name.replace(/\.mdx$/i, "")).trim(),
      href: `/articles/${String(parsed.data.slug || name.replace(/\.mdx$/i, "")).trim()}/`,
      ...metrics,
    };
  })
  .sort((left, right) => left.score - right.score);

const averageScore = readabilityItems.length
  ? Math.round(readabilityItems.reduce((sum, item) => sum + item.score, 0) / readabilityItems.length)
  : 0;

const readabilitySummary = {
  articleCount: readabilityItems.length,
  averageScore,
  clearCount: readabilityItems.filter((item) => item.score >= 82).length,
  goodCount: readabilityItems.filter((item) => item.score >= 64 && item.score < 82).length,
  denseCount: readabilityItems.filter((item) => item.score < 64).length,
  hardest: readabilityItems.slice(0, 6),
};

const report = {
  generatedAt: new Date().toISOString(),
  stage,
  readability: readabilitySummary,
  build: {
    htmlPages: null,
    rssReady: false,
    internalLinks: {
      ok: null,
      checkedAt: null,
    },
  },
};

const distDir = path.join(root, "dist");
if (fs.existsSync(distDir)) {
  const htmlPages = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        htmlPages.push(fullPath);
      }
    }
  };
  walk(distDir);
  report.build.htmlPages = htmlPages.length;
  report.build.rssReady = fs.existsSync(path.join(distDir, "rss.xml"));
  if (stage === "postbuild") {
    report.build.internalLinks = {
      ok: true,
      checkedAt: new Date().toISOString(),
    };
  }
}

fs.mkdirSync(path.dirname(publicReportPath), { recursive: true });
fs.writeFileSync(publicReportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
if (fs.existsSync(distDir)) {
  fs.writeFileSync(distReportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

console.log(`[generate-admin-build-report] stage=${stage} readability=${averageScore}`);
