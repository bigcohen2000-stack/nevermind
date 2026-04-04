import { useEffect, useMemo, useRef, useState } from "react";
import type { FlatService, ServiceExtension } from "../lib/services";
import {
  buildServiceDisplayActionLabel,
  buildServicePreStartWhatsAppHref,
  buildServiceReservationWhatsAppHref,
  formatMoney,
  getBoutiqueReferenceListPrice,
  getNetPrice,
  getVatAmount,
  mergeServiceWithExtension,
  resolveServiceAction,
} from "../lib/services";
import ServiceProposalWhatsAppCta from "./ServiceProposalWhatsAppCta";

function usePriceTicker(target: number, durationMs = 380) {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    const start = displayRef.current;
    if (start === target) return;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - (1 - p) ** 2;
      const next = Math.round(start + (target - start) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (p < 1) frame = requestAnimationFrame(tick);
      else displayRef.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return display;
}

type Props = {
  serviceJson: string;
  /** full = כמו ServiceCard (מע"מ מפורט). compact = שורת מחיר קצרה */
  layout?: "full" | "compact";
};

export default function ServicePricingBlock({ serviceJson, layout = "full" }: Props) {
  const service = useMemo(() => JSON.parse(serviceJson) as FlatService, [serviceJson]);
  const extensions = (service.extensions ?? []) as ServiceExtension[];
  const extensionsGated = Boolean(service.extensions_gated);

  const [selectedId, setSelectedId] = useState<string | null | undefined>(() =>
    extensionsGated ? undefined : null,
  );

  const selectedExt = useMemo(() => {
    if (extensionsGated) {
      if (typeof selectedId !== "string") return null;
      return extensions.find((e) => e.id === selectedId) ?? null;
    }
    if (selectedId === null) return null;
    return extensions.find((e) => e.id === selectedId) ?? null;
  }, [extensions, extensionsGated, selectedId]);

  const merged = useMemo(() => mergeServiceWithExtension(service, selectedExt), [service, selectedExt]);
  const tickered = usePriceTicker(merged.price_full);
  const boutiqueRef = getBoutiqueReferenceListPrice(merged.price_full);

  const baseAction = useMemo(() => resolveServiceAction(service), [service]);

  const showPricingAndActions = !extensionsGated || typeof selectedId === "string";

  useEffect(() => {
    if (!showPricingAndActions) return;
    window.dispatchEvent(
      new CustomEvent("nm-service-price", {
        detail: {
          serviceId: service.id,
          price: merged.price_full,
          formatted: formatMoney(merged.price_full),
          title: service.title,
        },
      }),
    );
  }, [merged.price_full, service.id, service.title, showPricingAndActions]);

  const primaryHref = showPricingAndActions
    ? selectedExt
      ? buildServiceReservationWhatsAppHref(service, selectedExt)
      : baseAction.href
    : "#";
  const primaryExternal = showPricingAndActions ? (selectedExt ? true : baseAction.external) : false;
  const primaryLabel = useMemo(
    () =>
      showPricingAndActions
        ? buildServiceDisplayActionLabel(service, selectedExt)
        : buildServiceDisplayActionLabel(service),
    [showPricingAndActions, service, selectedExt]
  );

  const preStartHref = buildServicePreStartWhatsAppHref(service.title);
  const reservationHref = showPricingAndActions
    ? buildServiceReservationWhatsAppHref(service, selectedExt)
    : "#";

  const netPrice = getNetPrice(merged.price_full, 18);
  const vatAmount = getVatAmount(merged.price_full, 18);

  if (!extensions.length) {
    return null;
  }

  const isCompact = layout === "compact";
  const currentStep = showPricingAndActions ? 2 : 1;

  return (
    <div className="space-y-4" dir="rtl" data-nm-service-extensions={service.id}>
      {extensionsGated ? (
        <div
          className="rounded-[1.25rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-bg-canvas)]/80 p-4"
          aria-live="polite"
        >
          <div className="mb-3 flex gap-1.5" role="presentation">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                currentStep >= 1 ? "bg-[var(--nm-accent)]" : "bg-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)]"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                currentStep >= 2 ? "bg-[var(--nm-accent)]" : "bg-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)]"
              }`}
            />
          </div>
          <p className="text-xs font-semibold text-[var(--nm-fg)]">
            שלב {currentStep} מתוך 2
            {currentStep === 1 ? " · בחרו מה מתאים" : " · מחיר ופעולות"}
          </p>
        </div>
      ) : null}

      <fieldset className="space-y-2 rounded-[1.25rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)]/50 p-4 text-right">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-accent)]">
          {extensionsGated ? "מה נוח לכם עכשיו" : "בחירת אופציה"}
        </legend>
        <p className="text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">
          {extensionsGated
            ? "סמנו אפשרות אחת. אחרי הבחירה ניפתחו המחיר המדויק והכפתורים."
            : "ברירת מחדל: מחיר בסיס וכפתור התשלום המקורי. בוחרים הרחבה המחיר והכיתוב מתעדכנים, וההודעה לוואטסאפ כוללת את האופציה."}
        </p>
        <div className="flex flex-col gap-2">
          {!extensionsGated ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent bg-white/70 px-3 py-2 transition hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] has-[:checked]:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]">
              <input
                type="radio"
                className="mt-1"
                name={`nm-ext-${service.id}`}
                checked={selectedId === null}
                onChange={() => setSelectedId(null)}
                aria-label={`בסיס, מחיר ${formatMoney(service.price_full)}`}
              />
              <span className="text-sm text-[var(--nm-fg)]">
                <span className="font-semibold">בסיס</span>
                <span className="text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                  {" "}
                  ({formatMoney(service.price_full)})
                </span>
                {service.price_note?.trim() || service.subtitle?.trim() ? (
                  <span className="mt-1 block text-xs font-normal leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                    {service.price_note?.trim() || service.subtitle?.trim()}
                  </span>
                ) : null}
              </span>
            </label>
          ) : null}
          {extensions.map((ext) => {
            const extGross =
              ext.price_additive === true
                ? ext.price === 0
                  ? service.price_full
                  : service.price_full + ext.price
                : ext.price;
            const extAria = `${ext.label}, מחיר ${formatMoney(extGross)}`;
            return (
            <label
              key={ext.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent bg-white/70 px-3 py-2 transition hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] has-[:checked]:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]"
            >
              <input
                type="radio"
                className="mt-1"
                name={`nm-ext-${service.id}`}
                checked={selectedId === ext.id}
                onChange={() => setSelectedId(ext.id)}
                aria-label={extAria}
                aria-describedby={ext.description ? `nm-ext-desc-${service.id}-${ext.id}` : undefined}
              />
              <span className="min-w-0 flex-1 text-sm text-[var(--nm-fg)]">
                <span className="font-semibold">{ext.label}</span>
                <span className="text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                  {" "}
                  (
                  {ext.price_additive === true
                    ? ext.price === 0
                      ? `${formatMoney(service.price_full)} (פרטים ומחיר סופי בוואטסאפ)`
                      : `${formatMoney(service.price_full + ext.price)} (בסיס + ${ext.price.toLocaleString("he-IL")} ${"\u20AA"})`
                    : formatMoney(ext.price)}
                  )
                </span>
                {ext.description ? (
                  <span id={`nm-ext-desc-${service.id}-${ext.id}`} className="mt-1 block text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                    {ext.description}
                  </span>
                ) : null}
              </span>
            </label>
            );
          })}
        </div>
      </fieldset>

      {showPricingAndActions ? (
        <>
          {isCompact ? (
            <p className="text-sm font-semibold text-[var(--nm-fg)]">
              מחיר נבחר:{" "}
              <span data-nm-live-price="" className="tabular-nums">
                {formatMoney(tickered)}
              </span>
            </p>
          ) : (
            <div className="text-right">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--nm-accent)]">כולל מע"מ</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-[var(--nm-fg)]" data-nm-live-price="">
                {formatMoney(tickered)}
              </p>
              {boutiqueRef != null && boutiqueRef > merged.price_full ? (
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--nm-fg)_52%,var(--nm-bg))]">
                  <span className="line-through decoration-[color-mix(in_srgb,var(--nm-fg)_35%,transparent)]">
                    {formatMoney(boutiqueRef)}
                  </span>
                  <span className="ms-2">ייחוס לפני ערך בוטיק</span>
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]">
                {formatMoney(netPrice)} לפני מע"מ + {formatMoney(vatAmount)} מע"מ
              </p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">המחיר, הכפתורים והודעת הוואטסאפ נבנים מאותה בחירה, כדי שלא יופיעו פערים בדרך.</p>
          <div className="flex flex-col gap-2 overflow-hidden rounded-[1.25rem] sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-start sm:gap-2">
            <a
              href={primaryHref}
              {...(primaryExternal ? { target: "_blank", rel: "noreferrer" } : {})}
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[var(--nm-accent)] px-5 py-3 text-sm font-semibold text-[var(--nm-on-accent)] transition-colors duration-200 hover:bg-[var(--nm-accent-hover)]"
              data-nm-primary-cta=""
            >
              {primaryLabel}
            </a>
            <div className="basis-full w-full min-w-0">
              <ServiceProposalWhatsAppCta
                serviceJson={serviceJson}
                selectedExtensionJson={selectedExt ? JSON.stringify(selectedExt) : null}
              />
            </div>
            <a
              href={preStartHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_14%,transparent)] bg-[var(--nm-bg-canvas)] px-5 py-3 text-sm font-semibold text-[var(--nm-fg)] transition hover:bg-[var(--nm-tint)]"
            >
              שאלה לפני שמתחילים?
            </a>
            <a
              href={reservationHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_14%,transparent)] px-5 py-3 text-sm font-semibold text-[var(--nm-fg)] transition hover:bg-[var(--nm-tint)]"
            >
              שיריון מקום (פרטים מלאים)
            </a>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--nm-fg)_16%,transparent)] bg-white/50 px-4 py-3 text-center text-sm text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">
          בחרו אפשרות למעלה כדי לראות מחיר וכפתורי המשך.
        </p>
      )}
    </div>
  );
}

