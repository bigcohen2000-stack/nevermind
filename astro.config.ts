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
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
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
        if (pathname === "/intake") return false;
        if (pathname === "/premium-access") return false;
        return true;
      },
      serialize: (item) => ({ ...item, priority: 0.7 }),
    }),
    pagefind(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
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
