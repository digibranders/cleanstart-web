import type { LexicalRoot } from "@/lib/blog";
import { relationId } from "@/lib/blog-cta/relevance";
import { getCmsVideosByIds } from "./videos-cms";
import type { Video } from "./videos-utils";

/** What the page needs to draw a video block. Written onto the block as `fields._video`. */
export type ArticleVideoData = Pick<Video, "id" | "title" | "thumb" | "durationSeconds">;

type Node = { type?: string; children?: Node[]; fields?: Record<string, unknown> };

const isVideoBlock = (node: Node): boolean => node.type === "block" && node.fields?.blockType === "videoEmbed";

/** CMS ids of every video block in the content, in reading order, without repeats. */
export function collectVideoIds(content: LexicalRoot): string[] {
  const ids = new Set<string>();
  const visit = (node: Node): void => {
    if (isVideoBlock(node)) {
      const id = relationId(node.fields?.video);
      if (id !== null) ids.add(id);
    }
    node.children?.forEach(visit);
  };
  visit(content.root as unknown as Node);
  return [...ids];
}

/**
 * A copy of the content with each video block carrying its video. A block
 * whose video could not be found (deleted, unpublished, private) is removed,
 * so the article never shows a gap or a player that cannot play.
 */
export function applyVideos(content: LexicalRoot, videos: ReadonlyMap<string, Video>): LexicalRoot {
  const copy = JSON.parse(JSON.stringify(content)) as LexicalRoot;
  const visit = (node: Node): void => {
    if (!node.children) return;
    node.children = node.children.filter((child) => {
      if (!isVideoBlock(child)) return true;
      const id = relationId(child.fields?.video);
      const video = id === null ? undefined : videos.get(id);
      if (!video || !child.fields) return false;
      const data: ArticleVideoData = {
        id: video.id,
        title: video.title,
        thumb: video.thumb,
        durationSeconds: video.durationSeconds,
      };
      child.fields._video = data;
      return true;
    });
    node.children.forEach(visit);
  };
  visit(copy.root as unknown as Node);
  return copy;
}

/**
 * Fills in the video blocks of a rich-text body before it reaches the
 * renderer, which may be a client component and cannot fetch. One CMS read
 * per page, and none at all when the body has no video block.
 */
export async function resolveLexicalVideos<T extends LexicalRoot | null | undefined>(body: T): Promise<T> {
  if (!body?.root?.children?.length) return body;
  const ids = collectVideoIds(body);
  if (ids.length === 0) return body;
  return applyVideos(body, await getCmsVideosByIds(ids)) as T;
}
