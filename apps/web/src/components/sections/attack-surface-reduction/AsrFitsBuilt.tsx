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
      className="relative overflow-hidden rounded-[32px]"
      style={{ minHeight: "352px" }}
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
        className="absolute rounded-[32px] bg-white overflow-hidden"
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
            height: "153px",
            background: "#df9bff",
            borderRadius: "50%",
            filter: "blur(66.5px)",
            opacity: 0.5,
          }}
        />

        {/* Subtle grid lines */}
        {[68, 166, 224, 322].map((x) => (
          <div
            key={x}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: x,
              top: 0,
              width: "1px",
              height: "264px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}

        {/* Horizontal grid lines */}
        {[75, 191].map((y) => (
          <div
            key={y}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              right: 0,
              top: y,
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ))}

        {/* 3D icon */}
        <div
          className="relative overflow-hidden"
          style={{ height: "200px" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.icon}
            alt=""
            aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "160px",
              height: "160px",
              objectFit: "contain",
            }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Divider */}
        <div
          aria-hidden
          className="pointer-events-none"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* Text */}
        <div className="px-10 py-8 flex flex-col gap-4">
          <p
            className="text-[#111]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
            }}
          >
            {card.title}
          </p>
          <p
            className="text-[#555]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
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
