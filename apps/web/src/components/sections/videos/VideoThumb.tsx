import Image from "next/image";
import { youtubeThumbnail } from "@/lib/podcast-utils";
import type { Video } from "@/lib/videos-utils";

interface VideoThumbProps {
  video: Pick<Video, "id" | "thumb">;
  sizes: string;
  priority?: boolean;
}

/**
 * Poster frame, cropped to 16:9 by the parent's aspect box. Videos without a
 * 1280x720 frame use the 4:3 frame, whose letterbox bars `object-cover` trims.
 */
export function VideoThumb({
  video,
  sizes,
  priority = false,
}: VideoThumbProps): React.ReactElement {
  return (
    <Image
      src={youtubeThumbnail(video.id, video.thumb === "hq" ? "hqdefault" : "maxresdefault")}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}
