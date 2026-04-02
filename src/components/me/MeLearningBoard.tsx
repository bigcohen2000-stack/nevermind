import { useCallback, useEffect, useMemo, useState } from "react";
import { memberProgressUrl } from "../../lib/club-api-base";

type Article = {
  slug: string;
  title: string;
  pubDate: string;
  updatedDate?: string;
  tags: string[];
  difficultyLevel?: "beginner" | "advanced" | "deep";
};

type ClubSession = { progressToken?: string; expiresAt?: string };

function readSession(): ClubSession | null {
  try {
    const raw = localStorage.getItem("nm_club_session");
    if (!raw) return null;
    const data = JSON.parse(raw) as ClubSession;
    if (!data?.expiresAt || Date.parse(data.expiresAt) < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function levelHe(d?: Article["difficultyLevel"]): string {
  if (d === "beginner") return "מתחיל";
  if (d === "advanced") return "בינוני";
  if (d === "deep") return "מתקדם";
  return "ללא רמה";
}

type Props = { articles: Article[]; totalPublished: number };

export default function MeLearningBoard({ articles, totalPublished }: Props) {
  const [level, setLevel] = useState<"all" | "beginner" | "advanced" | "deep">("all");
  const [topic, setTopic] = useState("");
  const [tag, setTag] = useState("");
  const [progress, setProgress] = useState<{ articlesRead: string[]; secondsRead: number } | null>(null);

  const load = useCallback(async () => {
    const s = readSession();
    const url = memberProgressUrl();
    if (!s?.progressToken || !url) {
      setProgress(null);
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${s.progressToken}`, Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; progress?: { articlesRead: string[]; secondsRead: number } };
      if (res.ok && data?.ok && data.progress) setProgress(data.progress);
    } catch {
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    articles.forEach((a) => a.tags.forEach((t) => s.add(t)));
    return [...s].sort((a, b) => a.localeCompare(b, "he"));
  }, [articles]);

  const filtered = useMemo(() => {
    const topicQ = topic.trim();
    return articles.filter((a) => {
      if (level !== "all" && a.difficultyLevel !== level) return false;
      if (topicQ && !a.tags.some((x) => x.includes(topicQ))) return false;
      const tg = tag.trim();
      if (tg && !a.tags.includes(tg)) return false;
      return true;
    });
  }, [articles, level, topic, tag]);

  const readSet = new Set(progress?.articlesRead ?? []);
  const ratio = totalPublished > 0 ? Math.min(100, Math.round((readSet.size / totalPublished) * 100)) : 0;

  const recommended = useMemo(() => {
    const unread = filtered.filter((a) => !readSet.has(a.slug));
    return unread.slice(0, 3);
  }, [filtered, readSet]);

  return (
    <div className="space-y-10 text-right" dir="rtl">
      <div className="rounded-[1.6rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-tint)] p-6">
        <h2 className="text-lg font-semibold text-[var(--nm-fg)]">התקדמות</h2>
        <p className="mt-2 text-sm text-[color-mix(in_srgb,var(--nm-fg)_68%,var(--nm-bg))]">
          לפי מספר מאמרים שסומנו בשרת מתוך {totalPublished} שפורסמו.
        </p>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)]" role="progressbar" aria-valuenow={ratio} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-[var(--nm-accent)] transition-[width] duration-500" style={{ width: `${ratio}%` }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-[var(--nm-fg)]">{ratio}%</p>
        {progress ? (
          <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">זמן מצטבר משוער: {Math.floor(progress.secondsRead / 60)} דקות</p>
        ) : (
          <p className="mt-1 text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">התחברות מועדון תטען את מד ההתקדמות.</p>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-end gap-3 rounded-[1.4rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] p-4">
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          נושא (חיפוש בתג)
          <input
            type="search"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]"
            placeholder="מילה מתוך תגית"
            autoComplete="off"
          />
        </label>
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          רמה
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]"
          >
            <option value="all">הכל</option>
            <option value="beginner">מתחיל</option>
            <option value="advanced">בינוני</option>
            <option value="deep">מתקדם</option>
          </select>
        </label>
        <label className="flex w-full min-w-0 flex-col gap-1 text-sm font-semibold text-[var(--nm-fg)] sm:min-w-[10rem]">
          תגית
          <select value={tag} onChange={(e) => setTag(e.target.value)} className="min-h-[44px] rounded-[1rem] border border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-white px-3 py-2 text-[var(--nm-fg)]">
            <option value="">הכל</option>
            {allTags.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
      </div>

      {recommended.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[var(--nm-fg)]">המלצות להמשך</h3>
          <ul className="space-y-2">
            {recommended.map((a) => (
              <li key={a.slug}>
                <a href={`/articles/${a.slug}/`} className="text-sm font-semibold text-[var(--nm-accent)] underline-offset-4 hover:underline">
                  {a.title}
                </a>
                <span className="mr-2 text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                  {levelHe(a.difficultyLevel)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--nm-fg)]">רשימה ({filtered.length})</h3>
        <ul className="space-y-2">
          {filtered.map((a) => {
            const done = readSet.has(a.slug);
            return (
              <li key={a.slug} className="flex flex-wrap items-center justify-between gap-2 rounded-[1.1rem] border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-white/90 px-3 py-2">
                <a href={`/articles/${a.slug}/`} className="text-sm font-medium text-[var(--nm-fg)] hover:text-[var(--nm-accent)]">
                  {a.title}
                </a>
                <span className="text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                  {levelHe(a.difficultyLevel)}
                  {done ? " · נסרק" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
