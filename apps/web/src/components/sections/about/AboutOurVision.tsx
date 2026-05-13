import Image from "next/image";

export function AboutOurVision() {
  return (
    <section className="relative overflow-hidden bg-white py-[100px]">
      {/* Left grid vector — Figma left: -393px, size: 755px, top: 306px on 1920px frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/vision-vector-left.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          left: "-393px",
          top: "306px",
          width: "755px",
          height: "755px",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* Right grid vector — Figma right: -368px, size: 727px, top: -428px */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/vision-vector-right.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          right: "-368px",
          top: "-428px",
          width: "727px",
          height: "727px",
        }}
        loading="lazy"
        decoding="async"
      />
      {/* Subtle left-side decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-120px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.06) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1276px] px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left: target / bullseye 3D image */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative" style={{ width: "clamp(280px, 40vw, 480px)" }}>
              {/* Purple glow behind the image */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(167,84,255,0.25) 0%, transparent 70%)",
                  filter: "blur(40px)",
                  transform: "scale(1.3)",
                }}
              />
              <Image
                src="/images/about/vision-target.png"
                alt="Our Vision — target"
                width={418}
                height={353}
                className="relative w-full h-auto object-contain"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: text + CTA */}
          <div className="flex flex-col gap-10 lg:max-w-[622px]">
            <div className="flex flex-col gap-6">
              <h2
                className="font-sans font-bold"
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.875rem)",
                  lineHeight: "1.0",
                  letterSpacing: "-0.05em",
                  color: "#111",
                }}
              >
                Our{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(-6.3deg, #2CC1EB 0%, #9A51FF 64%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Vision
                </span>
              </h2>

              <p
                className="font-sans"
                style={{
                  fontSize: "clamp(1.1rem, 1.8vw, 1.875rem)",
                  fontWeight: 400,
                  lineHeight: "1.4",
                  letterSpacing: "-0.04em",
                  color: "rgba(17,17,17,0.8)",
                }}
              >
                We believe every organization should be able to build and
                release software that is secure by design. CleanStart is
                creating that future, one clean build at a time.
              </p>
            </div>

            {/* Blue "Contact Us" button */}
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-lg font-sans font-medium text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3960F9]"
              style={{
                width: "131px",
                height: "44px",
                fontSize: "18px",
                letterSpacing: "-0.01em",
                background: "#3960F9",
                boxShadow:
                  "0 0 0 1.002px #3960F9, 0 1px 2px rgba(9,6,63,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
                borderRadius: "8px",
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
