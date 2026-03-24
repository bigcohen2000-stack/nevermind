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

  await loadPagefind();
  const search = await window.pagefind?.search(trimmed);
  const data = await Promise.all(
    (search?.results ?? []).slice(0, limit).map((result) => result.data())
  );

  return data.map((item) => ({
    url: item.url,
    title: item.meta?.title ?? "",
    excerpt: item.excerpt ?? "",
  }));
}
