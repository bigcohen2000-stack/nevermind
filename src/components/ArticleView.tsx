"use client";

import { useEffect, useState } from "react";
import LiteYouTubeEmbed from "./LiteYouTubeEmbed";

const STORAGE_KEY = "has_full_access";

function getVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  isPremium: boolean;
  premiumTopic?: string | null;
  videoUrl?: string | null;
  excerpt: string;
  content: string;
}

export interface ArticleViewProps {
  article: Article;
}

export function ArticleView({ article }: ArticleViewProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      setHasAccess(raw === "true");
    } finally {
      setMounted(true);
    }
  }, []);

  const showFullContent = !article.isPremium || (mounted && hasAccess);
  const videoId = getVideoId(article.videoUrl);

  return (
    <article
      className="mx-auto max-w-3xl bg-stone-50 px-4 py-10 text-right sm:px-6"
      dir="rtl"
    >
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          {article.category}
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-stone-900 sm:text-3xl">
          {article.title}
        </h1>
      </header>

      {article.isPremium && !showFullContent ? (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-base leading-relaxed text-stone-800">{article.excerpt}</p>
          <p className="text-sm leading-relaxed text-stone-600">
            נושא זה עוסק ב־{article.premiumTopic ?? "תוכן מעמיק"} ודורש התבוננות מעמיקה יותר. הגישה המלאה זמינה לתומכי האתר.
          </p>
          <p className="pt-2">
            <a
              href="/services/"
              className="inline-block rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
            >
              פתח גישה מלאה
            </a>
          </p>
        </div>
      ) : (
        <>
          {videoId ? (
            <div className="my-8">
              <LiteYouTubeEmbed videoId={videoId} title={article.title} />
            </div>
          ) : null}

          <section
            className="article-body space-y-4 text-base leading-relaxed text-stone-900 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-[var(--nm-accent)] first:[&_h3]:mt-4 [&_p]:mb-4 [&_p]:text-stone-900 [&_strong]:font-semibold [&_strong]:text-stone-900"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </>
      )}
    </article>
  );
}
