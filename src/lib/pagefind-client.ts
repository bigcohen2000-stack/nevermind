import { localSiteSearch, mergeSearchResults } from "./local-site-search";

export type PagefindSearchResult = {
  url: string;
  title: string;
  excerpt: string;
};

declare global {
  interface Window {
    pagefind?: {
      options?: (opts: Record<string, unknown>) => Promise<void>;
      search: (query: string) => Promise<{
        results: { data: () => Promise<{ url: string; meta: { title: string }; excerpt: string }> }[];
      }>;
    };
  }
}

/** נתיב יחסי עם סלאש בסוף לעמודי HTML בסגנון האתר */
function normalizeResultUrl(url: string): string {
  if (!url || url.startsWith("#")) return url;
  let path = url;
  try {
    if (/^https?:\/\//i.test(url)) path = new URL(url).pathname;
  } catch {
    /* ignore */
  }
  if (!path.startsWith("/")) path = `/${path}`;
  const seg = path.split("/").filter(Boolean).pop() ?? "";
  if (!seg.includes(".") && !path.endsWith("/")) return `${path}/`;
  return path;
}

export const loadPagefind = () =>
  new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("pagefind: no window"));
      return;
    }
    if (window.pagefind) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/pagefind/pagefind.js";
    script.async = true;
    script.onload = () => {
      const waitUntil = async () => {
        for (let i = 0; i < 60; i += 1) {
          if (window.pagefind && typeof window.pagefind.search === "function") return;
          await new Promise((r) => window.setTimeout(r, 50));
        }
        throw new Error("pagefind API not ready");
      };
      void waitUntil().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("pagefind script failed"));
    document.head.appendChild(script);
  });

export async function runPagefindSearch(query: string, limit = 6): Promise<PagefindSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const q = trimmed.toLowerCase();

  const local = localSiteSearch(trimmed, limit);

  let remote: PagefindSearchResult[] = [];
  try {
    await loadPagefind();
    if (typeof window.pagefind?.options === "function") {
      try {
        await window.pagefind.options({ baseUrl: "/" });
      } catch {
        /* ignore */
      }
    }
    const search = await window.pagefind?.search(trimmed);
    const data = await Promise.all(
      (search?.results ?? []).slice(0, limit).map((result) => result.data())
    );

    remote = data.map((item) => ({
      url: normalizeResultUrl(item.url),
      title: item.meta?.title ?? "",
      excerpt: item.excerpt ?? "",
    }));
  } catch {
    return local.slice(0, limit);
  }

  const scored = remote.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    const aExact = aTitle === q ? 3 : aTitle.includes(q) ? 2 : a.url.includes("/glossary/") ? 1 : 0;
    const bExact = bTitle === q ? 3 : bTitle.includes(q) ? 2 : b.url.includes("/glossary/") ? 1 : 0;
    return bExact - aExact;
  });

  return mergeSearchResults(local, scored, limit);
}
