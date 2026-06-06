import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

const PUBLIC_IMAGES = [
  "Patch after image creation",
  "Public base images",
  "Large attack surface",
  "Scanner-driven security",
  "Non-deterministic builds",
];

const CLEANSTART_FEATURES = [
  "Built from verified source",
  "Controlled packages",
  "Minimal components",
  "Secure by design",
  "Reproducible builds",
];

export function SecurityNotPatching() {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#F6F6F6] py-section-sm"
      aria-labelledby="security-title"
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 h-[819px]"
        >
          <Image
            src="/images/security/bg-grid-bottom-left.svg"
            alt=""
            width={1101}
            height={1101}
            sizes="1101px"
            className="pointer-events-none absolute"
            style={{
              left: "-707px",
              top: "401px",
              width: "1101px",
              height: "1101px",
            }}
          />
          <Image
            src="/images/security/bg-cube-top-right.svg"
            alt=""
            width={374}
            height={332}
            sizes="374px"
            className="pointer-events-none absolute"
            style={{
              left: "1086px",
              top: "0px",
              width: "374px",
              height: "332px",
            }}
          />
        </div>

        <div className="flex flex-col items-start gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <Reveal header className="justify-self-start" style={{ maxWidth: "444px" }}>
            <h2
              id="security-title"
              className="font-display text-[#111111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
              }}
            >
              Security isn&rsquo;t just{" "}
              <span className="cs-text-gradient-impact">patching</span>
            </h2>
          </Reveal>
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(217,217,217,0) 0%, rgba(217,217,217,1) 47.2%, rgba(217,217,217,0) 100%)",
            }}
          />
          <Reveal
            header
            delay={0.15}
            y={20}
            className="md:justify-self-end"
            style={{ maxWidth: "541px" }}
          >
            <p
              className="text-[#111111] md:text-right"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                lineHeight: 1.4,
                letterSpacing: "-0.02em",
                opacity: 0.8,
              }}
            >
              Recognized for innovation in secure software supply chain and
              hardened container images.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-10 flex flex-col items-center gap-6 md:mt-12 md:flex-row md:justify-center md:gap-10">
          <SecurityCard kind="public" features={PUBLIC_IMAGES} />
          <SecurityCard kind="cleanstart" features={CLEANSTART_FEATURES} />

          <VsBadge />
        </div>
      </div>
    </section>
  );
}

interface SecurityCardProps {
  kind: "public" | "cleanstart";
  features: string[];
}

function SecurityCard({ kind, features }: SecurityCardProps) {
  const isPublic = kind === "public";

  return (
    <div
      className="relative flex h-full w-full flex-col lg:max-w-[500px]"
      style={{
        borderRadius: 40,
        background: "#2CC1EB",
        padding: 10,
        zIndex: 10,
      }}
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ borderRadius: 32 }}
      >
        {/* The two cards share the same source gradient in the design; the
            public card is desaturated (reads near-black) and the CleanStart
            card stays full-color (reads vivid purple). We approximate that with
            two distinct CSS gradients. */}
        <div
          className="relative flex h-[clamp(76px,7vw,100px)] w-full items-center justify-center gap-3 overflow-hidden"
          style={{
            background: isPublic
              ? "linear-gradient(135deg, #151021 0%, #1A1733 60%, #221A3D 100%)"
              : "linear-gradient(135deg, #1B0E33 0%, #2B1456 40%, #471EC0 100%)",
          }}
        >
          {isPublic ? (
            <Image
              aria-hidden
              src="/images/security/header-cube.svg"
              alt=""
              width={162}
              height={186}
              sizes="162px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{
                right: "-37px",
                top: "-13px",
                width: "162px",
                height: "186.4px",
                opacity: 0.7,
              }}
            />
          ) : (
            <Image
              aria-hidden
              src="/images/security/header-chevron.svg"
              alt=""
              width={258}
              height={236}
              sizes="258px"
              className="pointer-events-none absolute mix-blend-soft-light"
              style={{
                right: "-120px",
                top: "-2px",
                width: "258px",
                height: "236px",
                opacity: 0.7,
              }}
            />
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[60px]"
            style={{
              background:
                "radial-gradient(60% 140% at 50% 100%, rgba(44,193,235,0.65) 0%, rgba(44,193,235,0.25) 35%, rgba(44,193,235,0) 70%)",
              filter: "blur(6px)",
            }}
          />

          <div className="relative z-10 flex w-full items-center justify-center gap-3">
            {isPublic ? (
              <>
                <Image
                  src="/images/security/cube-icon.svg"
                  alt=""
                  width={41}
                  height={48}
                  sizes="41px"
                  className="h-[47px] w-[41px]"
                />
                <span
                  className="font-display text-white"
                  style={{
                    fontSize: "var(--fs-h3)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Public Images
                </span>
              </>
            ) : (
              <Image
                src="/images/security/cleanstart-logo.svg"
                alt="CleanStart"
                width={227}
                height={47}
                sizes="227px"
                className="h-[47px] w-auto"
                priority={false}
              />
            )}
          </div>
        </div>

        {/* flex-1 lets this area absorb the grid-row's stretched height so both
            cards' visible bottoms stay aligned regardless of how many lines each
            card's text wraps to. */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-white py-[clamp(24px,2.5vw,36px)]" style={{ minHeight: "clamp(260px, 22vw, 340px)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              right: -40,
              bottom: -50,
              width: 262,
              height: 262,
              borderRadius: "50%",
              background: "#DF9BFF",
              opacity: 0.18,
              filter: "blur(40px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: -100,
              top: 30,
              width: 364,
              height: 364,
              borderRadius: "50%",
              background: "#2CC1EB",
              opacity: 0.10,
              filter: "blur(60px)",
            }}
          />

          <ul className="relative z-10 mx-auto flex h-full max-w-[400px] flex-col justify-center gap-[clamp(20px,2.5vw,36px)]">
            {features.map((label) => (
              <li key={label} className="flex items-center gap-6">
                {isPublic ? (
                  <Image
                    src="/images/security/snowflake.svg"
                    alt=""
                    width={24}
                    height={24}
                    sizes="24px"
                    className="h-6 w-6 shrink-0"
                  />
                ) : (
                  <Image
                    src="/images/security/sparkle.svg"
                    alt=""
                    width={31}
                    height={27}
                    sizes="31px"
                    className="h-[27px] w-[31px] shrink-0"
                  />
                )}
                <span
                  className="text-[#333333]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-body)",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** "VS" badge centered in the gap between the two comparison cards. z-30 keeps
 *  it above both cards. */
function VsBadge() {
  // Smaller on mobile where the badge sits in the narrow gap between the
  // vertically stacked cards; full size on tablet/desktop where it bridges
  // the two side-by-side cards.
  const SIZE = "clamp(72px, 11vw, 160px)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: SIZE,
        aspectRatio: "1 / 1",
        zIndex: 30,
      }}
    >
      <Image
        src="/images/security/vs-badge.webp"
        alt=""
        width={252}
        height={252}
        sizes="200px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
