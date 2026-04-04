#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true });

const TARGET_DIRS = ["src", "docs", "scripts", ".github", "workers", path.join("public", "admin")];
const TEXT_EXTENSIONS = new Set([
  ".astro",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".md",
  ".mdx",
  ".json",
  ".toml",
  ".yml",
  ".yaml",
  ".txt",
]);

const suspiciousChecks = [
  {
    label: "replacement character",
    test: (line) => line.includes("\uFFFD"),
  },
  {
    label: "likely mojibake sequence",
    test: (line) => /(?:\u00C3.|\u00C2.|\u05D2\u20AC)/.test(line),
  },
  {
    label: "broken Hebrew encoding pattern",
    test: (line) => (line.match(/\u05F3/g) ?? []).length >= 3,
  },
];

async function* walk(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    yield fullPath;
  }
}

const issues = [];

for (const targetDir of TARGET_DIRS) {
  const absDir = path.join(ROOT, targetDir);
  for await (const filePath of walk(absDir)) {
    const relPath = path.relative(ROOT, filePath).replace(/\\/g, "/");
    const bytes = await readFile(filePath);
    let text = "";

    try {
      text = decoder.decode(bytes);
    } catch {
      issues.push(`${relPath}: file is not valid UTF-8`);
      continue;
    }

    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const issue = suspiciousChecks.find((check) => check.test(line));
      if (!issue) continue;
      issues.push(`${relPath}:${index + 1}: ${issue.label}`);
    }
  }
}

if (issues.length > 0) {
  console.error("check-text-integrity: found suspicious text encoding issues:\n" + issues.join("\n"));
  process.exit(1);
}

console.log("check-text-integrity: passed.");
