import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");

if (!fs.existsSync(distDir)) {
  console.error("Missing dist directory. Run build first.");
  process.exit(1);
}

/** @type {string[]} */
const htmlFiles = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
};

walk(distDir);

const hrefRegex = /href\s*=\s*"([^"]+)"/g;
const ignoredPrefixes = ["http://", "https://", "mailto:", "tel:", "javascript:"];
const ignoredPathPrefixes = ["/_astro/", "/fonts/", "/pagefind/"];
const ignoredPathExtensions = [
  ".css",
  ".js",
  ".mjs",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".xml",
  ".json",
  ".txt",
  ".pdf",
  ".woff",
  ".woff2",
  ".mp3",
  ".m4a",
  ".ogg",
  ".wav",
];

/**
 * @param {string} href
 * @returns {boolean}
 */
const isSkippableHref = (href) => {
  if (!href) return true;
  if (href.startsWith("#")) return true;
  if (href.startsWith("//")) return true;
  return ignoredPrefixes.some((prefix) => href.startsWith(prefix));
};

/**
 * @param {string} pathname
 * @returns {boolean}
 */
const isSkippablePath = (pathname) => {
  if (!pathname || pathname === "/") return false;
  if (ignoredPathPrefixes.some((prefix) => pathname.startsWith(prefix))) return true;
  return ignoredPathExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
};

/**
 * Resolve site-relative href to built file path candidates.
 * @param {string} href
 * @returns {string[]}
 */
const candidatesForHref = (href) => {
  const [rawPath] = href.split(/[?#]/);
  const normalized = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const clean = normalized.replace(/\/+$/, "") || "/";

  if (clean === "/") {
    return [path.join(distDir, "index.html")];
  }

  const asDir = path.join(distDir, clean.slice(1), "index.html");
  const asHtml = path.join(distDir, `${clean.slice(1)}.html`);
  return [asDir, asHtml];
};

/** @type {{from:string, href:string}[]} */
const failures = [];

for (const htmlFile of htmlFiles) {
  const fromRelative = path.relative(distDir, htmlFile).replace(/\\/g, "/");
  const isAdminPage = fromRelative.startsWith("admin/");
  const content = fs.readFileSync(htmlFile, "utf8");
  hrefRegex.lastIndex = 0;

  let match = null;
  while ((match = hrefRegex.exec(content)) !== null) {
    const href = String(match[1] || "").trim();
    if (isSkippableHref(href)) continue;
    if (!href.startsWith("/")) continue;
    if (isAdminPage) continue;

    const [rawPath] = href.split(/[?#]/);
    const normalizedPath = (rawPath || "/").replace(/\/+$/, "") || "/";
    if (isSkippablePath(normalizedPath)) continue;
    if (normalizedPath.startsWith("/admin")) continue;

    const candidates = candidatesForHref(normalizedPath);
    const exists = candidates.some((candidate) => fs.existsSync(candidate));
    if (!exists) {
      failures.push({
        from: fromRelative,
        href: normalizedPath,
      });
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken internal links found: ${failures.length}`);
  failures.forEach((f) => {
    console.error(`- ${f.href} (from ${f.from})`);
  });
  process.exit(1);
}

console.log(`Internal link check passed (${htmlFiles.length} HTML files scanned).`);
