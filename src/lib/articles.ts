type ArticleDataLike = {
  slug?: string | null;
  youtube?: string | null;
  youtubeId?: string | null;
};

type ArticleLike = {
  slug?: string | null;
  data?: ArticleDataLike | null;
};

const trimText = (value: unknown): string => String(value ?? "").trim();

export function getCanonicalArticleSlug(entry: ArticleLike): string {
  const fromData = trimText(entry?.data?.slug);
  if (fromData) return fromData;
  return trimText(entry?.slug);
}

export function getCanonicalArticleHref(entry: ArticleLike): string {
  return `/articles/${encodeURIComponent(getCanonicalArticleSlug(entry))}/`;
}

export function getArticleYoutubeId(data: ArticleDataLike | null | undefined): string | undefined {
  const direct = trimText(data?.youtubeId);
  if (direct) return direct;
  const alias = trimText(data?.youtube);
  return alias || undefined;
}
