import { useEffect, useState } from "react";

type RuntimeCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

type RuntimePayload = {
  ok: boolean;
  generatedAt: string;
  checks: RuntimeCheck[];
};

type ReadabilityItem = {
  slug: string;
  title: string;
  href: string;
  score: number;
  label: string;
};

type BuildPayload = {
  generatedAt: string;
  stage: string;
  readability?: {
    articleCount: number;
    averageScore: number;
    clearCount: number;
    goodCount: number;
    denseCount: number;
    hardest: ReadabilityItem[];
  };
  build?: {
    htmlPages: number | null;
    rssReady: boolean;
    internalLinks: {
      ok: boolean | null;
      checkedAt: string | null;
    };
  };
};

type PulsePayload = {
  ok: boolean;
  available: boolean;
  generatedAt: string;
  activeNow: number | null;
  recentRequests: number | null;
  mood: string;
  reason: string;
  windowMinutes: number;
};

type SearchGapRow = {
  query: string;
  count: number;
  lastSeen: string;
};

type SearchGapPayload = {
  ok: boolean;
  available?: boolean;
  source?: string;
  rows: SearchGapRow[];
};

type MobileAuditPayload = {
  ok: boolean;
  error?: string;
  url?: string;
  strategy?: string;
  performanceScore: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  inpMs: number | null;
  fetchedAt?: string;
};

type Props = {
  endpoint: string;
  buildReportHref: string;
  pulseEndpoint: string;
  psiEndpoint: string;
  gapsEndpoint: string;
};

function statusTone(ok: boolean) {
  return ok
    ? "border-emerald-600/18 bg-emerald-600/6 text-emerald-700"
    : "border-[#D42B2B]/18 bg-[#D42B2B]/6 text-[#D42B2B]";
}

function formatDateTime(value?: string) {
  if (!value) return "לא זמין";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "לא זמין";
  return date.toLocaleString("he-IL");
}

function formatTime(value?: string) {
  if (!value) return "לא זמין";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "לא זמין";
  return date.toLocaleTimeString("he-IL");
}

function metricLabel(value: number | null | undefined, suffix = "") {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${value}${suffix}`;
}

export default function SystemHealthWidget({
  endpoint,
  buildReportHref,
  pulseEndpoint,
  psiEndpoint,
  gapsEndpoint,
}: Props) {
  const [runtimePayload, setRuntimePayload] = useState<RuntimePayload | null>(null);
  const [buildPayload, setBuildPayload] = useState<BuildPayload | null>(null);
  const [pulsePayload, setPulsePayload] = useState<PulsePayload | null>(null);
  const [gapPayload, setGapPayload] = useState<SearchGapPayload | null>(null);
  const [error, setError] = useState("");
  const [psiPayload, setPsiPayload] = useState<MobileAuditPayload | null>(null);
  const [psiLoading, setPsiLoading] = useState(false);
  const [psiError, setPsiError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [runtimeResponse, buildResponse, pulseResponse, gapResponse] = await Promise.all([
          fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store" }),
          fetch(buildReportHref, { headers: { accept: "application/json" }, cache: "no-store" }),
          fetch(pulseEndpoint, { headers: { accept: "application/json" }, cache: "no-store" }),
          fetch(gapsEndpoint, { headers: { accept: "application/json" }, cache: "no-store" }),
        ]);

        const runtimeData = (await runtimeResponse.json()) as RuntimePayload;
        const buildData = (await buildResponse.json()) as BuildPayload;
        const pulseData = (await pulseResponse.json()) as PulsePayload;
        const gapData = (await gapResponse.json()) as SearchGapPayload;

        if (!runtimeResponse.ok || !runtimeData?.ok) {
          throw new Error("runtime");
        }

        if (!cancelled) {
          setRuntimePayload(runtimeData);
          setBuildPayload(buildData);
          setPulsePayload(pulseData);
          setGapPayload(gapData);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("לא הצלחנו לטעון את בריאות המערכת כרגע");
        }
      }
    };

    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [buildReportHref, endpoint, gapsEndpoint, pulseEndpoint]);

  const runPsi = async () => {
    setPsiLoading(true);
    setPsiError("");
    try {
      const response = await fetch(psiEndpoint, { headers: { accept: "application/json" }, cache: "no-store" });
      const data = (await response.json()) as MobileAuditPayload;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "psi");
      }
      setPsiPayload(data);
    } catch (err) {
      setPsiPayload(null);
      setPsiError(err instanceof Error && err.message ? err.message : "לא הצלחנו להריץ בדיקת מובייל כרגע");
    } finally {
      setPsiLoading(false);
    }
  };

  const readability = buildPayload?.readability;
  const build = buildPayload?.build;
  const gapRows = gapPayload?.rows ?? [];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">בדיקות runtime</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{runtimePayload?.checks?.length ?? "--"}</p>
          <p className="mt-1 text-xs text-black/48">עודכן {formatTime(runtimePayload?.generatedAt)}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">Cloudflare עכשיו</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{pulsePayload?.activeNow ?? "--"}</p>
          <p className="mt-1 text-xs text-black/48">{pulsePayload?.mood || "ממתין לחיבור"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">בקשות בחלון</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{pulsePayload?.recentRequests ?? "--"}</p>
          <p className="mt-1 text-xs text-black/48">
            {pulsePayload?.windowMinutes ? `${pulsePayload.windowMinutes} דקות אחרונות` : "ממתין לחיבור"}
          </p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">קישורים פנימיים</p>
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
            {build?.internalLinks?.ok === true ? "עבר" : build?.internalLinks?.ok === false ? "דורש בדיקה" : "ממתין"}
          </p>
          <p className="mt-1 text-xs text-black/48">{formatDateTime(build?.internalLinks?.checkedAt ?? undefined)}</p>
        </div>
      </div>

      {error ? <p className="rounded-[22px] border border-[#D42B2B]/18 bg-[#D42B2B]/6 px-4 py-3 text-sm text-[#D42B2B]">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="space-y-3">
          {(runtimePayload?.checks ?? []).map((check) => (
            <div key={check.id} className={`rounded-[22px] border px-4 py-4 ${statusTone(check.ok)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{check.label}</p>
                  <p className="text-sm leading-6 text-black/65">{check.detail}</p>
                </div>
                <span className="rounded-full border border-current/15 px-3 py-1 text-xs font-semibold">{check.ok ? "תקין" : "חסר"}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-[24px] border border-black/8 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">דוח build אחרון</p>
            <p className="mt-1 text-xs text-black/48">
              {buildPayload?.generatedAt ? new Date(buildPayload.generatedAt).toLocaleString("he-IL") : "ממתין לדוח"}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-black/68">
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">עמודי HTML: {build?.htmlPages ?? "--"}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">RSS: {build?.rssReady ? "מוכן" : "לא זמין"}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">קריאות ממוצעת: {readability?.averageScore ?? "--"}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">מאמרים צפופים: {readability?.denseCount ?? "--"}</div>
          </div>
          {readability?.hardest?.length ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-black/48">כדאי לפשט קודם</p>
              {readability.hardest.slice(0, 4).map((item) => (
                <a key={item.slug} href={item.href} className="block rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3 transition hover:border-[#D42B2B]/20 hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-right">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{item.title}</p>
                      <p className="text-xs text-black/48">{item.label}</p>
                    </div>
                    <span className="rounded-full border border-black/8 px-2.5 py-1 text-xs font-semibold text-black/70">{item.score}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="space-y-3 rounded-[24px] border border-black/8 bg-white p-4">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D42B2B]">מדדי אתר</p>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">Cloudflare</h3>
            <p className="text-sm leading-6 text-black/62">מונה חי של האתר מתוך Cloudflare GraphQL, בלי שכבת דשבורד חיצונית ובלי תלות בנתוני גוגל.</p>
          </div>
          <div className="grid gap-2 text-sm text-black/68">
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">משתמשים חיים: {pulsePayload?.activeNow ?? "--"}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">בקשות אחרונות: {pulsePayload?.recentRequests ?? "--"}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">עדכון אחרון: {formatTime(pulsePayload?.generatedAt)}</div>
          </div>
          <p className="text-xs leading-6 text-black/48">
            {pulsePayload?.available === false ? pulsePayload.reason || "חסר חיבור ל־Cloudflare" : pulsePayload?.mood || "ממתין לנתונים"}
          </p>
        </section>

        <section className="space-y-3 rounded-[24px] border border-black/8 bg-white p-4">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D42B2B]">Core Web Vitals</p>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">בדיקת מובייל</h3>
            <p className="text-sm leading-6 text-black/62">דגימה אחת לפי קריאה. זו לא מדידה רציפה, ולכן היא רצה רק בלחיצה.</p>
          </div>
          <button
            type="button"
            onClick={() => void runPsi()}
            disabled={psiLoading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/10 bg-[#FAFAF8] px-4 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:border-[#D42B2B]/22 hover:text-[#D42B2B] disabled:cursor-wait disabled:opacity-70"
          >
            {psiLoading ? "מריץ בדיקה" : "הרץ בדיקה"}
          </button>
          {psiError ? <p className="rounded-[18px] border border-[#D42B2B]/18 bg-[#D42B2B]/6 px-3 py-3 text-sm text-[#D42B2B]">{psiError}</p> : null}
          <div className="grid gap-2 text-sm text-black/68">
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">ציון ביצועים: {metricLabel(psiPayload?.performanceScore)}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">LCP: {metricLabel(psiPayload?.lcpMs, "ms")}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">CLS: {metricLabel(psiPayload?.cls)}</div>
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">INP: {metricLabel(psiPayload?.inpMs, "ms")}</div>
          </div>
          <p className="text-xs leading-6 text-black/48">{psiPayload?.fetchedAt ? `עודכן ${formatDateTime(psiPayload.fetchedAt)}` : "נדרש אימות Cloudflare Access והרצת בדיקה"}</p>
        </section>

        <section className="space-y-3 rounded-[24px] border border-black/8 bg-white p-4">
          <div className="space-y-1 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D42B2B]">Insight Gaps</p>
            <h3 className="text-lg font-semibold text-[#1A1A1A]">מה הקהל מחפש ולא מוצא</h3>
            <p className="text-sm leading-6 text-black/62">כל חיפוש בלי תוצאה יכול להופיע כאן אוטומטית ולשמש רשימת עבודה לתוכן הבא.</p>
          </div>
          {gapRows.length ? (
            <div className="space-y-2">
              {gapRows.slice(0, 6).map((row) => (
                <div key={`${row.query}-${row.lastSeen}`} className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-right">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{row.query}</p>
                      <p className="text-xs text-black/48">{formatDateTime(row.lastSeen)}</p>
                    </div>
                    <span className="rounded-full border border-black/8 px-2.5 py-1 text-xs font-semibold text-black/70">{row.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-black/8 bg-[#FAFAF8] px-3 py-3 text-sm leading-6 text-black/62">
              עדיין אין פערי חיפוש מתועדים. כשמשתמש יחפש בלי תוצאות, המונח יופיע כאן אוטומטית.
            </div>
          )}
          <p className="text-xs leading-6 text-black/48">
            מקור: {gapPayload?.source === "kv:search_gaps" ? "KV של Cloudflare" : "זיכרון פונקציה מקומי"}
          </p>
        </section>
      </div>
    </div>
  );
}
