#!/usr/bin/env node
/**
 * סריקת מילים אסורות בקופי (language-hardline.mdc).
 * לא כולל: migration-map (נתיבי הפניה היסטוריים), הערות ב-master-philosophy.
 */

import { readFile } from "fs/promises";
import { glob } from "glob";
import { join } from "path";

const ROOT = process.cwd();

const FORBIDDEN = ["עזרה", "תמיכה", "טיפול", "ייעוץ", "ריפוי"];

const GLOBS = ["src/**/*.{astro,mdx,tsx,ts,jsx,js}", "src/config/*.json"];

const IGNORE = [
  "**/node_modules/**",
  "**/migration-map.ts",
  "**/master-philosophy.ts",
  "**/.cursor/**",
];

async function main() {
  const files = await glob(GLOBS, {
    cwd: ROOT,
    ignore: IGNORE,
    nodir: true,
  });

  const hits = [];

  for (const rel of files) {
    const full = join(ROOT, rel);
    let text;
    try {
      text = await readFile(full, "utf-8");
    } catch {
      continue;
    }

    for (const word of FORBIDDEN) {
      if (!word) continue;
      if (text.includes(word)) {
        const lines = text.split("\n");
        lines.forEach((line, i) => {
          if (line.includes(word)) {
            hits.push({ file: rel, line: i + 1, word, snippet: line.trim().slice(0, 120) });
          }
        });
      }
    }
  }

  if (hits.length) {
    console.error("\n[copy-audit] נמצאו מילים אסורות:\n");
    hits.forEach((h) => {
      console.error(`  ${h.file}:${h.line}  [${h.word}]  ${h.snippet}`);
    });
    console.error(`\n[copy-audit] סה"כ ${hits.length} הופעות.\n`);
    process.exit(1);
  }

  console.log("[copy-audit] לא נמצאו מילים אסורות בקבצים שנסרקו.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
