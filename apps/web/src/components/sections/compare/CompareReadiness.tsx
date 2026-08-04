import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { COMPLIANCE, DEV_EXPERIENCE, VERIFYING } from "./compare-data";
import { BAND_DARK, EllipseGlow, Icon3D } from "./compare-visuals";

/**
 * Compliance and Regulatory Readiness · Developer Experience · Verifying
 * Container Images — the article's three "what this buys you in practice"
 * sections, set as three movements on one dark band.
 *
 * Three list shapes, three treatments: six compliance capabilities as icon
 * tiles, seven tool names as plain chips (they are labels, not statements, and
 * mixing real vendor logos with names we have no mark for would read as an
 * accident), and seven verification questions as a numbered sequence — which is
 * how the article frames them.
 */

const EVIDENCE_ICONS: readonly string[] = [
  "/images/compare/icon-provenance.webp",
  "/images/compare/icon-signed-artifact.webp",
  "/images/compare/icon-sbom.webp",
  "/images/attack-surface-reduction/approach-icon-deterministic.webp",
  "/images/compare/icon-fips.webp",
  "/images/compare/icon-stig.webp",
];

/**
 * Brand marks for the tooling list, in the README-badge idiom.
 *
 * Artwork is Simple Icons (CC0), the same set shields.io badges use, saved as
 * SVGs under `public/images/compare/tools/` so ~18KB of path data stays out of
 * the bundle and nothing is fetched from a third-party CDN at runtime.
 *
 * Each mark sits on a white disc rather than directly on the band: Helm's brand
 * colour is `#0F1689`, which is invisible against a dark section, so a
 * full-colour-on-dark badge would silently lose one of the seven.
 */
const TOOL_LOGOS: Readonly<Record<string, string>> = {
  Docker: "docker",
  Kubernetes: "kubernetes",
  Helm: "helm",
  "GitHub Actions": "github-actions",
  "GitLab CI": "gitlab",
  Jenkins: "jenkins",
  "Argo CD": "argo-cd",
};

const DARK_BODY: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  lineHeight: 1.65,
  letterSpacing: "-0.01em",
  color: "rgba(255,255,255,0.78)",
  maxWidth: "68ch",
  textWrap: "pretty",
};

function DarkHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Reveal header>
      <h2
        id={id}
        className="font-display text-white"
        style={{
          fontSize: "var(--fs-h2)",
          fontWeight: 600,
          letterSpacing: "var(--fs-h2-ls)",
          lineHeight: "var(--fs-h2-lh)",
          maxWidth: "24ch",
          textWrap: "balance",
        }}
      >
        {children}
      </h2>
    </Reveal>
  );
}

export function CompareReadiness(): React.ReactElement {
  return (
    <Section
      data-section="CompareReadiness"
      padding="lg"
      className="relative overflow-hidden"
      style={{ background: BAND_DARK }}
      aria-labelledby="compare-compliance-title"
    >
      <EllipseGlow side="right" />

      <Container className="relative flex flex-col gap-[clamp(56px,5vw,88px)]">
        {/* ── Compliance and Regulatory Readiness ── */}
        <div className="flex flex-col gap-6 md:gap-7">
          <DarkHeading id="compare-compliance-title">
            {COMPLIANCE.heading}
          </DarkHeading>
          {COMPLIANCE.body.map((text) => (
            <Reveal key={text}>
              <p style={DARK_BODY}>{text}</p>
            </Reveal>
          ))}
          <Reveal>
            <p style={{ ...DARK_BODY, color: "#ffffff", fontWeight: 500 }}>
              {COMPLIANCE.listLead}
            </p>
          </Reveal>

          {/* One panel holding all six, divided by hairlines — the same move as
              the opening questions. Six separate tiles was noise; six bare rows
              on a dark band had nothing holding them together. */}
          <div
            className="overflow-hidden"
            style={{
              borderRadius: "24px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <RevealStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {(COMPLIANCE.items ?? []).map((item, index) => (
                <RevealItem key={item} className="h-full">
                  <div
                    className={cn(
                      "flex h-full items-center gap-4 border-white/[0.10]",
                      index > 0 ? "border-t sm:border-t-0" : "",
                      index % 2 === 1 ? "sm:border-l lg:border-l-0" : "",
                      index >= 2 ? "sm:border-t" : "",
                      index % 3 !== 0 ? "lg:border-l" : "",
                      index >= 3 ? "lg:border-t" : "lg:border-t-0",
                    )}
                    style={{ padding: "clamp(16px, 1.5vw, 22px)" }}
                  >
                    <Icon3D
                      src={EVIDENCE_ICONS[index] ?? EVIDENCE_ICONS[0] ?? ""}
                      size={56}
                    />
                    <span
                      className="font-display text-white"
                      style={{
                        fontSize: "var(--fs-h5)",
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.25,
                        textWrap: "balance",
                      }}
                    >
                      {item}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          <Reveal>
            <p style={DARK_BODY}>{COMPLIANCE.after?.[0]}</p>
          </Reveal>
        </div>

        {/* ── Developer Experience ── */}
        <div
          className="flex flex-col gap-6 md:gap-7"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "clamp(40px, 3.6vw, 64px)",
          }}
        >
          <DarkHeading id="compare-dev-title">{DEV_EXPERIENCE.heading}</DarkHeading>
          <Reveal>
            <p style={{ ...DARK_BODY, fontSize: "var(--fs-lead-sm)", lineHeight: 1.5 }}>
              {DEV_EXPERIENCE.body[0]}
            </p>
          </Reveal>
          <Reveal>
            <p style={{ ...DARK_BODY, color: "#ffffff", fontWeight: 500 }}>
              {DEV_EXPERIENCE.listLead}
            </p>
          </Reveal>

          <RevealStagger className="flex flex-wrap gap-3">
            {DEV_EXPERIENCE.items.map((tool) => {
              const slug = TOOL_LOGOS[tool];
              return (
                <RevealItem key={tool}>
                  <span
                    className="inline-flex items-center gap-2.5 text-white"
                    style={{
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.07)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)",
                      padding: slug ? "7px 20px 7px 7px" : "10px 20px",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {slug && (
                      <span
                        aria-hidden
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/images/compare/tools/${slug}.svg`}
                          alt=""
                          width={16}
                          height={16}
                          className="pointer-events-none select-none"
                          style={{ width: 16, height: 16 }}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    )}
                    {tool}
                  </span>
                </RevealItem>
              );
            })}
          </RevealStagger>

          <div className="flex flex-col gap-4">
            {DEV_EXPERIENCE.after.map((text) => (
              <Reveal key={text}>
                <p style={DARK_BODY}>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Verifying Container Images ── */}
        <div
          className="flex flex-col gap-6 md:gap-7"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.16)",
            paddingTop: "clamp(40px, 3.6vw, 64px)",
          }}
        >
          <DarkHeading id="compare-verifying-title">{VERIFYING.heading}</DarkHeading>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
            <div className="flex flex-col gap-5">
              <Reveal>
                <p style={{ ...DARK_BODY, fontSize: "var(--fs-lead-sm)", lineHeight: 1.5 }}>
                  {VERIFYING.body[0]}
                </p>
              </Reveal>
              <Reveal>
                <p style={{ ...DARK_BODY, color: "#ffffff", fontWeight: 500 }}>
                  {VERIFYING.listLead}
                </p>
              </Reveal>
              <Reveal>
                <p style={{ ...DARK_BODY, color: "rgba(255,255,255,0.62)" }}>
                  {VERIFYING.after[0]}
                </p>
              </Reveal>
            </div>

            <RevealStagger className="flex flex-col">
              {VERIFYING.items.map((question, index) => (
                <RevealItem key={question}>
                  <div
                    className="flex items-center gap-5 py-3.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.16)" }}
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full tabular-nums"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        boxShadow: "inset 0 0 0 1px rgba(201,166,255,0.45)",
                        color: "#C9A6FF",
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-caption)",
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      className="text-white/90"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        lineHeight: 1.45,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {question}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </div>
      </Container>
    </Section>
  );
}
