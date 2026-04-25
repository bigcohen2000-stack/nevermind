import { useEffect, useState } from "react";

type LiveConnection = {
  id: string;
  memberName: string;
  phone: string;
  ipFingerprint: string;
  path: string;
  device: string;
  authStatus: string;
  seenAt: string;
  minutesAgo: number | null;
};

type Payload = {
  ok: boolean;
  source: string;
  generatedAt: string;
  totalActive: number;
  totalRecent: number;
  items: LiveConnection[];
};

type Props = {
  endpoint: string;
};

type OverviewEntry = {
  memberName?: string;
  phone?: string;
  ipFingerprint?: string;
  path?: string;
  userAgent?: string;
  seenAt?: string;
};

type OverviewPayload = {
  ok?: boolean;
  recentLogins?: OverviewEntry[];
};

function readOverviewPayload(): OverviewPayload | null {
  if (typeof window === "undefined") return null;
  const payload = window.__NM_ADMIN_OVERVIEW__;
  return payload && payload.ok === true ? payload : null;
}

function formatDevice(userAgent: string) {
  const value = String(userAgent || "").toLowerCase();
  if (!value) return "דפדפן לא מזוהה";

  const platform = value.includes("iphone") || value.includes("ios")
    ? "iPhone"
    : value.includes("android")
      ? "Android"
      : value.includes("mac os") || value.includes("macintosh")
        ? "Mac"
        : value.includes("windows")
          ? "Windows"
          : value.includes("linux")
            ? "Linux"
            : "מכשיר";

  const browser = value.includes("edg/")
    ? "Edge"
    : value.includes("chrome/") && !value.includes("edg/")
      ? "Chrome"
      : value.includes("safari/") && !value.includes("chrome/")
        ? "Safari"
        : value.includes("firefox/")
          ? "Firefox"
          : "דפדפן";

  return `${platform} · ${browser}`;
}

function buildStatus(pathname: string) {
  const path = String(pathname || "").trim();
  if (path.startsWith("/admin")) return "כניסת מנהל";
  if (path.startsWith("/me")) return "אזור אישי";
  if (path.startsWith("/articles/")) return "קריאת תוכן";
  if (path.startsWith("/dashboard")) return "בקרה פנימית";
  return "גישה פעילה";
}

function minutesAgo(value: string) {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 60000));
}

function isRecent(seenAt: string, minutesWindow: number) {
  const time = Date.parse(String(seenAt || ""));
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= minutesWindow * 60 * 1000;
}

function mapOverviewToPayload(source: OverviewPayload): Payload {
  const recentLogins = Array.isArray(source?.recentLogins) ? source.recentLogins : [];
  const items = recentLogins.slice(0, 8).map((entry, index) => {
    const seenAt = String(entry?.seenAt || "");
    return {
      id: `${entry?.phone || "guest"}-${seenAt || index}`,
      memberName: String(entry?.memberName || ""),
      phone: String(entry?.phone || "ללא טלפון"),
      ipFingerprint: String(entry?.ipFingerprint || "לא זמין"),
      path: String(entry?.path || "/"),
      device: formatDevice(String(entry?.userAgent || "")),
      authStatus: buildStatus(String(entry?.path || "")),
      seenAt,
      minutesAgo: minutesAgo(seenAt),
    };
  });

  const uniqueActive = new Set(
    recentLogins
      .filter((entry) => isRecent(String(entry?.seenAt || ""), 20))
      .map((entry) => String(entry?.phone || entry?.ipFingerprint || ""))
      .filter(Boolean),
  );

  return {
    ok: true,
    source: "worker:club_activity:fallback",
    generatedAt: new Date().toISOString(),
    totalActive: uniqueActive.size,
    totalRecent: recentLogins.length,
    items,
  };
}

export default function LiveConnectionsWidget({ endpoint }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const applyOverview = (overview: OverviewPayload | null) => {
      if (!overview || overview.ok !== true || cancelled) return false;
      setPayload(mapOverviewToPayload(overview));
      setError("");
      return true;
    };

    const load = async () => {
      if (applyOverview(readOverviewPayload())) {
        return;
      }

      try {
        const response = await fetch(endpoint, { headers: { accept: "application/json" }, cache: "no-store" });
        const data = (await response.json()) as Payload;
        if (!response.ok || !data?.ok) {
          throw new Error("primary_failed");
        }
        if (!cancelled) {
          setPayload(data);
          setError("");
        }
      } catch {
        try {
          const fallbackResponse = await fetch("/dashboard/api/club-admin/admin/overview", {
            headers: { accept: "application/json" },
            cache: "no-store",
          });
          const fallbackData = (await fallbackResponse.json()) as OverviewPayload;
          if (!fallbackResponse.ok || fallbackData?.ok !== true) {
            throw new Error("fallback_failed");
          }
          if (!cancelled) {
            setPayload(mapOverviewToPayload(fallbackData));
            setError("");
          }
        } catch {
          if (!cancelled) {
            setError(
              "לא הצלחנו למשוך כרגע את נתוני החיבורים. בדרך כלל זו חסימה של Cloudflare Access. צריך להגן גם על /dashboard/* וגם על /dashboard/api/*, ולוודא שהמייל שלך מורשה."
            );
          }
        }
      }
    };

    const onOverview = (event: Event) => {
      const detail = (event as CustomEvent<OverviewPayload | null>).detail;
      applyOverview(detail ?? null);
    };

    void load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("nm-admin-overview", onOverview as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("nm-admin-overview", onOverview as EventListener);
    };
  }, [endpoint]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">פעילים עכשיו</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{payload?.totalActive ?? "--"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">חיבורים בחלון</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{payload?.totalRecent ?? "--"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">עדכון אחרון</p>
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
            {payload?.generatedAt ? new Date(payload.generatedAt).toLocaleTimeString("he-IL") : "ממתין"}
          </p>
        </div>
      </div>

      {error ? <p className="rounded-[22px] border border-[#D42B2B]/18 bg-[#D42B2B]/6 px-4 py-3 text-sm text-[#D42B2B]">{error}</p> : null}

      <div className="grid gap-3">
        {(payload?.items ?? Array.from({ length: 4 })).map((item, index) => (
          <div
            key={payload ? item.id : index}
            className="grid gap-3 rounded-[22px] border border-black/8 bg-white px-4 py-3 sm:grid-cols-[1fr_0.9fr_1.1fr_1fr_0.9fr]"
          >
            {payload ? (
              <>
                <div>
                  <p className="text-xs text-black/45">חבר</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">
                    {item.memberName ? `${item.memberName} · ${item.phone}` : item.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-black/45">מזהה רשת</p>
                  <p className="mt-1 font-mono text-sm text-[#1A1A1A]">{item.ipFingerprint}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">נתיב</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.path}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">דפדפן</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.device}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">מצב</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.authStatus}</p>
                  <p className="mt-1 text-xs text-black/48">{item.minutesAgo == null ? "לא זמין" : `לפני ${item.minutesAgo} דק`}</p>
                </div>
              </>
            ) : (
              <div className="col-span-full h-11 rounded-2xl bg-black/5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
