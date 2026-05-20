import Image from "next/image";

export function AboutOurVision() {
  return (
    <section
      className="relative overflow-hidden py-[100px]"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, #f3f0ff 35%, #eaf1ff 100%)",
      }}
    >
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
          {/* Left: target / bullseye 3D image — wrapper sized to tight Figma CONTENT bounds (609×568) for max target size */}
          <div className="flex items-center lg:justify-start">
            <div
              className="relative"
              style={{ width: "clamp(420px, 55vw, 620px)", aspectRatio: "609 / 568" }}
            >
              {/* Background blobs from Figma (Ellipse 46683 + 46703) — large blurred purple + cyan circles that sit behind the graphic and make the white echo ellipses visible */}
              <div
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  left: "-30%",
                  top: "10%",
                  width: "140%",
                  height: "140%",
                  background:
                    "radial-gradient(circle, rgba(223,155,255,0.78) 0%, rgba(223,155,255,0) 35%)",
                  filter: "blur(40px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  left: "-15%",
                  top: "-20%",
                  width: "130%",
                  height: "130%",
                  background:
                    "radial-gradient(circle, rgba(44,193,235,0.4) 0%, rgba(44,193,235,0) 35%)",
                  filter: "blur(40px)",
                }}
              />

              {/* Echo ring trail — five SVG ellipses from Figma node 248:2129 (back to front render order) */}
              {/* Each bbox is sized to its Figma rendered-bbox % of the CONTENT bounds (609×568); inner uses SVG-natural aspect to keep ellipse shape locked. */}

              {/* Ellipse 46701 — reduced to 0.7× of disc size, center preserved */}
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-center justify-center"
                style={{ left: "11.83%", top: "44.11%", width: "43.25%", height: "43.76%" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "100%",
                    aspectRatio: "158.395 / 269.234",
                    transform: "rotate(127.75deg) scaleY(-1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/about/vision-echo-4.svg"
                    alt=""
                    className="block h-full w-full select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Ellipse 46702 — reduced to 0.7×, center preserved */}
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-center justify-center"
                style={{ left: "3.93%", top: "52.68%", width: "43.25%", height: "43.76%" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "100%",
                    aspectRatio: "158.395 / 269.234",
                    transform: "rotate(-52.25deg) scaleY(-1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/about/vision-echo-5.svg"
                    alt=""
                    className="block h-full w-full select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Ellipse 46700 — reduced to 0.7×, center preserved */}
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-center justify-center"
                style={{ left: "19.37%", top: "35.84%", width: "43.25%", height: "43.76%" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "100%",
                    aspectRatio: "158.395 / 269.234",
                    transform: "rotate(127.75deg) scaleY(-1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/about/vision-echo-3.svg"
                    alt=""
                    className="block h-full w-full select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Ellipse 46698 — reduced to 0.7×, center preserved */}
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-center justify-center"
                style={{ left: "29.25%", top: "26.87%", width: "43.25%", height: "43.76%" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "100%",
                    aspectRatio: "178.095 / 302.72",
                    transform: "rotate(127.75deg) scaleY(-1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/about/vision-echo-2.svg"
                    alt=""
                    className="block h-full w-full select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Ellipse 46699 — reduced to 0.7×, center preserved */}
              <div
                aria-hidden
                className="pointer-events-none absolute flex items-center justify-center"
                style={{ left: "37.46%", top: "17.39%", width: "43.25%", height: "43.76%" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: "100%",
                    aspectRatio: "201.381 / 319.9",
                    transform: "rotate(127.75deg) scaleY(-1)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/about/vision-echo-1.svg"
                    alt=""
                    className="block h-full w-full select-none"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              {/* Target image — exact Figma position (431.70×406.41 @ 449.03, 68.91 within content bounds origin 271, 68) */}
              <Image
                src="/images/about/vision-target.png"
                alt="Our Vision — target"
                width={418}
                height={353}
                sizes="(min-width: 1024px) 418px, 50vw"
                className="absolute object-contain"
                style={{
                  left: "33%",
                  top: "-14%",
                  width: "95%",
                  height: "93%",
                  transform: "rotate(-12.65deg)",
                }}
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: text + CTA */}
          <div className="flex flex-col gap-10 lg:max-w-[622px]">
            <div className="flex flex-col gap-6">
              <h2
                className="font-display font-bold"
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
              className="cs-btn-blue"
              style={{ width: "131px", height: "44px", fontSize: "1.125rem" }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
