import Image from "next/image";
import Link from "next/link";
import type React from "react";

import { pickImageUrl } from "@/lib/blog";
import type { AuthorDetail } from "@/lib/authors";
import {
  DETAIL_HERO_GRADIENT,
} from "@/components/sections/_shared/DetailHero";

interface AuthorHeroProps {
  author: AuthorDetail;
}

export function AuthorHero({ author }: AuthorHeroProps): React.ReactElement {
  const photoSrc = pickImageUrl(author.photo, ["hero", "card", "thumb"]);
  const social = author.social ?? {};

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: DETAIL_HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.png"
        alt=""
        className="pointer-events-none select-none absolute top-20 right-0 hidden xl:block"
        style={{
          width: "265px",
          height: "265px",
          mixBlendMode: "lighten",
          opacity: 0.4,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 pt-[58px]">
          <Link
            href="/"
            className="text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Home
          </Link>
          <span style={{ color: "rgba(152,172,195,0.6)" }}>/</span>
          <Link
            href="/blogs"
            className="text-xs leading-[1.4]"
            style={{ color: "#98ACC3" }}
          >
            Blogs
          </Link>
          <span style={{ color: "rgba(152,172,195,0.6)" }}>/</span>
          <span
            className="text-xs leading-[1.4] truncate max-w-[280px]"
            style={{ color: "#BFCCDA" }}
            aria-current="page"
          >
            {author.name}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-14 pt-[56px] pb-[80px]">
          <div
            className="shrink-0 overflow-hidden relative mx-auto lg:mx-0"
            style={{
              width: "clamp(160px, 22vw, 220px)",
              height: "clamp(160px, 22vw, 220px)",
              borderRadius: "16px",
            }}
          >
            {photoSrc ? (
              <Image
                src={photoSrc}
                alt={author.photo?.alt ?? author.name}
                fill
                sizes="(max-width: 1024px) 200px, 220px"
                className="object-cover"
                priority
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

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <p
              className="text-sm uppercase tracking-[0.12em] font-medium"
              style={{ color: "#98ACC3" }}
            >
              Author
            </p>

            <h1
              className="font-display font-semibold text-white"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.25rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
              }}
            >
              {author.name}
            </h1>

            {(author.role || author.location) && (
              <div
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-base"
                style={{ color: "#BFCCDA" }}
              >
                {author.role && <span>{author.role}</span>}
                {author.role && author.location && (
                  <span style={{ color: "rgba(191,204,218,0.5)" }}>•</span>
                )}
                {author.location && <span>{author.location}</span>}
              </div>
            )}

            {author.bioShort && (
              <p
                className="text-base leading-[1.6] max-w-[640px]"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                {author.bioShort}
              </p>
            )}

            <SocialLinks social={social} authorName={author.name} />
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialLinks({
  social,
  authorName,
}: {
  social: NonNullable<AuthorDetail["social"]>;
  authorName: string;
}): React.ReactElement | null {
  const entries: { key: keyof typeof social; href: string; label: string; icon: React.ReactElement }[] = [];

  if (social.linkedin) {
    entries.push({
      key: "linkedin",
      href: social.linkedin,
      label: "LinkedIn",
      icon: <LinkedInIcon />,
    });
  }
  if (social.twitter) {
    entries.push({
      key: "twitter",
      href: social.twitter,
      label: "Twitter / X",
      icon: <TwitterIcon />,
    });
  }
  if (social.github) {
    entries.push({
      key: "github",
      href: social.github,
      label: "GitHub",
      icon: <GitHubIcon />,
    });
  }
  if (social.website) {
    entries.push({
      key: "website",
      href: social.website,
      label: "Website",
      icon: <GlobeIcon />,
    });
  }
  if (social.email) {
    entries.push({
      key: "email",
      href: `mailto:${social.email}`,
      label: "Email",
      icon: <MailIcon />,
    });
  }

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      {entries.map((e) => (
        <a
          key={e.key}
          href={e.href}
          target={e.key === "email" ? undefined : "_blank"}
          rel={e.key === "email" ? undefined : "noopener noreferrer"}
          aria-label={`${authorName} on ${e.label}`}
          className="inline-flex items-center justify-center transition-colors"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {e.icon}
        </a>
      ))}
    </div>
  );
}

function LinkedInIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function TwitterIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.84l-5.36-6.97L4.5 22H1.24l8.04-9.18L1 2h7.01l4.85 6.4L18.244 2zm-1.2 18h1.86L7.04 4H5.07l11.974 16z" />
    </svg>
  );
}

function GitHubIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.56 4.57-1.52 7.86-5.83 7.86-10.91C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function GlobeIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function MailIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
