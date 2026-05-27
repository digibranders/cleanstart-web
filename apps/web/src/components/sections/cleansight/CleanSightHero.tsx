import Image from "next/image";
import Link from "next/link";

/*
 * CleanSight Hero — Figma node 926:2365 (Option2 redesign).
 *
 * Stacked centred layout: heading + description + "Contact Us" CTA at top,
 * raw dashboard screenshot (no laptop frame) below. Two soft radial glows
 * flank the dashboard on the left and right. Background is the same
 * navy → indigo → violet gradient as before, fading to white into the
 * next section.
 */
export function CleanSightHero(): React.ReactElement {
  return (
    <section
      data-section="CleanSightHero"
      className="relative overflow-hidden"
      style={{
        // Bottom alpha-fade dropped — keep the violet solid all the way down
        // so the section beneath isn't bleeding through as a white wash.
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 100%)",
      }}
    >
      {/* Bottom white fade removed — the next section (WhyMattersGrid) now
          owns its own top-edge gradient blend, so the hero can keep its
          purple bottom intact. */}

      {/* ── Content ── */}
      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "clamp(96px, 9.5vw, 138px)",
          paddingBottom: "0px",
          zIndex: 2,
        }}
      >
        {/* Centred heading + description + CTA */}
        <div className="flex flex-col items-center text-center gap-6">
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-display)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              textWrap: "balance",
            }}
          >
            <span className="block">Continuous Visibility.</span>
            <span className="block">
              Continuous{" "}
              <span className="cs-text-gradient-impact">Remediation.</span>
            </span>
          </h1>

          <p
            className="text-white max-w-[640px]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              opacity: 0.8,
            }}
          >
            Continuously discover, assess, and remediate container risk across
            modern environments.
          </p>

          <Link
            href="/contact-us"
            className="cs-btn-glass"
            style={
              {
                "--cs-btn-px": "20px",
                "--cs-btn-fs": "15px",
              } as React.CSSProperties
            }
          >
            <span>Contact Us</span>
          </Link>
        </div>

        {/* Dashboard screenshot + side glows. Mounted to the bottom of the
            hero section: fixed 56 px gap below the CTA at every viewport,
            and zero padding below so the dashboard's rounded bottom edge
            sits flush with the section's bottom edge. The image keeps its
            aspect ratio and scales down proportionally with the viewport. */}
        <div
          className="relative mx-auto"
          style={{
            marginTop: "56px",
            maxWidth: "min(960px, 100%)",
            paddingBottom: "0px",
          }}
        >
          {/* Left glow — Ellipse 46683 */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute hidden md:block"
            style={{
              left: "-180px",
              top: "-12px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(192, 59, 255, 0.45) 0%, rgba(192, 59, 255, 0) 70%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />
          {/* Right glow — Ellipse 46684 */}
          <div
            aria-hidden
            className="pointer-events-none select-none absolute hidden md:block"
            style={{
              right: "-180px",
              bottom: "-40px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(44, 193, 235, 0.40) 0%, rgba(44, 193, 235, 0) 70%)",
              filter: "blur(40px)",
              zIndex: 0,
            }}
          />

          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "11px",
              boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
              zIndex: 2,
            }}
          >
            <Image
              src="/images/cleansight/hero-dashboard-v2.png"
              alt="CleanSight dashboard showing container visibility metrics, vulnerability breakdown, and ecosystem package distribution"
              width={1018}
              height={581}
              sizes="(min-width: 1024px) 960px, 100vw"
              className="block w-full h-auto select-none"
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
