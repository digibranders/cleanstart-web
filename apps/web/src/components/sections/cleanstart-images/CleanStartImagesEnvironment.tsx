import { Reveal } from "@/components/ui/Reveal";

type LogoItem = {
  src: string;
  alt: string;
  /** Intrinsic width */
  w: number;
  /** Intrinsic height */
  h: number;
};

/**
 * Registry / cloud-platform brand logos. Icons keep their official brand
 * colour (red Red-Hat fedora, orange AWS cubes, blue Docker whale, etc.);
 * wordmark text has been recoloured white in the source SVGs so it reads
 * against this section's dark navy → purple gradient. Two copies in the
 * marquee track produce a seamless infinite loop.
 */
// Intrinsic dimensions match each SVG's tight content-bbox viewBox so the
// rendered marquee row has consistent logo heights with no transparent padding.
const LOGOS: LogoItem[] = [
  { src: "/images/cleanstart-images/stacks-color/nexus.svg",        alt: "Sonatype Nexus",      w: 68,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/quay.svg",         alt: "Quay",                w: 204, h: 60 },
  { src: "/images/cleanstart-images/stacks-color/redhat.svg",       alt: "Red Hat",             w: 199, h: 60 },
  { src: "/images/cleanstart-images/stacks-color/harbor.svg",       alt: "Harbor",              w: 207, h: 60 },
  { src: "/images/cleanstart-images/stacks-color/azure.svg",        alt: "Microsoft Azure",     w: 64,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/aws.svg",          alt: "Amazon Web Services", w: 99,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/github.svg",       alt: "GitHub",              w: 62,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/jfrog.svg",        alt: "JFrog",               w: 62,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/docker.svg",       alt: "Docker",              w: 83,  h: 60 },
  { src: "/images/cleanstart-images/stacks-color/google-cloud.svg", alt: "Google Cloud",        w: 346, h: 60 },
];

export function CleanStartImagesEnvironment(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesModernStacks"
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 67.14%, #471ec0 107.43%)",
        paddingTop: "clamp(56px, 7vw, 100px)",
        paddingBottom: "clamp(56px, 7vw, 100px)",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Large top-right grid vector */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          right: "-450px",
          top: "-300px",
          width: "1101px",
          height: "1101px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-top-right-vector.svg"
          alt=""
          width={1101}
          height={1101}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Union hexagon — top-left corner */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "-109px",
          top: "-94px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Union hexagon — top-right corner */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden xl:block"
        style={{
          left: "calc(1214 / 1920 * 100%)",
          top: "-84px",
          width: "305.606px",
          height: "318.251px",
          mixBlendMode: "overlay",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/env-union-hex.svg"
          alt=""
          width={211}
          height={246}
          style={{
            display: "block",
            width: "211px",
            height: "246px",
            flexShrink: 0,
            transform: "rotate(-150deg) scaleY(-1)",
            opacity: 0.3,
          }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Ellipse glow — bottom-left */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          left: "-72px",
          bottom: "-40px",
          width: "315px",
          height: "315px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-64.44%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/env-ellipse-glow.svg"
            alt=""
            width={721}
            height={721}
            style={{ display: "block", width: "100%", height: "100%" }}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="relative flex flex-col items-center">

        {/* Heading max-width forces the "Images for Modern" / "Stacks" wrap */}
        <Reveal header>
          <h2
            className="font-display text-white text-center"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              maxWidth: "clamp(280px, 43vw, 623px)",
              textWrap: "wrap" as const,
            }}
          >
            {"Images for Modern "}
            <span className="cs-text-gradient-impact">Stacks</span>
          </h2>
        </Reveal>

        {/* Infinite logo marquee. The edge fade uses a CSS mask so the logos
            fade to transparent against whatever lies behind. The fade band is
            kept narrow (~40px) so it never exceeds the inter-logo gap; a wider
            band would reveal the section background between logos and read as a
            darker column, especially on mobile where the viewport is narrower
            than the gap. */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            marginTop: "clamp(40px, 5vw, 80px)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0, #000 40px, #000 calc(100% - 40px), transparent 100%)",
          }}
        >
          {/* Two full copies of the track produce a seamless infinite loop */}
          <div
            className="cs-marquee"
            style={{
              animationDuration: "35s",
              gap: "clamp(28px, 4vw, 64px)",
              alignItems: "center",
            }}
            aria-hidden
          >
            {LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`a-${logo.alt}`}
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="shrink-0 select-none pointer-events-none"
                style={{
                  height: "clamp(32px, 4vw, 56px)",
                  width: "auto",
                  opacity: 0.95,
                }}
                loading="eager"
                decoding="async"
              />
            ))}
            {LOGOS.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`b-${logo.alt}`}
                src={logo.src}
                alt=""
                aria-hidden
                width={logo.w}
                height={logo.h}
                className="shrink-0 select-none pointer-events-none"
                style={{
                  height: "clamp(32px, 4vw, 56px)",
                  width: "auto",
                  opacity: 0.95,
                }}
                loading="eager"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
