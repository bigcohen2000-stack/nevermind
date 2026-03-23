import servicesConfig from "../config/services.json";
import appConfig from "../config/appConfig.json";

type ServicesConfig = typeof servicesConfig;
export type PaymentMethod = ServicesConfig["payment_methods"][number];
export type ServiceStage = ServicesConfig["funnel_stages"][number];

/** זמינות מובנית (תאריך עדכון + מקומות) — תאימות: גם `availability_note` מחרוזת */
export type ServiceAvailability = {
  spots_left: number;
  updated_at: string;
  label?: string;
};

export type StageService = ServiceStage["services"][number] & {
  action_link?: string;
  action_href?: string;
  availability_note?: string;
  availability?: ServiceAvailability;
  social_proof?: string | null;
  whatsapp_template?: string | null;
};
export type AddOn = ServicesConfig["add_ons"][number];
export type ThoughtShift = ServicesConfig["trust_elements"]["thought_shifts"][number];
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
export const disclaimerLong = servicesConfig.trust_elements.disclaimer;

/** שורה מתחת לכל כפתור פעולה בכרטיס שירות */
export const disclaimerShort = "זהו הסבר פרספקטיבה אישית, לא טיפול.";

/** תבנית ברירת מחדל לוואטסאפ מדף שירותים (אם חסר `whatsapp_template` ב־JSON) */
export const defaultWhatsappServiceTemplate =
  "שלום, הגעתי מדף השירותים ב-NeverMind.\n\nמתעניין ב: {title} ({price} ₪)\n\nהנושא שאני רוצה לפרק: ";

export const servicesCurrency = servicesConfig.currency;
export const servicesTaxLabel = servicesConfig.tax_label;
export const servicesHero = servicesConfig.hero;
export const servicesStages = servicesConfig.funnel_stages;
export const servicesAddOns = servicesConfig.add_ons;
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

/** הודעת וואטסאפ אחידה לתיאום פגישה ממאמר */
export function buildArticleMeetingWhatsAppMessage(params: { title: string; slug: string }): string {
  return `היי, הגעתי מהמאמר "${params.title}" (${params.slug}) ואני רוצה לתאם פגישה.`;
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
  if (subjectLabel) {
    return `היי יקיר, קראתי את המאמר בנושא ${subjectLabel} ורציתי להתייעץ...`;
  }
  const titleTrim = (opts.articleTitle ?? "").trim();
  if (titleTrim) {
    return `היי יקיר, קראתי את המאמר "${titleTrim}" ורציתי להתייעץ...`;
  }
  return "היי יקיר, קראתי מאמר באתר NeverMind ורציתי להתייעץ...";
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

export const resolveServiceAction = (service: StageService | FlatService) => {
  const actionText = service.action_text || `אני רוצה להתקדם עם ${service.title}`;
  const defaultMessage = `שלום, אני רוצה להתקדם עם ${service.title}. ראיתי את המסלול באתר במחיר ${formatMoney(service.price_full)}. אפשר לשלוח לי את הפרטים המלאים?`;

  if (service.action_type === "link" && typeof service.action_href === "string" && service.action_href.trim()) {
    return {
      href: service.action_href.trim(),
      external: false,
      label: actionText,
      kind: "link" as const,
    };
  }

  if (service.action_type === "invoice" && typeof service.action_link === "string" && service.action_link.trim()) {
    return {
      href: service.action_link,
      external: true,
      label: actionText,
      kind: "invoice" as const,
    };
  }

  return {
    href: buildServiceWhatsAppHref(service),
    external: true,
    label: actionText,
    kind: "whatsapp" as const,
  };
};
