const BLOCKED_EXACT_PATHS = new Set(["/404", "/premium-access"]);
const BLOCKED_PREFIXES = ["/admin", "/dashboard", "/api", "/me", "/club", "/search"] as const;

function normalizePathname(pathname: string): string {
  const raw = String(pathname || "").trim();
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function isPathIndexable(pathname: string, allowIndexing: boolean): boolean {
  if (!allowIndexing) return false;
  const normalized = normalizePathname(pathname);
  if (BLOCKED_EXACT_PATHS.has(normalized)) return false;
  return !BLOCKED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}

export function pathToRobotsContent(pathname: string, allowIndexing: boolean): "index, follow" | "noindex, nofollow" {
  return isPathIndexable(pathname, allowIndexing) ? "index, follow" : "noindex, nofollow";
}

