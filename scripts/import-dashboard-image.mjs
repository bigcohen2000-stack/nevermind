import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return "";
  return String(process.argv[index + 1] ?? "").trim();
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function sanitizeFolder(value) {
  return String(value || "articles")
    .split("/")
    .map((segment) => slugify(segment) || "images")
    .join("/");
}

async function readInputBuffer(inputPath, url) {
  if (inputPath) {
    return fs.readFile(path.resolve(process.cwd(), inputPath));
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function findAvailableFilename(outputDir, baseName) {
  const initialName = `${baseName}.webp`;
  try {
    await fs.access(path.join(outputDir, initialName));
  } catch {
    return initialName;
  }

  const suffix = crypto.randomBytes(3).toString("hex");
  return `${baseName}-${suffix}.webp`;
}

async function main() {
  const inputPath = getArg("--input");
  const url = getArg("--url");
  const title = getArg("--title");
  const folder = sanitizeFolder(getArg("--folder") || "articles");
  const qualityRaw = Number(getArg("--quality") || "82");
  const quality = Number.isFinite(qualityRaw) ? Math.min(100, Math.max(50, qualityRaw)) : 82;

  if ((!inputPath && !url) || !title) {
    console.error("Usage: node scripts/import-dashboard-image.mjs --input <file> --title <title> [--folder articles]");
    console.error("   or: node scripts/import-dashboard-image.mjs --url <https://...> --title <title> [--folder articles]");
    process.exitCode = 1;
    return;
  }

  const buffer = await readInputBuffer(inputPath, url);
  const outputDir = path.join(process.cwd(), "public", "assets", "images", folder);
  await fs.mkdir(outputDir, { recursive: true });

  const baseName = slugify(title) || "image";
  const filename = await findAvailableFilename(outputDir, baseName);
  const diskPath = path.join(outputDir, filename);

  const transformed = sharp(buffer, { failOnError: true }).rotate();
  const metadata = await transformed.metadata();
  await transformed.webp({ quality, effort: 6 }).toFile(diskPath);

  const publicPath = `/assets/images/${folder}/${filename}`;
  const stats = await fs.stat(diskPath);

  console.log(
    JSON.stringify(
      {
        ok: true,
        filename,
        publicPath,
        diskPath: path.relative(process.cwd(), diskPath).replace(/\\/g, "/"),
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        bytes: stats.size,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error));
  process.exitCode = 1;
});
