import Image from "next/image";

export interface FactoryCardProps {
  title: string;
  description: string;
}

export function FactoryCard({ title, description }: FactoryCardProps) {
  return (
    <>
      {/* Mobile and tablet variant; the absolute-positioned desktop variant
          only applies at lg+ where the 5-up grid fits. */}
      <div
        className="relative lg:hidden"
        style={{
          width: "295px",
          height: "88px",
          borderRadius: "18px",
          border: "2.24px solid #DAB6F3",
          background: "#151021",
        }}
      >

        <div
          className="absolute mix-blend-color-dodge pointer-events-none"
          style={{
            left: "-7px",
            top: "8px",
            width: "97px",
            height: "72px",
          }}
        >
          <Image
            src="/images/factory-orb.png"
            alt=""
            width={97}
            height={72}
            className="w-full h-full object-contain"
            sizes="97px"
            priority
          />
        </div>

        <div
          className="absolute flex flex-col gap-1 justify-center text-white"
          style={{
            left: "85px",
            right: "64px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <h3
            className="font-display font-medium"
            style={{
              fontSize: "var(--fs-h4)",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </h3>
          <p
            className="font-normal"
            style={{
              fontSize: "var(--fs-body-sm)",
              lineHeight: 1.1,
              letterSpacing: "-0.98px",
              opacity: 0.8,
            }}
          >
            {description}
          </p>
        </div>

        <button
          type="button"
          aria-label={`Learn more about ${title}`}
          className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-white/80 text-white transition hover:bg-white/10"
          style={{
            right: "24px",
            top: "30px",
          }}
        >
          <svg width="8" height="11" viewBox="0 0 9 12" fill="none" aria-hidden>
            <path
              d="M2 1L7 6L2 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div
        className="cs-factory-card relative hidden w-full overflow-hidden rounded-[24px] lg:flex lg:flex-col lg:items-center lg:gap-3 lg:pt-4 lg:pb-4"
        style={{ height: "374px" }}
      >


        <div className="pointer-events-none relative flex w-full items-center justify-center">
          <Image
            src="/images/factory-orb.png"
            alt=""
            width={168}
            height={164}
            priority
            sizes="168px"
            className="object-contain"
            style={{ height: "164px", width: "auto" }}
          />
        </div>

        <div className="relative flex w-full flex-col items-center gap-3 px-3 text-center">
          <h3
            className="font-display font-normal text-white"
            style={{
              fontSize: "var(--fs-h2)",
              lineHeight: "var(--text-t-heading-lg-lh)",
              letterSpacing: "var(--text-t-heading-lg-ls)",
            }}
          >
            {renderTitle(title)}
          </h3>
          <p
            className="font-normal text-white"
            style={{
              fontSize: "var(--fs-body)",
              lineHeight: "var(--text-t-body-md-lh)",
              letterSpacing: "var(--text-t-body-md-ls)",
              opacity: 0.8,
            }}
          >
            {description}
          </p>
        </div>

        <button
          type="button"
          aria-label={`Learn more about ${title}`}
          className="relative mt-auto flex h-7 w-7 items-center justify-center rounded-full border-[1.75px] border-white/95 text-white transition hover:bg-white/10"
        >
          <svg width="9" height="12" viewBox="0 0 9 12" fill="none" aria-hidden>
            <path
              d="M2 1L7 6L2 11"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}

function renderTitle(title: string) {
  const parts = title.split(" ");
  if (parts.length === 1) return <>{title}</>;
  if (parts.length === 2) {
    return (
      <>
        {parts[0]}
        <br />
        {parts[1]}
      </>
    );
  }
  return (
    <>
      {parts.slice(0, 2).join(" ")}
      <br />
      {parts.slice(2).join(" ")}
    </>
  );
}
