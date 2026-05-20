export function AsrFitsBuilt(): React.ReactElement {
  const cards: Array<{
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      icon: "/images/attack-surface-reduction/fits-icon-1.png",
      title: "Drop-in Images",
      description: "Fewer exploitable components exist at image pull time",
    },
    {
      icon: "/images/attack-surface-reduction/fits-icon-2.png",
      title: "Pipeline Compatible",
      description: "Works with existing CI/CD and registries.",
    },
    {
      icon: "/images/attack-surface-reduction/fits-icon-3.png",
      title: "Deploy Anywhere",
      description: "Supports Kubernetes and container platforms.",
    },
  ];

  return (
    <section
      data-section="AsrFitsBuilt"
      className="relative overflow-hidden"
    >
      <div className="relative mx-auto max-w-[1276px] px-6 py-16 md:py-[88px]">
        {/* Heading row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <h2
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.23vw, 62px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1.05,
              maxWidth: "562px",
            }}
          >
            Fits into what you&rsquo;ve already{" "}
            <span
              style={{
                background: "linear-gradient(95deg, #9A51FF 0%, #2CC1EB 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              built
            </span>
          </h2>
          <p
            className="text-[#111]/70"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.15vw, 22px)",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.4,
              maxWidth: "458px",
            }}
          >
            Stay informed with the latest research, threat intelligence reports,
            and expert analysis from our security team.
          </p>
        </div>

        {/* Cards row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <FitsCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FitsCardProps {
  card: { icon: string; title: string; description: string };
}

function FitsCard({ card }: FitsCardProps): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] min-h-[clamp(260px,26vw,352px)]"
    >
      {/* Outer cyan border glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[40px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, #2CC1EB 0%, #2CC1EB 100%)",
          opacity: 0.3,
        }}
      />

      {/* White card with subtle shadow */}
      <div
        className="absolute rounded-[32px] bg-white overflow-hidden flex flex-col"
        style={{ inset: "8px" }}
      >
        {/* Purple glow blob */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "8px",
            top: "43px",
            width: "360px",
            maxWidth: "calc(100% + 80px)",
            height: "153px",
            background: "#df9bff",
            borderRadius: "50%",
            filter: "blur(66.5px)",
            opacity: 0.5,
          }}
        />

        {/* Subtle grid lines — vertical, percentage-positioned so they scale
            with card width instead of clipping at narrow widths. */}
        {[20, 49, 66, 95].map((pct) => (
          <div
            key={pct}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `${pct}%`,
              top: 0,
              width: "1px",
              height: "60%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}

        {/* Horizontal grid lines — percentage Y so they track icon-area height */}
        {[22, 56].map((pct) => (
          <div
            key={pct}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: `${pct}%`,
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}

        {/* 3D icon — fluid height, icon vertically centred so the gap to
            title is consistent at all viewports. */}
        <div className="relative flex items-center justify-center h-[clamp(120px,14vw,180px)] shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.icon}
            alt=""
            aria-hidden
            className="pointer-events-none select-none object-contain"
            style={{
              width: "clamp(110px, 12vw, 160px)",
              aspectRatio: "1 / 1",
            }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Divider */}
        <div
          aria-hidden
          className="pointer-events-none shrink-0"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Text — fluid padding + token typography */}
        <div className="flex flex-col gap-[clamp(8px,1vw,16px)] p-[clamp(20px,2.5vw,40px)]">
          <p
            className="text-card-title-lg text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
            }}
          >
            {card.title}
          </p>
          <p
            className="text-body-lg text-[#555]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              letterSpacing: "-0.05em",
              lineHeight: 1.4,
              maxWidth: "295px",
            }}
          >
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
