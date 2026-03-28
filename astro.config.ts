import fs from "node:fs";
import path from "node:path";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";
import matter from "gray-matter";
import remarkGlossaryLinks from "./src/plugins/remark-glossary-links";
import rehypeGlossaryPreviews from "./src/plugins/rehype-glossary-previews";
import { premiumMdxStripPlugin } from "./src/vite-plugins/premium-mdx-strip";

const articlesDir = path.resolve("src/content/articles");

/** lastmod לפי frontmatter (updatedDate או pubDate) למסלולי /articles/... */
function articlePathToLastmod(): Map<string, Date> {
  const map = new Map<string, Date>();
  if (!fs.existsSync(articlesDir)) return map;
  for (const name of fs.readdirSync(articlesDir)) {
    if (!name.endsWith(".mdx")) continue;
    const raw = fs.readFileSync(path.join(articlesDir, name), "utf8");
    let data: Record<string, unknown>;
    try {
      data = matter(raw).data as Record<string, unknown>;
    } catch {
      continue;
    }
    if (data.draft === true) continue;
    const slug = name.replace(/\.mdx$/i, "");
    const pathname = `/articles/${slug}`;
    const updated = data.updatedDate ?? data.pubDate;
    if (updated == null) continue;
    const d = new Date(updated as string | number | Date);
    if (Number.isNaN(d.getTime())) continue;
    map.set(pathname, d);
  }
  return map;
}

const articleLastmodByPath = articlePathToLastmod();

export default defineConfig({
  site: "https://www.nevermind.co.il",
  publicDir: "./public",
  output: "static",
  adapter: cloudflare(),
  build: {
    format: "directory",
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  image: {
    domains: ["youtube.com", "i.ytimg.com", "img.youtube.com"],
  },
  integrations: [
    mdx({
      remarkPlugins: [remarkGlossaryLinks],
      rehypePlugins: [rehypeGlossaryPreviews],
    }),
    react(),
    sitemap({
      filter: (page) => {
        const pathname = (() => {
          if (typeof page === "object" && page !== null) {
            const withPath = page as { pathname?: unknown; url?: unknown };
            if (typeof withPath.pathname === "string") {
              return withPath.pathname.replace(/\/$/, "") || "/";
            }
            if (typeof withPath.url === "string") {
              try {
                return new URL(withPath.url).pathname.replace(/\/$/, "") || "/";
              } catch {
                return withPath.url.replace(/\/$/, "") || "/";
              }
            }
          }
          if (typeof page === "string") {
            try {
              return new URL(page).pathname.replace(/\/$/, "") || "/";
            } catch {
              return page.replace(/\/$/, "") || "/";
            }
          }
          return "/";
        })();
        if (pathname === "/404") return false;
        if (pathname.startsWith("/admin")) return false;
        if (pathname === "/premium-access") return false;
        return true;
      },
      serialize: (item) => {
        const rawUrl =
          typeof item === "object" && item !== null && "url" in item && typeof (item as { url: unknown }).url === "string"
            ? (item as { url: string }).url
            : String(item);
        let pathname = "/";
        try {
          pathname = new URL(rawUrl).pathname.replace(/\/$/, "") || "/";
        } catch {
          /* ignore */
        }
        let priority = 0.65;
        let changefreq: "weekly" | "monthly" | "yearly" = "monthly";
        if (pathname === "/") {
          priority = 1.0;
          changefreq = "weekly";
        } else if (pathname === "/intake") {
          priority = 0.9;
          changefreq = "monthly";
        } else if (pathname === "/services" || pathname.startsWith("/services/")) {
          priority = 0.85;
        } else if (pathname === "/articles" || pathname.startsWith("/articles/")) {
          priority = 0.75;
        }
        const articleMod = articleLastmodByPath.get(pathname);
        const lastmod = articleMod ?? (item as { lastmod?: Date }).lastmod;
        return { ...item, priority, changefreq, ...(lastmod ? { lastmod } : {}) };
      },
    }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss(), premiumMdxStripPlugin()],
    build: {
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
  },
});
