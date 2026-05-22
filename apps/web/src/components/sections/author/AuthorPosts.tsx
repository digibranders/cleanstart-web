import Image from "next/image";
import Link from "next/link";
import type React from "react";

import type { Blog } from "@/lib/blog";
import { formatBlogDate, pickImageUrl } from "@/lib/blog";
import { effectivePublishedAt } from "@/lib/published-date";

interface AuthorPostsProps {
  posts: Blog[];
  authorName: string;
}

export function AuthorPosts({
  posts,
  authorName,
}: AuthorPostsProps): React.ReactElement | null {
  if (!posts.length) return null;

  return (
    <section
      className="relative w-full"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 62%, #471EC0 100%)",
        paddingBottom: "230px",
      }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 pt-section-md">
        <div className="flex items-end justify-between gap-6 pb-10">
          <h2
            className="font-display font-semibold text-white"
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            More from {authorName.split(" ")[0]}
          </h2>
          <Link
            href="/blogs"
            className="text-sm font-medium hover:underline whitespace-nowrap"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            All blogs →
          </Link>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PostCard({ post }: { post: Blog }): React.ReactElement {
  const img = pickImageUrl(post.heroImage, ["card", "thumb", "hero"]);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden h-full transition-transform hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: "16 / 9", background: "rgba(255,255,255,0.04)" }}
      >
        {img ? (
          <Image
            src={img}
            alt={post.heroImage?.alt ?? post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, #9A51FF 0%, #2CC1EB 100%)",
            }}
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-col gap-3 p-5">
        {post.categories?.name && (
          <span
            className="text-xs uppercase tracking-[0.1em] font-medium"
            style={{ color: "#A48BFF" }}
          >
            {post.categories.name}
          </span>
        )}
        <h3
          className="font-display text-card-title-sm font-medium text-white line-clamp-2"
          style={{
            lineHeight: 1.3,
            letterSpacing: "-0.01em",
          }}
        >
          {post.title}
        </h3>
        <div
          className="flex items-center gap-2 text-xs mt-auto pt-2"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {(() => {
            const displayDate = effectivePublishedAt(post);
            return displayDate ? <span>{formatBlogDate(displayDate)}</span> : null;
          })()}
          {effectivePublishedAt(post) && post.readingMinutes != null && <span>•</span>}
          {post.readingMinutes != null && (
            <span>{post.readingMinutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}
