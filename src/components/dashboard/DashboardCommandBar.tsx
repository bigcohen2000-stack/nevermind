import { useDeferredValue, useEffect, useRef, useState } from "react";
import type { DashboardSearchItem } from "../../lib/dashboard-data";

type Props = {
  index: DashboardSearchItem[];
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function searchItems(items: DashboardSearchItem[], query: string): DashboardSearchItem[] {
  const normalized = normalize(query);
  if (!normalized) return items.slice(0, 8);

  return [...items]
    .map((item) => {
      const haystack = normalize(
        [item.label, item.description, item.group, item.meta || "", ...item.keywords].join(" "),
      );
      const matchIndex = haystack.indexOf(normalized);
      return {
        item,
        score:
          matchIndex === 0
            ? 4
            : item.label.toLowerCase().includes(normalized)
              ? 3
              : item.description.toLowerCase().includes(normalized)
                ? 2
                : haystack.includes(normalized)
                  ? 1
                  : 0,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)
    .map((entry) => entry.item);
}

function toneClass(tone?: DashboardSearchItem["tone"]): string {
  if (tone === "critical") return "border-[#D42B2B]/25 bg-[#D42B2B]/8 text-[#D42B2B]";
  if (tone === "watch") return "border-black/10 bg-black/5 text-black/70";
  return "border-emerald-600/20 bg-emerald-600/8 text-emerald-700";
}

export default function DashboardCommandBar({ index }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);
  const results = searchItems(index, deferredQuery);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressedShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (pressedShortcut) {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <div className="sticky top-20 z-40 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex min-h-[56px] w-full items-center justify-between rounded-[24px] border border-black/8 bg-white/82 px-4 text-right shadow-[0_12px_40px_rgba(26,26,26,0.05)] backdrop-blur-sm transition hover:border-[#D42B2B]/30"
          aria-label="פתיחת חיפוש מהיר"
        >
          <span className="text-sm text-black/52">חפש מאמרים, חברים, flags והגדרות</span>
          <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-semibold text-black/48">
            Cmd K
          </span>
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-[#1A1A1A]/18 px-4 py-16 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-command-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="mx-auto max-w-3xl rounded-[32px] border border-black/8 bg-[#FAFAF8] p-4 shadow-[0_30px_90px_rgba(26,26,26,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-[24px] border border-black/8 bg-white px-4">
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="חיפוש מיידי"
                className="h-14 w-full bg-transparent text-base text-[#1A1A1A] outline-none placeholder:text-black/38"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-black/8 px-3 py-1 text-xs font-semibold text-black/52"
              >
                סגור
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/45">
              <span className="rounded-full border border-black/8 bg-white px-3 py-1">מאמרים</span>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1">ניהול גישה</span>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1">מדדים ובקרה</span>
              <span className="rounded-full border border-black/8 bg-white px-3 py-1">הגדרות מערכת</span>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-auto pr-1">
              {results.length > 0 ? (
                results.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="block rounded-[24px] border border-black/8 bg-white px-4 py-3 transition hover:border-[#D42B2B]/28"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 text-right">
                        <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                        <p className="text-sm leading-6 text-black/62">{item.description}</p>
                        {item.meta ? <p className="text-xs text-black/45">{item.meta}</p> : null}
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${toneClass(item.tone)}`}>
                        {item.group}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="rounded-[24px] border border-black/8 bg-white px-4 py-5 text-sm text-black/58">
                  אין התאמה כרגע. נסה כותרת מאמר, IP, Access או SSL.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
