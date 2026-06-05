import Image from "next/image";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

const PILLARS = [
  {
    icon: "/images/about/icon-secure-foundation.png",
    title: "Trust by Design",
    description:
      "Trust should be engineered into software foundations, not retrofitted after deployment.",
  },
  {
    icon: "/images/about/icon-continuous-compliance.png",
    title: "Verifiable by Default",
    description:
      "Modern software should be continuously verifiable across every stage of delivery.",
  },
  {
    icon: "/images/about/icon-full-visibility.png",
    title: "Security Without Friction",
    description:
      "Developers should be able to move fast without inheriting unnecessary operational risk.",
  },
];

export function AboutWhoWeAre() {
  return (
    <section className="relative overflow-hidden bg-white py-section-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/who-we-are-vector.svg"
        alt=""
        className="pointer-events-none absolute select-none"
        style={{
          left: "2%",
          top: "-244px",
          width: "min(701px, 37vw)",
          height: "auto",
          opacity: 0.55,
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/about/who-we-are-union.svg"
        alt=""
        className="pointer-events-none absolute select-none hidden lg:block"
        style={{
          right: "-80px",
          top: "50%",
          width: "380px",
          height: "auto",
          transform: "scaleY(-1) rotate(141.39deg)",
          opacity: 0.35,
        }}
        loading="lazy"
        decoding="async"
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div className="flex flex-col items-center text-center gap-12 lg:flex-row lg:items-start lg:text-left lg:gap-[106px]">
          <Reveal header className="shrink-0">
            <h2
              className="font-display"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                color: "#111",
              }}
            >
              Who We Are
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                color: "rgba(17,17,17,0.8)",
                maxWidth: "840px",
              }}
            >
              CleanStart is building the foundation for trusted software delivery by helping organizations reduce inherited risk and establish trust across the software supply chain.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-[60px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/about/pillar-divider-1.svg"
            alt=""
            className="pointer-events-none absolute select-none hidden lg:block"
            style={{
              left: "calc(33.33% - 0.75px)",
              top: "0",
              width: "1.5px",
              height: "clamp(160px, 18vw, 249px)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/about/pillar-divider-2.svg"
            alt=""
            className="pointer-events-none absolute select-none hidden lg:block"
            style={{
              left: "calc(66.67% - 0.75px)",
              top: "0",
              width: "1.5px",
              height: "clamp(160px, 18vw, 249px)",
            }}
          />

          <RevealStagger className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <RevealItem key={pillar.title} className="flex flex-col items-center text-center sm:items-start sm:text-left gap-6 px-0 sm:px-8 first:pl-0 last:pr-0">
                <div className="relative h-[100px] w-[100px] overflow-hidden rounded-lg shrink-0">
                  <Image
                    src={pillar.icon}
                    alt={pillar.title}
                    width={100}
                    height={100}
                    sizes="100px"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <h3
                    className="font-display"
                    style={{
                      fontSize: "var(--fs-h3)",
                      fontWeight: 700,
                      lineHeight: 1.1,
                      letterSpacing: "-0.04em",
                      color: "#333",
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body)",
                      fontWeight: 400,
                      lineHeight: 1.4,
                      letterSpacing: "-0.02em",
                      color: "#333",
                    }}
                  >
                    {pillar.description}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
