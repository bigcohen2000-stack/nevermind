import { useCallback, useEffect, useRef, useState } from "react";
import { runPagefindSearch, type PagefindSearchResult } from "../lib/pagefind-client";
import { FloatingInput } from "./ui/FloatingInput";
import { glossaryConcepts } from "../data/glossary";

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

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

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSuggestions([]);
    setResults([]);
    setLoadError(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeModal]);

  const executeSearch = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setLoadError(false);
      return;
    }

    const myId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const next = await runPagefindSearch(trimmed, 8);
      if (myId !== requestIdRef.current) return;
      setResults(next);
    } catch {
      if (myId !== requestIdRef.current) return;
      setResults([]);
      setLoadError(true);
    } finally {
      if (myId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setResults([]);
      return;
    }

    const base = glossaryConcepts
      .map((item) => item.title.trim())
      .filter(Boolean)
      .filter((title) => title.includes(trimmed) || trimmed.includes(title))
      .slice(0, 6);
    setSuggestions(base);
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const timeout = window.setTimeout(() => {
      void executeSearch(trimmed);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div
      data-search-modal
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--nm-inverse)]/20 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      onClick={closeModal}
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
            onClick={closeModal}
            className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-3 py-1 text-[clamp(0.8rem,0.75rem+0.2vw,0.95rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
          >
            סגור
          </button>
        </div>

        <p className="mt-3 text-right text-[clamp(1rem,0.95rem+0.25vw,1.05rem)] font-semibold text-[var(--nm-fg)]">מה מעסיק אותך כרגע?</p>
        <p className="mt-1 text-right text-[clamp(0.85rem,0.82rem+0.2vw,1rem)] leading-6 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">
          כתוב מילה כמו אגו, בחירה או בהירות. לחץ Enter לחיפוש ממוקד.
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void executeSearch(query);
          }}
        >
          <FloatingInput
            ref={inputRef}
            id="nm-search-modal-query"
            label="מה מעסיק אותך כרגע"
            type="search"
            value={query}
            onChange={setQuery}
            hideValidation
            dir="rtl"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void executeSearch(query);
              }
            }}
            aria-label="מה מעסיק אותך כרגע? | חיפוש במרכז הידע של השם לא משנה"
          />
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--nm-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--nm-on-accent)] transition hover:bg-[var(--nm-accent-hover)]"
          >
            חפש
          </button>
        </form>

        {suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-end gap-2" aria-label="השלמות חיפוש">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  void executeSearch(item);
                }}
                className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--nm-accent)] transition hover:border-[color-mix(in_srgb,var(--nm-accent)_24%,transparent)]"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {isLoading && (
            <p className="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
              מחפשים מה מתאים...
            </p>
          )}

          {loadError && (
            <p className="rounded-2xl border border-[color-mix(in_srgb,var(--nm-accent)_24%,transparent)] bg-[var(--nm-tint)] px-4 py-3 text-right text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[var(--nm-fg)]">
              מנוע החיפוש לא נטען (לרוב אחרי בנייה מקומית). נסה שוב אחרי פרסום, או עבור ישירות לספרייה והגדרות.
            </p>
          )}

          {!isLoading && query && results.length === 0 && !loadError && (
            <div className="space-y-3">
              <p className="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                אולי השאלה היא לא איפה לחפש, אלא מה באמת מבקש להיראות.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <a
                  href="/articles/"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
                >
                  ארכיון מאמרים
                </a>
                <a
                  href="/library/"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
                >
                  ספרייה מובנית
                </a>
                <a
                  href="/glossary/ego/"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white"
                >
                  מה זה אגו?
                </a>
              </div>
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
