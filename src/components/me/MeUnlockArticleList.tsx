import { useMemo, useState } from "react";

export type UnlockArticleRow = {
  slug: string;
  title: string;
  pubDate: string;
  updatedDate?: string;
  tags: string[];
  difficultyLevel?: "beginner" | "advanced" | "deep";
};

type Props = {
  articles: UnlockArticleRow[];
  buildTimeMs: number;
};

const DAY_MS = 86400000;
const NEW_DAYS = 7;

function sortDate(a: UnlockArticleRow): number {
  const u = a.updatedDate ? Date.parse(a.updatedDate) : NaN;
  const p = Date.parse(a.pubDate);
  return Math.max(Number.isFinite(u) ? u : 0, Number.isFinite(p) ? p : 0);
}

function levelLabel(d?: UnlockArticleRow["difficultyLevel"]): string {
  if (d === "beginner") return "מתחיל";
  if (d === "advanced") return "בינוני";
  if (d === "deep") return "מתקדם";
  return "ללא רמה";
}

export default function MeUnlockArticleList({ articles, buildTimeMs }: Props) {
  const [topic, setTopic] = useState("");
  const [tag, setTag] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "30" | "90" | "365">("all");

  const allTags = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => s.add(t)));
    return [...s].sort((a, b) => a.localeCompare(b, "he"));
  }, [articles]);

  const filtered = useMemo(() => {
    const now = buildTimeMs;
    const rows = articles.filter((a) => {
      const t = topic.trim();
      if (t && !a.tags.some((x) => x.includes(t))) return false;
      const tg = tag.trim();
      if (tg && !a.tags.includes(tg)) return false;
      if (datePreset !== "all") {
        const days = datePreset === "30" ? 30 : datePreset === "90" ? 90 : 365;
        const cutoff = now - days * DAY_MS;
        if (sortDate(a) < cutoff) return false;
      }
      return true;
    });
    return rows.sort((a, b) => sortDate(b) - sortDate(a));
  }, [articles, topic, tag, datePreset, buildTimeMs]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex flex-wrap items-end justify-end gap-3 rounded-[1.4rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] p-4">
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          נושא (חיפוש בתג)
          <input
            type="search"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]"
            placeholder="למשל בהירות"
            autoComplete="off"
          />
        </label>
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          תגית
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]"
          >
            <option value="">הכל</option>
            {allTags.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          תאריך
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
            className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]"
          >
            <option value="all">הכל</option>
            <option value="30">30 יום אחרונים</option>
            <option value="90">90 יום אחרונים</option>
            <option value="365">שנה</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]" aria-live="polite">
        מציג {filtered.length} מתוך {articles.length} מאמרים. המיון מהחדש לישן.
      </p>

      <ul className="space-y-3">
        {filtered.map((a) => {
          const ts = sortDate(a);
          const isNew = buildTimeMs - ts < NEW_DAYS * DAY_MS;
          return (
            <li
              key={a.slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <a
                  href={`/articles/${a.slug}/`}
                  className="font-semibold text-[var(--nm-fg)] underline-offset-4 hover:text-[var(--nm-accent)] hover:underline"
                >
                  {a.title}
                </a>
                <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                  {levelLabel(a.difficultyLevel)} · {a.tags.slice(0, 4).join(" · ") || "ללא תגיות"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isNew ? (
                  <span className="inline-flex items-center rounded-full bg-[var(--nm-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--nm-accent)]">
                    חדש
                  </span>
                ) : null}
                <time className="text-xs text-[color-mix(in_srgb,var(--nm-fg)_50%,var(--nm-bg))]" dateTime={new Date(ts).toISOString()}>
                  {new Date(ts).toLocaleDateString("he-IL")}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
