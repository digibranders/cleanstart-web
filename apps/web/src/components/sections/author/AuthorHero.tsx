import Image from "next/image";
import type React from "react";

import { pickImageUrl } from "@/lib/blog";
import type { AuthorDetail } from "@/lib/authors";
import { DETAIL_HERO_GRADIENT } from "@/components/sections/_shared/DetailHero";
import { HeroReveal } from "@/components/ui/Reveal";

interface AuthorHeroProps {
  author: AuthorDetail;
}

export function AuthorHero({ author }: AuthorHeroProps): React.ReactElement {
  const photoSrc = pickImageUrl(author.photo, ["hero", "card", "thumb"]);
  const linkedin = author.social?.linkedin;
  const stats = buildStats(author);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: DETAIL_HERO_GRADIENT }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute top-32 right-0 hidden xl:block"
        style={{
          width: "320px",
          height: "320px",
          mixBlendMode: "lighten",
          opacity: 0.35,
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/blogs/hero-orb-top.webp"
        alt=""
        className="pointer-events-none select-none absolute top-40 left-0 hidden xl:block"
        style={{
          width: "300px",
          height: "300px",
          mixBlendMode: "lighten",
          opacity: 0.3,
          transform: "scaleX(-1)",
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="flex flex-col items-center gap-6 pt-[calc(72px+env(safe-area-inset-top)+clamp(40px,6vw,80px)+var(--cs-header-extra))] pb-10 text-center">
          <div
            className="relative shrink-0"
            style={{
              width: "clamp(240px, 26vw, 300px)",
              aspectRatio: "404 / 450",
            }}
          >
            {/* Stacked lavender cards rotated behind the photo (Figma node 857:17518) */}
            <div
              aria-hidden
              className="absolute"
              style={{
                left: "-0.6%",
                top: "-4.6%",
                width: "90.1%",
                height: "107.3%",
                borderRadius: "clamp(46px, 5vw, 60px)",
                background: "rgba(222,227,247,0.5)",
                transform: "rotate(-7.21deg)",
                transformOrigin: "center",
              }}
            />
            <div
              aria-hidden
              className="absolute"
              style={{
                left: "-0.6%",
                top: "-4.6%",
                width: "90.1%",
                height: "107.3%",
                borderRadius: "clamp(46px, 5vw, 60px)",
                background: "rgba(222,227,247,0.5)",
                transform: "rotate(-17.21deg)",
                transformOrigin: "center",
              }}
            />
            <div
              className="relative w-full h-full overflow-hidden"
              style={{
                borderRadius: "clamp(46px, 5vw, 60px)",
                background: "#dee3f7",
              }}
            >
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={author.photo?.alt ?? author.name}
                  fill
                  sizes="(max-width: 1024px) 260px, 300px"
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
          </div>

          <div className="flex flex-col items-center gap-3">
            <HeroReveal y={50} duration={1.0} className="flex items-center justify-center gap-3 flex-wrap">
              <h1
                className="font-display font-semibold text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  lineHeight: 1.15,
                  letterSpacing: "var(--text-hero-product-ls)",
                }}
              >
                {author.name}
              </h1>
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${author.name} on LinkedIn`}
                  className="inline-flex items-center justify-center"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "#0A66C2",
                    color: "#FFFFFF",
                  }}
                >
                  <LinkedInIcon />
                </a>
              )}
            </HeroReveal>

            {author.role && (
              <HeroReveal y={30} delay={0.2} duration={0.8}>
                <p
                  className="font-medium"
                  style={{
                    fontSize: "var(--fs-lead-sm)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {author.role}
                </p>
              </HeroReveal>
            )}
          </div>
        </div>

        {stats.length > 0 && (
          <div
            className="relative grid gap-y-4 pb-16"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
              borderTop: "1px solid rgba(255,255,255,0.14)",
              paddingTop: "28px",
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="flex items-center justify-center gap-3 px-4"
                style={
                  i < stats.length - 1
                    ? { borderRight: "1px solid rgba(255,255,255,0.14)" }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center shrink-0"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {s.icon}
                </span>
                <span
                  className="text-body-sm"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function buildStats(
  author: AuthorDetail,
): { label: string; icon: React.ReactElement }[] {
  const items: { label: string; icon: React.ReactElement }[] = [];

  const years = computeYearsOfExperience(author.experience);
  if (years > 0) {
    items.push({
      label: `Experience : ${years} yrs`,
      icon: <BriefcaseIcon />,
    });
  }

  const firstSkill = author.skills?.[0]?.skill;
  if (firstSkill) {
    items.push({
      label: `Skills : ${firstSkill}`,
      icon: <SkillsIcon />,
    });
  }

  const firstTopic = author.topicAreas?.[0]?.topic;
  if (firstTopic) {
    items.push({
      label: firstTopic,
      icon: <ContainerIcon />,
    });
  }

  return items;
}

function computeYearsOfExperience(
  experience: AuthorDetail["experience"],
): number {
  if (!experience?.length) return 0;
  const years = experience
    .map((e) => e.fromYear)
    .filter((y): y is number => typeof y === "number" && y > 1900);
  if (!years.length) return 0;
  const earliest = Math.min(...years);
  const now = new Date().getUTCFullYear();
  return Math.max(0, now - earliest);
}

function LinkedInIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function BriefcaseIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

function SkillsIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="m8 14-2 8 6-4 6 4-2-8" />
    </svg>
  );
}

function ContainerIcon(): React.ReactElement {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18M8 5v14M16 5v14" />
    </svg>
  );
}
