import { Reveal } from "@/components/ui/Reveal";

export function AboutOurStory() {
  return (
    <section
      className="relative overflow-hidden min-h-[640px] lg:min-h-[clamp(420px,40vw,600px)]"
    >
      {/* Founders photo — two sources, one per viewport, because the section
          changes aspect ratio dramatically between mobile (tall, ~9:16) and
          desktop (wide, ~16:5). Using one image for both meant either the
          portrait got upscaled 5× on desktop (blurry building tops, founders
          off-screen) or the landscape got cropped to nothing on mobile. */}

      {/* Mobile: portrait photo (founders in the lower half, centered). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/about/founders-new.png"
        alt="CleanStart founders"
        className="absolute inset-0 h-full w-full object-cover object-center lg:hidden"
        loading="lazy"
        decoding="async"
      />

      {/* Desktop: landscape photo (founders centered horizontally, full NYC
          scene visible). Anchored at 80% center so the founders sit on the
          right portion of the section behind the left-aligned text overlay. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/about/founders-photo2.png"
        alt="CleanStart founders"
        className="absolute inset-0 h-full w-full object-cover object-[80%_center] hidden lg:block"
        loading="lazy"
        decoding="async"
      />

      {/* Desktop overlay — left-to-right black fade. Hidden on mobile because
          the text is centered, not left-aligned, so a horizontal fade no longer
          matches the text position. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(84.003deg, rgba(0,0,0,0.88) 1.453%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 58%)",
        }}
      />

      {/* Desktop purple bottom gradient. Hidden on mobile so the founders photo
          stays clean below the text overlay. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block"
        style={{
          opacity: 0.6,
          background:
            "linear-gradient(0deg, rgba(71,30,192,0.6) 0%, rgba(70,30,191,0.522) 16.724%, rgba(66,30,188,0.3) 56.81%, rgba(66,30,188,0) 100%)",
        }}
      />

      {/* Mobile overlay — top-down dark fade. Opaque behind the centered text
          at the top of the section, fading to transparent by ~55% so the
          founders show through unobscured in the lower half. */}
      <div
        aria-hidden
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.62) 25%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col items-center text-center mx-auto lg:items-start lg:text-left lg:mx-0 gap-6 py-[clamp(72px,11vw,150px)]"
          style={{ maxWidth: "514px" }}
        >
          <Reveal header>
            <h2
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              Our <span className="cs-text-gradient-impact">Story</span>
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20}>
            <p
              className="text-white"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                opacity: 0.8,
              }}
            >
              CleanStart was founded on a simple belief: trusted software starts at the foundation. By integrating security, compliance, and provenance into every build, we help organizations confidently deliver open source and AI infrastructure at scale.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
