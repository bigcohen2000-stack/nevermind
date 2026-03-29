import { useEffect, useState } from "react";
import appConfig from "../config/appConfig.json";

type Detail = {
  serviceId?: string;
  formatted?: string;
  price?: number;
  title?: string;
};

const PRICING_HREF = "/services/#pricing";
/** כרטיס מנוי ארכיון ב־services.json — id: portal-access */
const ARCHIVE_SERVICE_HREF = "/services/#portal-access";

const linkClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_14%,transparent)] bg-[color-mix(in_srgb,var(--nm-bg-canvas)_92%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--nm-fg)] transition-colors hover:border-[color-mix(in_srgb,var(--nm-accent)_28%,transparent)] hover:text-[var(--nm-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nm-accent)]";

export default function ServicesPricingStickyBar() {
  const [detail, setDetail] = useState<Detail | null>(null);

  useEffect(() => {
    const onPrice = (e: Event) => {
      const ce = e as CustomEvent<Detail>;
      if (ce.detail && typeof ce.detail.formatted === "string") {
        setDetail(ce.detail);
      }
    };
    window.addEventListener("nm-service-price", onPrice as EventListener);
    return () => window.removeEventListener("nm-service-price", onPrice as EventListener);
  }, []);

  const wa = String((appConfig as { contact?: { whatsAppNumber?: string } }).contact?.whatsAppNumber ?? "").replace(
    /\D/g,
    "",
  );
  const waHref =
    wa && detail?.title
      ? `https://wa.me/${wa}?text=${encodeURIComponent(`שלום, אשמח לקבוע פגישה במקום בנוגע ל: ${detail.title}`)}`
      : wa
        ? `https://wa.me/${wa}?text=${encodeURIComponent("שלום, אשמח לקבוע פגישה במקום")}`
        : "/contact/";

  return (
    <>
      <div
        className="sticky top-[calc(var(--nm-staging-banner-height,0px)+5.5rem)] z-30 -mx-4 mb-6 hidden border-b border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[color-mix(in_srgb,var(--nm-bg-canvas)_96%,transparent)] px-4 py-3 text-right backdrop-blur-sm sm:-mx-0 sm:mx-0 md:block"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">מחיר נוכחי (בחירה אחרונה)</p>
            <p className="text-lg font-semibold text-[var(--nm-fg)]">{detail?.formatted ?? "בחרו הרחבה במחירון למטה"}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href={PRICING_HREF} data-astro-prefetch className={linkClass}>
              מחירון מלא
            </a>
            <a href={ARCHIVE_SERVICE_HREF} data-astro-prefetch className={linkClass}>
              מנוי ארכיון
            </a>
          </div>
        </div>
        <p className="mt-2 text-[0.65rem] leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_48%,var(--nm-bg))]">
          חודש · רבעון · שנה · שנתיים: הפרטים בכרטיס &quot;מנוי ארכיון NeverMind&quot; למטה.
        </p>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-[var(--nm-bg-canvas)]/95 px-4 py-3 shadow-[0_-8px_32px_rgba(26,26,26,0.12)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-[#1a1a1a]">
              <span className="block text-xs font-normal text-[color-mix(in_srgb,var(--nm-fg)_50%,var(--nm-bg))]">מחיר</span>
              <span className="truncate">{detail?.formatted ?? "בחרו אופציה"}</span>
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[var(--nm-inverse)] px-4 py-2.5 text-sm font-semibold text-[var(--nm-inverse-fg)]"
            >
              פגישה במקום
            </a>
          </div>
          <div className="flex flex-wrap items-stretch justify-end gap-2 border-t border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] pt-3">
            <a href={PRICING_HREF} data-astro-prefetch className={`${linkClass} flex-1 sm:flex-none`}>
              מחירון מלא
            </a>
            <a href={ARCHIVE_SERVICE_HREF} data-astro-prefetch className={`${linkClass} flex-1 sm:flex-none`}>
              להצטרף לארכיון
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
