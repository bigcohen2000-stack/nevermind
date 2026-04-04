import fs from "node:fs";
import path from "node:path";

const UPLOAD_EXTS = [".webp", ".jpg", ".jpeg", ".png"] as const;
const DEFAULT_LOGO = "/images/logo.svg";

/**
 * אם אין תמונה מפורשת, מחפש קודם ב־public/assets/images/articles ואז ב־public/uploads לפי slug.
 */
export function resolveArticleHeroImage(articleSlug: string, configuredImage: string | undefined): string {
  const trimmed = typeof configuredImage === "string" ? configuredImage.trim() : "";
  if (trimmed && trimmed !== DEFAULT_LOGO) return trimmed;

  const assetsDir = path.join(process.cwd(), "public", "assets", "images", "articles");
  for (const ext of UPLOAD_EXTS) {
    const fp = path.join(assetsDir, `${articleSlug}${ext}`);
    if (fs.existsSync(fp)) {
      return `/assets/images/articles/${articleSlug}${ext}`;
    }
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const base = path.join(uploadsDir, articleSlug);
  for (const ext of UPLOAD_EXTS) {
    const fp = base + ext;
    if (fs.existsSync(fp)) {
      return `/uploads/${articleSlug}${ext}`;
    }
  }

  return trimmed || DEFAULT_LOGO;
}
