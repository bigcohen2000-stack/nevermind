import { useCallback, useEffect, useMemo, useState } from "react";
import { memberInsightsUrl, memberProgressUrl } from "../../lib/club-api-base";

export type DashboardArticle = {
  slug: string;
  title: string;
  pubDate: string;
  tags: string[];
  difficultyLevel?: "beginner" | "advanced" | "deep";
};

type ClubSession = {
  memberName?: string;
  phone?: string;
  expiresAt?: string;
  progressToken?: string;
};

const BG = "#FAFAF8";
const FG = "#1A1A1A";
const ACCENT = "#D42B2B";

const LS_LAST = "nm_last_article_open";
const LS_LOG = "nm_article_open_log";
const LS_SECONDS = "nm_reading_seconds_local";
const LS_STREAK = "nm_dashboard_streak";
const LS_INSIGHTS_LOCAL = "nm_insights_journal_local";

function readClubSession(): ClubSession | null {
  try {
    const raw = localStorage.getItem("nm_club_session");
    if (!raw) return null;
    const data = JSON.parse(raw) as ClubSession;
    if (!data?.expiresAt || Date.parse(data.expiresAt) < Date.now()) {
      localStorage.removeItem("nm_club_session");
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function readLastOpen(): { slug: string; title: string; at: number } | null {
  try {
    const raw = localStorage.getItem(LS_LAST);
    if (!raw) return null;
    const o = JSON.parse(raw) as { slug?: string; title?: string; at?: number };
    if (!o.slug || !o.title) return null;
    return { slug: o.slug, title: o.title, at: o.at ?? 0 };
  } catch {
    return null;
  }
}

function readOpenLog(): Array<{ slug: string; title: string; at: number }> {
  try {
    const raw = localStorage.getItem(LS_LOG);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Array<{ slug?: string; title?: string; at?: number }>;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x.slug && x.title)
      .map((x) => ({ slug: x.slug!, title: x.title!, at: x.at ?? 0 }))
      .sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

function readLocalSeconds(): number {
  try {
    const n = Number.parseInt(localStorage.getItem(LS_SECONDS) || "0", 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function streakCount(): number {
  try {
    const raw = localStorage.getItem(LS_STREAK);
    const o = JSON.parse(raw || "{}") as { lastDate?: string; count?: number };
    const today = new Date().toISOString().slice(0, 10);
    if (o.lastDate === today && typeof o.count === "number") return o.count;
    return typeof o.count === "number" ? o.count : 0;
  } catch {
    return 0;
  }
}

function bumpStreakOnVisit(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem(LS_STREAK);
    let last = "";
    let count = 0;
    try {
      const o = JSON.parse(raw || "{}") as { lastDate?: string; count?: number };
      last = o.lastDate || "";
      count = Number(o.count) || 0;
    } catch {
      /* ignore */
    }
    if (last === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const next = last === yesterday ? count + 1 : 1;
    localStorage.setItem(LS_STREAK, JSON.stringify({ lastDate: today, count: next }));
  } catch {
    /* ignore */
  }
}

function greetingForHour(d: Date): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "בוקר טוב";
  if (h >= 12 && h < 17) return "המשך יום נעים";
  if (h >= 17 && h < 21) return "ערב טוב";
  return "לילה שקט";
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h} שעות ו-${m % 60} דקות`;
  if (m > 0) return `${m} דקות`;
  return `${sec} שניות`;
}

type Props = {
  articles: DashboardArticle[];
  totalPublished: number;
  whatsAppDigits: string;
};

export default function MePersonalDashboard({ articles, totalPublished, whatsAppDigits }: Props) {
  const [session, setSession] = useState<ClubSession | null>(null);
  const [progress, setProgress] = useState<{ articlesRead: string[]; secondsRead: number } | null>(null);
  const [insightsText, setInsightsText] = useState("");
  const [insightsStatus, setInsightsStatus] = useState("");
  const [insightsSaving, setInsightsSaving] = useState(false);
  const [lastOpen, setLastOpen] = useState<ReturnType<typeof readLastOpen>>(null);
  const [openLog, setOpenLog] = useState<ReturnType<typeof readOpenLog>>([]);
  const [localSec, setLocalSec] = useState(0);
  const [streak, setStreak] = useState(0);
  const [tick, setTick] = useState(0);

  const refreshLocal = useCallback(() => {
    setSession(readClubSession());
    setLastOpen(readLastOpen());
    setOpenLog(readOpenLog());
    setLocalSec(readLocalSeconds());
    bumpStreakOnVisit();
    setStreak(streakCount());
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const loadProgress = useCallback(async () => {
    const s = readClubSession();
    const url = memberProgressUrl();
    if (!s?.progressToken || !url) {
      setProgress(null);
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${s.progressToken}`, Accept: "application/json" },
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

  const loadInsights = useCallback(async () => {
    const s = readClubSession();
    const url = memberInsightsUrl();
    if (!s?.progressToken || !url) {
      try {
        setInsightsText(localStorage.getItem(LS_INSIGHTS_LOCAL) || "");
      } catch {
        setInsightsText("");
      }
      return;
    }
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${s.progressToken}`, Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        insights?: { text?: string };
      };
      if (res.ok && data?.ok && typeof data.insights?.text === "string") {
        setInsightsText(data.insights.text);
        return;
      }
    } catch {
      /* fallback */
    }
    try {
      setInsightsText(localStorage.getItem(LS_INSIGHTS_LOCAL) || "");
    } catch {
      setInsightsText("");
    }
  }, []);

  useEffect(() => {
    void loadProgress();
    void loadInsights();
  }, [loadProgress, loadInsights]);

  const displayName = useMemo(() => {
    const n = session?.memberName?.trim();
    if (n) return n;
    try {
      const saved = localStorage.getItem("nm_dashboard_display_name")?.trim();
      if (saved) return saved;
    } catch {
      /* ignore */
    }
    return "אורח";
  }, [session]);

  const readSlugs = useMemo(() => {
    const s = new Set<string>();
    progress?.articlesRead?.forEach((x) => s.add(x));
    openLog.forEach((x) => s.add(x.slug));
    return s;
  }, [progress, openLog]);

  const articlesReadCount = readSlugs.size;

  const totalSeconds = (progress?.secondsRead ?? 0) + localSec;

  const greeting = useMemo(() => greetingForHour(new Date()), [tick]);

  const recommended = useMemo(() => {
    const unread = articles.filter((a) => !readSlugs.has(a.slug));
    const pick = unread.length > 0 ? unread : articles;
    return pick.slice(0, 4);
  }, [articles, readSlugs]);

  const historyEight = useMemo(() => {
    const seen = new Set<string>();
    const out: DashboardArticle[] = [];
    for (const row of openLog) {
      if (seen.has(row.slug)) continue;
      const meta = articles.find((a) => a.slug === row.slug);
      if (meta) {
        seen.add(row.slug);
        out.push(meta);
      } else {
        seen.add(row.slug);
        out.push({ slug: row.slug, title: row.title, pubDate: new Date(row.at).toISOString(), tags: [] });
      }
      if (out.length >= 8) break;
    }
    if (out.length < 8) {
      for (const a of articles) {
        if (out.length >= 8) break;
        if (!seen.has(a.slug)) {
          seen.add(a.slug);
          out.push(a);
        }
      }
    }
    return out.slice(0, 8);
  }, [openLog, articles]);

  const badgeFill = (threshold: number) => Math.min(1, articlesReadCount / threshold);

  const saveInsights = async () => {
    const s = readClubSession();
    const url = memberInsightsUrl();
    setInsightsSaving(true);
    setInsightsStatus("");
    try {
      if (s?.progressToken && url) {
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${s.progressToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ text: insightsText }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean };
        if (res.ok && data?.ok) {
          setInsightsStatus("נשמר");
          return;
        }
      }
      localStorage.setItem(LS_INSIGHTS_LOCAL, insightsText);
      setInsightsStatus("נשמר במכשיר");
    } catch {
      setInsightsStatus("לא נשמר, נסה שוב");
    } finally {
      setInsightsSaving(false);
    }
  };

  const giftHref = useMemo(() => {
    const msg =
      "היי, הגעתי מהלוח האישי. יש לי שאלה על מתנה או ארכה לחברות מועדון. אפשר לבדוק יחד כשיהיה לך זמן";
    const wa = whatsAppDigits.replace(/\D/g, "");
    if (!wa) return "#";
    return `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
  }, [whatsAppDigits]);

  const expiresLabel = session?.expiresAt
    ? new Date(session.expiresAt).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-10 pb-28 text-right" dir="rtl" style={{ color: FG, background: BG }}>
      <header className="space-y-2">
        <p className="text-[0.8125rem] font-medium leading-relaxed" style={{ color: `${FG}99` }}>
          שלום {displayName}, {greeting}
        </p>
        <h1 className="text-[clamp(1.65rem,1.4rem+1vw,2.25rem)] font-semibold leading-tight tracking-tight" style={{ color: FG }}>
          לוח בקרה
        </h1>
        <p className="text-[0.8125rem] font-medium leading-relaxed" style={{ color: `${FG}66` }}>
          סיכום מתוך {totalPublished} מאמרים באתר
        </p>
      </header>

      <section aria-label="סטטיסטיקה אישית" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "מאמרים שקראת", value: String(articlesReadCount) },
          { label: "זמן למידה", value: fmtDuration(totalSeconds) },
          { label: "רצף ימים באתר", value: `${streak} ימים` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border px-5 py-5 shadow-[0_1px_0_rgba(26,26,26,0.04)]"
            style={{ borderColor: `${FG}14`, background: "#fff" }}
          >
            <p className="text-[0.8125rem] font-medium leading-relaxed" style={{ color: `${FG}88` }}>
              {card.label}
            </p>
            <p className="mt-3 text-[1.35rem] font-semibold tabular-nums tracking-tight" style={{ color: FG }}>
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section aria-label="המשך לקרוא" className="rounded-2xl border px-5 py-5" style={{ borderColor: `${FG}14`, background: "#fff" }}>
        <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
          המשך לקרוא
        </h2>
        {lastOpen ? (
          <a
            href={`/articles/${lastOpen.slug}/`}
            className="mt-4 block rounded-xl px-4 py-4 transition hover:opacity-90"
            style={{ background: `${ACCENT}14` }}
          >
            <p className="text-[0.8125rem] font-medium" style={{ color: `${FG}99` }}>
              המאמר האחרון שפתחת
            </p>
            <p className="mt-2 text-[1.05rem] font-semibold leading-snug" style={{ color: FG }}>
              {lastOpen.title}
            </p>
          </a>
        ) : (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: `${FG}70` }}>
            עדיין אין סימון למאמר אחרון. כשתפתח מאמר הוא יופיע כאן
          </p>
        )}
      </section>

      <section aria-label="היסטוריה והמלצות" className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
            היסטוריה
          </h2>
          <ul className="space-y-2">
            {historyEight.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/articles/${a.slug}/`}
                  className="block rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-[color-mix(in_srgb,#1A1A1A_04%,white)]"
                  style={{ borderColor: `${FG}12`, color: FG }}
                >
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
            במיוחד בשבילך
          </h2>
          <ul className="space-y-2">
            {recommended.map((a) => (
              <li key={a.slug}>
                <a
                  href={`/articles/${a.slug}/`}
                  className="block rounded-xl border px-4 py-3 text-sm font-medium transition hover:bg-[color-mix(in_srgb,#1A1A1A_04%,white)]"
                  style={{ borderColor: `${FG}12`, color: FG }}
                >
                  {a.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="יומן תובנות" className="rounded-2xl border px-5 py-5" style={{ borderColor: `${FG}14`, background: "#fff" }}>
        <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
          יומן תובנות
        </h2>
        <label className="mt-3 block text-[0.8125rem] font-medium" style={{ color: `${FG}88` }} htmlFor="nm-insights-field">
          מה לקחתי מהיום
        </label>
        <textarea
          id="nm-insights-field"
          value={insightsText}
          onChange={(e) => setInsightsText(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none ring-0 focus:border-[color-mix(in_srgb,#D42B2B_35%,transparent)]"
          style={{ borderColor: `${FG}18`, color: FG, background: BG }}
        />
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => void saveInsights()}
            disabled={insightsSaving}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: ACCENT }}
          >
            {insightsSaving ? "שומר" : "שמירה"}
          </button>
          {insightsStatus ? (
            <span className="text-xs font-medium" style={{ color: `${FG}70` }}>
              {insightsStatus}
            </span>
          ) : null}
        </div>
      </section>

      <section aria-label="מועדון ומתנה" className="rounded-2xl border px-5 py-5" style={{ borderColor: `${FG}14`, background: "#fff" }}>
        <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
          מועדון והטבות
        </h2>
        {session && expiresLabel ? (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: `${FG}88` }}>
            חבר מועדון עד תאריך {expiresLabel}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: `${FG}70` }}>
            אין כרגע חיבור פעיל למועדון מהמכשיר הזה
          </p>
        )}
        <a
          href={giftHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border px-6 text-sm font-semibold transition hover:bg-[color-mix(in_srgb,#1A1A1A_04%,white)]"
          style={{ borderColor: `${FG}22`, color: FG }}
        >
          יש לך מתנה
        </a>
      </section>

      <section aria-label="תגים" className="space-y-3">
        <h2 className="text-[0.9375rem] font-semibold" style={{ color: FG }}>
          Badges
        </h2>
        <div className="flex flex-wrap justify-end gap-6">
          {[
            { label: "חוקר מתחיל", threshold: 5 },
            { label: "קורא עקבי", threshold: 12 },
            { label: "עומק מלא", threshold: 20 },
          ].map((b) => {
            const fill = badgeFill(b.threshold);
            return (
              <div key={b.label} className="flex flex-col items-center gap-2 text-center">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold"
                  style={{
                    borderColor: `${FG}18`,
                    color: fill > 0.15 ? ACCENT : `${FG}44`,
                    background: `color-mix(in srgb, ${ACCENT} ${Math.round(fill * 100)}%, ${BG})`,
                  }}
                  aria-hidden
                >
                  ◆
                </span>
                <span className="max-w-[6rem] text-[0.75rem] font-medium leading-snug" style={{ color: `${FG}99` }}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-center text-[0.8125rem] font-medium leading-relaxed" style={{ color: `${FG}55` }}>
        עוד 12 חברים לומדים עכשיו באתר
      </p>

      <p className="pb-4 text-center text-[0.75rem] font-medium leading-relaxed" style={{ color: `${FG}50` }}>
        הנתונים האלו גלויים רק לך
      </p>

      <a
        href="/questions/"
        className="fixed bottom-6 z-40 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(26,26,26,0.12)] transition hover:opacity-95"
        style={{ background: FG, insetInlineStart: "max(1rem, env(safe-area-inset-left))", bottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        שאל שאלה חדשה
      </a>
    </div>
  );
}
