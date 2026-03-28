import { useMemo, useState } from "react";
import type { FlatService, ServiceExtension } from "../lib/services";
import {
  buildServiceActionWhatsAppHref,
  buildServicePreStartWhatsAppHref,
  buildServiceReservationWhatsAppHref,
  formatMoney,
  getNetPrice,
  getVatAmount,
  mergeServiceWithExtension,
  resolveServiceAction,
} from "../lib/services";

type Props = {
  serviceJson: string;
  /** full = כמו ServiceCard (מע״מ מפורט). compact = שורת מחיר קצרה */
  layout?: "full" | "compact";
};

export default function ServicePricingBlock({ serviceJson, layout = "full" }: Props) {
  const service = useMemo(() => JSON.parse(serviceJson) as FlatService, [serviceJson]);
  const extensions = (service.extensions ?? []) as ServiceExtension[];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedExt = useMemo(
    () => extensions.find((e) => e.id === selectedId) ?? null,
    [extensions, selectedId],
  );

  const merged = useMemo(
    () => mergeServiceWithExtension(service, selectedExt),
    [service, selectedExt],
  );

  const baseAction = useMemo(() => resolveServiceAction(service), [service]);

  const primaryHref = selectedExt
    ? buildServiceReservationWhatsAppHref(service, selectedExt)
    : baseAction.href;
  const primaryExternal = selectedExt ? true : baseAction.external;
  const primaryLabel = useMemo(() => {
    if (selectedExt && service.override_on_extension === true) {
      return selectedExt.action_text;
    }
    return baseAction.label;
  }, [selectedExt, service.override_on_extension, baseAction.label]);

  const actionWhatsAppHref = buildServiceActionWhatsAppHref(service, selectedExt);
  const preStartHref = buildServicePreStartWhatsAppHref(service.title);
  const reservationHref = buildServiceReservationWhatsAppHref(service, selectedExt);

  const netPrice = getNetPrice(merged.price_full, 18);
  const vatAmount = getVatAmount(merged.price_full, 18);

  if (!extensions.length) {
    return null;
  }

  const isCompact = layout === "compact";

  return (
    <div className="space-y-4" dir="rtl" data-nm-service-extensions={service.id}>
      <fieldset className="space-y-2 rounded-[1.25rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)]/50 p-4 text-right">
        <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--nm-accent)]">
          בחירת אופציה
        </legend>
        <p className="text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">
          ברירת מחדל: מחיר בסיס וכפתור התשלום המקורי. בוחרים הרחבה המחיר והכיתוב מתעדכנים, וההודעה לוואטסאפ כוללת את האופציה.
        </p>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-transparent bg-white/70 px-3 py-2 transition hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] has-[:checked]:border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]">
            <input
              type="radio"
              className="mt-1"
              name={`nm-ext-${service.id}`}
              checked={selectedId === null}
              onChange={() => setSelectedId(null)}
            />
            <span className="text-sm text-[var(--nm-fg)]">
              <span className="font-semibold">בסיס</span>
              <span className="text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                {" "}
                ({formatMoney(service.price_full)})
              </span>
            </span>
          </label>
          {extensions.map((ext) => (
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
              />
              <span className="min-w-0 flex-1 text-sm text-[var(--nm-fg)]">
                <span className="font-semibold">{ext.label}</span>
                <span className="text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">
                  {" "}
                  (
                  {ext.price_additive === true
                    ? `${formatMoney(service.price_full + ext.price)} (בסיס + ${ext.price.toLocaleString("he-IL")} ${"\u20AA"})`
                    : formatMoney(ext.price)}
                  )
                </span>
                {ext.description ? (
                  <span className="mt-1 block text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                    {ext.description}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {isCompact ? (
        <p className="text-sm font-semibold text-[var(--nm-fg)]">
          מחיר נבחר: <span data-nm-live-price="">{formatMoney(merged.price_full)}</span>
        </p>
      ) : (
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--nm-accent)]">כולל מע״מ</p>
          <p className="mt-2 text-4xl font-semibold text-[var(--nm-fg)]" data-nm-live-price="">
            {formatMoney(merged.price_full)}
          </p>
          <p className="mt-2 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_64%,var(--nm-bg))]">
            {formatMoney(netPrice)} לפני מע״מ + {formatMoney(vatAmount)} מע״מ
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-start sm:gap-2">
        <a
          href={primaryHref}
          {...(primaryExternal ? { target: "_blank", rel: "noreferrer" } : {})}
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[var(--nm-accent)] px-5 py-3 text-sm font-semibold text-[var(--nm-on-accent)] transition-colors duration-200 hover:bg-[var(--nm-accent-hover)]"
          data-nm-primary-cta=""
        >
          {primaryLabel}
        </a>
        <a
          href={actionWhatsAppHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[var(--nm-fg)] bg-transparent px-5 py-3 text-sm font-medium text-[var(--nm-fg)] transition-colors duration-200 hover:bg-[var(--nm-surface-muted)]"
        >
          הודעת פתיחה עם מחיר
        </a>
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
    </div>
  );
}
