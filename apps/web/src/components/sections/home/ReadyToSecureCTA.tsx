import { Reveal } from "@/components/ui/Reveal";

/**
 * Inner content for the Home page CTA, rendered inside the Footer's fixed
 * 1276×330 / radius-40 slot. The Footer owns the container, position, overlap,
 * and z-stacking. This component renders only the fill, decorative art, and
 * copy/CTA. The wrapper is `absolute inset-0` to fill the locked slot.
 */
export function ReadyToSecureCTA() {
  return (
    <div
      className="absolute inset-0 grid grid-cols-1 items-center gap-y-8 p-8 md:gap-y-0 md:p-12 lg:items-start lg:grid-cols-[minmax(0,460px)_minmax(0,460px)] lg:gap-x-[clamp(32px,5vw,72px)] lg:justify-center lg:p-[clamp(32px,4vw,48px)_clamp(32px,5vw,80px)]"
      style={{
        background: "linear-gradient(180deg, #131E8F 0%, #471EC0 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "-10%",
          top: "-30%",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(closest-side, rgba(127,82,255,0.55) 0%, rgba(127,82,255,0) 70%)",
        }}
      />

      <Reveal header className="relative z-10 mx-auto lg:mx-0">
        <p
          id="cta-title"
          className="font-display text-white text-center lg:text-left"
          style={{
            maxWidth: "min(460px, 100%)",
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            textWrap: "balance",
          }}
        >
          Ready to Secure Your Container Infrastructure?
        </p>
      </Reveal>

      <Reveal header delay={0.15} y={20} className="relative z-10 flex flex-col items-center lg:items-start gap-[18px]">
        <p
          className="font-normal text-white text-center lg:text-left"
          style={{
            maxWidth: "493px",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            opacity: 0.8,
          }}
        >
          Start with zero-CVE hardened images. Deploy faster with confidence
          knowing your containers are secured from the ground up.
        </p>
        <a
          href="/book-a-demo"
          className="cs-btn-glass"
          style={{
            ["--cs-btn-px" as string]: "18px",
            ["--cs-btn-fs" as string]: "16px",
          }}
        >
          <span>Book a Demo</span>
        </a>
      </Reveal>
    </div>
  );
}
