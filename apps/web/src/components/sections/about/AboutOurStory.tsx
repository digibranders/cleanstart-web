export function AboutOurStory() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(420px, 40vw, 600px)" }}
    >
      {/* Full-width founders photo as background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/about/founders-photo2.png"
        alt="CleanStart founders"
        className="absolute inset-0 full w-full object-cover"
        style={{ objectPosition: "80% center" }}
        loading="lazy"
        decoding="async"
      />

      {/* Black left-to-right fade — Figma node 248:2108, exact 2-stop values */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(84.003deg, rgba(0,0,0,0.88) 1.453%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 58%)",
        }}
      />

      {/* Purple gradient from bottom — Figma node 248:2107, rotate-180 → 0deg, layer opacity 60% */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: 0.6,
          background:
            "linear-gradient(0deg, rgba(71,30,192,0.6) 0%, rgba(70,30,191,0.522) 16.724%, rgba(66,30,188,0.3) 56.81%, rgba(66,30,188,0) 100%)",
        }}
      />

      {/* Text content — left-aligned */}
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="flex flex-col gap-6 py-[clamp(72px,11vw,150px)]"
          style={{ maxWidth: "514px" }}
        >
          <h2
            className="font-display text-white"
            style={{
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Our <span className="cs-text-gradient-impact">Story</span>
          </h2>

          <p
            className="text-white"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
              opacity: 0.8,
            }}
          >
            Our founders spent decades in cybersecurity and engineering and saw
            a recurring flaw: security was always added after software was
            built. CleanStart began with a simple belief, trust must start at
            the foundation. That belief drives everything we do, helping
            organizations move fast, stay compliant, and deliver software the
            world can trust.
          </p>
        </div>
      </div>
    </section>
  );
}
