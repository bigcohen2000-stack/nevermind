import { articles, type Article } from "@/data/data";

export type ContentItem = Article;

export interface CategorySummary {
  id: string;
  title: string;
  slug: string;
  count: number;
}

function toCategorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function getArticles(): Article[] {
  return [...articles].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getLatestContent(limit: number): Article[] {
  return getArticles().slice(0, limit);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}

export function getArticleByOrderIndex(orderIndex: number): Article | undefined {
  return articles.find((article) => article.orderIndex === orderIndex);
}

export function getCategories(): CategorySummary[] {
  const map = new Map<string, CategorySummary>();

  for (const article of articles) {
    const slug = toCategorySlug(article.category);
    const existing = map.get(slug);

    if (existing) {
      existing.count += 1;
    } else {
      map.set(slug, {
        id: slug,
        title: article.category,
        slug,
        count: 1
      });
    }
  }

  return Array.from(map.values());
}

export function getContentByCategory(categorySlug: string): Article[] {
  const categories = getCategories();
  const match = categories.find((category) => category.slug === categorySlug);
  if (!match) {
    return [];
  }
  return articles.filter((article) => article.category === match.title);
}

export function getContentBySlug(
  _categorySlug: string,
  slug: string
): Article | undefined {
  // For תאימות לאחור – מתעלמים מהקטגוריה ובוחרים לפי slug בלבד.
  return getArticleBySlug(slug);
}

