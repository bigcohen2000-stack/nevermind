import { useCallback, useEffect, useState } from "react";
import { memberProgressUrl } from "../../lib/club-api-base";

type ClubSession = {
  memberName?: string;
  phone?: string;
  expiresAt?: string;
  lastLoginAt?: string;
  progressToken?: string;
};

function readSession(): ClubSession | null {
  try {
    const raw = localStorage.getItem("nm_club_session");
    if (!raw) return null;
    const data = JSON.parse(raw) as ClubSession;
    if (!data?.expiresAt) return null;
    if (Date.parse(data.expiresAt) < Date.now()) {
      localStorage.removeItem("nm_club_session");
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export default function MeAccountSettings() {
  const [session, setSession] = useState<ClubSession | null>(null);
  const [progress, setProgress] = useState<{ articlesRead: string[]; secondsRead: number; updatedAt: string; lastIpPrefix?: string } | null>(null);
  const [ipLocal, setIpLocal] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const s = readSession();
    setSession(s);
    const url = memberProgressUrl();
    if (!s?.progressToken || !url) {
      setProgress(null);
      setStatus(!s ? "אין סשן מועדון פעיל. התחבר דרך שירותים או דף המועדון." : "אין טוקן התקדמות. התחבר שוב כדי לסנכרן.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${s.progressToken}`, Accept: "application/json" },
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; progress?: typeof progress; error?: string };
      if (!res.ok || !data?.ok || !data.progress) {
        setStatus(data?.error ? String(data.error) : "לא נטען סיכום מהשרת.");
        setProgress(null);
        return;
      }
      setProgress(data.progress);
    } catch {
      setStatus("השרת לא ענה. נסה שוב.");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => setIpLocal(typeof d?.ip === "string" ? d.ip : ""))
      .catch(() => setIpLocal(""));
  }, [load]);

  const fmtTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h} שעות ו-${m % 60} דקות`;
    if (m > 0) return `${m} דקות`;
    return `${sec} שניות`;
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.6rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/95 p-6 shadow-[0_16px_40px_rgba(26,26,26,0.04)]">
          <h2 className="text-lg font-semibold text-[var(--nm-fg)]">פרטי חיבור</h2>
          <dl className="mt-4 space-y-3 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))]">
            <div>
              <dt className="font-semibold text-[var(--nm-fg)]">שם</dt>
              <dd>{session?.memberName ?? "לא מחובר"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--nm-fg)]">טלפון</dt>
              <dd>{session?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--nm-fg)]">תוקף חברות</dt>
              <dd>{session?.expiresAt ? new Date(session.expiresAt).toLocaleDateString("he-IL") : "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--nm-fg)]">IP במכשיר (ציבורי)</dt>
              <dd>{ipLocal || "לא זוהה"}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.6rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/95 p-6 shadow-[0_16px_40px_rgba(26,26,26,0.04)]">
          <h2 className="text-lg font-semibold text-[var(--nm-fg)]">סיכום מהשרת</h2>
          {busy ? <p className="mt-3 text-sm text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">טוען…</p> : null}
          {progress ? (
            <dl className="mt-4 space-y-3 text-sm leading-7 text-[color-mix(in_srgb,var(--nm-fg)_78%,var(--nm-bg))]">
              <div>
                <dt className="font-semibold text-[var(--nm-fg)]">מאמרים בסריקה</dt>
                <dd>{progress.articlesRead.length}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--nm-fg)]">זמן קריאה מצטבר (הערכה)</dt>
                <dd>{fmtTime(progress.secondsRead)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--nm-fg)]">עדכון אחרון</dt>
                <dd>{new Date(progress.updatedAt).toLocaleString("he-IL")}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--nm-fg)]">טביעת IP אחרונה (מקוצרת)</dt>
                <dd>{progress.lastIpPrefix ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-[color-mix(in_srgb,var(--nm-fg)_60%,var(--nm-bg))]">{status || "אין נתונים להצגה."}</p>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--nm-fg)_14%,transparent)] px-5 py-2 text-sm font-semibold text-[var(--nm-fg)] transition hover:bg-[var(--nm-tint)]"
          >
            רענון
          </button>
        </article>
      </div>
    </div>
  );
}
