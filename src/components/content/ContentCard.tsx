import Image from "next/image";
import Link from "next/link";
import { FileText, Lock, PlayCircle } from "lucide-react";
import type { ContentItem } from "@/lib/content";

export interface ContentCardProps {
  item: ContentItem;
  href: string;
}

export function ContentCard({ item, href }: ContentCardProps) {
  const isVideo = item.mediaType === "video";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl bg-white/5 shadow-md shadow-black/30 transition-transform transition-shadow duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(min-width: 1280px) 320px, (min-width: 768px) 260px, 80vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute top-3 me-3 ms-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            {item.category}
          </span>
          <div className="flex items-center gap-1">
            {isVideo ? (
              <PlayCircle className="h-5 w-5 text-white drop-shadow" aria-hidden="true" />
            ) : (
              <FileText className="h-5 w-5 text-white drop-shadow" aria-hidden="true" />
            )}
            {item.durationMinutes ? (
              <span className="text-[11px] text-white/90">
                {item.durationMinutes} דק&#39;
              </span>
            ) : null}
          </div>
        </div>
        {item.isPremium ? (
          <div className="absolute bottom-3 me-3 flex items-center gap-1 rounded-full bg-brand-accent px-2 py-1 text-[11px] font-semibold text-brand shadow">
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>Premium</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white">{item.title}</h3>
        <p className="line-clamp-3 text-xs text-white/80">{item.summary}</p>
      </div>
    </Link>
  );
}

