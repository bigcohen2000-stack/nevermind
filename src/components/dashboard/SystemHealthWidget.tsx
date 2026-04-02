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

type Props = {
  endpoint: string;
  buildReportHref: string;
};

function statusTone(ok: boolean) {
  return ok
    ? "border-emerald-600/18 bg-emerald-600/6 text-emerald-700"
    : "border-[#D42B2B]/18 bg-[#D42B2B]/6 text-[#D42B2B]";
}

export default function SystemHealthWidget({ endpoint, buildReportHref }: Props) {
  const [runtimePayload, setRuntimePayload] = useState<RuntimePayload | null>(null);
  const [buildPayload, setBuildPayload] = useState<BuildPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [runtimeResponse, buildResponse] = await Promise.all([
          fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store" }),
          fetch(buildReportHref, { headers: { accept: "application/json" }, cache: "no-store" }),
        ]);

        const runtimeData = (await runtimeResponse.json()) as RuntimePayload;
        const buildData = (await buildResponse.json()) as BuildPayload;

        if (!runtimeResponse.ok || !runtimeData?.ok) {
          throw new Error("runtime");
        }

        if (!cancelled) {
          setRuntimePayload(runtimeData);
          setBuildPayload(buildData);
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
  }, [buildReportHref, endpoint]);

  const readability = buildPayload?.readability;
  const build = buildPayload?.build;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">בדיקות runtime</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{runtimePayload?.checks?.length ?? "--"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">קריאות ממוצעת</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{readability?.averageScore ?? "--"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">קישורים פנימיים</p>
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
            {build?.internalLinks?.ok === true ? "עבר" : build?.internalLinks?.ok === false ? "דורש בדיקה" : "ממתין"}
          </p>
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
    </div>
  );
}