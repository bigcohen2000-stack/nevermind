import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Plugin } from "vite";
import siteSettings from "../config/siteSettings.json";
import { splitPremiumRawBody } from "../lib/premium-split";

const articlesDir = path.resolve("src/content/articles");

function getCutoffMarker(): string {
  const pv = siteSettings as { premiumVault?: { cutoffMarker?: string } };
  return typeof pv.premiumVault?.cutoffMarker === "string" ? pv.premiumVault.cutoffMarker : "<!--premium-break-->";
}

export function premiumMdxStripPlugin(): Plugin {
  const markerRaw = getCutoffMarker();
  return {
    name: "premium-mdx-strip",
    enforce: "pre",
    transform(code, id) {
      const filePath = id.split("?")[0];
      if (!filePath.replace(/\\/g, "/").includes("/content/articles/") || !filePath.endsWith(".mdx")) {
        return null;
      }
      let parsed: ReturnType<typeof matter>;
      try {
        parsed = matter(code);
      } catch {
        return null;
      }
      if (!parsed.data?.isPremium) return null;
      const { publicPart } = splitPremiumRawBody(parsed.content, markerRaw);
      return { code: matter.stringify(publicPart, parsed.data), map: null };
    },
    buildStart() {
      const locks: Record<string, string> = {};
      if (!fs.existsSync(articlesDir)) return;
      const marker = markerRaw;
      for (const name of fs.readdirSync(articlesDir)) {
        if (!name.endsWith(".mdx")) continue;
        const full = path.join(articlesDir, name);
        const raw = fs.readFileSync(full, "utf8");
        let data: Record<string, unknown>;
        let content: string;
        try {
          const p = matter(raw);
          data = p.data as Record<string, unknown>;
          content = p.content;
        } catch {
          continue;
        }
        if (!data.isPremium) continue;
        const slug = name.replace(/\.mdx$/i, "");
        const { lockedPart } = splitPremiumRawBody(content, marker);
        if (lockedPart.trim().length > 0) {
          locks[slug] = lockedPart;
        }
      }
      const outDir = path.resolve("src/lib/generated");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "premium-locks.json"), JSON.stringify(locks), "utf8");
    },
  };
}
