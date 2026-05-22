"use client";

import { useRef } from "react";
import Image from "next/image";
import { Container, Section } from "@/components/layout";

type Quote = { name: string; role: string; avatar: string; body: string };

const QUOTES: Quote[] = [
  {
    name: "Kevin R.",
    role: "CISO, TechCorp",
    avatar: "/images/community/avatar-kevin.png",
    body: '"CleanStart has fundamentally changed our approach to developer security. We\'ve reduced vulnerabilities by 90% by following community-driven standards."',
  },
  {
    name: "Kevin R.",
    role: "CISO, TechCorp",
    avatar: "/images/community/avatar-kevin.png",
    body: '"CleanStart has fundamentally changed our approach to developer security. We\'ve reduced vulnerabilities by 90% by following community-driven standards."',
  },
  {
    name: "Kevin R.",
    role: "CISO, TechCorp",
    avatar: "/images/community/avatar-kevin.png",
    body: '"CleanStart has fundamentally changed our approach to developer security. We\'ve reduced vulnerabilities by 90% by following community-driven standards."',
  },
];

function QuoteIcon({ size = 32, color = "#0B0B27" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 32 24" fill="none" aria-hidden>
      <path
        d="M0 24V13.4q0-5.32 2.84-9.5T11.3 0v6.34Q7.92 6.94 6.6 9.1q-1.32 2.16-1.32 4.62H10v10.28Zm17 0V13.4q0-5.32 2.84-9.5T28.3 0v6.34q-3.38.6-4.7 2.76-1.32 2.16-1.32 4.62H27v10.28Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Community / Testimonials carousel (Figma 732:3695).
 *
 * Light-tinted lavender backdrop with a large quote glyph at top-left,
 * paired carousel-arrow chips top-right, and a horizontally-scrollable
 * row of white quote cards. The third card peeks from behind to hint
 * scrollability (Figma `Rectangle 1000001880` at x=1187, y=-51).
 */
export function CommunityTestimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("article");
    const step = card ? card.getBoundingClientRect().width + 32 : 400;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <Section
      padding="lg"
      ariaLabel="Community testimonials"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #F4EEFB 0%, #ECE7FE 60%, #E6E1FF 100%)",
      }}
    >
      {/* Decorative purple glow — bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-180px",
          bottom: "-180px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.25) 0%, rgba(122,89,255,0) 70%)",
          filter: "blur(60px)",
        }}
      />

      <Container className="relative">
        {/* Top row: quote icon + carousel arrows */}
        <div className="flex items-center justify-between">
          <QuoteIcon size={48} />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B27] text-white transition hover:bg-[#1B1F4F] cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next testimonial"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0B27] text-white transition hover:bg-[#1B1F4F] cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel track */}
        <div
          ref={trackRef}
          className="mt-10 flex snap-x snap-mandatory gap-8 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {QUOTES.map((q, i) => (
            <article
              key={i}
              className="snap-start shrink-0 rounded-[16px] bg-white p-8 shadow-[0_24px_48px_-24px_rgba(11,11,39,0.18)]"
              style={{ width: "min(696px, 85vw)" }}
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="relative h-[47px] w-[47px] overflow-hidden rounded-full bg-[#E6E1FF]"
                  >
                    <Image src={q.avatar} alt="" width={47} height={47} className="h-full w-full object-cover" />
                  </span>
                  <div className="flex flex-col">
                    <span
                      className="font-display font-semibold text-[#0B0B27]"
                      style={{ fontSize: "16px", lineHeight: 1.3 }}
                    >
                      {q.name}
                    </span>
                    <span
                      className="font-sans uppercase text-[#5A5A6E]"
                      style={{ fontSize: "11px", letterSpacing: "0.08em" }}
                    >
                      {q.role}
                    </span>
                  </div>
                </div>
                <QuoteIcon size={28} color="#B8B3D9" />
              </header>
              <p
                className="mt-6 font-sans text-[#3A3A52]"
                style={{ fontSize: "17px", lineHeight: 1.5, letterSpacing: "-0.01em" }}
              >
                {q.body}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
