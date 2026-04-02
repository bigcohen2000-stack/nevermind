import servicesConfig from "../config/services.json";
import appConfig from "../config/appConfig.json";

type ServicesConfig = typeof servicesConfig;
export type PaymentMethod = ServicesConfig["payment_methods"][number];
/** ׳©׳׳‘ ׳‘׳׳¡׳׳•׳. ׳›׳•׳׳ social_proof ׳׳•׳₪׳¦׳™׳•׳ ׳׳™ ׳‘׳¨׳׳× ׳”׳©׳׳‘ (׳׳¢׳‘׳¨ ׳׳©׳™׳¨׳•׳× ׳‘׳•׳“׳“) */
export type ServiceStage = ServicesConfig["funnel_stages"][number] & {
  social_proof?: string | null;
};

/** ׳–׳׳™׳ ׳•׳× ׳׳•׳‘׳ ׳™׳× (׳×׳׳¨׳™׳ ׳¢׳“׳›׳•׳ + ׳׳§׳•׳׳•׳×). ׳×׳׳™׳׳•׳×: ׳’׳ `availability_note` ׳׳—׳¨׳•׳–׳× */
export type ServiceAvailability = {
  spots_left: number;
  updated_at?: string;
  label?: string;
};

/** ׳”׳¨׳—׳‘׳× ׳׳—׳™׳¨/׳׳•׳¨׳ ׳׳©׳™׳¨׳•׳× (׳˜׳׳₪׳•׳, ׳׳•׳׳₪׳, ׳׳ ׳•׳™) */
export type ServiceExtension = {
  id: string;
  label: string;
  price: number;
  description: string;
  action_text: string;
  /** ׳׳ true: ׳׳—׳™׳¨ ׳׳•׳¦׳’ = ׳׳—׳™׳¨ ׳‘׳¡׳™׳¡ + price */
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
  /** ׳׳” ׳§׳•׳¨׳” ׳‘׳₪׳•׳¢׳ (3), ׳׳×׳׳™׳ ׳›׳© (2), ׳׳ ׳׳×׳׳™׳ ׳›׳© (1) ג€” ׳›׳¨׳˜׳™׳¡ ׳׳—׳™׳¨׳•׳ */
  what_happens?: string[];
  fits_when?: string[];
  not_when?: string;
  extensions?: ServiceExtension[];
  /** ׳׳ true: ׳‘׳•׳—׳¨׳™׳ ׳×׳—׳™׳׳” ׳”׳¨׳—׳‘׳” (׳‘׳׳™ ׳‘׳¨׳™׳¨׳× ׳׳—׳“׳), ׳•׳׳– ׳ ׳₪׳×׳—׳™׳ ׳׳—׳™׳¨ ׳•׳›׳₪׳×׳•׳¨׳™׳ ג€” ׳›׳׳• ׳©׳׳‘׳™׳ ׳‘׳˜׳•׳₪׳¡ */
  extensions_gated?: boolean;
  update?: boolean;
  override_on_extension?: boolean;
  /** ׳©׳•׳¨׳× ׳׳—׳™׳¨/׳׳©׳ (׳׳—׳™׳¨׳•׳) */
  price_note?: string;
  subtitle?: string;
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

/** ׳’׳™׳׳•׳™ ׳ ׳׳•׳× ׳׳¨׳•׳. ׳׳§׳•׳¨: `trust_elements.disclaimer` ׳‘ײ¾services.json */
export const disclaimerLong =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_full?.toString?.() ||
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer?.toString?.() ||
  "";

/** ׳©׳•׳¨׳” ׳׳×׳—׳× ׳׳›׳ ׳›׳₪׳×׳•׳¨ ׳₪׳¢׳•׳׳” ׳‘׳›׳¨׳˜׳™׳¡ ׳©׳™׳¨׳•׳× */
export const disclaimerShort =
  (servicesConfig.trust_elements as Record<string, unknown>).disclaimer_short?.toString?.() ||
  "׳–׳”׳• ׳”׳¡׳‘׳¨ ׳₪׳¨׳¡׳₪׳§׳˜׳™׳‘׳” ׳׳™׳©׳™׳×, ׳׳ ׳©׳™׳₪׳•׳˜ ׳§׳׳™׳ ׳™.";

/** ׳×׳‘׳ ׳™׳× ׳‘׳¨׳™׳¨׳× ׳׳—׳“׳ ׳׳•׳•׳׳˜׳¡׳׳₪ ׳׳“׳£ ׳©׳™׳¨׳•׳×׳™׳ (׳׳ ׳—׳¡׳¨ `whatsapp_template` ׳‘ײ¾JSON) */
export const defaultWhatsappServiceTemplate =
  "׳©׳׳•׳, ׳”׳’׳¢׳×׳™ ׳׳“׳£ ׳”׳©׳™׳¨׳•׳×׳™׳ ׳‘-NeverMind.\n\n׳׳×׳¢׳ ׳™׳™׳ ׳‘: {title} ({price} ג‚×)\n\n׳”׳ ׳•׳©׳ ׳©׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳₪׳¨׳§: ";

/** ׳׳₪׳× ׳׳™׳™׳§׳•׳ ׳™׳ ׳׳₪׳™׳¦'׳¨׳™׳ */
export const featureIcons: Record<string, string> = {
  default: "ג“",
  phone: "נ“±",
  location: "נ“",
  privacy: "נ”’",
  time: "ג±",
  group: "נ‘¥",
  video: "נ¥",
  whatsapp: "נ’¬",
  content: "נ“–",
  recurring: "נ”„",
};

export const servicesCurrency = servicesConfig.currency;
export const servicesTaxLabel = servicesConfig.tax_label;

/** ׳׳—׳™׳¨ ׳™׳™׳—׳•׳¡ ׳׳×׳¦׳•׳’׳” (׳׳₪׳ ׳™ ׳”׳ ׳—׳× ׳‘׳•׳˜׳™׳§ ׳׳•׳¦׳’׳×) ג€” ׳”׳×׳©׳׳•׳ ׳‘׳₪׳•׳¢׳ ׳ ׳©׳׳¨ ׳׳₪׳™ price_full ׳‘ײ¾JSON */
export function getBoutiqueReferenceListPrice(chargePrice: number): number | null {
  const raw = (servicesConfig as Record<string, unknown>).boutique_display_discount_percent;
  const pct = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw) : 0;
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 50) return null;
  return Math.round(chargePrice / (1 - pct / 100));
}
const DEFAULT_CONTENT_GAP_MESSAGE =
  "׳—׳™׳₪׳©׳×׳™ ׳‘׳׳¨׳›׳™׳•׳, ׳•׳¨׳׳™׳×׳™ ׳©׳¢׳•׳“ ׳׳ ׳™׳¦׳ ׳׳™ ׳׳”׳§׳׳™׳˜ ׳׳• ׳׳›׳×׳•׳‘ ׳׳©׳”׳• ׳¡׳₪׳¦׳™׳₪׳™ ׳¢׳ ׳–׳”. ׳–׳” ׳“׳•׳•׳§׳ ׳׳¢׳ ׳™׳™׳, ׳׳ ׳×׳¨׳¦׳” ׳ ׳•׳›׳ ׳׳“׳‘׳¨ ׳¢׳ ׳–׳” ׳¨׳’׳¢ ׳™׳—׳“. ׳׳₪׳¢׳׳™׳ ׳›׳›׳” ׳ ׳•׳׳“׳™׳ ׳”׳×׳›׳ ׳™׳ ׳”׳›׳™ ׳˜׳•׳‘׳™׳ ׳›׳׳, ׳•׳–׳” ׳ ׳•׳’׳¢ ׳’׳ ׳׳׳—׳¨׳™׳. ׳׳₪׳©׳¨ ׳’׳ ׳‘׳׳ ׳•׳ ׳™׳׳™׳•׳× ׳׳׳׳”, ׳׳” ׳©׳ ׳•׳— ׳׳. ׳׳” ׳“׳¢׳×׳?";

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
    title: "׳׳•׳׳₪׳ ׳₪׳•׳“׳§׳׳¡׳˜",
    body: "׳׳’׳™׳¢׳™׳ ׳׳׳•׳׳₪׳ ׳₪׳•׳“׳§׳׳¡׳˜ ׳׳׳™׳×׳™ ׳•׳ ׳•׳›׳—׳™׳ ׳׳©׳™׳—׳” ׳׳¨׳×׳§׳× ׳¢׳ ׳›׳ ׳×׳—׳•׳׳™ ׳”׳—׳™׳™׳. ׳׳₪׳©׳¨ ׳׳“׳‘׳¨ ׳‘׳׳™ ׳׳”׳™׳•׳× ׳׳¦׳•׳׳׳™׳ - ׳׳ ׳•׳ ׳™׳׳™׳•׳× ׳׳׳׳” ׳׳ ׳×׳¨׳¦׳”. ׳׳₪׳©׳¨ ׳’׳ ׳׳‘׳§׳© ׳¢׳™׳•׳•׳× ׳§׳•׳. ׳׳ ׳×׳¨׳¦׳” ׳׳©׳×׳£ ׳—׳‘׳¨ ׳©׳¢׳•׳‘׳¨ ׳׳× ׳׳•׳×׳• ׳”׳“׳‘׳¨, ׳׳•׳×׳• ׳—׳•׳׳¨ ׳•׳™׳–׳•׳׳׳™ ׳–׳׳™׳ ׳’׳ ׳‘׳©׳‘׳™׳׳•.",
    ctaHref: "/services/#balcony-experience",
    ctaLabel: "׳׳₪׳¨׳˜׳™׳ ׳¢׳ ׳”׳׳•׳׳₪׳",
  },
  talk: {
    title: "׳©׳™׳—׳” ׳©׳ 20 ׳“׳§׳•׳×",
    body: "׳‘׳•׳ ׳ ׳׳¦׳ ׳–׳׳ ׳©׳ ׳•׳— ׳׳ ׳•׳׳™ ׳•׳ ׳©׳•׳—׳— 20 ׳“׳§׳•׳× ׳¢׳ ׳׳” ׳©׳×׳¨׳¦׳”. ׳׳ ׳×׳¨׳¦׳” ׳׳©׳׳•׳¢ ׳¨׳¢׳™׳•׳ ׳•׳× ׳—׳“׳©׳™׳, ׳׳× ׳“׳¢׳×׳™ ׳¢׳ ׳׳©׳”׳• ׳¡׳₪׳¦׳™׳₪׳™, ׳׳• ׳©׳׳׳₪׳” ׳׳™׳₪׳” ׳¢׳•׳“ ׳׳₪׳©׳¨ ׳׳₪׳×׳— ׳•׳׳—׳“׳“ ׳׳× ׳”׳—׳©׳™׳‘׳” - ׳–׳” ׳‘׳“׳™׳•׳§ ׳׳” ׳©׳׳ ׳™ ׳›׳׳.",
    ctaHref: "/services/#phone-perspective",
    ctaLabel: "׳׳§׳‘׳™׳¢׳× ׳©׳™׳—׳”",
  },
  archive: {
    title: "׳׳¨׳›׳™׳•׳ NeverMind",
    body: "׳’׳™׳©׳” ׳׳›׳ ׳”׳׳׳׳¨׳™׳ ׳•׳”׳¡׳¨׳˜׳•׳ ׳™׳ ׳‘׳׳×׳¨ - ׳›׳•׳׳ ׳”׳₪׳•׳“׳§׳׳¡׳˜ ׳”׳׳׳ ׳•׳™׳•׳×׳¨ ׳-12,000 ׳©׳¢׳•׳× ׳×׳•׳›׳ ׳¢׳ ׳›׳ ׳ ׳•׳©׳׳™ ׳”׳—׳™׳™׳. ׳₪׳•׳×׳—׳™׳ ׳ ׳•׳©׳׳™׳ ׳׳•׳¨׳›׳‘׳™׳: ׳“׳×, ׳¡׳׳™׳, ׳”׳×׳׳›׳¨׳•׳™׳•׳×, ׳¡׳§׳¡, ׳–׳•׳’׳™׳•׳×, ׳₪׳•׳¨׳ ׳• ׳•׳׳”׳‘׳” ׳׳׳™׳×׳™׳×.",
    ctaHref: "/services/#portal-access",
    ctaLabel: "׳׳׳ ׳•׳™ ׳”׳׳¨׳›׳™׳•׳",
  },
  philosophy: {
    title: "׳׳™׳ ׳–׳” ׳¢׳•׳‘׳“ ׳›׳׳",
    body: "׳–׳” ׳׳ ׳”׳׳׳¦׳” ׳—׳׳”. ׳–׳• ׳‘׳“׳™׳§׳” ׳©׳ ׳׳” ׳©׳›׳‘׳¨ ׳§׳™׳™׳, ׳•׳₪׳×׳™׳—׳” ׳׳׳₪׳©׳¨׳•׳™׳•׳× ׳—׳“׳©׳•׳× ׳׳ ׳×׳¨׳¦׳”.",
    ctaHref: "/services/",
    ctaLabel: "׳׳׳¨׳—׳‘ ׳”׳’׳™׳׳•׳™",
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
    label: "׳”׳ ׳—׳” ׳׳׳ ׳•׳™ ׳©׳ ׳×׳™ ֲ· ׳׳–׳׳ ׳׳•׳’׳‘׳",
    title: "׳׳׳׳•׳“ ׳׳× ׳׳ ׳’׳ ׳•׳ NeverMind",
    subtitle:
      "׳׳ ׳”׳’׳¢׳× ׳׳›׳׳ ׳‘׳’׳׳ {topic}, ׳™׳© ׳¡׳™׳›׳•׳™ ׳˜׳•׳‘ ׳©׳”׳×׳©׳•׳‘׳” ׳›׳‘׳¨ ׳׳—׳›׳” ׳‘׳׳¨׳›׳™׳•׳. ׳”׳׳ ׳•׳™ ׳₪׳•׳×׳— ׳׳ ׳’׳™׳©׳” ׳׳›׳ ׳”׳—׳§׳™׳¨׳•׳×, ׳׳›׳ ׳”׳×׳›׳ ׳™׳, ׳׳›׳ ׳”׳©׳׳׳•׳×, ׳‘׳׳™ ׳”׳’׳‘׳׳”.",
    cta_buttons: [
      { text: "׳׳ ׳•׳™ ׳—׳•׳“׳©׳™ ֲ· 175 ג‚×", plan: "monthly", price: 175 },
      { text: "׳׳ ׳•׳™ ׳©׳ ׳×׳™ ֲ· 1,850 ג‚×", plan: "yearly", price: 1850 },
      { text: "׳׳ ׳•׳™ ׳׳©׳ ׳×׳™׳™׳ ֲ· 3,450 ג‚×", plan: "two_years", price: 3450 },
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

/** ׳׳™׳׳•׳™ {topic} ׳‘׳›׳•׳×׳¨׳× ׳׳©׳ ׳” ׳©׳ ׳›׳ ׳™׳¡׳× topic */
export function formatTopicLandingSubtitle(template: string, topic: string): string {
  const t = topic.trim() || "׳׳” ׳©׳—׳™׳₪׳©׳×";
  return template.replace(/\{topic\}/g, t);
}

/** ׳׳—׳™׳¨ ׳׳×׳¦׳•׳’׳”: ׳׳¡׳₪׳¨ ׳׳׳•׳¡׳₪׳¨ + ׳¨׳•׳•׳— ׳׳ ׳©׳‘׳™׳¨ ׳׳₪׳ ׳™ ג‚× */
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

/** ׳׳ ׳§׳” ׳¨׳•׳•׳—׳™׳ ׳›׳₪׳•׳׳™׳, ׳©׳•׳¨׳•׳× ׳¨׳™׳§׳•׳× ׳•׳¨׳¢׳© ׳׳₪׳ ׳™ encodeURIComponent */
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

/** ׳•׳•׳׳˜׳¡׳׳₪ ׳‘׳¡׳•׳£ ׳׳׳׳¨: ׳ ׳™׳¡׳•׳— ׳©׳™׳׳•׳¨ ׳§׳¦׳¨ + ׳›׳•׳×׳¨׳× + ׳§׳™׳©׳•׳¨ */
export function buildRetentionArticleWhatsAppHref(articleTitle: string, articleUrl: string): string {
  const t = String(articleTitle || "").trim() || "׳׳׳׳¨";
  const u = String(articleUrl || "").trim();
  const body = u ? `׳׳ ׳–׳” ׳”׳–׳™׳– ׳׳©׳”׳• - ׳‘׳•׳ ׳ ׳“׳‘׳¨ ׳¢׳ ׳–׳”\n\n${t}\n${u}` : `׳׳ ׳–׳” ׳”׳–׳™׳– ׳׳©׳”׳• - ׳‘׳•׳ ׳ ׳“׳‘׳¨ ׳¢׳ ׳–׳”\n\n${t}`;
  return buildWhatsAppHref(body);
}

/** ׳©׳׳׳” ׳׳₪׳ ׳™ ׳”׳×׳—׳׳”. ׳©׳ ׳”׳©׳™׳¨׳•׳× ׳׳©׳•׳‘׳¥ ׳‘׳”׳•׳“׳¢׳” (׳׳§׳•׳“׳“ ׳ײ¾URL) */
export function buildServicePreStartWhatsAppHref(serviceName: string): string {
  const name = serviceName.trim() || "׳”׳©׳™׳¨׳•׳×";
  const preface = buildWhatsAppCrmPreface(name);
  const message = `${preface}\n\n׳”׳™׳™ ׳”׳©׳ ׳׳ ׳׳©׳ ׳”, ׳׳ ׳™ ׳§׳•׳¨׳ ׳¢׳›׳©׳™׳• ׳¢׳ ${name} ׳•׳׳©׳”׳• ׳©׳ ׳¡׳™׳§׳¨׳ ׳׳•׳×׳™. ׳׳₪׳©׳¨ ׳׳©׳׳•׳ ׳©׳׳׳” ׳§׳˜׳ ׳” ׳׳₪׳ ׳™ ׳©׳׳׳©׳™׳›׳™׳?`;
  return buildWhatsAppHref(message);
}

/** ׳×׳׳¨׳™׳/׳©׳¢׳” ׳‘׳¢׳‘׳¨׳™׳× ׳׳©׳•׳¨׳× ׳–׳׳™׳ ׳•׳× (׳׳‘׳•׳¡׳¡ ׳©׳¢׳•׳ ׳”׳“׳₪׳“׳₪׳ / ׳©׳¨׳× ׳׳₪׳™ ׳׳—׳¨׳•׳–׳× ISO) */
export function formatAvailabilityDateHebrew(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const days = ["׳¨׳׳©׳•׳", "׳©׳ ׳™", "׳©׳׳™׳©׳™", "׳¨׳‘׳™׳¢׳™", "׳—׳׳™׳©׳™", "׳©׳™׳©׳™", "׳©׳‘׳×"];
  const day = date.getDay();
  const prefix = day === 6 ? '׳׳•׳¦"׳©' : `׳™׳•׳ ${days[day]}`;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `׳¢׳•׳“׳›׳ ${prefix} ${hours}:${minutes}`;
}

/** ׳©׳•׳¨׳× ׳–׳׳™׳ ׳•׳× ׳׳׳׳” ׳׳×׳¦׳•׳’׳” (׳׳•׳‘׳™׳™׳§׳˜ ׳׳• ׳׳—׳¨׳•׳–׳× legacy) */
export function formatAvailabilityLine(service: StageService | FlatService): string | null {
  const av = service.availability;
  if (av && typeof av.spots_left === "number" && typeof av.updated_at === "string" && av.updated_at.trim()) {
    const label = (av.label?.trim() || "׳ ׳•׳×׳¨׳•").trim();
    const n = av.spots_left;
    const unit = n === 1 ? "׳׳§׳•׳" : "׳׳§׳•׳׳•׳×";
    const datePart = formatAvailabilityDateHebrew(av.updated_at.trim());
    if (!datePart) return `${label} ${n} ${unit}`;
    return `${label} ${n} ${unit} ֲ· ${datePart}`;
  }
  const legacy = service.availability_note?.trim();
  return legacy || null;
}

/** ׳×׳¦׳•׳’׳× ׳–׳׳™׳ ׳•׳× ׳‘׳₪׳•׳¨׳׳˜ ׳—׳“׳© */
export function formatAvailabilityLabel(spotsLeft: number, updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return `׳ ׳•׳×׳¨׳• ${spotsLeft} ׳׳§׳•׳׳•׳×`;
  const days = ["׳¨׳׳©׳•׳", "׳©׳ ׳™", "׳©׳׳™׳©׳™", "׳¨׳‘׳™׳¢׳™", "׳—׳׳™׳©׳™", "׳©׳™׳©׳™", "׳©׳‘׳×"];
  const day = days[date.getDay()];
  const prefix = date.getDay() === 6 ? '׳׳•׳¦"׳©' : `׳™׳•׳ ${day}`;
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `׳ ׳•׳×׳¨׳• ${spotsLeft} ׳׳§׳•׳׳•׳× ֲ· ׳¢׳•׳“׳›׳ ${prefix} ${hh}:${mm}`;
}

function applyWhatsappTemplate(
  template: string,
  service: StageService | FlatService,
  extensionLabel?: string
): string {
  const price = Math.round(service.price_full).toLocaleString("he-IL");
  const label = (extensionLabel ?? "").trim() || "׳‘׳¡׳™׳¡";
  return template
    .replace(/\{title\}/g, service.title)
    .replace(/\{price\}/g, price)
    .replace(/\{label\}/g, label);
}

/** ׳׳—׳™׳¨ ׳׳₪׳§׳˜׳™׳‘׳™ ׳׳₪׳™ ׳”׳¨׳—׳‘׳” (׳׳׳ ׳׳• ׳×׳•׳¡׳₪׳× ׳¢׳ ׳‘׳¡׳™׳¡) */
export function effectiveExtensionPrice(basePrice: number, ext: ServiceExtension | null | undefined): number {
  if (!ext) return basePrice;
  if (ext.price_additive === true) return basePrice + ext.price;
  return ext.price;
}

/** ׳¢׳•׳×׳§ ׳©׳™׳¨׳•׳× ׳¢׳ ׳׳—׳™׳¨ ׳•ײ¾CTA ׳׳•׳×׳׳׳™׳ ׳׳‘׳—׳™׳¨׳× ׳”׳¨׳—׳‘׳” */
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

/** ׳”׳•׳“׳¢׳× ׳›׳₪׳×׳•׳¨ ׳‘׳•׳׳• ׳ ׳‘׳“׳•׳§ ׳‘׳•׳•׳׳˜׳¡׳׳₪ (׳׳—׳™׳¨ ׳‘ײ¾Ref ׳₪׳ ׳™׳׳™ ׳‘׳׳‘׳“) */
export function buildServiceProposalWhatsAppMessage(args: {
  serviceTitle: string;
  extensionLabel: string;
  userFocus?: string;
  priceGross: number;
  includeCrmPreface?: boolean;
}): string {
  const serviceName = (args.serviceTitle || "").trim() || "׳”׳©׳™׳¨׳•׳×";
  const extensionName = (args.extensionLabel || "").trim() || "׳‘׳¡׳™׳¡";
  const focusRaw = (args.userFocus ?? "").replace(/[\t ]+/g, " ").trim();
  const refN = Math.max(0, Math.round(Number(args.priceGross) || 0));

  const chunks: string[] = [];
  if (args.includeCrmPreface !== false) {
    chunks.push(buildWhatsAppCrmPreface(serviceName));
    chunks.push("");
  }
  chunks.push(`׳©׳׳•׳, ׳¨׳׳™׳×׳™ ׳׳× ׳”׳׳₪׳©׳¨׳•׳× ׳©׳ ${serviceName} ׳¢׳ ׳”׳¨׳—׳‘׳× ${extensionName}.`);
  if (focusRaw.length > 0) {
    const focusSentence = /[.!?]$/.test(focusRaw) ? focusRaw : `${focusRaw}.`;
    chunks.push(`׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳×׳׳§׳“ ׳‘: ${focusSentence}`);
  }
  chunks.push("׳׳×׳™ ׳ ׳•׳›׳ ׳׳”׳×׳§׳“׳?");
  chunks.push(`(Ref: NM-${refN})`);

  return normalizeWhatsAppMessageBody(chunks.join("\n"));
}

export function buildServiceProposalWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null,
  userFocus?: string
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const extLabel = selectedExtension?.label?.trim() || "׳‘׳¡׳™׳¡";
  const message = buildServiceProposalWhatsAppMessage({
    serviceTitle: service.title,
    extensionLabel: extLabel,
    userFocus,
    priceGross: merged.price_full,
    includeCrmPreface: true,
  });
  return buildWhatsAppHref(message);
}

/** ׳§׳™׳©׳•׳¨ ׳•׳•׳׳˜׳¡׳׳₪ ׳׳©׳™׳¨׳•׳×. ׳×׳‘׳ ׳™׳× ׳׳”ײ¾JSON ׳׳• ׳‘׳¨׳™׳¨׳× ׳׳—׳“׳, ׳׳—׳¨׳× ׳”׳•׳“׳¢׳” ׳›׳׳׳™׳× */
export function buildServiceWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const raw = (service.whatsapp_template ?? defaultWhatsappServiceTemplate).trim();
  if (raw) {
    return buildWhatsAppHref(applyWhatsappTemplate(raw, merged, selectedExtension?.label));
  }
  const actionText = merged.action_text || `׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳×׳§׳“׳ ׳¢׳ ${service.title}`;
  const defaultMessage = `׳©׳׳•׳, ׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳×׳§׳“׳ ׳¢׳ ${merged.title}. ׳¨׳׳™׳×׳™ ׳׳× ׳”׳׳¡׳׳•׳ ׳‘׳׳×׳¨ ׳‘׳׳—׳™׳¨ ${formatMoney(merged.price_full)}. ׳׳₪׳©׳¨ ׳׳‘׳“׳•׳§ ׳™׳—׳“ ׳׳× ׳”׳₪׳¨׳˜׳™׳ ׳”׳׳׳׳™׳?`;
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
  const actionLine = merged.action_text?.trim() || `׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳×׳§׳“׳ ׳¢׳ ${service.title}`;
  const paymentLine = "׳ ׳×׳׳ ׳×׳©׳׳•׳ ׳‘׳×׳•׳ ׳”׳©׳™׳—׳” ׳׳—׳¨׳™ ׳”׳×׳׳׳” ׳§׳¦׳¨׳”. ׳‘׳׳™ ׳׳™׳ ׳§ ׳׳•׳˜׳•׳׳˜׳™ ׳‘׳”׳•׳“׳¢׳”.";
  const variant =
    selectedExtension?.label?.trim() ? `\n׳׳•׳₪׳¦׳™׳” ׳ ׳‘׳—׳¨׳”: ${selectedExtension.label.trim()}` : "";
  const body = `${actionLine}${variant}\n׳׳—׳™׳¨: ${formatMoney(merged.price_full)}\n${paymentLine}`;
  return buildWhatsAppHref(`${preface}\n\n${body}`);
}

/** ׳©׳™׳¨׳™׳•׳ / ׳”׳×׳¢׳ ׳™׳™׳ ׳•׳×: ׳₪׳™׳¨׳•׳˜ ׳—׳‘׳™׳׳” ׳•׳׳™׳ ׳§ ׳×׳©׳׳•׳ ׳¨׳§ ׳‘׳”׳§׳©׳¨ ׳©׳™׳—׳” ׳¡׳’׳•׳¨׳” */
export function buildServiceReservationWhatsAppHref(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const merged = mergeServiceWithExtension(service, selectedExtension ?? null);
  const preface = buildWhatsAppCrmPreface(service.title);
  const price = formatMoney(merged.price_full);
  const featureLines = Array.isArray(service.features)
    ? service.features.map((f) => (typeof f === "string" ? f : f.text ?? "").trim()).filter(Boolean)
    : [];
  const includesLine =
    featureLines.length > 0
      ? `׳׳” ׳–׳” ׳›׳•׳׳ ׳‘׳₪׳•׳¢׳: ${featureLines.slice(0, 6).join(" ֲ· ")}`
      : service.subtitle?.trim()
        ? `׳׳” ׳–׳” ׳›׳•׳׳ ׳‘׳₪׳•׳¢׳: ${service.subtitle.trim()}`
        : "";
  const paymentLine = "׳×׳©׳׳•׳: ׳ ׳×׳׳ ׳¨׳§ ׳‘׳×׳•׳ ׳”׳©׳™׳—׳” ׳”׳–׳• ׳׳—׳¨׳™ ׳”׳×׳׳׳” ׳§׳¦׳¨׳”.";
  const variantLine = selectedExtension?.label?.trim()
    ? `׳׳•׳₪׳¦׳™׳”: ${selectedExtension.label.trim()}`
    : "";
  const body = [
    `׳”׳™׳™, ׳׳ ׳™ ׳׳×׳¢׳ ׳™׳™׳ ׳‘${service.title} (${price}).`,
    variantLine,
    includesLine,
    paymentLine,
    "",
    "׳׳©׳׳— ׳׳“׳‘׳¨ ׳¢׳ ׳–׳” ׳›׳©׳™׳”׳™׳” ׳׳ ׳–׳׳.",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
  return buildWhatsAppHref(`${preface}\n\n${body}`);
}

/** ׳”׳×׳¨׳׳× ׳¢׳ ׳™׳™׳ ׳‘׳©׳™׳¨׳•׳× ג€” ׳׳׳ Web3Forms (׳—׳•׳‘׳× hCaptcha ׳‘׳¦׳“ ׳”׳¡׳₪׳§). ׳׳₪׳©׳¨ ׳׳—׳‘׳¨ ׳›׳׳ ׳׳•׳’ ׳׳• ׳¢׳¨׳•׳¥ ׳׳—׳¨. */
export async function notifyServiceInterest(_params: {
  serviceId: string;
  serviceTitle: string;
  flow: string;
}): Promise<void> {
  void _params;
}

const WA_CRM_TAGLINE = "׳׳—׳©׳‘׳” ׳׳—׳× ׳ ׳§׳™׳™׳” - ׳™׳©׳¨ ׳׳•׳•׳׳˜׳¡׳׳₪";

/** ׳©׳•׳¨׳× CRM ׳׳₪׳¨׳¡׳•׳¨: ׳׳§׳•׳¨ + ׳˜׳•׳ ׳§׳‘׳•׳¢ */
export function buildWhatsAppCrmPreface(sourceTitle: string): string {
  const title = String(sourceTitle || "NeverMind").trim() || "NeverMind";
  return `[Lead | Source: ${title}]\n${WA_CRM_TAGLINE}`;
}

/** ׳•׳•׳׳˜׳¡׳׳₪: ׳›׳ ׳™׳¡׳” ׳ײ¾/services/?topic= + ׳‘׳—׳™׳¨׳× ׳×׳•׳›׳ ׳™׳× ׳׳ ׳•׳™ (׳׳—׳™׳¨ ׳•׳׳–׳”׳” ׳׳©׳™׳—׳”) */
export function buildTopicLandingPlanWhatsAppHref(args: {
  topic: string;
  plan: string;
  price: number;
  ctaLabel: string;
  paymentLink?: string;
}): string {
  const preface = buildWhatsAppCrmPreface("׳׳ ׳•׳™ ׳׳¨׳›׳™׳•׳ NeverMind");
  const topicLine = args.topic.trim() || "׳׳׳ ׳¦׳™׳•׳ ׳ ׳•׳©׳";
  const money = formatMoney(args.price);
  const pay = args.paymentLink?.trim()
    ? `׳׳™׳ ׳§ ׳×׳©׳׳•׳ (׳׳—׳¨׳™ ׳׳™׳©׳•׳¨ ׳§׳¦׳¨ ׳‘׳©׳™׳—׳”): ${args.paymentLink.trim()}`
    : "׳׳‘׳§׳© ׳׳™׳ ׳§ ׳×׳©׳׳•׳ ׳׳•׳×׳׳ ׳׳—׳¨׳™ ׳׳™׳©׳•׳¨ ׳§׳¦׳¨.";
  const body = `׳”׳’׳¢׳×׳™ ׳ײ¾/services/?topic ׳¢׳ ׳ ׳•׳©׳ ׳׳”׳›׳ ׳™׳¡׳”.\n׳ ׳•׳©׳: ${topicLine}\n׳‘׳—׳™׳¨׳”: ${args.ctaLabel}\n׳׳–׳”׳” ׳×׳•׳›׳ ׳™׳×: ${args.plan}\n׳׳—׳™׳¨ ׳׳•׳¦׳’: ${money}\n${pay}`;
  return buildWhatsAppHref(`${preface}\n\n${body}`);
}

/** ׳”׳•׳“׳¢׳× ׳•׳•׳׳˜׳¡׳׳₪ ׳׳—׳™׳“׳” ׳׳×׳™׳׳•׳ ׳₪׳’׳™׳©׳” ׳׳׳׳׳¨ */
export function buildArticleMeetingWhatsAppMessage(params: { title: string; slug: string }): string {
  const preface = buildWhatsAppCrmPreface(params.title);
  const body = `׳”׳™׳™, ׳”׳’׳¢׳×׳™ ׳׳”׳׳׳׳¨ "${params.title}" (${params.slug}) ׳•׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳×׳׳ ׳₪׳’׳™׳©׳”.`;
  return `${preface}\n\n${body}`;
}

/** ׳˜׳§׳¡׳˜ ׳׳™׳“ ׳§׳•׳ ׳˜׳§׳¡׳˜׳•׳׳׳™ ׳׳₪׳™ ׳×׳’׳™׳× ׳¨׳׳©׳•׳ ׳” ׳׳”-frontmatter (׳׳• ׳ ׳•׳©׳/׳›׳•׳×׳¨׳× ׳’׳™׳‘׳•׳™) */
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
    return `${preface}\n\n׳”׳™׳™ ׳”׳©׳ ׳׳ ׳׳©׳ ׳”, ׳§׳¨׳׳×׳™ ׳׳× ׳”׳׳׳׳¨ ׳‘׳ ׳•׳©׳ ${subjectLabel} ׳•׳¨׳¦׳™׳×׳™ ׳׳”׳×׳™׳™׳¢׳¥...`;
  }
  if (titleTrim) {
    return `${preface}\n\n׳”׳™׳™ ׳”׳©׳ ׳׳ ׳׳©׳ ׳”, ׳§׳¨׳׳×׳™ ׳׳× ׳”׳׳׳׳¨ "${titleTrim}" ׳•׳¨׳¦׳™׳×׳™ ׳׳”׳×׳™׳™׳¢׳¥...`;
  }
  return `${preface}\n\n׳”׳™׳™ ׳”׳©׳ ׳׳ ׳׳©׳ ׳”, ׳§׳¨׳׳×׳™ ׳׳׳׳¨ ׳‘׳׳×׳¨ NeverMind ׳•׳¨׳¦׳™׳×׳™ ׳׳”׳×׳™׳™׳¢׳¥...`;
};

export const buildArticleContextWhatsAppHref = (
  opts: Parameters<typeof buildArticleContextLeadMessage>[0]
) => buildWhatsAppHref(buildArticleContextLeadMessage(opts));

/** ׳©׳•׳¨׳× ׳”׳§׳©׳¨ ׳§׳¦׳¨׳” ׳‘׳׳™ ׳₪׳×׳™׳— - ׳׳©׳™׳׳•׳‘ ׳‘׳”׳•׳“׳¢׳•׳× ׳׳¨׳•׳›׳•׳× (׳׳™׳׳•׳™ ׳©׳“׳•׳× ׳•׳›׳•׳³) */
export const buildArticleReadContextLine = (
  opts: Parameters<typeof buildArticleContextLeadMessage>[0]
): string => {
  const tagList = opts.tags ?? [];
  const firstFromTags = tagList.map((t) => String(t).trim()).find(Boolean) ?? "";
  const topicTrim = (opts.topic ?? "").trim();
  const subjectLabel = topicTrim || firstFromTags;
  if (subjectLabel) {
    return `׳§׳¨׳׳×׳™ ׳׳× ׳”׳׳׳׳¨ ׳‘׳ ׳•׳©׳ ${subjectLabel}.`;
  }
  const titleTrim = (opts.articleTitle ?? "").trim();
  if (titleTrim) {
    return `׳§׳¨׳׳×׳™ ׳׳× ׳”׳׳׳׳¨ "${titleTrim}".`;
  }
  return "׳§׳¨׳׳×׳™ ׳׳׳׳¨ ׳‘׳׳×׳¨ NeverMind.";
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
        error: "׳›׳•׳×׳¨׳× ׳‘׳¢׳‘׳¨׳™׳× ׳׳—׳™׳™׳‘׳× slug ׳‘׳׳ ׳’׳׳™׳× ׳׳₪׳ ׳™ ׳™׳™׳¦׳•׳",
      };
    }
    const suggested = slugifyTitle(trimmedTitle);
    if (hasHebrew && hasLatin && suggested) {
      return {
        valid: false,
        error:
          "׳”׳›׳•׳×׳¨׳× ׳›׳•׳׳׳× ׳¢׳‘׳¨׳™׳× - ׳”-Slug ׳”׳׳•׳˜׳•׳׳˜׳™ ׳—׳׳§׳™. ׳ ׳ ׳׳”׳–׳™׳ Slug ׳™׳“׳ ׳™ ׳‘׳׳ ׳’׳׳™׳× ׳©׳׳×׳׳¨ ׳׳× ׳ ׳•׳©׳ ׳”׳׳׳׳¨",
      };
    }
    return suggested ? { valid: true, suggested } : { valid: true };
  }

  if (!SAFE_SLUG_REGEX.test(trimmedSlug)) {
    return {
      valid: false,
      error: "Slug ׳—׳™׳™׳‘ ׳׳”׳›׳™׳ ׳׳•׳×׳™׳•׳× ׳׳ ׳’׳׳™׳•׳× ׳§׳˜׳ ׳•׳×, ׳׳¡׳₪׳¨׳™׳ ׳•׳׳§׳₪׳™׳ ׳‘׳׳‘׳“",
    };
  }

  return { valid: true };
}

export const resolveServiceAction = (service: StageService | FlatService) => {
  const actionText = service.payment_cta || service.action_text || `׳׳ ׳™ ׳¨׳•׳¦׳” ׳׳”׳×׳§׳“׳ ׳¢׳ ${service.title}`;

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

function fallbackServiceActionLabel(service: StageService | FlatService): string {
  if (service.id === "portal-access") return "בקשה להצטרף";
  if (service.id === "balcony-experience") return "שריון מקום";
  return "קביעת שיחה";
}

function stripTrailingPriceFromActionLabel(value: string): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*\)\s*$/u, "")
    .trim();
}

export function buildServiceDisplayActionLabel(
  service: StageService | FlatService,
  selectedExtension?: ServiceExtension | null
): string {
  const fallback = fallbackServiceActionLabel(service);
  const raw = selectedExtension?.action_text?.trim() || service.payment_cta?.trim() || service.action_text?.trim() || "";
  const cleaned = stripTrailingPriceFromActionLabel(raw);
  return cleaned || fallback;
}

export function assertServicePricingConsistency(services: Array<StageService | FlatService>): void {
  const issues: string[] = [];

  services.forEach((service) => {
    const variants: Array<ServiceExtension | null> = [null, ...(((service.extensions ?? []) as ServiceExtension[]) || [])];

    variants.forEach((variant) => {
      const merged = mergeServiceWithExtension(service, variant);
      const reservation = decodeURIComponent(buildServiceReservationWhatsAppHref(service, variant));
      const proposal = decodeURIComponent(buildServiceProposalWhatsAppHref(service, variant));
      const localizedPrice = Math.round(merged.price_full).toLocaleString("he-IL");
      const expectedRef = `NM-${Math.round(merged.price_full)}`;

      if (!reservation.includes(localizedPrice)) {
        issues.push(`${service.id}${variant ? `:${variant.id}` : ""} reservation_missing_price`);
      }

      if (!proposal.includes(expectedRef)) {
        issues.push(`${service.id}${variant ? `:${variant.id}` : ""} proposal_missing_ref`);
      }

      if (variant?.price_additive === true && merged.price_full < service.price_full) {
        issues.push(`${service.id}:${variant.id} additive_extension_lower_than_base`);
      }
    });
  });

  if (issues.length) {
    throw new Error(`services_pricing_consistency_failed\n${issues.join("\n")}`);
  }
}
