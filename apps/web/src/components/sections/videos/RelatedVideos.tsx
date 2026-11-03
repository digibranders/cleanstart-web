import Link from "next/link";
import { videoHref, type Video } from "@/lib/videos-utils";
import { VideoMeta } from "./VideoMeta";
import { VideoThumb } from "./VideoThumb";

interface RelatedVideosProps {
  videos: readonly Video[];
}

/** Plain links to other video pages, so every video is reachable from every other. */
export function RelatedVideos({ videos }: RelatedVideosProps): React.ReactElement | null {
  if (videos.length === 0) return null;
  return (
    <section aria-labelledby="related-videos-title" className="mt-16">
      <h2
        id="related-videos-title"
        className="font-display font-semibold text-[#12101C]"
        style={{ fontSize: "var(--fs-h3)", letterSpacing: "-0.015em" }}
      >
        More videos
      </h2>
      <ul className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id} className="min-w-0">
            <Link href={videoHref(video)} prefetch={false} className="group block">
              <span className="relative block aspect-video overflow-hidden rounded-[14px] bg-black">
                <VideoThumb video={video} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw" />
              </span>
              <span className="mt-3 block">
                <VideoMeta video={video} />
              </span>
              <span
                className="mt-1.5 block font-display font-semibold text-[#12101C] group-hover:text-[#5B2EE0]"
                style={{ fontSize: "var(--fs-h5)", lineHeight: 1.35, letterSpacing: "-0.01em" }}
              >
                {video.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
