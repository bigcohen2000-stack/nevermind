import { useEffect, useRef, useState } from "react";

type SearchResult = {
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

const loadPagefind = () =>
  new Promise<void>((resolve, reject) => {
    if (window.pagefind) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "/pagefind/pagefind.js";
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener("open-search", onOpen as EventListener);

    return () => {
      window.removeEventListener("open-search", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => inputRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      try {
        setIsLoading(true);
        await loadPagefind();
        const search = await window.pagefind?.search(query);
        const data = await Promise.all(
          (search?.results ?? []).slice(0, 6).map((result) => result.data())
        );

        if (!cancelled) {
          setResults(
            data.map((item) => ({
              url: item.url,
              title: item.meta?.title ?? "",
              excerpt: item.excerpt ?? "",
            }))
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      cancelled = true;
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div
      data-search-modal
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--nm-inverse)]/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-[min(720px,92vw)] rounded-3xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-bg-canvas)] p-6 shadow-sm"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="search-title"
            className="text-[clamp(1.2rem,1.05rem+0.6vw,1.6rem)] font-semibold text-[var(--nm-fg)]"
          >
            מרכז הידע של NeverMind
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-3 py-1 text-[clamp(0.8rem,0.75rem+0.2vw,0.95rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
          >
            סגור
          </button>
        </div>

        <p className="mt-3 text-right text-[clamp(1rem,0.95rem+0.25vw,1.05rem)] font-semibold text-[var(--nm-fg)]">מה מעסיק אותך כרגע?</p>
        <p className="mt-1 text-right text-[clamp(0.85rem,0.82rem+0.2vw,1rem)] leading-6 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">
          נסה לחפש: בהירות, פרדוקס, או איך פותרים בעיית שורש.
        </p>

        <div className="mt-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="מה מעסיק אותך כרגע?"
            className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/80 px-4 py-3 text-right text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] text-[var(--nm-fg)] outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--nm-fg)_22%,transparent)]"
            dir="rtl"
            aria-label="מה מעסיק אותך כרגע? — חיפוש במרכז הידע של NeverMind"
          />
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && (
            <p className="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
              מחפשים מה מתאים…
            </p>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="space-y-3">
              <p className="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                אולי השאלה היא לא איפה לחפש, אלא מה באמת מבקש להיראות.
              </p>
              <a
                href="/articles"
                className="inline-flex items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
              >
                להתחיל לחקור
              </a>
            </div>
          )}

          <ul className="space-y-3">
            {results.map((result) => (
              <li key={result.url}>
                <a
                  href={result.url}
                  className="block rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-3 transition-colors duration-300 hover:bg-white"
                >
                  <p className="text-[clamp(0.95rem,0.9rem+0.25vw,1.1rem)] font-semibold text-[var(--nm-fg)]">
                    {result.title}
                  </p>
                  <p
                    className="mt-1 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]"
                    dangerouslySetInnerHTML={{ __html: result.excerpt }}
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
