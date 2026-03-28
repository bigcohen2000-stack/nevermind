import type { CollectionEntry } from "astro:content";
import appConfig from "../config/appConfig.json";
import { getSeoArticlePlainText } from "./article-seo-plain";

type ArticleEntry = CollectionEntry<"articles">;

const toIso = (value: Date | string | undefined) => {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

export function buildArticleJsonLdPreview(
  entry: ArticleEntry,
  opts: { pagePath: string; ogImageAbsolute: string; articlePaywalled: boolean }
): Record<string, unknown> {
  const { data } = entry;
  const siteUrl = appConfig.site.url.endsWith("/") ? appConfig.site.url.slice(0, -1) : appConfig.site.url;
  const pageUrl = `${siteUrl}${opts.pagePath.startsWith("/") ? opts.pagePath : `/${opts.pagePath}`}`;
  const rawBody = entry.body ?? "";
  const seoBody = getSeoArticlePlainText(entry.id, Boolean(data.isPremium), rawBody).trim();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    author: {
      "@type": "Person",
      name: data.author ?? "השם לא משנה",
    },
    datePublished: toIso(data.pubDate),
    dateModified: toIso(data.updatedDate) ?? toIso(data.pubDate),
    image: opts.ogImageAbsolute,
    inLanguage: "he-IL",
    mainEntityOfPage: pageUrl,
    publisher: {
      "@type": "Organization",
      name: appConfig.site.name,
      url: siteUrl,
    },
    ...(opts.articlePaywalled ? { isAccessibleForFree: false } : {}),
    ...(seoBody.length > 0 ? { articleBody: seoBody.slice(0, 8000) } : {}),
  };
}

export function buildTruthBlockPreview(entry: ArticleEntry): { questionForSchema: string; originalInsight: string } {
  const q = typeof entry.data.questionForSchema === "string" ? entry.data.questionForSchema.trim() : "";
  const o = typeof entry.data.originalInsight === "string" ? entry.data.originalInsight.trim() : "";
  return { questionForSchema: q, originalInsight: o };
}
