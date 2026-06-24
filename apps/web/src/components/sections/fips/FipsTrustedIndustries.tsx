import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

const LEFT_CARDS = [
  {
    title: "Government & Public Sector",
    body: "Built for regulated federal workloads.",
  },
  {
    title: "Healthcare & Life Sciences",
    body: "Secure compliant infrastructure for critical systems.",
  },
] as const;

const RIGHT_CARDS = [
  {
    title: "Financial Services",
    body: "Validated cryptography for sensitive environments.",
  },
  {
    title: "Critical Infrastructure",
    body: "Trusted foundations for highly regulated operations.",
  },
] as const;

function IndustryCard({
  title,
  body,
  paddingLeft,
  paddingLeftClassName,
  variant = "desktop",
}: {
  title: string;
  body: string;
  paddingLeft?: string;
  paddingLeftClassName?: string;
  variant?: "mobile" | "desktop";
}): React.ReactElement {
  const isMobile = variant === "mobile";
  return (
    <div
      className={`bg-white${paddingLeftClassName ? ` ${paddingLeftClassName}` : ""}`}
      style={{
        borderRadius: isMobile ? "16px" : "24px",
        paddingTop: isMobile ? "24px" : "32px",
        paddingRight: isMobile ? "24px" : "44px",
        paddingBottom: isMobile ? "24px" : "32px",
        paddingLeft: paddingLeftClassName
          ? undefined
          : (paddingLeft ?? (isMobile ? "24px" : "44px")),
        minHeight: isMobile ? undefined : "207px",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: isMobile ? "20px" : "var(--fs-h3)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1.2,
          color: "#111111",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: isMobile ? "14px" : "var(--fs-body)",
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.5,
          color: "#111111",
          marginTop: isMobile ? "8px" : "16px",
        }}
      >
        {body}
      </p>
    </div>
  );
}

export function FipsTrustedIndustries(): React.ReactElement {
  return (
    <section
      data-section="FipsTrustedIndustries"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
      }}
    >
      {/* Footer contract: as the last background section on this CTA page, the
          bottom padding uses --spacing-section-cta so the overlapping footer CTA
          card has matching breathing room. */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md"
        style={{ paddingBottom: "var(--spacing-section-cta)" }}
      >
        <div className="flex flex-col items-center text-center">
          <Reveal header>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                color: "white",
              }}
            >
              Trusted Across
              <span
                className="block"
                style={{
                  background: "linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Regulated Industries
              </span>
            </h2>
          </Reveal>
        </div>

        <div className="mt-[60px]">
          <div
            className="lg:hidden relative grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: "16px" }}
          >
            <div
              aria-hidden
              className="pointer-events-none select-none absolute z-10 left-1/2 top-1/2 hidden sm:block"
              style={{
                width: "clamp(140px, 22vw, 220px)",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Image
                src="/images/fips/cube-impact-transparent.webp"
                alt=""
                fill
                sizes="22vw"
                priority={false}
              />
            </div>
            <IndustryCard
              title={LEFT_CARDS[0].title}
              body={LEFT_CARDS[0].body}
              variant="mobile"
            />
            <IndustryCard
              title={RIGHT_CARDS[0].title}
              body={RIGHT_CARDS[0].body}
              variant="mobile"
            />
            <IndustryCard
              title={LEFT_CARDS[1].title}
              body={LEFT_CARDS[1].body}
              variant="mobile"
              paddingLeftClassName="pl-6 sm:pl-[clamp(80px,14vw,140px)]"
            />
            <IndustryCard
              title={RIGHT_CARDS[1].title}
              body={RIGHT_CARDS[1].body}
              variant="mobile"
              paddingLeftClassName="pl-6 sm:pl-[clamp(80px,14vw,140px)]"
            />
          </div>

          <div
            className="hidden lg:grid relative grid-cols-[minmax(0,606px)_minmax(0,595px)] justify-center items-center"
            style={{
              gap: "clamp(40px, 5vw, 75px)",
              minHeight: "clamp(380px, 32vw, 458px)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none select-none absolute z-10 left-1/2 top-1/2"
              style={{
                width: "clamp(260px, 28vw, 406px)",
                aspectRatio: "1 / 1",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Image
                src="/images/fips/cube-impact-transparent.webp"
                alt="CleanStart 3D cube"
                fill
                sizes="(min-width: 1440px) 406px, 28vw"
                priority={false}
              />
            </div>

            <div className="flex flex-col" style={{ gap: "44px" }}>
              {LEFT_CARDS.map((card) => (
                <IndustryCard key={card.title} title={card.title} body={card.body} />
              ))}
            </div>

            {/* Extra left padding on the right column clears the absolutely positioned cube overlap. */}
            <div className="flex flex-col" style={{ gap: "44px" }}>
              {RIGHT_CARDS.map((card) => (
                <IndustryCard
                  key={card.title}
                  title={card.title}
                  body={card.body}
                  paddingLeft="clamp(110px, 12vw, 180px)"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
