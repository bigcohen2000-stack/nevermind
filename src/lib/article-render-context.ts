export type ArticleRenderContext = {
  questionForSchema?: string;
  originalInsight?: string;
};

let active: ArticleRenderContext = {};

export function setArticleRenderContext(next: ArticleRenderContext): void {
  active = { ...next };
}

export function getArticleRenderContext(): ArticleRenderContext {
  return active;
}
