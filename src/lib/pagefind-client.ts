export type PagefindSearchResult = {
  url: string;
  title: string;
  excerpt: string;
};

declare global {
  interface Window {
    pagefind?: {
      search: (query: string) => Promise<{
        results: { data: () => Promise<{ url: string; meta: { title: string }; excerpt: string }> }[];
      }>;
    };
  }
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
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("pagefind script failed"));
    document.head.appendChild(script);
  });

export async function runPagefindSearch(query: string, limit = 6): Promise<PagefindSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const q = trimmed.toLowerCase();

  await loadPagefind();
  const search = await window.pagefind?.search(trimmed);
  const data = await Promise.all(
    (search?.results ?? []).slice(0, limit).map((result) => result.data())
  );

  return data
    .map((item) => ({
      url: item.url,
      title: item.meta?.title ?? "",
      excerpt: item.excerpt ?? "",
    }))
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const aExact = aTitle === q ? 3 : aTitle.includes(q) ? 2 : a.url.includes(`/glossary/${encodeURIComponent(trimmed)}`) ? 1 : 0;
      const bExact = bTitle === q ? 3 : bTitle.includes(q) ? 2 : b.url.includes(`/glossary/${encodeURIComponent(trimmed)}`) ? 1 : 0;
      return bExact - aExact;
    });
}
