import React, { useState } from "react";

interface LiteYouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export default function LiteYouTubeEmbed({
  videoId,
  title = "סרטון וידאו",
}: LiteYouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const saveData = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const thumbnail = saveData
    ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    : `https://i.ytimg.com/vi_webp/${videoId}/sddefault.webp`;

  const loadIframe = () => {
    setIsLoaded(true);
  };

  if (isLoaded) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1${saveData ? "" : "&autoplay=1"}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className="lite-youtube group relative aspect-video cursor-pointer overflow-hidden rounded-xl bg-[var(--nm-surface-muted)] shadow-lg"
      onClick={loadIframe}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          loadIframe();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`נגן את הסרטון: ${title}`}
    >
      <img
        src={thumbnail}
        alt={title}
        className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
        loading="lazy"
        width="640"
        height="360"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--nm-accent)] shadow-xl transition-transform group-hover:scale-110">
          <svg className="ml-1 h-8 w-8 text-[var(--nm-on-accent)]" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
