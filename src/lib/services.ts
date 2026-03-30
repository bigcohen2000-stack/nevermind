import servicesConfig from "../config/services.json";
import appConfig from "../config/appConfig.json";

type ServicesConfig = typeof servicesConfig;
export type PaymentMethod = ServicesConfig["payment_methods"][number];
/** שלב במסלול. כולל social_proof אופציונלי ברמת השלב (מעבר לשירות בודד) */
export type ServiceStage = ServicesConfig["funnel_stages"][number] & {
  social_proof?: string | null;
};

/** זמינות מובנית (תאריך עדכון + מקומות). תאימות: גם `availability_note` מחרוזת */
export type ServiceAvailability = {
  spots_left: number;
  updated_at?: string;
  label?: string;
};

/** הרחבת מחיר/אורך לשירות (טלפון, אולפן, מנוי) */
export type ServiceExtension = {
  id: string;
  label: string;
  price: number;
  description: string;
  action_text: string;
  /** אם true: מחיר מוצג = מחיר בסיס + price */
  price_additive?: boolean;
};

export type StageService = ServiceStage["services"][number] & {
  action_type?: "whatsapp" | "payment" | "link" | "invoice" | string;
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
  friendly_note?: string;
  /** מה קורה בפועל (3), מתאים כש (2), לא מתאים כש (1) — כרטיס מחירון */
  what_happens?: string[];
  fits_when?: string[];
  not_when?: string;
  extensions?: ServiceExtension[];
  /** אם true: בוחרים תחילה הרחבה (בלי ברירת מחדל), ואז נפתחים מחיר וכפתורים — כמו שלבים בטופס */
  extensions_gated?: boolean;
  update?: boolean;
  override_on_extension?: boolean;
};

export type PremiumMemberPriceRow = { service_id: string; member_price: number; label: string };
export type PremiumExclusiveCard = {
  title: string;
  summary: string;
  href: string;
  cta_label: string;
};
export type PremiumBonusesConfig = {
  section_title?: string;
  section_intro?: string;
  exclusive?: PremiumExclusiveCard[];
  member_prices?: PremiumMemberPriceRow[];
};

export const getPremiumBonuses = (): PremiumBonusesConfig => {
  const raw = (servicesConfig as Record<string, unknown>).premium_bonuses;
  if (!raw || typeof raw !== "object") return { exclusive: [], member_prices: [] };
  return raw as PremiumBonusesConfig;
};
export type AddOn = { id?: string; title?: string; description?: string; price?: number; [key: string]: unknown };
export type ThoughtShift = { before?: string; after?: string; title?: string; body?: string; [key: string]: unknown };
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

/** גילוי נאות ארוך. מקור: `trust_elements.disclaimer` ב־services.json */
export const disclaimerLong =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_full?.toString?.() ||
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer?.toString?.() ||
  "";

/** שורה מתחת לכל כפתור פעולה בכרטיס שירות */
export const disclaimerShort =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_short?.toString?.() ||
  "זהו הסבר פרספקטיבה אישית, לא שיפוט קליני.";

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

/** מחיר ייחוס לתצוגה (לפני הנחת בוטיק מוצגת) — התשלום בפועל נשאר לפי price_full ב־JSON */
export function getBoutiqueReferenceListPrice(chargePrice: number): number | null {
  const raw = (servicesConfig as Record<string, unknown>).boutique_display_discount_percent;
  const pct = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw) : 0;
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 50) return null;
  return Math.round(chargePrice / (1 - pct / 100));
}
const DEFAULT_CONTENT_GAP_MESSAGE =
  "חיפשתי בארכיון, וראיתי שעוד לא יצא לי להקליט או לכתוב משהו ספציפי על זה. זה דווקא מעניין, אם תרצה נוכל לדבר על זה רגע יחד. לפעמים ככה נולדים התכנים הכי טובים כאן, וזה נוגע גם לאחרים. אפשר גם באנונימיות מלאה, מה שנוח לך. מה דעתך?";

export const servicesContentGapMessage =
  (servicesConfig as Record<string, unknown>).content_gap_message?.toString?.()?.trim() ||
  DEFAULT_CONTENT_GAP_MESSAGE;

export type EngagementSectionCard = {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
};

export type EngagementSectionsMap = {
  studio: EngagementSectionCard;
  talk: EngagementSectionCard;
  archive: EngagementSectionCard;
  philosophy: EngagementSectionCard;
};

const defaultEngagementSections: EngagementSectionsMap = {
  studio: {
    title: "אולפן פודקאסט",
    body: "מגיעים לאולפן פודקאסט אמיתי ונוכחים לשיחה מרתקת על כל תחומי החיים. אפשר לדבר בלי להיות מצולמים - אנונימיות מלאה אם תרצה. אפשר גם לבקש עיוות קול: לטובתך ולטובת כולם - כי אם תרצה לשתף חבר שעובר את אותו הדבר, הסרטונים יעזרו לו בדיוק כמו שעזרו לך.",
    ctaHref: "/services/#balcony-experience",
    ctaLabel: "לפרטים על האולפן",
  },
  talk: {
    title: "שיחה של 20 דקות",
    body: "בוא נמצא זמן שנוח לך ולי ונשוחח 20 דקות על מה שתרצה. אם תרצה לשמוע רעיונות חדשים, את דעתי על משהו ספציפי, או שאמפה איפה עוד אפשר לפתח ולחדד את החשיבה - זה בדיוק מה שאני כאן.",
    ctaHref: "/services/#phone-perspective",
    ctaLabel: "לקביעת שיחה",
  },
  archive: {
    title: "ארכיון NeverMind",
    body: "גישה לכל המאמרים והסרטונים באתר - כולל הפודקאסט המלא ויותר מ-12,000 שעות תוכן על כל נושאי החיים. פותחים נושאים מורכבים: דת, סמים, התמכרויות, סקס, זוגיות, פורנו ואהבה אמיתית.",
    ctaHref: "/services/#portal-access",
    ctaLabel: "למנוי הארכיון",
  },
  philosophy: {
    title: "איך זה עובד כאן",
    body: "זה לא עוד המלצה. זו הבנה עמוקה של מה שכבר קיים, ופתיחה לאפשרויות חדשות - אם תרצה.",
    ctaHref: "/services/",
    ctaLabel: "למרחב הגילוי",
  },
};

export const servicesEngagementSections: EngagementSectionsMap = (() => {
  const raw = (servicesConfig as Record<string, unknown>).engagement_sections as Partial<EngagementSectionsMap> | undefined;
  if (!raw || typeof raw !== "object") return defaultEngagementSections;
  return {
    studio: { ...defaultEngagementSections.studio, ...(raw.studio ?? {}) },
    talk: { ...defaultEngagementSections.talk, ...(raw.talk ?? {}) },
    archive: { ...defaultEngagementSections.archive, ...(raw.archive ?? {}) },
    philosophy: { ...defaultEngagementSections.philosophy, ...(raw.philosophy ?? {}) },
  };
})();

export const servicesHero = servicesConfig.hero;
export const servicesStages = servicesConfig.funnel_stages as ServiceStage[];
export const servicesAddOns = ((servicesConfig as Record<string, unknown>).add_ons as AddOn[] | undefined) ?? [];
export const servicesAuthoritySection = ((servicesConfig as Record<string, unknown>).authority_section ??
  null) as AuthoritySection | null;
export const servicesTrust = servicesConfig.trust_elements;
export const servicesThoughtShifts =
  ((servicesConfig.trust_elements as Record<string, unknown>).thought_shifts as ThoughtShift[] | undefined) ?? [];
export const servicesPaymentMethods = servicesConfig.payment_methods as PaymentMethod[];

export type TopicLandingCtaButton = {
  text: string;
  plan: string;
  price: number;
};

export type TopicLandingHeader = {
  label: string;
  title: string;
  subtitle: string;
  cta_buttons: TopicLandingCtaButton[];
};

export type ServicesTopicLandingConfig = {
  update?: boolean;
  extend?: boolean;
  override_base_cta?: boolean;
  override_on_extension?: boolean;
  topic_header: TopicLandingHeader;
  pricing: { monthly: number; yearly: number; two_years: number };
};

const defaultTopicLanding: ServicesTopicLandingConfig = {
  update: true,
  extend: true,
  override_base_cta: false,
  override_on_extension: true,
  topic_header: {
    label: "הנחה למנוי שנתי · לזמן מוגבל",
    title: "ללמוד את השיטה NEVERMIND",
    subtitle:
      "אם הגעת לכאן בגלל {topic}, יש סיכוי טוב שהתשובה כבר מחכה בארכיון. המנוי פותח לך גישה לכל החקירות, לכל התכנים, לכל השאלות, בלי הגבלה.",
    cta_buttons: [
      { text: "מנוי חודשי · 175 ₪", plan: "monthly", price: 175 },
      { text: "מנוי שנתי · 1,850 ₪", plan: "yearly", price: 1850 },
      { text: "מנוי לשנתיים · 3,450 ₪", plan: "two_years", price: 3450 },
    ],
  },
  pricing: { monthly: 175, yearly: 1850, two_years: 3450 },
};

export const servicesTopicLanding: ServicesTopicLandingConfig = (() => {
  const raw = (servicesConfig as Record<string, unknown>).topic_landing as Partial<ServicesTopicLandingConfig> | undefined;
  if (!raw || typeof raw !== "object" || !raw.topic_header || !raw.pricing) {
    return defaultTopicLanding;
  }
  const th = raw.topic_header;
  const buttons = Array.isArray(th.cta_buttons) ? th.cta_buttons : defaultTopicLanding.topic_header.cta_buttons;
  return {
    ...defaultTopicLanding,
    ...raw,
    topic_header: {
      ...defaultTopicLanding.topic_header,
      ...th,
      label: typeof th.label === "string" && th.label.trim() ? th.label.trim() : defaultTopicLanding.topic_header.label,
      title: typeof th.title === "string" && th.title.trim() ? th.title.trim() : defaultTopicLanding.topic_header.title,
      subtitle:
        typeof th.subtitle === "string" && th.subtitle.trim()
          ? th.subtitle.trim()
          : defaultTopicLanding.topic_header.subtitle,
      cta_buttons: (() => {
        const filtered = buttons.filter(
          (b): b is TopicLandingCtaButton =>
            Boolean(
              b && typeof b.text === "string" && b.text.trim() && typeof b.plan === "string" && typeof b.price === "number"
            )
        );
        return filtered.length > 0 ? filtered : defaultTopicLanding.topic_header.cta_buttons;
      })(),
    },
    pricing: {
      ...defaultTopicLanding.pricing,
      ...raw.pricing,
    },
  };
})();

/** מילוי {topic} בכותרת משנה של כניסת topic */
export function formatTopicLandingSubtitle(template: string, topic: string): string {
  const t = topic.trim() || "מה שחיפשת";
  return template.replace(/\{topic\}/g, t);
}

/** מחיר לתצוגה: מספר ממוספר + רווח לא שביר לפני ₪ */
export const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString("he-IL")}\u00A0${servicesCurrency}`;
export const getNetPrice = (grossPrice: number, taxPercent: number) => Math.round(grossPrice / (1 + taxPercent / 100));
export const getVatAmount = (grossPrice: number, taxPercent: number) => grossPrice - getNetPrice(grossPrice, taxPercent);

export const flattenVisibleServices = (): FlatService[] =>
  servicesStages.flatMap((stage) =>
    stage.services
      .filter((service) => service.visible !== false)
      .map(
        (service) =>
          ({
            ...service,
            stageName: stage.stage_name,
            targetAudience: stage.target_audience,
          }) as FlatService
      )
  );

export const findServiceById = (id: string) => flattenVisibleServices().find((service) => service.id === id);

/** מנקה רווחים כפולים, שורות ריקות ורעש לפני encodeURIComponent */
export function normalizeWhatsAppMessageBody(raw: string): string {
  const s = String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = s
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter((line) => line.length > 0);
  let out = lines.join("\n").trim();
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/\.{3,}/g, ".");
  return out;
}

export const buildWhatsAppHref = (message: string) => {
  const normalized = normalizeWhatsAppMessageBody(message);
  return `https://wa.me/${appConfig.contact.whatsAppNumber}?text=${encodeURIComponent(normalized)}`;
};

/** וואטסאפ בסוף מאמר: ניסוח שימור קצר + כותרת + קישור */
export function buildRetentionArticleWhatsAppHref(articleTitle: string, articleUrl: string): string {
  const t = String(articleTitle || "").trim() || "מאמר";
  const u = String(articleUrl || "").trim();
  const body = u ? `אם זה הזיז משהו - בוא נדבר על זה\n\n${t}\n${u}` : `אם זה הזיז משהו - בוא נדבר על זה\n\n${t}`;
  return buildWhatsAppHref(body);
}

/** שאלה לפני התחלה. שם השירות משובץ בהודעה (מקודד ל־URL) */
export function buildServicePreStartWhatsAppHref(serviceName: string): string {
  const name = serviceName.trim() || "השירות";
  const preface = buildWhatsAppCrmPreface(name);
  const message = `${preface}\n\nהיי השם לא משנה, אני קורא עכשיו על ${name} ומשהו שם סיקרן אותי. אפשר לשאול שאלה קטנה לפני שממשיכים?`;
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

function applyWhatsappTemplate(
  template: string,
  service: StageService | FlatService,
  extensionLabel?: string
): string {
  const price = Math.round(service.price_full).toLocaleString("he-IL");
  const label = (extensionLabel ?? "").trim() || "בסיס";
  return template
    .replace(/\{title\}/g, service.title)
    .replace(/\{price\}/g, price)
    .replace(/\{label\}/g, label);
}

/** מחיר אפקטיבי לפי הרחבה (מלא או תוספת על בסיס) */
export function effectiveExtensionPrice(basePrice: number, ext: ServiceExtension | null | undefined): number {
  if (!ext) return basePrice;
  if (ext.price_additive === true) return basePrice + ext.price;
  return ext.price;
}

/** עותק שירות עם מחיר ו־CTA מותאמים לבחירת הרחבה */
export function mergeServiceWithExtension(
  service: StageService | FlatService,
  ext: ServiceExtension | null
): FlatService {
  const price_full = effectiveExtensionPrice(service.price_full, ext);
  const base = { ...service, price_full } as FlatService;
  if (ext && service.override_on_extension === true) {
    base.action_text = ext.action_text;
    base.payment_cta = ext.action_text;
  }
  return base;
}

/** הודעת כפתור בואו נבדוק בוואטסאפ (מחיר ב־Ref פנימי בלבד) */
export function buildServiceProposalWhatsAppMessage(args: {
  serviceTitle: string;
  extensionLabel: string;
  userFocus?: string;
  priceGross: number;
  includeCrmPreface?: boolean;
}): string {
  const serviceName = (args.serviceTitle || "").trim() || "השירות";
  const extensionName = (args.extensionLabel || "").trim() || "בסיס";
  const focusRaw = (args.userFocus ?? "").replace(/[\t ]+/g, " ").trim();
  const refN = Math.max(0, Math.round(Number(args.priceGross) || 0));

  const chunks: string[] = [];
  if (args.includeCrmPreface !== false) {
    chunks.push(buildWhatsAppCrmPreface(serviceName));
    chunks.push("");
  }
  chunks.push(`שלום, ראיתי את האפשרות של ${serviceName} עם הרחבת ${extensionName}.`);
  if (focusRaw.length > 0) {
    const focusSentence = /[.!?]$/.test(focusRaw) ? focusRaw : `${focusRaw}.`;
    chunks.push(`אני רוצה להתמקד ב: ${focusSentence}`);
  }
  chunks.push("מתי נוכל להתקדם?");
  chunks.push(`(Ref: NM-${refN})`);

  return normalizeWhatsAppMessageBody(chunks.join("\n"));
}

export function buildServiceProposalWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null,
  userFocus?: string
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const extLabel = selectedExtension?.label?.trim() || "בסיס";
  const message = buildServiceProposalWhatsAppMessage({
    serviceTitle: service.title,
    extensionLabel: extLabel,
    userFocus,
    priceGross: merged.price_full,
    includeCrmPreface: true,
  });
  return buildWhatsAppHref(message);
}

/** קישור וואטסאפ לשירות. תבנית מה־JSON או ברירת מחדל, אחרת הודעה כללית */
export function buildServiceWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const raw = (service.whatsapp_template ?? defaultWhatsappServiceTemplate).trim();
  if (raw) {
    return buildWhatsAppHref(applyWhatsappTemplate(raw, merged, selectedExtension?.label));
  }
  const actionText = merged.action_text || `אני רוצה להתקדם עם ${service.title}`;
  const defaultMessage = `שלום, אני רוצה להתקדם עם ${merged.title}. ראיתי את המסלול באתר במחיר ${formatMoney(merged.price_full)}. אפשר לבדוק יחד את הפרטים המלאים?`;
  return buildWhatsAppHref(
    actionText === (service.action_text || "") ? `${actionText}. ${defaultMessage}` : defaultMessage
  );
}

export function buildServiceActionWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const preface = buildWhatsAppCrmPreface(service.title);
  const paymentLink = typeof service.payment_link === "string" ? service.payment_link.trim() : "";
  const actionLine = merged.action_text?.trim() || `אני רוצה להתקדם עם ${service.title}`;
  const paymentLine = paymentLink ? `לינק תשלום לשלב הבא: ${paymentLink}` : "אשמח ללינק תשלום אחרי התאמה קצרה.";
  const variant =
    selectedExtension?.label?.trim() ? `\nאופציה נבחרה: ${selectedExtension.label.trim()}` : "";
  const body = `${actionLine}${variant}\nמחיר: ${formatMoney(merged.price_full)}\n${paymentLine}`;
  return buildWhatsAppHref(`${preface}\n\n${body}`);
}

/** שיריון / התעניינות: פירוט חבילה ולינק תשלום רק בהקשר שיחה סגורה */
export function buildServiceReservationWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const preface = buildWhatsAppCrmPreface(service.title);
  const price = formatMoney(merged.price_full);
  const paymentLink = typeof service.payment_link === "string" ? service.payment_link.trim() : "";
  const featureLines = Array.isArray(service.features)
    ? service.features.map((f) => (typeof f === "string" ? f : f.text ?? "").trim()).filter(Boolean)
    : [];
  const includesLine =
    featureLines.length > 0
      ? `מה זה כולל בפועל: ${featureLines.slice(0, 6).join(" · ")}`
      : service.subtitle?.trim()
        ? `מה זה כולל בפועל: ${service.subtitle.trim()}`
        : "";
  const paymentLine = paymentLink
    ? `לינק לתשלום מאושר (מיועד להמשך רק בתוך השיחה הזו אחרי התאמה קצרה, לא כפרסום חיצוני): ${paymentLink}`
    : "מבקש לינק תשלום מאושר אחרי תיאום קצר כאן בשיחה.";
  const variantLine = selectedExtension?.label?.trim()
    ? `אופציה: ${selectedExtension.label.trim()}`
    : "";
  const body = [
    `היי, אני מתעניין ב${service.title} (${price}).`,
    variantLine,
    includesLine,
    paymentLine,
    "",
    "אם זה לא רלוונטי — תגיב בקצרה ואסיים כאן.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
  return buildWhatsAppHref(`${preface}\n\n${body}`);
}

/** התראת עניין בשירות — ללא Web3Forms (חובת hCaptcha בצד הספק). אפשר לחבר כאן לוג או ערוץ אחר. */
export async function notifyServiceInterest(_params: {
  serviceId: string;
  serviceTitle: string;
  flow: string;
}): Promise<void> {
  void _params;
}

const WA_CRM_TAGLINE = "מחשבה אחת נקייה - ישר לוואטסאפ";

/** שורת CRM לפרסור: מקור + טון קבוע */
export function buildWhatsAppCrmPreface(sourceTitle: string): string {
  const title = String(sourceTitle || "NeverMind").trim() || "NeverMind";
  return `[Lead | Source: ${title}]\n${WA_CRM_TAGLINE}`;
}

/** וואטסאפ: כניסה מ־/services/?topic= + בחירת תוכנית מנוי (מחיר ומזהה לשיחה) */
export function buildTopicLandingPlanWhatsAppHref(args: {
  topic: string;
  plan: string;
  price: number;
  ctaLabel: string;
  paymentLink?: string;
}): string {
  const preface = buildWhatsAppCrmPreface("מנוי ארכיון NeverMind");
  const topicLine = args.topic.trim() || "ללא ציון נושא";
  const money = formatMoney(args.price);
  const pay = args.paymentLink?.trim()
    ? `לינק תשלום (אחרי אישור קצר בשיחה): ${args.paymentLink.trim()}`
    : "מבקש לינק תשלום מותאם אחרי אישור קצר.";
  const body = `הגעתי מ־/services/?topic עם נושא מהכניסה.\nנושא: ${topicLine}\nבחירה: ${args.ctaLabel}\nמזהה תוכנית: ${args.plan}\nמחיר מוצג: ${money}\n${pay}`;
  return buildWhatsAppHref(`${preface}\n\n${body}`);
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
    return `${preface}\n\nהיי השם לא משנה, קראתי את המאמר בנושא ${subjectLabel} ורציתי להתייעץ...`;
  }
  if (titleTrim) {
    return `${preface}\n\nהיי השם לא משנה, קראתי את המאמר "${titleTrim}" ורציתי להתייעץ...`;
  }
  return `${preface}\n\nהיי השם לא משנה, קראתי מאמר באתר NeverMind ורציתי להתייעץ...`;
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
