import type React from "react";
import Link from "next/link";
import { Container, Section } from "@/components/layout";
import { ArrowRightIcon, DownloadIcon } from "@/components/sections/case-studies/CaseStudyIcons";
import { Reveal } from "@/components/ui/Reveal";
import { RenderLexical } from "@/lib/renderLexical";
import { isLexicalBodyEmpty, type LexicalRoot } from "@/lib/blog";
import type { CaseStudyGlanceFact } from "@/lib/case-studies";

/**
 * The read: a sticky facts rail beside the narrative.
 *
 * The rail is the part a reader actually uses — it holds what they need to
 * repeat the claim to somebody else (who, which sector, when, what format)
 * and the download, pinned so it is reachable from anywhere in the article.
 *
 * The prose column renders the collection's `body`. It is optional, and a
 * study without one gets an honest empty state: the detail is in the PDF, here
 * is the PDF. Better than restating the hero standfirst or filling the space
 * with boilerplate about container security.
 */

function RailRow({ label, value }: CaseStudyGlanceFact): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="font-sans uppercase text-[#8a8a99]"
        style={{ fontSize: "var(--fs-caption)", letterSpacing: "0.07em" }}
      >
        {label}
      </dt>
      <dd
        className="font-sans font-medium text-[#111]"
        style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.4 }}
      >
        {value}
      </dd>
    </div>
  );
}

export function CaseStudyBody({
  facts,
  body,
  downloadHref,
  fileMeta,
}: {
  facts: readonly CaseStudyGlanceFact[];
  body?: LexicalRoot | null | undefined;
  downloadHref?: string | undefined;
  fileMeta?: string | null;
}): React.ReactElement {
  const hasBody = !isLexicalBodyEmpty(body);

  return (
    <Section
      padding="md"
      data-section="CaseStudyBody"
      className="bg-white"
      ariaLabel="The story"
    >
      <Container>
        {/* The pair is centred rather than pinned left. A 680px reading column
            (the prose max in CLAUDE.md) inside a 1440 container otherwise
            leaves ~370px of dead gutter on the right that reads as a mistake. */}
        <div className="grid gap-10 lg:grid-cols-[264px_minmax(0,680px)] lg:justify-center lg:gap-16">
          <Reveal y={24} className="lg:sticky lg:top-24 lg:self-start">
            <div
              className="rounded-[24px] p-6"
              style={{ background: "#f6f6f6", border: "1px solid rgba(17,17,17,0.06)" }}
            >
              <p
                className="font-display font-semibold text-[#111]"
                style={{ fontSize: "var(--fs-h5)", letterSpacing: "-0.02em" }}
              >
                At a glance
              </p>

              <dl className="mt-5 flex flex-col gap-4">
                {facts.map((fact) => (
                  <RailRow key={fact.label} {...fact} />
                ))}
              </dl>

              {downloadHref && (
                <>
                  <div aria-hidden className="my-6 h-px w-full bg-black/[0.08]" />
                  <a
                    href={downloadHref}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cs-btn-blue w-full"
                    style={
                      {
                        "--cs-btn-fs": "15px",
                        "--cs-btn-h": "44px",
                        "--cs-btn-px": "16px",
                      } as React.CSSProperties
                    }
                  >
                    <DownloadIcon size={16} />
                    <span>Download the PDF</span>
                  </a>
                  {fileMeta && (
                    <p
                      className="mt-2 text-center font-sans text-[#8a8a99]"
                      style={{ fontSize: "var(--fs-caption)" }}
                    >
                      {fileMeta}
                    </p>
                  )}
                </>
              )}

              <div aria-hidden className="my-6 h-px w-full bg-black/[0.08]" />
              <Link
                href="/book-a-demo"
                className="inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
                style={{ fontSize: "var(--fs-body-sm)" }}
              >
                Run this on your images
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </Reveal>

          <Reveal y={28} delay={0.08}>
            <h2
              className="font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h3)",
                fontWeight: "var(--fs-h3-weight)",
                letterSpacing: "var(--fs-h3-ls)",
                lineHeight: "var(--fs-h3-lh)",
              }}
            >
              What happened
            </h2>

            {hasBody ? (
              <div className="mt-6" style={{ maxWidth: "680px" }}>
                <RenderLexical content={body} />
              </div>
            ) : (
              <div
                className="mt-6 rounded-[24px] p-7 sm:p-8"
                style={{
                  maxWidth: "680px",
                  background:
                    "linear-gradient(140deg, #f4f1ff 0%, #f6f6f6 55%, #eef8fc 100%)",
                  border: "1px solid rgba(74,59,241,0.1)",
                }}
              >
                <p
                  className="font-sans text-[#111]"
                  style={{ fontSize: "var(--fs-body)", lineHeight: "var(--fs-body-lh)" }}
                >
                  The full account of this engagement, including the environment,
                  the migration itself and the before-and-after measurements, is in
                  the case study document.
                </p>
                {downloadHref && (
                  <a
                    href={downloadHref}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 font-sans font-medium text-[#4a3bf1] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33BAEC]"
                    style={{ fontSize: "var(--fs-body)" }}
                  >
                    <DownloadIcon size={17} />
                    <span>Read the full case study{fileMeta ? ` (${fileMeta})` : ""}</span>
                  </a>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
