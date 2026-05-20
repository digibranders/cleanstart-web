import Image from "next/image";

interface TeamMember {
  name: string;
  role?: string;
  photo: string;
  linkedIn?: string;
}

const EXECUTIVES: TeamMember[] = [
  {
    name: "Nilesh Jain",
    role: "CO-FOUNDER & CEO",
    photo: "/images/teams/nilesh-jain.png",
    linkedIn: "https://linkedin.com/in/nilesh-jain",
  },
  {
    name: "Vijendra Katiyar",
    role: "CO-FOUNDER & CRO",
    photo: "/images/teams/vijendra-katiyar.png",
    linkedIn: "https://linkedin.com/in/vijendra-katiyar",
  },
  {
    name: "Biswajit De",
    role: "CO-FOUNDER & CTO",
    photo: "/images/teams/biswajit-de.png",
    linkedIn: "https://linkedin.com/in/biswajit-de",
  },
];

const ADVISORS: TeamMember[] = [
  {
    name: "Anandamoy Roychowdhary",
    photo: "/images/teams/anandamoy-roychowdhary.png",
    linkedIn: "https://linkedin.com/in/anandamoy-roychowdhary",
  },
];

// Card background: radial gradient SVG data URL — exact Figma spec
// gradientTransform matrix produces a top→bottom directional fill
const CARD_BG_IMAGE = `url("data:image/svg+xml,<svg viewBox='0 0 404 469' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-0.65 -56 48.239 -1.0303 221 469)'><stop stop-color='rgba(71,31,195,0.4)' offset='0'/><stop stop-color='rgba(45,31,169,0.7)' offset='0.36881'/><stop stop-color='rgba(19,30,143,1)' offset='0.73763'/><stop stop-color='rgba(18,24,103,1)' offset='0.86881'/><stop stop-color='rgba(16,18,62,1)' offset='1'/></radialGradient></defs></svg>")`;

function TeamCard({ name, role, photo, linkedIn }: TeamMember) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px]"
      style={{
        aspectRatio: "404 / 469",
        backgroundImage: CARD_BG_IMAGE,
        backgroundSize: "100% 100%",
      }}
    >
      {/* Photo — shifted 11px up to improve head-room framing (matches Figma) */}
      <div className="absolute inset-0" style={{ top: "-11px" }}>
        <Image
          src={photo}
          alt={name}
          fill
          className="pointer-events-none object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 404px"
        />
      </div>

      {/* Bottom gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{
          height: "131px",
          background: "linear-gradient(to bottom, rgba(71,30,193,0), #210e5b)",
        }}
      />

      {/* Name + role + LinkedIn — top: 78.47% = 368px / 469px card height */}
      <div
        className="absolute left-[24px] right-[24px] flex items-center justify-between"
        style={{ top: "78.47%" }}
      >
        <div className="flex flex-col gap-[9px] text-white">
          <p
            className="font-display font-bold leading-none"
            style={{
              fontSize: "clamp(1.25rem, 2.2vw, 2rem)",
              letterSpacing: "-0.05em",
            }}
          >
            {name}
          </p>
          {role !== undefined && (
            <p
              className="font-sans font-normal leading-[1.4]"
              style={{
                fontSize: "clamp(0.875rem, 1.4vw, 1.25rem)",
                letterSpacing: "-0.05em",
              }}
            >
              {role}
            </p>
          )}
        </div>

        {linkedIn !== undefined ? (
          <a
            href={linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${name} on LinkedIn`}
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/teams/linkedin-btn.svg"
              alt=""
              width={44}
              height={44}
              aria-hidden
              loading="lazy"
              decoding="async"
            />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/teams/linkedin-btn.svg"
            alt=""
            width={44}
            height={44}
            aria-hidden
            className="shrink-0"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
    </div>
  );
}

export function TeamsLeadership() {
  return (
    <section className="relative overflow-hidden bg-white py-[120px]">
      {/* ── Left vector blob (Figma Vector 583:3476) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{ left: "-270px", top: "-183px", width: "919px", height: "891px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/teams/vector-blob.svg"
          alt=""
          width={919}
          height={891}
          loading="lazy"
          decoding="async"
          style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
        />
      </div>

      {/* ── Center vector blob (Figma Vector 583:3477) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{
          left: "calc(344px / 1920 * 100%)",
          top: "722px",
          width: "1177px",
          height: "1142px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/teams/vector-blob-center.svg"
          alt=""
          width={1177}
          height={1142}
          loading="lazy"
          decoding="async"
          style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
        />
      </div>

      {/* ── Right vector blob (Figma Vector 583:3478) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{
          left: "calc(1441px / 1920 * 100%)",
          top: "-238px",
          width: "919px",
          height: "891px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/teams/vector-blob.svg"
          alt=""
          width={919}
          height={891}
          loading="lazy"
          decoding="async"
          style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
        />
      </div>

      {/* ── Bottom-left union shape (Figma Union 583:3480, rotate 141.39° scaleY-1) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:flex items-center justify-center"
        style={{ left: "-164px", bottom: "-230px", width: "488px", height: "497px" }}
      >
        <div style={{ transform: "rotate(141.39deg) scaleY(-1)", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/union-shape.svg"
            alt=""
            width={324}
            height={377}
            loading="lazy"
            decoding="async"
            style={{ display: "block", maxWidth: "none" }}
          />
        </div>
      </div>

      {/* ── Bottom-right union shape (Figma Union 583:3479, rotate 141.39° scaleY-1) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:flex items-center justify-center"
        style={{
          left: "calc(1620px / 1920 * 100%)",
          bottom: "-247px",
          width: "488px",
          height: "497px",
        }}
      >
        <div style={{ transform: "rotate(141.39deg) scaleY(-1)", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/union-shape.svg"
            alt=""
            width={324}
            height={377}
            loading="lazy"
            decoding="async"
            style={{ display: "block", maxWidth: "none" }}
          />
        </div>
      </div>

      {/* ── Bottom-left ellipse glow (Figma Ellipse 46684, 583:3484) ── */}
      {/* Outer div = position anchor (258×258). Inner div uses inset:-94.19% to expand the glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{ left: "-9px", bottom: "-104px", width: "258px", height: "258px" }}
      >
        <div className="absolute" style={{ inset: "-94.19%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/ellipse-corner.svg"
            alt=""
            loading="lazy"
            decoding="async"
            style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
          />
        </div>
      </div>

      {/* ── Bottom-right ellipse glow (Figma Ellipse 46684, 583:3483) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{
          left: "calc(1775px / 1920 * 100%)",
          bottom: "-121px",
          width: "258px",
          height: "258px",
        }}
      >
        <div className="absolute" style={{ inset: "-94.19%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/teams/ellipse-corner.svg"
            alt=""
            loading="lazy"
            decoding="async"
            style={{ display: "block", maxWidth: "none", width: "100%", height: "100%" }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Executive Leadership */}
        <h2
          className="mb-[60px] text-center font-display font-bold text-[#111]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.875rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          {"Executive "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(-7.2deg, rgb(44,193,235) 0%, rgb(154,81,255) 64%)",
            }}
          >
            Leadership
          </span>
        </h2>

        <div className="mb-[120px] grid grid-cols-1 gap-8 md:grid-cols-3">
          {EXECUTIVES.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>

        {/* Advisory Board */}
        <h2
          className="mb-[60px] text-center font-display font-bold text-[#111]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.875rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          {"Advisory "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(-9.86deg, rgb(44,193,235) 0%, rgb(154,81,255) 64%)",
            }}
          >
            Board
          </span>
        </h2>

        <div className="flex justify-center">
          <div className="w-full max-w-[404px]">
            {ADVISORS[0] !== undefined && <TeamCard {...ADVISORS[0]} />}
          </div>
        </div>
      </div>
    </section>
  );
}
