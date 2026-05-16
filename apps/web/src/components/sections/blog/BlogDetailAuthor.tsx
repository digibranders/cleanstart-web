import type React from "react";
import Image from "next/image";
import { pickImageUrl } from "@/lib/blog";
import type { BlogAuthor } from "@/lib/blog";

interface BlogDetailAuthorProps {
  authors?: BlogAuthor[] | undefined;
}

export function BlogDetailAuthor({
  authors,
}: BlogDetailAuthorProps): React.ReactElement | null {
  if (!authors || authors.length === 0) return null;

  return (
    <section className="relative w-full bg-white" data-section="BlogDetailAuthor">
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="flex gap-12 pb-16">
          <div
            className="hidden lg:block shrink-0"
            style={{ width: "260px" }}
            aria-hidden
          />
          <div
            className="min-w-0 flex-1 mx-auto lg:mx-0 flex flex-col gap-6"
            style={{ maxWidth: "680px" }}
          >
            {authors.map((author) => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorCard({ author }: { author: BlogAuthor }): React.ReactElement {
  const photoSrc = pickImageUrl(author.photo, ["card", "hero", "thumb"]);

  return (
    <div
      className="flex gap-5 sm:gap-6 bg-[#F5F5F5] p-5 sm:p-6"
      style={{ borderRadius: "12px" }}
    >
      <div
        className="shrink-0 overflow-hidden relative"
        style={{
          width: "clamp(96px, 12vw, 144px)",
          height: "clamp(96px, 12vw, 144px)",
          borderRadius: "8px",
        }}
      >
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={author.photo?.alt ?? author.name}
            fill
            sizes="(max-width: 640px) 96px, 144px"
            className="object-cover"
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

      <div className="min-w-0 flex-1 flex flex-col gap-3">
        <p
          className="text-sm font-normal"
          style={{
            color: "rgba(17,17,17,0.6)",
            margin: 0,
          }}
        >
          Author
        </p>

        <h3
          className="font-display font-bold tracking-[-0.02em]"
          style={{
            fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
            color: "#111111",
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {author.name}
        </h3>

        {author.bio && (
          <p
            className="text-base font-normal leading-[1.6]"
            style={{
              color: "rgba(17,17,17,0.65)",
              margin: 0,
            }}
          >
            {author.bio}
          </p>
        )}

        {author.linkedin && (
          <a
            href={author.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${author.name} on LinkedIn`}
            className="inline-flex items-center justify-center bg-[#E5E5E5] hover:bg-[#D5D5D5] transition-colors"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="rgba(17,17,17,0.6)"
              aria-hidden
            >
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
            </svg>
            <span className="sr-only">LinkedIn profile of {author.name}</span>
          </a>
        )}
      </div>
    </div>
  );
}
