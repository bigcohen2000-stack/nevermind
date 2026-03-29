import fs from "node:fs";
import path from "node:path";

const UPLOAD_EXTS = [".jpg", ".jpeg", ".webp", ".png"] as const;
const DEFAULT_LOGO = "/images/logo.svg";

/**
 * אם אין תמונה מפורשת (או לוגו), מחפש ב־public/uploads לפי slug.
 */
export function resolveArticleHeroImage(articleSlug: string, configuredImage: string | undefined): string {
  const trimmed = typeof configuredImage === "string" ? configuredImage.trim() : "";
  if (trimmed && trimmed !== DEFAULT_LOGO) return trimmed;

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
