import LiteYouTubeEmbed from "../LiteYouTubeEmbed";

interface VideoPlayerProps {
  url: string;
  title: string;
}

function getVideoId(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const videoId = getVideoId(url);

  if (!videoId) {
    return null;
  }

  return (
    <div className="mb-6 mt-4">
      <LiteYouTubeEmbed videoId={videoId} title={title} />
    </div>
  );
}
