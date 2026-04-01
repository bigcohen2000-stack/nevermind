import { useState } from "react";
import type { DashboardContentHealthItem } from "../../lib/dashboard-data";

type Props = {
  items: DashboardContentHealthItem[];
};

type FilterMode = "all" | "critical" | "watch" | "ok";

function toneSurface(tone: DashboardContentHealthItem["tone"]): string {
  if (tone === "critical") return "border-[#D42B2B]/22 bg-[#D42B2B]/6";
  if (tone === "watch") return "border-black/10 bg-black/4";
  return "border-emerald-600/18 bg-emerald-600/6";
}

function toneText(tone: DashboardContentHealthItem["tone"]): string {
  if (tone === "critical") return "text-[#D42B2B]";
  if (tone === "watch") return "text-black/72";
  return "text-emerald-700";
}

export default function ContentHealthWidget({ items }: Props) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const filtered = items.filter((item) => filter === "all" || item.tone === filter);
  const totals = {
    all: items.length,
    critical: items.filter((item) => item.tone === "critical").length,
    watch: items.filter((item) => item.tone === "watch").length,
    ok: items.filter((item) => item.tone === "ok").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: `הכל ${totals.all}` },
          { key: "critical", label: `דורש טיפול ${totals.critical}` },
          { key: "watch", label: `במעקב ${totals.watch}` },
          { key: "ok", label: `תקין ${totals.ok}` },
        ].map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setFilter(entry.key as FilterMode)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === entry.key
                ? "border-[#D42B2B]/22 bg-[#D42B2B]/8 text-[#D42B2B]"
                : "border-black/8 bg-white text-black/62"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <a key={item.slug} href={item.href} className={`rounded-[24px] border px-4 py-4 transition hover:-translate-y-0.5 ${toneSurface(item.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 text-right">
                <p className="text-sm font-semibold text-[#1A1A1A]">{item.title}</p>
                <p className="text-sm leading-6 text-black/60">{item.reason}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneSurface(item.tone)} ${toneText(item.tone)}`}>
                {item.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-right">
              <div className="rounded-[18px] border border-black/8 bg-white/76 p-3">
                <p className="text-xs text-black/45">Bounce rate</p>
                <p className={`mt-1 text-xl font-semibold ${item.bounceRate > 70 ? "text-[#D42B2B]" : "text-[#1A1A1A]"}`}>
                  {item.bounceRate}%
                </p>
              </div>
              <div className="rounded-[18px] border border-black/8 bg-white/76 p-3">
                <p className="text-xs text-black/45">ימים מהעדכון</p>
                <p className={`mt-1 text-xl font-semibold ${item.daysSinceUpdate > 90 ? "text-[#D42B2B]" : "text-[#1A1A1A]"}`}>
                  {item.daysSinceUpdate}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs text-black/42">עודכן לאחרונה {item.updatedLabel}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
