export function AboutOurStory() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "711px" }}
    >
      {/* Full-width founders photo as background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/about/founders-photo.png"
        alt="CleanStart founders"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />

      {/* Dark gradient overlay left-to-right — matches Figma linear-gradient 84deg black→transparent */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(84deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.70) 30%, rgba(0,0,0,0.30) 65%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Purple tint overlay — Figma gradient fill on top */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(71,30,192,0.25) 0%, rgba(70,30,191,0.15) 50%, rgba(66,30,188,0) 100%)",
        }}
      />

      {/* Text content — left-aligned */}
      <div className="relative mx-auto max-w-[1276px] px-6">
        <div
          className="flex flex-col gap-6 py-[120px]"
          style={{ maxWidth: "514px" }}
        >
          <h2
            className="font-sans font-bold text-white"
            style={{
              fontSize: "clamp(2.5rem, 4vw, 4rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.05em",
            }}
          >
            Our{" "}
            <span
              style={{
                background:
                  "linear-gradient(106deg, #9A51FF 1.8%, #2CC1EB 98.8%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Story
            </span>
          </h2>

          <p
            className="font-sans text-white"
            style={{
              fontSize: "clamp(1rem, 1.4vw, 1.5rem)",
              fontWeight: 400,
              lineHeight: "1.3",
              letterSpacing: "-0.04em",
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
