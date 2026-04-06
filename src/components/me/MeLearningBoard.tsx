import { useCallback, useEffect, useMemo, useState } from "react";
import { memberProgressUrl } from "../../lib/club-api-base";

type Article = {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  tags: string[];
  difficultyLevel?: "beginner" | "advanced" | "deep";
  image?: string;
  youtubeId?: string;
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
    const session = readSession();
    const url = memberProgressUrl();
    if (!session?.progressToken || !url) {
      setProgress(null);
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.progressToken}`, Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        progress?: { articlesRead: string[]; secondsRead: number };
      };
      if (res.ok && data?.ok && data.progress) setProgress(data.progress);
    } catch {
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((article) => article.tags.forEach((item) => set.add(item)));
    return [...set].sort((a, b) => a.localeCompare(b, "he"));
  }, [articles]);

  const filtered = useMemo(() => {
    const topicQuery = topic.trim();
    return articles.filter((article) => {
      if (level !== "all" && article.difficultyLevel !== level) return false;
      if (topicQuery && !article.tags.some((item) => item.includes(topicQuery))) return false;
      const selectedTag = tag.trim();
      if (selectedTag && !article.tags.includes(selectedTag)) return false;
      return true;
    });
  }, [articles, level, topic, tag]);

  const readSet = new Set(progress?.articlesRead ?? []);
  const ratio = totalPublished > 0 ? Math.min(100, Math.round((readSet.size / totalPublished) * 100)) : 0;

  const recommended = useMemo(() => {
    const unread = filtered.filter((article) => !readSet.has(article.slug));
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
          נושא מתוך תגיות
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
            {allTags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      {recommended.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-[var(--nm-fg)]">המלצות להמשך</h3>
          <ul className="grid gap-3 md:grid-cols-3">
            {recommended.map((article) => (
              <li key={article.slug} className="overflow-hidden rounded-[1.2rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/92">
                {article.image && article.image !== "/images/logo.svg" ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    width={1200}
                    height={675}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : null}
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--nm-accent)]">{levelHe(article.difficultyLevel)}</span>
                    {article.youtubeId ? (
                      <span className="rounded-full bg-[var(--nm-tint)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--nm-accent)]">וידאו</span>
                    ) : null}
                  </div>
                  <a href={`/articles/${article.slug}/`} className="block text-base font-semibold text-[var(--nm-fg)] underline-offset-4 hover:text-[var(--nm-accent)] hover:underline">
                    {article.title}
                  </a>
                  <p className="text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_66%,var(--nm-bg))]">{article.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-[var(--nm-fg)]">רשימה ({filtered.length})</h3>
        <ul className="space-y-2">
          {filtered.map((article) => {
            const done = readSet.has(article.slug);
            return (
              <li key={article.slug} className="rounded-[1.1rem] border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-white/90 px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <a href={`/articles/${article.slug}/`} className="text-sm font-medium text-[var(--nm-fg)] hover:text-[var(--nm-accent)]">
                      {article.title}
                    </a>
                    <p className="mt-1 text-xs leading-6 text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">
                      {article.description}
                    </p>
                  </div>
                  <span className="text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
                    {levelHe(article.difficultyLevel)}
                    {done ? " • נסרק" : ""}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[1.4rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] p-4">
        <div className="flex flex-wrap justify-end gap-2 text-sm font-semibold text-[var(--nm-accent)]">
          <a href="/glossary/" className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white px-3 py-2 transition hover:bg-[var(--nm-tint)]">
            לבדוק מושג במילון
          </a>
          <a href="/me/unlock/" className="rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white px-3 py-2 transition hover:bg-[var(--nm-tint)]">
            להמשיך לאזור הסגור
          </a>
        </div>
      </section>
    </div>
  );
}
