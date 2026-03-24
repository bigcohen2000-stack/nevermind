import servicesConfig from "../config/services.json";
import appConfig from "../config/appConfig.json";

type ServicesConfig = typeof servicesConfig;
export type PaymentMethod = ServicesConfig["payment_methods"][number];
/** שלב במסלול — כולל social_proof אופציונלי ברמת השלב (מעבר לשירות בודד) */
export type ServiceStage = ServicesConfig["funnel_stages"][number] & {
  social_proof?: string | null;
};

/** זמינות מובנית (תאריך עדכון + מקומות) — תאימות: גם `availability_note` מחרוזת */
export type ServiceAvailability = {
  spots_left: number;
  updated_at: string;
  label?: string;
};

export type StageService = ServiceStage["services"][number] & {
  action_link?: string;
  action_href?: string;
  payment_link?: string;
  payment_flow?: "direct" | "after_interview" | string;
  payment_cta?: string;
  installments?: { count?: number; label?: string } | null;
  availability_note?: string;
  availability?: ServiceAvailability;
  social_proof?: string | null;
  whatsapp_template?: string | null;
  features?: Array<string | { text?: string; icon?: string }>;
};
export type AddOn = ServicesConfig["add_ons"][number];
export type ThoughtShift = ServicesConfig["trust_elements"]["thought_shifts"][number];
export type AuthoritySection = {
  title?: string;
  subtitle?: string;
  services?: StageService[];
};
export type FlatService = StageService & {
  stageName: string;
  targetAudience: string;
  action_link?: string;
  action_href?: string;
  availability_note?: string;
  availability?: ServiceAvailability;
  social_proof?: string | null;
  whatsapp_template?: string | null;
};

/** גילוי נאות ארוך — מקור: `trust_elements.disclaimer` ב־services.json */
export const disclaimerLong =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_full?.toString?.() ||
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer?.toString?.() ||
  "";

/** שורה מתחת לכל כפתור פעולה בכרטיס שירות */
export const disclaimerShort =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_short?.toString?.() ||
  "זהו הסבר פרספקטיבה אישית, לא טיפול.";

/** תבנית ברירת מחדל לוואטסאפ מדף שירותים (אם חסר `whatsapp_template` ב־JSON) */
export const defaultWhatsappServiceTemplate =
  "שלום, הגעתי מדף השירותים ב-NeverMind.\n\nמתעניין ב: {title} ({price} ₪)\n\nהנושא שאני רוצה לפרק: ";

/** מפת אייקונים לפיצ'רים */
export const featureIcons: Record<string, string> = {
  default: "✓",
  phone: "📱",
  location: "📍",
  privacy: "🔒",
  time: "⏱",
  group: "👥",
  video: "🎥",
  whatsapp: "💬",
  content: "📖",
  recurring: "🔄",
};

export const servicesCurrency = servicesConfig.currency;
export const servicesTaxLabel = servicesConfig.tax_label;
export const servicesHero = servicesConfig.hero;
export const servicesStages = servicesConfig.funnel_stages as ServiceStage[];
export const servicesAddOns = servicesConfig.add_ons;
export const servicesAuthoritySection = ((servicesConfig as Record<string, unknown>).authority_section ??
  null) as AuthoritySection | null;
export const servicesTrust = servicesConfig.trust_elements;
export const servicesThoughtShifts = servicesConfig.trust_elements.thought_shifts as ThoughtShift[];
export const servicesPaymentMethods = servicesConfig.payment_methods as PaymentMethod[];

export const formatMoney = (value: number) => `${Math.round(value).toLocaleString("he-IL")} ${servicesCurrency}`;
export const getNetPrice = (grossPrice: number, taxPercent: number) => Math.round(grossPrice / (1 + taxPercent / 100));
export const getVatAmount = (grossPrice: number, taxPercent: number) => grossPrice - getNetPrice(grossPrice, taxPercent);

export const flattenVisibleServices = (): FlatService[] =>
  servicesStages.flatMap((stage: ServiceStage) =>
    stage.services
      .filter((service: StageService) => service.visible !== false)
      .map((service: StageService) => ({
        ...service,
        stageName: stage.stage_name,
        targetAudience: stage.target_audience,
      }))
  );

export const findServiceById = (id: string) => flattenVisibleServices().find((service) => service.id === id);

export const buildWhatsAppHref = (message: string) =>
  `https://wa.me/${appConfig.contact.whatsAppNumber}?text=${encodeURIComponent(message)}`;

/** שאלה לפני התחלה — שם השירות משובץ בהודעה (מקודד ל־URL) */
export function buildServicePreStartWhatsAppHref(serviceName: string): string {
  const name = serviceName.trim() || "השירות";
  const preface = buildWhatsAppCrmPreface(name);
  const message = `${preface}\n\nהיי יקיר, אני קורא עכשיו על ${name} ומשהו שם סיקרן אותי. אפשר לשאול שאלה קטנה לפני שממשיכים?`;
  return buildWhatsAppHref(message);
}

/** תאריך/שעה בעברית לשורת זמינות (מבוסס שעון הדפדפן / שרת לפי מחרוזת ISO) */
export function formatAvailabilityDateHebrew(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const day = date.getDay();
  const prefix = day === 6 ? 'מוצ"ש' : `יום ${days[day]}`;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `עודכן ${prefix} ${hours}:${minutes}`;
}

/** שורת זמינות מלאה לתצוגה (אובייקט או מחרוזת legacy) */
export function formatAvailabilityLine(service: StageService | FlatService): string | null {
  const av = service.availability;
  if (av && typeof av.spots_left === "number" && typeof av.updated_at === "string" && av.updated_at.trim()) {
    const label = (av.label?.trim() || "נותרו").trim();
    const n = av.spots_left;
    const unit = n === 1 ? "מקום" : "מקומות";
    const datePart = formatAvailabilityDateHebrew(av.updated_at.trim());
    if (!datePart) return `${label} ${n} ${unit}`;
    return `${label} ${n} ${unit} · ${datePart}`;
  }
  const legacy = service.availability_note?.trim();
  return legacy || null;
}

/** תצוגת זמינות בפורמט חדש */
export function formatAvailabilityLabel(spotsLeft: number, updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return `נותרו ${spotsLeft} מקומות`;
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const day = days[date.getDay()];
  const prefix = date.getDay() === 6 ? 'מוצ"ש' : `יום ${day}`;
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `נותרו ${spotsLeft} מקומות · עודכן ${prefix} ${hh}:${mm}`;
}

function applyWhatsappTemplate(template: string, service: StageService | FlatService): string {
  const price = Math.round(service.price_full).toLocaleString("he-IL");
  return template.replace(/\{title\}/g, service.title).replace(/\{price\}/g, price);
}

/** קישור וואטסאפ לשירות — תבנית מה־JSON או ברירת מחדל, אחרת הודעה כללית */
export function buildServiceWhatsAppHref(service: StageService | FlatService): string {
  const raw = (service.whatsapp_template ?? defaultWhatsappServiceTemplate).trim();
  if (raw) {
    return buildWhatsAppHref(applyWhatsappTemplate(raw, service));
  }
  const actionText = service.action_text || `אני רוצה להתקדם עם ${service.title}`;
  const defaultMessage = `שלום, אני רוצה להתקדם עם ${service.title}. ראיתי את המסלול באתר במחיר ${formatMoney(service.price_full)}. אפשר לשלוח לי את הפרטים המלאים?`;
  return buildWhatsAppHref(actionText === service.action_text ? `${actionText}. ${defaultMessage}` : defaultMessage);
}

/** התראת עניין בשירות (best-effort, לא לשבור UX) */
export async function notifyServiceInterest(params: {
  serviceId: string;
  serviceTitle: string;
  flow: string;
}): Promise<void> {
  try {
    const formData = new FormData();
    formData.append("access_key", "94b32b6c-7590-4ac6-b8b4-1bc73dd2e5c8");
    formData.append("subject", `NeverMind - עניין ב: ${params.serviceTitle}`);
    formData.append("message", `שירות: ${params.serviceId}\nזרימה: ${params.flow}\nזמן: ${new Date().toISOString()}`);
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });
  } catch {
    // silent fail
  }
}

const WA_CRM_TAGLINE = "מחשבה אחת נקייה – ישר לוואטסאפ";

/** שורת CRM לפרסור: מקור + טון קבוע */
export function buildWhatsAppCrmPreface(sourceTitle: string): string {
  const title = String(sourceTitle || "NeverMind").trim() || "NeverMind";
  return `[Lead | Source: ${title}]\n${WA_CRM_TAGLINE}`;
}

/** הודעת וואטסאפ אחידה לתיאום פגישה ממאמר */
export function buildArticleMeetingWhatsAppMessage(params: { title: string; slug: string }): string {
  const preface = buildWhatsAppCrmPreface(params.title);
  const body = `היי, הגעתי מהמאמר "${params.title}" (${params.slug}) ואני רוצה לתאם פגישה.`;
  return `${preface}\n\n${body}`;
}

/** טקסט ליד קונטקסטואלי לפי תגית ראשונה מה-frontmatter (או נושא/כותרת גיבוי) */
export const buildArticleContextLeadMessage = (opts: {
  tags?: string[];
  topic?: string;
  articleTitle?: string;
}): string => {
  const tagList = opts.tags ?? [];
  const firstFromTags = tagList.map((t) => String(t).trim()).find(Boolean) ?? "";
  const topicTrim = (opts.topic ?? "").trim();
  const subjectLabel = topicTrim || firstFromTags;
  const titleTrim = (opts.articleTitle ?? "").trim();
  const sourceTitle = titleTrim || subjectLabel || "NeverMind";
  const preface = buildWhatsAppCrmPreface(sourceTitle);
  if (subjectLabel) {
    return `${preface}\n\nהיי יקיר, קראתי את המאמר בנושא ${subjectLabel} ורציתי להתייעץ...`;
  }
  if (titleTrim) {
    return `${preface}\n\nהיי יקיר, קראתי את המאמר "${titleTrim}" ורציתי להתייעץ...`;
  }
  return `${preface}\n\nהיי יקיר, קראתי מאמר באתר NeverMind ורציתי להתייעץ...`;
};

export const buildArticleContextWhatsAppHref = (
  opts: Parameters<typeof buildArticleContextLeadMessage>[0]
) => buildWhatsAppHref(buildArticleContextLeadMessage(opts));

/** שורת הקשר קצרה בלי פתיח - לשילוב בהודעות ארוכות (מילוי שדות וכו׳) */
export const buildArticleReadContextLine = (
  opts: Parameters<typeof buildArticleContextLeadMessage>[0]
): string => {
  const tagList = opts.tags ?? [];
  const firstFromTags = tagList.map((t) => String(t).trim()).find(Boolean) ?? "";
  const topicTrim = (opts.topic ?? "").trim();
  const subjectLabel = topicTrim || firstFromTags;
  if (subjectLabel) {
    return `קראתי את המאמר בנושא ${subjectLabel}.`;
  }
  const titleTrim = (opts.articleTitle ?? "").trim();
  if (titleTrim) {
    return `קראתי את המאמר "${titleTrim}".`;
  }
  return "קראתי מאמר באתר NeverMind.";
};

const HEBREW_TITLE_ONLY_REGEX = /^[\u0590-\u05FF\s\-.,'"!?()]+$/;
const SAFE_SLUG_REGEX = /^[a-z0-9-]+$/;
const HAS_HEBREW_REGEX = /[\u0590-\u05FF]/;
const HAS_LATIN_REGEX = /[A-Za-z]/;

export function slugifyTitle(value: string): string {
  const ascii = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii;
}

export function validateSlug(
  slug: string,
  title: string
): { valid: true; suggested?: string } | { valid: false; error: string } {
  const trimmedSlug = String(slug || "").trim();
  const trimmedTitle = String(title || "").trim();

  if (!trimmedSlug) {
    const isHebrewOnlyTitle = Boolean(trimmedTitle) && HEBREW_TITLE_ONLY_REGEX.test(trimmedTitle);
    const hasHebrew = HAS_HEBREW_REGEX.test(trimmedTitle);
    const hasLatin = HAS_LATIN_REGEX.test(trimmedTitle);
    if (isHebrewOnlyTitle) {
      return {
        valid: false,
        error: "כותרת בעברית מחייבת slug באנגלית לפני ייצוא",
      };
    }
    const suggested = slugifyTitle(trimmedTitle);
    if (hasHebrew && hasLatin && suggested) {
      return {
        valid: false,
        error:
          "הכותרת כוללת עברית - ה-Slug האוטומטי חלקי. נא להזין Slug ידני באנגלית שמתאר את נושא המאמר",
      };
    }
    return suggested ? { valid: true, suggested } : { valid: true };
  }

  if (!SAFE_SLUG_REGEX.test(trimmedSlug)) {
    return {
      valid: false,
      error: "Slug חייב להכיל אותיות אנגליות קטנות, מספרים ומקפים בלבד",
    };
  }

  return { valid: true };
}

export const resolveServiceAction = (service: StageService | FlatService) => {
  const actionText = service.payment_cta || service.action_text || `אני רוצה להתקדם עם ${service.title}`;

  if (service.payment_flow === "direct" && typeof service.payment_link === "string" && service.payment_link.trim()) {
    return {
      href: service.payment_link.trim(),
      external: true,
      label: actionText,
      kind: "payment" as const,
      flow: service.payment_flow,
    };
  }

  if (service.action_type === "payment" && typeof service.payment_link === "string" && service.payment_link.trim()) {
    return {
      href: service.payment_link.trim(),
      external: true,
      label: actionText,
      kind: "payment" as const,
      flow: service.payment_flow ?? "direct",
    };
  }

  if (service.action_type === "link" && typeof service.action_href === "string" && service.action_href.trim()) {
    return {
      href: service.action_href.trim(),
      external: false,
      label: actionText,
      kind: "link" as const,
      flow: service.payment_flow ?? "link",
    };
  }

  if (service.action_type === "invoice" && typeof service.action_link === "string" && service.action_link.trim()) {
    return {
      href: service.action_link,
      external: true,
      label: actionText,
      kind: "invoice" as const,
      flow: service.payment_flow ?? "invoice",
    };
  }

  return {
    href: buildServiceWhatsAppHref(service),
    external: true,
    label: actionText,
    kind: "whatsapp" as const,
    flow: service.payment_flow ?? "whatsapp",
  };
};
