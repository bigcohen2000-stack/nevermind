import type { APIRoute } from "astro";
import appConfig from "../config/appConfig.json";
import { MIGRATION_REDIRECTS } from "../data/migration-map";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizePathname(pathname: string): string {
  let p = pathname.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function absoluteLoc(base: string, pathname: string): string {
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${root}${path === "/" ? "/" : path}`;
}

/** weekly + 0.6 blog; monthly + 0.8 services; home 1.0 monthly; שאר יעדי המיגרציה monthly ~0.7 */
function classifyMigrationUrl(pathname: string): { changefreq: string; priority: string } {
  const p = normalizePathname(pathname);
  if (p === "/") return { changefreq: "monthly", priority: "1.0" };
  if (p === "/services" || p.startsWith("/services/")) return { changefreq: "monthly", priority: "0.8" };
  if (p.startsWith("/articles/") || p.startsWith("/blog/")) return { changefreq: "weekly", priority: "0.6" };
  return { changefreq: "monthly", priority: "0.7" };
}

function buildUrlSet(): string[] {
  const fromMigration = Object.values(MIGRATION_REDIRECTS).map((v) => normalizePathname(v));
  const unique = new Set<string>(["/", ...fromMigration]);
  return [...unique].sort((a, b) => a.localeCompare(b, "en"));
}

export const GET: APIRoute = ({ site }) => {
  const baseUrl =
    (site?.href ? site.href.replace(/\/$/, "") : null) ??
    String(appConfig.site?.url ?? "https://www.nevermind.co.il").replace(/\/$/, "");
  const lastmod = new Date().toISOString().slice(0, 10);

  const paths = buildUrlSet();
  const urlEntries = paths.map((pathname) => {
    const { changefreq, priority } = classifyMigrationUrl(pathname);
    const loc = escapeXml(absoluteLoc(baseUrl, pathname === "/" ? "/" : `${pathname}/`));
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
