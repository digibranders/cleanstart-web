import { notFound } from "next/navigation";
import { UpNext } from "@/components/sections/videos/UpNext";
import { VideoDescription } from "@/components/sections/videos/VideoDescription";
import { VideoMeta } from "@/components/sections/videos/VideoMeta";
import { VideoModal } from "@/components/sections/videos/VideoModal";
import { VideoPlayer } from "@/components/sections/videos/VideoPlayer";
import { VideoTopicPills } from "@/components/sections/videos/VideoTopicPills";
import { getVideoBySlug, getVideos } from "@/lib/videos";
import { relatedVideos, videoPath } from "@/lib/videos-utils";

/**
 * Intercepts /videos/[slug] when it is opened from the library, so the player
 * opens over the grid. A direct visit, a refresh or a crawler gets the full
 * page at app/videos/[slug] instead.
 */
export default async function VideoModalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const [video, all] = await Promise.all([getVideoBySlug(slug), getVideos()]);
  if (!video) notFound();

  return (
    <VideoModal
      title={video.title}
      player={
        <VideoPlayer
          video={video}
          sizes="(min-width: 1024px) 980px, 100vw"
          priority
          autoPlay
          radius="0px"
        />
      }
    >
      <VideoMeta video={video} />
      <VideoDescription description={video.summary} />
      <VideoTopicPills topics={video.topics} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[rgba(18,16,28,0.08)] pt-6">
        {/* A real navigation: the full page is a different route from this overlay. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href={videoPath(video.slug)}
          className="font-sans text-[15px] font-medium text-[#5B2EE0] underline underline-offset-4 hover:text-[#3A1BA8]"
        >
          Open the full page
        </a>
      </div>
      <UpNext videos={relatedVideos(video, all, 3)} layout="row" replace headingId="modal-up-next" />
    </VideoModal>
  );
}
