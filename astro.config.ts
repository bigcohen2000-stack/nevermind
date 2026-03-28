import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import pagefind from "astro-pagefind";
import tailwindcss from "@tailwindcss/vite";
import remarkGlossaryLinks from "./src/plugins/remark-glossary-links";

export default defineConfig({
  site: "https://www.nevermind.co.il",
  publicDir: "./public",
  output: "static",
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
    mdx({ remarkPlugins: [remarkGlossaryLinks] }),
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
        return { ...item, priority, changefreq };
      },
    }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
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
