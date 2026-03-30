import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import appConfig from "../config/appConfig.json";
import { validateAntispamFields } from "../lib/form-antispam";
import { HCAPTCHA_SITE_KEY } from "../lib/hcaptcha-public";
import { pickIntakeHumanChallenge, type IntakeHumanChallenge } from "../lib/intake-human-check";
import { WEB3FORMS_ACCESS_KEY } from "../lib/web3forms-access";
import { FloatingInput } from "./ui/FloatingInput";

const WA_MAX_CHARS = 3600;
const INTAKE_HUMAN_EMPTY = "נדרשת תשובה קצרה לשאלה למעלה.";
const INTAKE_HUMAN_WRONG = "משהו לא מדויק בתשובה, נסה שוב.";
const INTAKE_HONEYPOT_FAIL = "לא נשלח. רענן את העמוד ונסה שוב.";

const waDigits = String((appConfig as { contact?: { whatsAppNumber?: string } }).contact?.whatsAppNumber ?? "").replace(
  /\D/g,
  "",
);
const DRAFT_KEY = "nm-intake-draft-v1";

type ExpressionMode = "" | "write" | "select" | "both";

const MODE_OPTIONS: { id: ExpressionMode; title: string; body: string }[] = [
  {
    id: "write",
    title: "לכתוב בחופשיות",
    body: "טקסט פתוח. בלי מבנה קבוע.",
  },
  {
    id: "select",
    title: "לסמן נושאים",
    body: "כפתורים. מהיר לסרוק.",
  },
  {
    id: "both",
    title: "גם וגם",
    body: "סימון וטקסט יחד.",
  },
];

const MODE_HINTS: Record<Exclude<ExpressionMode, "">, string> = {
  write:
    "כתיבה חופשית לא אומרת בלבול. לפעמים זה רק מקום לדבר אמיתי בלי לסדר מראש.",
  select: "סימון מסמן כיוון. לא התחייבות. אפשר לשנות לפני שליחה.",
  both: "שילוב נותן גם מילה פתוחה וגם מסגרת. זה לגיטימי כאן.",
};

const TAG_DEFS: { key: string; label: string; hint: string }[] = [
  {
    key: "overload",
    label: "עומס / חוסר סדר",
    hint: "עומס לפעמים אומר שאין עדיין סדר לראות דרכו. לא בהכרח שהמצב בלתי אפשרי.",
  },
  {
    key: "clarity",
    label: "בהירות / כיוון",
    hint: "בהירות כאן היא פרדוקס: לפעמים מגיעה אחרי שמפסיקים לכפות אותה.",
  },
  {
    key: "relationships",
    label: "קשרים",
    hint: "קשר נמדד בפועל, לא בכוונה בלבד.",
  },
  {
    key: "money",
    label: "כסף / פרנסה",
    hint: "כסף חושף הרגלים. לא בהכרח את התמונה המלאה עליך.",
  },
  {
    key: "identity",
    label: "זהות / תמונה עצמית",
    hint: "זהות זה סיפור שאתה מספר לעצמך. שווה לבדוק אם הוא עדיין נכון.",
  },
  {
    key: "ego",
    label: "אגו / מנגנון הגנה",
    hint: "כאן אגו נבדק כמנגנון, לא כתחרות.",
  },
  {
    key: "other",
    label: "משהו אחר",
    hint: "מה שלא נכנס לרשימה שווה משפט אחד חופשי למטה.",
  },
];

const INTENT_OPTIONS: { value: string; label: string }[] = [
  { value: "fit", label: "להבין אם זה מתאים בכלל" },
  { value: "once", label: "שיחה נקודתית" },
  { value: "depth", label: "עומק / ליווי מתמשך" },
  { value: "unsure", label: "לא בטוח עדיין" },
];

function loadDraft(): Partial<{
  expressionMode: ExpressionMode;
  tags: string[];
  freeText: string;
  name: string;
  email: string;
  phone: string;
  intent: string;
}> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      expressionMode: (p.expressionMode as ExpressionMode) ?? "",
      tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string") : [],
      freeText: typeof p.freeText === "string" ? p.freeText : "",
      name: typeof p.name === "string" ? p.name : "",
      email: typeof p.email === "string" ? p.email : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      intent: typeof p.intent === "string" ? p.intent : "",
    };
  } catch {
    return {};
  }
}

function saveDraft(payload: Record<string, unknown>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

function isValidEmail(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function IntakeForm() {
  const formId = useId();
  const [expressionMode, setExpressionMode] = useState<ExpressionMode>("");
  const [tags, setTags] = useState<string[]>([]);
  const [lastTag, setLastTag] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState("");
  const [humanChallenge] = useState<IntakeHumanChallenge>(() => pickIntakeHumanChallenge());
  const [humanAnswer, setHumanAnswer] = useState("");
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "ok">("idle");
  const [clientError, setClientError] = useState("");
  const successRef = useRef<HTMLParagraphElement | null>(null);
  const hcaptchaRef = useRef<HCaptcha | null>(null);
  const openedAtRef = useRef(Date.now());
  const botcheckRef = useRef<HTMLInputElement | null>(null);
  const hpRef = useRef<HTMLInputElement | null>(null);
  const faxHoneypotRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const d = loadDraft();
    setExpressionMode(d.expressionMode ?? "");
    if (d.name) setName(d.name);
    if (d.email) setEmail(d.email);
    if (d.phone) setPhone(d.phone);
    if (d.intent) setIntent(d.intent);

    const mode = d.expressionMode ?? "";
    if (mode === "write") {
      setTags([]);
      setLastTag(null);
      if (d.freeText) setFreeText(d.freeText);
    } else if (mode === "select") {
      if (d.tags?.length) setTags(d.tags);
      setFreeText("");
    } else if (mode === "both") {
      if (d.tags?.length) setTags(d.tags);
      if (d.freeText) setFreeText(d.freeText);
    } else {
      if (d.freeText) setFreeText(d.freeText);
      if (d.tags?.length) setTags(d.tags);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      saveDraft({
        expressionMode,
        tags,
        freeText,
        name,
        email,
        phone,
        intent,
      });
    }, 200);
    return () => window.clearTimeout(t);
  }, [expressionMode, tags, freeText, name, email, phone, intent]);

  useEffect(() => {
    if (status !== "ok") return;
    const node = successRef.current;
    if (!node) return;
    const reduce =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    node.focus();
  }, [status]);

  const hintText = useMemo(() => {
    if (!expressionMode) {
      return "אין כאן ציון. יש מקום לכתוב, לסמן, או לשנות דעה באמצע.";
    }
    const base = MODE_HINTS[expressionMode];
    if (lastTag) {
      const def = TAG_DEFS.find((x) => x.key === lastTag);
      if (def) return `${base} ${def.hint}`;
    }
    return base;
  }, [expressionMode, lastTag]);

  const bumpStatusAfterEdit = useCallback(() => {
    setStatus((s) => (s === "ok" ? "idle" : s));
    setClientError("");
  }, []);

  const applyExpressionMode = useCallback((id: ExpressionMode) => {
    setExpressionMode(id);
    setClientError("");
    setStatus((s) => (s === "ok" ? "idle" : s));
    if (id === "write") {
      setTags([]);
      setLastTag(null);
    }
    if (id === "select") {
      setFreeText("");
    }
  }, []);

  const toggleTag = useCallback((key: string) => {
    bumpStatusAfterEdit();
    setTags((prev) => {
      const removing = prev.includes(key);
      const next = removing ? prev.filter((k) => k !== key) : [...prev, key];
      if (!removing) {
        setLastTag(key);
      } else {
        setLastTag(next.length ? next[next.length - 1]! : null);
      }
      return next;
    });
  }, [bumpStatusAfterEdit]);

  const validate = useCallback(() => {
    if (!expressionMode) {
      setClientError("בחר איך נוח לך להביע את עצמך.");
      return false;
    }
    if (!name.trim()) {
      setClientError("שם נדרש לפני שליחה.");
      return false;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setClientError("כתובת אימייל תקינה נדרשת לפני שליחה.");
      return false;
    }
    if ((faxHoneypotRef.current?.value ?? "").trim().length > 0) {
      setClientError(INTAKE_HONEYPOT_FAIL);
      return false;
    }
    if (!humanAnswer.trim()) {
      setClientError(INTAKE_HUMAN_EMPTY);
      return false;
    }
    if (!humanChallenge.verify(humanAnswer)) {
      setClientError(INTAKE_HUMAN_WRONG);
      return false;
    }
    const t = freeText.trim();
    if (expressionMode === "write" && t.length < 20) {
      setClientError("במצב כתיבה: כמה משפטים פתוחים (לפחות כ־20 תווים) כדי שיהיה מה להבין.");
      return false;
    }
    if (expressionMode === "select" && tags.length === 0) {
      setClientError("במצב סימון: סמן לפחות נושא אחד.");
      return false;
    }
    if (expressionMode === "select" && tags.includes("other")) {
      setClientError(
        'התג "משהו אחר" דורש משפט חופשי. עבור ל"גם וגם" או ל"כתיבה" ואז הרחב.',
      );
      return false;
    }
    if (expressionMode === "both") {
      if (tags.length === 0 && t.length < 15) {
        setClientError("במצב גם וגם: סמן נושא או כתוב לפחות שורה קצרה.");
        return false;
      }
    }
    if (expressionMode === "both" && tags.includes("other") && t.length < 12) {
      setClientError('סימנת "משהו אחר": כתוב לפחות משפט אחד שממקם את זה.');
      return false;
    }
    setClientError("");
    return true;
  }, [expressionMode, name, email, freeText, tags, humanAnswer, humanChallenge]);

  const buildBody = () => {
    const lines: string[] = [];
    lines.push("--- הכרות לפני שיחה | NeverMind ---");
    const modeLabel = MODE_OPTIONS.find((m) => m.id === expressionMode)?.title ?? expressionMode;
    lines.push(`איך נוח להביע: ${modeLabel}`);
    if (intent) {
      const il = INTENT_OPTIONS.find((x) => x.value === intent)?.label ?? intent;
      lines.push(`מה מחפשים עכשיו: ${il}`);
    }
    if ((expressionMode === "select" || expressionMode === "both") && tags.length) {
      const labels = tags
        .map((k) => TAG_DEFS.find((d) => d.key === k)?.label ?? k)
        .join(" · ");
      lines.push(`נושאים שסומנו: ${labels}`);
    }
    const includeFreeText = expressionMode === "write" || expressionMode === "both";
    if (includeFreeText && freeText.trim()) {
      lines.push("");
      lines.push("טקסט חופשי:");
      lines.push(freeText.trim());
    }
    if (phone.trim()) {
      lines.push("");
      lines.push(`טלפון (אופציונלי): ${phone.trim()}`);
    }
    return lines.join("\n");
  };

  const buildWhatsAppFullText = () => {
    const bodyText = buildBody();
    const lines = [
      "הכרות לפני שיחה | NeverMind",
      "",
      `שם: ${name.trim()}`,
      `אימייל: ${email.trim()}`,
      phone.trim() ? `טלפון: ${phone.trim()}` : "",
      "",
      bodyText,
    ].filter(Boolean);
    let t = lines.join("\n");
    if (t.length > WA_MAX_CHARS) {
      t = `${t.slice(0, WA_MAX_CHARS - 40)}\n\n[הודעה קוצרה — השלם בצ'אט]`;
    }
    return t;
  };

  const handleWhatsAppClick = () => {
    if (!validate()) return;
    const bodyText = buildBody();
    const tagLabels = tags.map((k) => TAG_DEFS.find((d) => d.key === k)?.label ?? k).join(" ");
    const spam = validateAntispamFields({
      botcheckValue: botcheckRef.current?.value ?? "",
      honeypotWebsiteValue: hpRef.current?.value ?? "",
      faxHoneypotValue: faxHoneypotRef.current?.value ?? "",
      startedAtMs: openedAtRef.current,
      messageTexts: [bodyText, name, email, phone, tagLabels],
    });
    if (!spam.ok) {
      setClientError(spam.userMessage);
      return;
    }
    if (!waDigits) {
      setClientError("מספר וואטסאפ לא מוגדר באתר. השתמש בשליחה רגילה.");
      return;
    }
    const text = buildWhatsAppFullText();
    const url = `https://wa.me/${waDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const bodyText = buildBody();
    const tagLabels = tags.map((k) => TAG_DEFS.find((d) => d.key === k)?.label ?? k).join(" ");
    const spam = validateAntispamFields({
      botcheckValue: botcheckRef.current?.value ?? "",
      honeypotWebsiteValue: hpRef.current?.value ?? "",
      faxHoneypotValue: faxHoneypotRef.current?.value ?? "",
      startedAtMs: openedAtRef.current,
      messageTexts: [bodyText, name, email, phone, tagLabels],
    });
    if (!spam.ok) {
      setClientError(spam.userMessage);
      return;
    }

    if (HCAPTCHA_SITE_KEY) {
      const t = hcaptchaToken?.trim() ?? "";
      if (!t) {
        setClientError("נא להשלים את האימות למטה.");
        return;
      }
    }

    setStatus("sending");
    const fd = new FormData();
    fd.append("access_key", WEB3FORMS_ACCESS_KEY);
    fd.append("subject", "הכרות לפני שיחה | NeverMind");
    fd.append("name", name.trim());
    fd.append("from_name", name.trim());
    fd.append("email", email.trim());
    fd.append("message", bodyText);
    fd.append("page", "intake");
    if (phone.trim()) {
      fd.append("phone", phone.trim());
    }
    fd.append("botcheck", botcheckRef.current?.value ?? "");
    fd.append("nm_hp_website", hpRef.current?.value ?? "");
    fd.append("nm_form_started_ms", String(openedAtRef.current));
    if (HCAPTCHA_SITE_KEY && hcaptchaToken?.trim()) {
      fd.append("h-captcha-response", hcaptchaToken.trim());
    }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fd,
      });
      let apiJson: { success?: boolean; message?: string } = {};
      try {
        apiJson = (await res.json()) as { success?: boolean; message?: string };
      } catch {
        apiJson = {};
      }
      const delivered = res.ok && apiJson.success === true;
      if (delivered) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        setFreeText("");
        setTags([]);
        setIntent("");
        setLastTag(null);
        setHumanAnswer("");
        setHcaptchaToken(null);
        try {
          hcaptchaRef.current?.resetCaptcha();
        } catch {
          /* ignore */
        }
        setStatus("ok");
        window.__nmHapticSuccess?.();
        window.dispatchEvent(new CustomEvent("nm-analytics", { detail: { name: "intake_form_submit" } }));
        (window as unknown as { __nmAnnounce?: (m: string) => void }).__nmAnnounce?.("השאלה נקלטה");
      } else {
        setStatus("idle");
        const hint =
          typeof apiJson.message === "string" && apiJson.message.trim().length > 0
            ? ` (${apiJson.message.trim()})`
            : "";
        setClientError(`השרת לא אישר קבלה${hint}. אפשר לנסות שוב או לשלוח בוואטסאפ.`);
      }
    } catch {
      setStatus("idle");
      setClientError("רשת או חסימה. אפשר לנסות שוב או לכתוב בוואטסאפ.");
    }
  };

  const showWrite = expressionMode === "write" || expressionMode === "both";
  const showTags = expressionMode === "select" || expressionMode === "both";

  const humanCheckFieldError =
    clientError === INTAKE_HUMAN_WRONG || clientError === INTAKE_HUMAN_EMPTY;

  return (
    <form
      id={formId}
      className="relative space-y-10 text-right"
      onSubmit={onSubmit}
      dir="rtl"
      noValidate
    >
      <input
        ref={botcheckRef}
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        defaultValue=""
        className="pointer-events-none absolute start-[10000px] top-0 h-px w-px overflow-hidden border-0 p-0 opacity-0"
      />
      <input
        ref={hpRef}
        type="text"
        name="nm_hp_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        title=""
        defaultValue=""
        className="pointer-events-none absolute start-[10000px] top-0 h-px w-px overflow-hidden border-0 p-0 opacity-0"
      />
      <input
        ref={faxHoneypotRef}
        type="text"
        name="fax_number"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        title=""
        defaultValue=""
        className="pointer-events-none absolute start-[10000px] top-0 h-px w-[1px] overflow-hidden border-0 p-0 [clip:rect(0,0,0,0)]"
      />

      <section className="space-y-4 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-bg-canvas)]/95 p-6">
        <h2 className="text-lg font-semibold text-[var(--nm-fg)]">איך נוח לך להביע את עצמך</h2>
        <p className="text-sm leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_68%,var(--nm-bg))]">
          בחר מצב אחד. אפשר לעבור ביניהם לפני שליחה.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((m) => {
            const active = expressionMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => applyExpressionMode(m.id)}
                className={`flex min-h-[100px] flex-col justify-between rounded-2xl border p-4 text-right transition ${
                  active
                    ? "border-[color-mix(in_srgb,var(--nm-accent)_40%,transparent)] bg-[var(--nm-tint)] shadow-sm"
                    : "border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/60 hover:border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)]"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nm-accent)]">
                  {active ? "נבחר" : "אפשרות"}
                </span>
                <span className="text-base font-semibold text-[var(--nm-fg)]">{m.title}</span>
                <span className="text-xs text-[color-mix(in_srgb,var(--nm-fg)_58%,var(--nm-bg))]">{m.body}</span>
              </button>
            );
          })}
        </div>
      </section>

      <aside
        aria-live="polite"
        className="rounded-2xl border border-[color-mix(in_srgb,var(--nm-accent)_22%,transparent)] bg-[var(--nm-tint)] px-4 py-3 text-sm leading-relaxed text-[var(--nm-fg)]"
      >
        <span className="font-semibold text-[var(--nm-accent)]">הערות בדרך · </span>
        {hintText}
      </aside>

      {expressionMode ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--nm-fg)]">מה מבקש להיראות עכשיו</h2>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[color-mix(in_srgb,var(--nm-fg)_72%,var(--nm-bg))]">
              כיוון כללי (לא חובה, ממקם את הפנייה בקריאה)
            </legend>
            <div className="flex flex-col gap-2">
              {INTENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--nm-fg)_8%,transparent)] bg-white/50 px-3 py-2"
                >
                  <input
                    type="radio"
                    name="intent"
                    value={opt.value}
                    checked={intent === opt.value}
                    onChange={() => {
                      setIntent(opt.value);
                      bumpStatusAfterEdit();
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-[var(--nm-fg)]">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      ) : null}

      {showTags ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--nm-fg)]">נושאים לסימון</h2>
          <p className="text-sm text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">
            לחיצה שנייה מבטלת. ההערות למטה משתנות לפי מה שסימנת לאחרונה.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {TAG_DEFS.map((t) => {
              const on = tags.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(t.key)}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    on
                      ? "border-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)] bg-[var(--nm-accent)] text-[var(--nm-on-accent)]"
                      : "border-[color-mix(in_srgb,var(--nm-fg)_12%,transparent)] bg-[var(--nm-surface-muted)] text-[var(--nm-fg)] hover:border-[color-mix(in_srgb,var(--nm-accent)_24%,transparent)]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {showWrite ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--nm-fg)]">מרחב פתוח</h2>
          <p className="text-sm text-[color-mix(in_srgb,var(--nm-fg)_62%,var(--nm-bg))]">
            {expressionMode === "write"
              ? "כאן אין צורך בסיכום יפה. מספיק כנות."
              : "אופציונלי אם בחרת גם סימון. אם משהו חשוב, שים כאן."}
          </p>
          <FloatingInput
            id={`${formId}-free`}
            name="freeText"
            label="מה שחשוב לך שיידעו לפני שיחה"
            multiline
            rows={8}
            value={freeText}
            onChange={(v) => {
              setFreeText(v);
              bumpStatusAfterEdit();
            }}
            dir="rtl"
            hideValidation
          />
        </section>
      ) : null}

      <section className="space-y-4 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-white/70 p-6">
        <h2 className="text-lg font-semibold text-[var(--nm-fg)]">איך לחזור אליך</h2>
        <FloatingInput
          id={`${formId}-name`}
          name="name"
          label="שם"
          value={name}
          onChange={(v) => {
            setName(v);
            bumpStatusAfterEdit();
          }}
          required
          dir="rtl"
          autoComplete="name"
          dataNameInput
        />
        <FloatingInput
          id={`${formId}-email`}
          name="email"
          label="אימייל"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            bumpStatusAfterEdit();
          }}
          required
          dir="rtl"
          autoComplete="email"
        />
        <FloatingInput
          id={`${formId}-phone`}
          name="phone"
          label="טלפון (אופציונלי)"
          type="tel"
          value={phone}
          onChange={(v) => {
            setPhone(v);
            bumpStatusAfterEdit();
          }}
          dir="rtl"
          autoComplete="tel"
        />
      </section>

      <section
        className="space-y-4 border border-black bg-white p-6 text-black"
        aria-labelledby={`${formId}-human-h`}
      >
        <h3 id={`${formId}-human-h`} className="text-lg font-semibold tracking-tight text-black">
          רגע של בהירות
        </h3>
        <p className="text-sm font-normal leading-relaxed text-black">
          בוטים עובדים על אוטומט. לצערי, גם רוב האנשים. בוא נוודא שאתה באמת נוכח כאן:
        </p>
        <p id={`${formId}-human-prompt`} className="text-base font-medium leading-snug text-black">
          {humanChallenge.prompt}
        </p>
        <div className="space-y-1">
          <label htmlFor={`${formId}-human`} className="sr-only">
            תשובה קצרה לשאלה למעלה
          </label>
          <input
            id={`${formId}-human`}
            name="intake_human_gate"
            type="text"
            value={humanAnswer}
            onChange={(e) => {
              setHumanAnswer(e.target.value);
              bumpStatusAfterEdit();
            }}
            autoComplete="off"
            dir="rtl"
            placeholder="מילה אחת של אמת..."
            aria-invalid={humanCheckFieldError || undefined}
            className={`w-full border-0 border-b-2 bg-white py-2 text-base text-black placeholder:text-neutral-500 outline-none ring-0 focus-visible:ring-0 ${
              humanCheckFieldError ? "border-red-600" : "border-black focus-visible:border-black"
            }`}
          />
        </div>
      </section>

      {HCAPTCHA_SITE_KEY ? (
        <div className="flex flex-col items-end gap-2 py-2" dir="rtl">
          <p className="text-xs text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">אימות לפני שליחה</p>
          <HCaptcha
            ref={hcaptchaRef}
            sitekey={HCAPTCHA_SITE_KEY}
            reCaptchaCompat={false}
            onVerify={(t) => setHcaptchaToken(t)}
            onExpire={() => setHcaptchaToken(null)}
            onError={() => setHcaptchaToken(null)}
          />
        </div>
      ) : null}

      {clientError ? (
        <p
          className={`text-sm font-semibold ${humanCheckFieldError ? "text-red-600" : "text-black"}`}
          role="alert"
        >
          {clientError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-stretch">
        <button
          type="submit"
          disabled={status === "sending"}
          data-nm-loading={status === "sending" ? "true" : undefined}
          data-nm-loading-label="מזקק את המנגנון..."
          className="relative min-h-[48px] w-full flex-1 rounded-full bg-[var(--nm-inverse)] px-6 py-4 text-xl font-bold text-[var(--nm-inverse-fg)] transition hover:bg-[var(--nm-accent)] disabled:opacity-60 sm:min-w-[12rem]"
        >
          {status === "sending" ? "מזקק את המנגנון..." : "שליחה למייל"}
        </button>
        <button
          type="button"
          onClick={handleWhatsAppClick}
          disabled={status === "sending"}
          className="min-h-[48px] w-full flex-1 rounded-full border-2 border-[color-mix(in_srgb,var(--nm-fg)_18%,transparent)] bg-[var(--nm-bg-canvas)] px-6 py-4 text-xl font-bold text-[var(--nm-fg)] transition hover:border-[color-mix(in_srgb,var(--nm-accent)_40%,transparent)] hover:bg-[var(--nm-tint)] disabled:opacity-60 sm:min-w-[12rem]"
        >
          שליחה לוואטסאפ (אותו תוכן)
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-[color-mix(in_srgb,var(--nm-fg)_55%,var(--nm-bg))]">
        שני הערוצים עוברים את אותו רגע בהירות ואת אותן בדיקות שקטות לפני פתיחה. בוואטסאפ נפתח חלון עם כל התוכן כטקסט אחד.
      </p>

      {status === "ok" ? (
        <p
          ref={successRef}
          tabIndex={-1}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--nm-fg)_10%,transparent)] bg-[var(--nm-surface-muted)] px-4 py-3 text-center text-sm font-semibold text-[var(--nm-fg)] outline-none ring-2 ring-transparent focus-visible:ring-[color-mix(in_srgb,var(--nm-accent)_35%,transparent)]"
          aria-live="polite"
        >
          התקבל. אם צריך עוד פרטים, נחזור למייל שציינת.
        </p>
      ) : null}
    </form>
  );
}
