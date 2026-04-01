import { useEffect, useState } from "react";

type LiveConnection = {
  ip: string;
  country: string;
  device: string;
  authStatus: string;
  activeSeconds: number;
};

type Payload = {
  ok: boolean;
  source: string;
  generatedAt: string;
  totalActive: number;
  items: LiveConnection[];
};

type Props = {
  endpoint: string;
};

export default function LiveConnectionsWidget({ endpoint }: Props) {
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
          setError("לא הצלחנו למשוך נתוני חיבורים כרגע");
        }
      }
    };

    void load();
    const timer = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [endpoint]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">חיבורים פעילים</p>
          <p className="mt-2 text-3xl font-semibold text-[#1A1A1A]">{payload?.totalActive ?? "--"}</p>
        </div>
        <div className="rounded-[22px] border border-black/8 bg-[#FAFAF8] p-4">
          <p className="text-xs text-black/48">מקור</p>
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">{payload?.source ?? "ממתין"}</p>
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
          <div key={"ip" in (item || {}) ? item.ip : index} className="grid gap-3 rounded-[22px] border border-black/8 bg-white px-4 py-3 sm:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_0.8fr]">
            {payload ? (
              <>
                <div>
                  <p className="text-xs text-black/45">IP</p>
                  <p className="mt-1 font-mono text-sm text-[#1A1A1A]">{item.ip}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">מדינה</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.country}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">מכשיר</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.device}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">אימות</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.authStatus}</p>
                </div>
                <div>
                  <p className="text-xs text-black/45">פעיל</p>
                  <p className="mt-1 text-sm text-[#1A1A1A]">{item.activeSeconds}s</p>
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
