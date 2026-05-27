import type React from "react";
import Image from "next/image";
import Link from "next/link";
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

function PhotoWrapper({
  slug,
  name,
  children,
}: {
  slug: string | undefined;
  name: string;
  children: React.ReactNode;
}): React.ReactElement {
  const sharedStyle: React.CSSProperties = {
    width: "clamp(96px, 12vw, 144px)",
    minHeight: "clamp(96px, 12vw, 144px)",
    borderRadius: "8px",
  };
  if (slug) {
    return (
      <Link
        href={`/author/${slug}`}
        aria-label={`Read more about ${name}`}
        className="shrink-0 self-stretch overflow-hidden relative block"
        style={sharedStyle}
      >
        {children}
      </Link>
    );
  }
  return (
    <div
      className="shrink-0 self-stretch overflow-hidden relative"
      style={sharedStyle}
    >
      {children}
    </div>
  );
}

function AuthorName({ author }: { author: BlogAuthor }): React.ReactElement {
  const nameClasses = "font-display font-bold tracking-[-0.02em]";
  const nameStyle: React.CSSProperties = {
    fontSize: "var(--fs-h3)",
    color: "#111111",
    lineHeight: 1.2,
    margin: 0,
  };

  if (author.slug) {
    return (
      <h3 className={nameClasses} style={nameStyle}>
        <Link
          href={`/author/${author.slug}`}
          className="hover:underline underline-offset-4 decoration-1"
          style={{ color: "inherit" }}
        >
          {author.name}
        </Link>
      </h3>
    );
  }

  return (
    <h3 className={nameClasses} style={nameStyle}>
      {author.name}
    </h3>
  );
}

function AuthorCard({ author }: { author: BlogAuthor }): React.ReactElement {
  const photoSrc = pickImageUrl(author.photo, ["card", "hero", "thumb"]);
  const bio = author.bioShort;
  const linkedinUrl = author.social?.linkedin ?? author.linkedin;

  return (
    <div
      className="flex gap-5 sm:gap-6 bg-[#F5F5F5] p-5 sm:p-6"
      style={{ borderRadius: "12px" }}
    >
      <PhotoWrapper slug={author.slug} name={author.name}>
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
      </PhotoWrapper>

      <div className="min-w-0 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p
            className="text-sm font-normal"
            style={{
              color: "rgba(17,17,17,0.6)",
              margin: 0,
            }}
          >
            Author
          </p>

          {linkedinUrl && (
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${author.name} on LinkedIn`}
              className="group inline-flex shrink-0 items-center justify-center bg-[#E5E5E5] hover:bg-[#0A66C2] transition-colors"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                color: "rgba(17,17,17,0.6)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="group-hover:text-white transition-colors"
                aria-hidden
              >
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
              </svg>
              <span className="sr-only">LinkedIn profile of {author.name}</span>
            </a>
          )}
        </div>

        <AuthorName author={author} />

        {bio && (
          <p
            className="text-base font-normal leading-[1.6] overflow-hidden"
            style={{
              color: "rgba(17,17,17,0.65)",
              margin: 0,
              whiteSpace: "pre-line",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 5,
            }}
          >
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}
