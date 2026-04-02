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

export default function LiveSecurityFeedWidget({ endpoint }: Props) {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
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
          setError("לא הצלחנו לעדכן את פיד האבטחה כרגע");
        }
      }
    };

    void load();
    const timer = window.setInterval(load, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
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

      {error ? <p className="rounded-[22px] border border-[#D42B2B]/18 bg-[#D42B2B]/6 px-4 py-3 text-sm text-[#D42B2B]">{error}</p> : null}

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
