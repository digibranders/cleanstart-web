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
    linkedIn: "https://www.linkedin.com/in/nilesh-jain-80243520/",
  },
  {
    name: "Vijendra Katiyar",
    role: "CO-FOUNDER & CRO",
    photo: "/images/teams/vijendra-katiyar.png",
    linkedIn: "https://www.linkedin.com/in/vijendra-katiyar-55456ba/",
  },
  {
    name: "Biswajit De",
    role: "CO-FOUNDER & CTO",
    photo: "/images/teams/biswajit-de.png",
    linkedIn: "https://www.linkedin.com/in/biswajitde/",
  },
];

const ADVISORS: TeamMember[] = [
  {
    name: "Anandamoy Roychowdhary",
    photo: "/images/teams/anandamoy-roychowdhary.png",
    linkedIn: "https://www.linkedin.com/in/anandamoy/",
  },
];

function LinkedInIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M31.1667 3.66667C33.5978 3.66667 35.9294 4.63244 37.6485 6.35152C39.3676 8.0706 40.3333 10.4022 40.3333 12.8333V31.1667C40.3333 33.5978 39.3676 35.9294 37.6485 37.6485C35.9294 39.3676 33.5978 40.3333 31.1667 40.3333H12.8333C10.4022 40.3333 8.0706 39.3676 6.35152 37.6485C4.63244 35.9294 3.66667 33.5978 3.66667 31.1667V12.8333C3.66667 10.4022 4.63244 8.0706 6.35152 6.35152C8.0706 4.63244 10.4022 3.66667 12.8333 3.66667H31.1667ZM14.6667 18.3333C14.1804 18.3333 13.7141 18.5265 13.3703 18.8703C13.0265 19.2141 12.8333 19.6804 12.8333 20.1667V29.3333C12.8333 29.8196 13.0265 30.2859 13.3703 30.6297C13.7141 30.9735 14.1804 31.1667 14.6667 31.1667C15.1529 31.1667 15.6192 30.9735 15.963 30.6297C16.3068 30.2859 16.5 29.8196 16.5 29.3333V20.1667C16.5 19.6804 16.3068 19.2141 15.963 18.8703C15.6192 18.5265 15.1529 18.3333 14.6667 18.3333ZM25.6667 18.3333C24.9311 18.3329 24.203 18.48 23.5253 18.766L23.2962 18.8705C23.0398 18.6142 22.7131 18.4396 22.3576 18.3689C22.002 18.2982 21.6334 18.3345 21.2985 18.4733C20.9635 18.612 20.6772 18.8469 20.4758 19.1483C20.2743 19.4497 20.1667 19.8041 20.1667 20.1667V29.3333C20.1667 29.8196 20.3598 30.2859 20.7036 30.6297C21.0475 30.9735 21.5138 31.1667 22 31.1667C22.4862 31.1667 22.9525 30.9735 23.2964 30.6297C23.6402 30.2859 23.8333 29.8196 23.8333 29.3333V23.8333C23.8333 23.3471 24.0265 22.8808 24.3703 22.537C24.7141 22.1932 25.1804 22 25.6667 22C26.1529 22 26.6192 22.1932 26.963 22.537C27.3068 22.8808 27.5 23.3471 27.5 23.8333V29.3333C27.5 29.8196 27.6932 30.2859 28.037 30.6297C28.3808 30.9735 28.8471 31.1667 29.3333 31.1667C29.8196 31.1667 30.2859 30.9735 30.6297 30.6297C30.9735 30.2859 31.1667 29.8196 31.1667 29.3333V23.8333C31.1667 22.3746 30.5872 20.9757 29.5558 19.9442C28.5243 18.9128 27.1254 18.3333 25.6667 18.3333ZM14.6667 12.8333C14.2176 12.8334 13.7842 12.9983 13.4487 13.2966C13.1131 13.595 12.8987 14.0062 12.8462 14.4522L12.8333 14.685C12.8339 15.1523 13.0128 15.6017 13.3336 15.9415C13.6543 16.2813 14.0927 16.4858 14.5592 16.5131C15.0257 16.5405 15.485 16.3888 15.8434 16.0888C16.2017 15.7889 16.432 15.3635 16.4872 14.8995L16.5 14.6667C16.5 14.1804 16.3068 13.7141 15.963 13.3703C15.6192 13.0265 15.1529 12.8333 14.6667 12.8333Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Card background: radial gradient SVG data URL — exact Figma spec
// gradientTransform matrix produces a top→bottom directional fill
const CARD_BG_IMAGE = `url("data:image/svg+xml,<svg viewBox='0 0 404 469' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-0.65 -56 48.239 -1.0303 221 469)'><stop stop-color='rgba(71,31,195,0.4)' offset='0'/><stop stop-color='rgba(45,31,169,0.7)' offset='0.36881'/><stop stop-color='rgba(19,30,143,1)' offset='0.73763'/><stop stop-color='rgba(18,24,103,1)' offset='0.86881'/><stop stop-color='rgba(16,18,62,1)' offset='1'/></radialGradient></defs></svg>")`;

function TeamCard({ name, role, photo, linkedIn }: TeamMember) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[40px]"
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
            className="shrink-0 text-white transition-colors duration-200 hover:text-[#0A66C2]"
          >
            <LinkedInIcon />
          </a>
        ) : (
          <span className="shrink-0 text-white">
            <LinkedInIcon />
          </span>
        )}
      </div>
    </div>
  );
}

export function TeamsLeadership() {
  return (
    <section className="relative overflow-hidden bg-white py-section-md">
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

      {/* ── Right vector blob (mirror of left top-left) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{ right: "-270px", top: "-183px", width: "919px", height: "891px" }}
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

      {/* ── Center vector blob — sits horizontally centered behind the Advisory Board (Anandamoy) card ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none xl:block"
        style={{
          left: "50%",
          bottom: "-120px",
          width: "1177px",
          height: "1142px",
          transform: "translateX(-50%)",
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
      <div className="relative mx-auto max-w-[var(--container-default)] px-6">
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
