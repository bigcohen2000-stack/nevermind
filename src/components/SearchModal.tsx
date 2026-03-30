import { useCallback, useEffect, useRef, useState } from "react";
import { glossaryConcepts } from "../data/glossary";
import { runPagefindSearch, type PagefindSearchResult } from "../lib/pagefind-client.js";
import { FloatingInput } from "./ui/FloatingInput";

const EMPTY_MESSAGE = "לא מצאנו את מה שחיפשת, אולי ננסה לשאול את ההפך?";
const LOADING_MESSAGE = "מזקק את המנגנון...";
const MODAL_ANIMATION_MS = 220;

type ModalState = "closed" | "opening" | "open" | "closing";

export default function SearchModal() {
  const [modalState, setModalState] = useState<ModalState>("closed");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PagefindSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const requestIdRef = useRef(0);
  const openFrameRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const isMounted = modalState !== "closed";
  const isPresented = modalState === "opening" || modalState === "open";

  const clearMotionTimers = useCallback(() => {
    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = null;
    }
    if (focusFrameRef.current !== null) {
      window.cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  }, []);

  const resetModal = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setLoadError(false);
    setIsLoading(false);
  }, []);

  const openModal = useCallback(() => {
    clearMotionTimers();
    setModalState((current) => {
      if (current === "open" || current === "opening") {
        return current;
      }
      return "opening";
    });
  }, [clearMotionTimers]);

  const closeModal = useCallback(() => {
    clearMotionTimers();
    setModalState((current) => {
      if (current === "closed" || current === "closing") {
        return current;
      }
      return "closing";
    });
  }, [clearMotionTimers]);

  useEffect(() => {
    const onOpen = () => {
      window.__nmHapticLight?.();
      openModal();
    };
    window.addEventListener("open-search", onOpen as EventListener);

    return () => {
      window.removeEventListener("open-search", onOpen as EventListener);
    };
  }, [openModal]);

  useEffect(() => {
    if (!isMounted) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMounted]);

  useEffect(() => {
    if (modalState !== "opening") return;

    openFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = window.requestAnimationFrame(() => {
        const input = inputRef.current;
        if (input) {
          input.focus({ preventScroll: true });
          if (input instanceof HTMLInputElement) {
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
        setModalState("open");
      });
    });

    return () => {
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
        openFrameRef.current = null;
      }
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [modalState]);

  useEffect(() => {
    if (modalState !== "open") return;

    settleTimerRef.current = window.setTimeout(() => {
      try {
        if (document.hasFocus() && navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch {
        /* ignore */
      }
    }, MODAL_ANIMATION_MS);

    return () => {
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
  }, [modalState]);

  useEffect(() => {
    if (modalState !== "closing") return;

    closeTimerRef.current = window.setTimeout(() => {
      resetModal();
      setModalState("closed");
    }, MODAL_ANIMATION_MS);

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [modalState, resetModal]);

  useEffect(() => {
    if (!isMounted) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMounted, closeModal]);

  useEffect(() => {
    return () => {
      clearMotionTimers();
    };
  }, [clearMotionTimers]);

  const executeSearch = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      requestIdRef.current += 1;
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
  }, []);

  const initiateSearch = useCallback(
    async (raw: string) => {
      window.__nmHapticLight?.();
      await executeSearch(raw);
    },
    [executeSearch]
  );

  useEffect(() => {
    if (!isMounted) return;
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
  }, [isMounted, query]);

  useEffect(() => {
    if (!isMounted) return;
    const trimmed = query.trim();
    if (!trimmed) return;
    const timeout = window.setTimeout(() => {
      void executeSearch(trimmed);
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [isMounted, query, executeSearch]);

  if (!isMounted) return null;

  return (
    <div
      data-search-modal
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-[var(--nm-inverse)]/20 backdrop-blur-sm transition-opacity duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
        isPresented ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      onClick={closeModal}
    >
      <div
        className={`w-[min(720px,92vw)] rounded-3xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-bg-canvas)] p-6 shadow-sm will-change-[opacity,transform] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
          isPresented ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
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
            className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 px-3 py-1 text-[clamp(0.8rem,0.75rem+0.2vw,0.95rem)] text-[color-mix(in_srgb,var(--nm-fg)_70%,var(--nm-bg))] transition-colors duration-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]"
          >
            סגור
          </button>
        </div>

        <p className="mt-3 text-right text-[clamp(1rem,0.95rem+0.25vw,1.05rem)] font-semibold text-[var(--nm-fg)]">
          מה מעסיק אותך כרגע?
        </p>
        <p className="mt-1 text-right text-[clamp(0.85rem,0.82rem+0.2vw,1rem)] leading-6 text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">
          כתוב מילה אחת, או מנגנון אחד, ונבדוק מה כבר פתוח עליו בארכיון.
        </p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void initiateSearch(query);
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
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void initiateSearch(query);
              }
            }}
            aria-label="מה מעסיק אותך כרגע | חיפוש במרכז הידע של NeverMind"
          />
          <button
            type="submit"
            data-nm-loading={isLoading ? "true" : undefined}
            data-nm-loading-label={LOADING_MESSAGE}
            className="relative inline-flex min-h-[48px] items-center justify-center rounded-full bg-[var(--nm-accent)] px-6 py-3 text-xl font-bold text-[var(--nm-on-accent)] transition hover:bg-[var(--nm-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-inverse)]"
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
                  void initiateSearch(item);
                }}
                className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--nm-accent)] transition hover:border-[color-mix(in_srgb,var(--nm-accent)_24%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {isLoading && (
            <div className="nm-feedback-loading space-y-3 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-surface-muted)_55%,white)] p-4 text-right">
              <p className="text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] font-medium text-[var(--nm-fg)]">{LOADING_MESSAGE}</p>
              <span className="nm-skeleton-line nm-skeleton-line--88 block rounded-lg" aria-hidden="true"></span>
              <span className="nm-skeleton-line nm-skeleton-line--60 block rounded-lg" aria-hidden="true"></span>
            </div>
          )}

          {loadError && (
            <p className="rounded-2xl border border-[color-mix(in_srgb,var(--nm-accent)_24%,transparent)] bg-[var(--nm-tint)] px-4 py-3 text-right text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[var(--nm-fg)]">
              מנוע החיפוש לא נטען כרגע. אפשר לנסות שוב בעוד רגע, או להיכנס ישר למאמרים ולמונחים.
            </p>
          )}

          {!isLoading && query.trim() && results.length === 0 && !loadError && (
            <div className="space-y-4 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-[color-mix(in_srgb,var(--nm-surface-muted)_55%,white)] p-4">
              <p className="text-right text-[clamp(0.95rem,0.9rem+0.2vw,1.05rem)] font-medium text-[var(--nm-fg)]">
                {EMPTY_MESSAGE}
              </p>
              <p className="text-right text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">
                אפשר לקחת כיוון אחר, או לבחור אחד המסלולים שכבר פתוחים כאן.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <a
                  href="/articles/hidden-assumptions-mechanics/"
                  data-nm-loading-label="בודק את שורש הרצון..."
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]"
                >
                  הנחה סמויה
                </a>
                <a
                  href="/articles/why-bad-things-happen/"
                  data-nm-loading-label="בודק את שורש הרצון..."
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]"
                >
                  למה דברים רעים קורים
                </a>
                <a
                  href="/articles/"
                  data-nm-loading-label="בודק את שורש הרצון..."
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/90 px-4 py-2 text-[clamp(0.85rem,0.8rem+0.2vw,1rem)] text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]"
                >
                  כל המאמרים
                </a>
              </div>
            </div>
          )}

          <ul className="space-y-3">
            {results.map((result) => (
              <li key={result.url}>
                <a
                  href={result.url}
                  data-nm-loading-label="בודק את שורש הרצון..."
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
