import { Reveal } from "@/components/ui/Reveal";

const CARDS = [
  {
    id: "coverage",
    title: "Continuous Coverage",
    body: "Continuously updated software inventories.",
    icon: "/images/sbom/mobile-adv-1.svg",
    mobileIcon: "/images/sbom/mobile-adv-1.svg",
    mobileTitleW: 175,
    mobileBodyW: 264,
  },
  {
    id: "dependency",
    title: "Dependency Mapping",
    body: "Track software dependencies and relationships.",
    icon: "/images/sbom/mobile-adv-2.svg",
    mobileIcon: "/images/sbom/mobile-adv-2.svg",
    mobileTitleW: 175,
    mobileBodyW: 264,
  },
  {
    id: "compliance",
    title: "Compliance Readiness",
    body: "Support audit and regulatory requirements.",
    icon: "/images/sbom/mobile-adv-3.svg",
    mobileIcon: "/images/sbom/mobile-adv-3.svg",
    mobileTitleW: 175,
    mobileBodyW: 264,
  },
  {
    id: "visibility",
    title: "Supply Chain Visibility",
    body: "Understand software components and origins.",
    icon: "/images/sbom/mobile-adv-4.svg",
    mobileIcon: "/images/sbom/mobile-adv-4.svg",
    mobileTitleW: 175,
    mobileBodyW: 264,
  },
] as const;

export function SbomIntelligence(): React.ReactElement {
  return (
    <section
      data-section="SbomIntelligence"
      className="relative overflow-hidden bg-white"
    >
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-220px",
          top: "-160px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "-220px",
          bottom: "-140px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.18) 0%, rgba(44,193,235,0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md">
        <div className="text-center mb-10 md:mb-14">
          <Reveal header>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-h2)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "#111",
              }}
            >
              <span className="block">SBOM Intelligence That</span>
              <span className="block">
                {"Drives "}
                <span className="cs-text-gradient-impact">Action</span>
              </span>
            </h2>
          </Reveal>
        </div>
      </div>

      <div className="relative hidden sm:block mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-section-md">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "32px" }}>
          {CARDS.map((card) => (
            <IntelligenceCard key={card.id} title={card.title} body={card.body} icon={card.icon} />
          ))}
        </div>
      </div>

      <div
        className="sm:hidden flex flex-col items-center pb-10"
        style={{ gap: "16px", paddingLeft: "10px", paddingRight: "10px" }}
      >
        {CARDS.map((card) => (
          <MobileIntelligenceCard
            key={card.id}
            title={card.title}
            body={card.body}
            mobileIcon={card.mobileIcon}
            titleW={card.mobileTitleW}
            bodyW={card.mobileBodyW}
          />
        ))}
      </div>
    </section>
  );
}

function IntelligenceCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: string;
}): React.ReactElement {
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: "295/324",
        padding: "4px",
        borderRadius: "40px",
        background: "rgba(44,193,235,0.30)",
      }}
    >
      <div
        className="relative overflow-hidden bg-white h-full"
        style={{
          borderRadius: "36px",
          paddingTop: "clamp(80px, 7vw, 110px)",
          paddingBottom: "clamp(20px, 1.67vw, 32px)",
          paddingLeft: "clamp(20px, 1.67vw, 32px)",
          paddingRight: "clamp(20px, 1.67vw, 32px)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none select-none absolute"
          style={{
            left: "50%",
            top: "28px",
            transform: "translateX(-50%)",
            width: "85%",
            height: "153px",
            opacity: 0.3,
            background: "#df9bff",
            filter: "blur(66px)",
            borderRadius: "50%",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none select-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 56px, rgba(0,0,0,0.04) 56px, rgba(0,0,0,0.04) 57px)",
            opacity: 0.4,
          }}
        />
        <div
          className="relative mx-auto flex items-center justify-center"
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0 6.17px 14.54px rgba(28,60,142,0.33), inset 0 -0.23px 0.29px rgba(0,44,179,0.5), inset 0 0.12px 0.58px rgba(255,255,255,0.81)",
            marginTop: "-48px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            aria-hidden
            style={{ width: "54px", height: "54px", display: "block" }}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="relative text-left flex flex-col gap-3">
          <p
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            {title}
          </p>
          <p
            className="text-[#555]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileIntelligenceCard({
  title,
  body,
  mobileIcon,
  titleW,
  bodyW,
}: {
  title: string;
  body: string;
  mobileIcon: string;
  titleW: number;
  bodyW: number;
}): React.ReactElement {
  const BALL_TOP = 18;
  const TEXT_TOP = 108;

  return (
    <div
      className="relative"
      style={{ width: "340px", height: "238px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/sbom/mobile-intel-card-frame.svg"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />

      <div
        className="absolute bg-white overflow-hidden"
        style={{
          left: "6px",
          top: "6px",
          width: "328px",
          height: "226px",
          borderRadius: "16px",
        }}
      >
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "13px",
            width: "209px",
            height: "90px",
            background: "#DF9BFF",
            opacity: 0.5,
            filter: "blur(66.5px)",
            borderRadius: "50%",
          }}
        />

        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: `${BALL_TOP}px`,
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 4.5px 10.6px 0px rgba(28,60,142,0.33), inset 0px -0.17px 0.212px 0px rgba(0,44,179,0.5), inset 0px 0.085px 0.424px 0px rgba(255,255,255,0.81)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileIcon}
            alt=""
            aria-hidden
            width={40}
            height={40}
            className="object-contain relative z-10"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div
          className="absolute flex flex-col items-center text-center"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: `${TEXT_TOP}px`,
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h4)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#000",
              width: `${titleW}px`,
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "#111",
              opacity: 0.8,
              width: `${bodyW}px`,
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
