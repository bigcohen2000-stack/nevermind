import servicesConfig from "../config/services.json";
import appConfig from "../config/appConfig.json";

type ServicesConfig = typeof servicesConfig;
export type PaymentMethod = ServicesConfig["payment_methods"][number];
export type ServiceStage = ServicesConfig["stages"][number];
export type StageService = ServiceStage["services"][number] & { action_link?: string };
export type AddOn = ServicesConfig["add_ons"][number];
export type ThoughtShift = ServicesConfig["trust_elements"]["thought_shifts"][number];
export type FlatService = StageService & {
  stageName: string;
  targetAudience: string;
  action_link?: string;
};

export const servicesCurrency = servicesConfig.currency;
export const servicesTaxLabel = servicesConfig.tax_label;
export const servicesHero = servicesConfig.hero;
export const servicesStages = servicesConfig.stages;
export const servicesAddOns = servicesConfig.add_ons;
export const servicesTrust = servicesConfig.trust_elements;
export const servicesThoughtShifts = servicesConfig.trust_elements.thought_shifts as ThoughtShift[];
export const servicesPaymentMethods = servicesConfig.payment_methods as PaymentMethod[];

export const formatMoney = (value: number) => `${Math.round(value).toLocaleString("he-IL")} ${servicesCurrency}`;
export const getNetPrice = (grossPrice: number, taxPercent: number) => Math.round(grossPrice / (1 + taxPercent / 100));
export const getVatAmount = (grossPrice: number, taxPercent: number) => grossPrice - getNetPrice(grossPrice, taxPercent);

export const flattenVisibleServices = (): FlatService[] =>
  servicesStages.flatMap((stage) =>
    stage.services
      .filter((service) => service.visible !== false)
      .map((service) => ({
        ...service,
        stageName: stage.stage_name,
        targetAudience: stage.target_audience,
      }))
  );

export const findServiceById = (id: string) => flattenVisibleServices().find((service) => service.id === id);

export const buildWhatsAppHref = (message: string) =>
  `https://wa.me/${appConfig.contact.whatsAppNumber}?text=${encodeURIComponent(message)}`;

/** טקסט ליד קונטקסטואלי לפי תגית ראשונה מ-frontmatter (או נושא/כותרת גיבוי) */
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

/** שורת הקשר קצרה בלי פתיח — לשילוב בהודעות ארוכות (מילוי שדות וכו׳) */
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

  if (service.action_type === "invoice" && typeof service.action_link === "string" && service.action_link.trim()) {
    return {
      href: service.action_link,
      external: true,
      label: actionText,
      kind: "invoice" as const,
    };
  }

  return {
    href: buildWhatsAppHref(actionText === service.action_text ? `${actionText}. ${defaultMessage}` : defaultMessage),
    external: true,
    label: actionText,
    kind: "whatsapp" as const,
  };
};
