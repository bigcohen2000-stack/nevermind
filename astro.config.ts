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
      filter: (page) => page !== "/404" && !page.startsWith("/admin") && page !== "/intake" && page !== "/premium-access",
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
