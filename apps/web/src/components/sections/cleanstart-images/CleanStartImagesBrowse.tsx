import type React from "react";
import { Reveal, RevealStagger, RevealItem } from "@/components/ui/Reveal";

type TrustCard = {
  title: string;
  body: string;
  iconSrc: string;
};

const TRUST_CARDS: TrustCard[] = [
  {
    title: "Transperent Origins",
    body: "Rebuilt from trusted upstream software.",
    iconSrc: "/images/cleanstart-images/trust-icon-trusted-source.svg",
  },
  {
    title: "Reduced Risk",
    body: "Minimal foundations with near-zero CVEs.",
    iconSrc: "/images/cleanstart-images/trust-icon-minimal-runtime.svg",
  },
  {
    title: "Verifiable Integrity",
    body: "Deterministic builds with software provenance.",
    iconSrc: "/images/cleanstart-images/trust-icon-deterministic.svg",
  },
  {
    title: "Compliance Ready",
    body: "Built for enterprise security requirements.",
    iconSrc: "/images/cleanstart-images/trust-icon-continuous-rebuild.svg",
  },
];

// Vertical line x-positions (px within the 287px card).
const VERTICAL_LINES = [48.47, 120.03, 162.38, 233.94];

/**
 * Mobile card — vertical layout: icon centered at top, text centered below.
 */
function MobileTrustCard({ card }: { card: TrustCard }): React.ReactElement {
  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: "328px",
        height: "226px",
        position: "relative",
        borderRadius: "16px",
        background: "white",
        overflow: "hidden",
        /* Subtle cyan glow border. */
        boxShadow:
          "0 0 0 1.5px rgba(44,193,235,0.22), 0 6px 24px rgba(44,193,235,0.14), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Purple glow blob — sits behind the ball. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{
          top: "-16px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "209px",
          height: "90px",
          background: "#df9bff",
          filter: "blur(66.5px)",
          opacity: 0.5,
          borderRadius: "50%",
        }}
      />

      {/* Blue ball — centered horizontally. */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
          boxShadow:
            "0px 4.5px 10.5px rgba(28,60,142,0.33), inset 0px 0.116px 0.582px rgba(255,255,255,0.81), inset 0px -0.233px 0.291px rgba(0,44,179,0.5)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.iconSrc}
          alt=""
          aria-hidden
          width={40}
          height={40}
          className="select-none pointer-events-none"
          style={{ width: "40px", height: "40px" }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text block — centered. */}
      <div
        className="absolute flex flex-col items-center text-center"
        style={{
          top: "108px",
          left: "16px",
          right: "16px",
          gap: "12px",
        }}
      >
        <h3
          className="font-display"
          style={{
            fontSize: "var(--fs-h4)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.2,
            color: "#000",
          }}
        >
          {card.title}
        </h3>
        <p
          className="font-sans"
          style={{
            fontSize: "var(--fs-body-sm)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.5,
            color: "rgba(17,17,17,0.8)",
          }}
        >
          {card.body}
        </p>
      </div>
    </div>
  );
}

/**
 * Desktop card — cyan glow border wrapper, white card, grid lines,
 * left-aligned ball + text.
 *
 * Fluid: the inner card is a container-query context (`container-type:
 * inline-size`) with a locked 287:346 aspect ratio, so every interior
 * dimension is expressed in `cqi` (1cqi = 1% of the card's width). The card
 * shrinks to fit its grid column — four-in-a-row from lg without overflow —
 * while the whole composition scales proportionally. Type stays on the role
 * tokens so copy remains legible at every size.
 */
function DesktopTrustCard({ card }: { card: TrustCard }): React.ReactElement {
  return (
    <div
      className="w-full"
      style={{
        background: "rgba(44,193,235,0.3)",
        borderRadius: "40px",
        padding: "4px",
      }}
    >
      {/* Inner white card. */}
      <div
        className="relative bg-white overflow-hidden w-full"
        style={{
          aspectRatio: "287 / 346",
          borderRadius: "36px",
          containerType: "inline-size",
        }}
      >
        {/* Purple glow blob — centered near the top. */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: "9.756cqi",
            left: "50%",
            transform: "translateX(-50%)",
            width: "91.593cqi",
            height: "53.31cqi",
            background: "#df9bff",
            filter: "blur(66.5px)",
            opacity: 0.3,
            borderRadius: "50%",
          }}
        />

        {/* Horizontal gradient lines. */}
        {[23.531, 63.952].map((y) => (
          <div
            key={y}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: `${y}cqi`,
              left: "-23.693cqi",
              right: "-23.693cqi",
              height: "1px",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.3,
            }}
          />
        ))}

        {/* Vertical gradient lines. */}
        {VERTICAL_LINES.map((x) => (
          <div
            key={x}
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: `${((x / 287) * 100).toFixed(3)}cqi`,
              top: 0,
              width: "0.73px",
              height: "91.986cqi",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50.77%, rgba(255,255,255,0) 100%)",
              opacity: 0.8,
            }}
          />
        ))}

        {/* Blue ball icon — left-aligned with the text below. */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "8.362cqi",
            left: "8.362cqi",
            width: "33.449cqi",
            height: "33.449cqi",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
            boxShadow:
              "0px 6.171px 14.537px rgba(28,60,142,0.33), inset 0px 0.116px 0.582px rgba(255,255,255,0.81), inset 0px -0.233px 0.291px rgba(0,44,179,0.5)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.iconSrc}
            alt=""
            aria-hidden
            width={54}
            height={54}
            className="select-none pointer-events-none"
            style={{ width: "18.815cqi", height: "18.815cqi" }}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Text. */}
        <div
          className="absolute flex flex-col"
          style={{
            left: "8.362cqi",
            right: "8.362cqi",
            top: "56.446cqi",
            gap: "4.181cqi",
          }}
        >
          <h3
            className="font-display"
            style={{
              fontSize: "var(--fs-h3)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111",
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-sans"
            style={{
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.03em",
              color: "#555",
            }}
          >
            {card.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CleanStartImagesBrowse(): React.ReactElement {
  return (
    <section
      data-section="CleanStartImagesTrustedSources"
      className="relative overflow-hidden bg-white"
    >
      {/* Corner vector — top-left. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-414px", top: "-174px", width: "568px", height: "551px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/browse-vector-corner.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Corner vector — top-right. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "1260px", top: "-156px", width: "568px", height: "551px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cleanstart-images/browse-vector-corner.svg"
          alt=""
          aria-hidden
          className="block size-full max-w-none select-none pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Ellipse glow — left. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "-305px", top: "578px", width: "315px", height: "315px" }}
      >
        <div style={{ position: "absolute", inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/browse-ellipse-glow.svg"
            alt=""
            aria-hidden
            className="block size-full max-w-none select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {/* Ellipse glow — right. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "1487px", top: "578px", width: "315px", height: "315px" }}
      >
        <div style={{ position: "absolute", inset: "-64.44%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cleanstart-images/browse-ellipse-glow.svg"
            alt=""
            aria-hidden
            className="block size-full max-w-none select-none pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center"
        style={{
          paddingTop: "var(--spacing-section-md)",
          paddingBottom: "var(--spacing-section-md)",
        }}
      >
        {/* Heading. */}
        <Reveal header>
          <h2
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.2,
              color: "#111",
            }}
          >
            Engineered for{" "}
            <span className="cs-text-gradient-impact"> Assurance</span>
          </h2>
        </Reveal>

        {/* Mobile card list — vertical stack, hidden at md+. */}
        <RevealStagger className="md:hidden mt-10 w-full flex flex-col items-center gap-7">
          {TRUST_CARDS.map((card) => (
            <RevealItem key={card.title} className="w-full max-w-[328px]">
              <MobileTrustCard card={card} />
            </RevealItem>
          ))}
        </RevealStagger>

        {/* Tablet/desktop card grid — 2×2 below lg, 4-up from lg.
            Columns cap at 287px (Figma size) on wide screens and shrink to fit
            below, so the fluid cards never overflow nor stretch oversized. */}
        <RevealStagger
          className="hidden md:grid justify-center mt-12 lg:mt-16 gap-y-8 gap-x-6 xl:gap-x-[41px] grid-cols-[repeat(2,minmax(0,287px))] lg:grid-cols-[repeat(4,minmax(0,287px))]"
        >
          {TRUST_CARDS.map((card) => (
            <RevealItem key={card.title} className="w-full">
              <DesktopTrustCard card={card} />
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
