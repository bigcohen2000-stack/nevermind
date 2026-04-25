import { useEffect, useState } from "react";

type Alarm = {
  phone: string;
  attempts: number;
  severity: "low" | "medium" | "high";
};

type EventItem = {
  id: string;
  phone: string;
  createdAt: string;
  label: string;
  note: string;
  attempts: number;
  severity: "low" | "medium" | "high";
  isAlarm: boolean;
};

type Payload = {
  ok: boolean;
  source: string;
  generatedAt: string;
  alarms: Alarm[];
  events: EventItem[];
};

type Props = {
  endpoint: string;
};

type OverviewFraudFlag = {
  phone?: string;
  memberIpCount?: number;
  passwordIpCount?: number;
  flaggedAt?: string;
};

type OverviewPayload = {
  ok?: boolean;
  fraudFlags?: OverviewFraudFlag[];
};

function severityClass(value: Alarm["severity"]): string {
  if (value === "high") return "border-[#D42B2B]/25 bg-[#D42B2B]/8 text-[#D42B2B]";
  if (value === "medium") return "border-amber-600/20 bg-amber-600/10 text-amber-800";
  return "border-black/10 bg-black/5 text-black/70";
}

function severityLabel(value: Alarm["severity"]): string {
  if (value === "high") return "גבוה";
  if (value === "medium") return "בינוני";
  return "נמוך";
}

function attemptsForFlag(item: OverviewFraudFlag) {
  return Math.max(Number(item?.memberIpCount) || 1, Number(item?.passwordIpCount) || 1);
}

function severityFromCounts(item: OverviewFraudFlag): Alarm["severity"] {
  const peak = Math.max(Number(item?.memberIpCount) || 0, Number(item?.passwordIpCount) || 0);
  if (peak >= 3) return "high";
  if (peak >= 2) return "medium";
  return "low";
}

function noteForFlag(item: OverviewFraudFlag) {
  const memberCount = Number(item?.memberIpCount) || 0;
  const passwordCount = Number(item?.passwordIpCount) || 0;
  if (passwordCount >= 3) return "אותה סיסמה הופיעה מכמה כתובות רשת בחלון קצר";
  if (memberCount >= 2) return "אותו חבר הופיע מכמה כתובות רשת קרובות בזמן";
  return "נרשם דפוס שדורש בדיקה ידנית";
}

function readOverviewPayload(): OverviewPayload | null {
  if (typeof window === "undefined") return null;
  const payload = window.__NM_ADMIN_OVERVIEW__;
  return payload && payload.ok === true ? payload : null;
}

function mapOverviewToPayload(source: OverviewPayload): Payload {
  const fraudFlags = Array.isArray(source?.fraudFlags) ? source.fraudFlags : [];
  const alarms = fraudFlags.slice(0, 5).map((item) => ({
    phone: String(item?.phone || "ללא זיהוי"),
    attempts: attemptsForFlag(item),
    severity: severityFromCounts(item),
  }));

  const events = fraudFlags.length
    ? fraudFlags.slice(0, 8).map((item, index) => {
        const attempts = attemptsForFlag(item);
        const severity = severityFromCounts(item);
        return {
          id: `${item?.phone || "flag"}-${item?.flaggedAt || index}`,
          phone: String(item?.phone || "ללא זיהוי"),
          createdAt: String(item?.flaggedAt || new Date().toISOString()),
          label: attempts >= 3 ? "דפוס גישה חריג" : "בדיקת גישה חוזרת",
          note: noteForFlag(item),
          attempts,
          severity,
          isAlarm: severity === "high",
        };
      })
    : [
        {
          id: "quiet-window",
          phone: "המערכת",
          createdAt: new Date().toISOString(),
          label: "אין Flag פתוח כרגע",
          note: "לא זוהו דפוסים חריגים בנתוני המועדון הפעילים",
          attempts: 0,
          severity: "low" as const,
          isAlarm: false,
        },
      ];

  return {
    ok: true,
    source: "worker:club_activity:fallback",
    generatedAt: new Date().toISOString(),
    alarms,
    events,
  };
}

export default function LiveSecurityFeedWidget({ endpoint }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

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
          throw new Error("failed");
        }
        if (!cancelled) {
          setPayload(data);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError(payload ? "" : "כרגע אין נתון חי זמין. כשה־worker יחזיר flags, הם יופיעו כאן.");
        }
      }
    };

    const schedule = () => {
      if (timer) window.clearInterval(timer);
      if (document.visibilityState === "hidden") return;
      timer = window.setInterval(load, 30000);
    };

    const onOverview = (event: Event) => {
      const detail = (event as CustomEvent<OverviewPayload | null>).detail;
      applyOverview(detail ?? null);
    };

    const onVisibilityChange = () => {
      schedule();
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    void load();
    schedule();
    window.addEventListener("nm-admin-overview", onOverview as EventListener);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      window.removeEventListener("nm-admin-overview", onOverview as EventListener);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [endpoint]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(payload?.alarms ?? []).map((alarm) => (
          <span key={alarm.phone} className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(alarm.severity)}`}>
            {alarm.phone} · {alarm.attempts} סימנים
          </span>
        ))}
        {payload?.alarms?.length === 0 ? (
          <span className="rounded-full border border-emerald-600/18 bg-emerald-600/8 px-3 py-1 text-xs font-semibold text-emerald-700">
            אין אזעקה פתוחה כרגע
          </span>
        ) : null}
      </div>

      {error ? <p className="rounded-[22px] border border-black/10 bg-black/4 px-4 py-3 text-sm text-black/62">{error}</p> : null}

      <div className="space-y-3">
        {(payload?.events ?? Array.from({ length: 4 })).map((event, index) => (
          <div key={payload ? event.id : index} className="rounded-[22px] border border-black/8 bg-white px-4 py-3">
            {payload ? (
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-1 text-right">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{event.label}</p>
                  <p className="text-sm leading-6 text-black/62">{event.note}</p>
                  <p className="text-xs text-black/42">
                    {event.phone} · {new Date(event.createdAt).toLocaleTimeString("he-IL")} · {event.attempts} סימנים
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(event.severity)}`}>
                    {severityLabel(event.severity)}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      event.isAlarm
                        ? "border-[#D42B2B]/25 bg-[#D42B2B]/8 text-[#D42B2B]"
                        : "border-black/10 bg-black/5 text-black/65"
                    }`}
                  >
                    {event.isAlarm ? "אזעקה" : "מעקב"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-11 rounded-2xl bg-black/5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
