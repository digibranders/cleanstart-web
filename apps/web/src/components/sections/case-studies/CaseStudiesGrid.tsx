import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";
import { Section, Container } from "@/components/layout";
import { EmptyState } from "@/components/feedback";
import { Pagination } from "@/components/ui/Pagination";
import { RevealStagger, RevealItem } from "@/components/ui/Reveal";
import { CaseStudyCard } from "./CaseStudyCard";

interface CaseStudiesGridProps {
  caseStudies: CaseStudy[];
  currentPage: number;
  totalPages: number;
  /** True when the CMS fetch failed (vs. a genuinely empty result). */
  loadFailed?: boolean;
}

function buildPageHref(page: number): string {
  return page > 1 ? `/case-studies?page=${page}` : "/case-studies";
}

export function CaseStudiesGrid({
  caseStudies,
  currentPage,
  totalPages,
  loadFailed = false,
}: CaseStudiesGridProps): React.ReactElement {
  return (
    <Section padding="md" style={{ background: "#f6f6f6" }}>
      <Container>
        {caseStudies.length === 0 ? (
          loadFailed ? (
            <EmptyState variant="load-failed" />
          ) : (
            <EmptyState
              variant="empty"
              title="No case studies yet"
              description="Check back soon — new customer stories are on the way."
            />
          )
        ) : (
          <>
            <RevealStagger
              gap={0.08}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-items-center lg:justify-items-start"
            >
              {caseStudies.map((caseStudy) => (
                <RevealItem key={caseStudy.id} className="w-full flex justify-center">
                  <CaseStudyCard caseStudy={caseStudy} />
                </RevealItem>
              ))}
            </RevealStagger>

            {/* Mobile: single "View More" button. Desktop: numbered pagination. */}
            {totalPages > 1 && currentPage < totalPages && (
              <div className="flex lg:hidden justify-center" style={{ marginTop: "40px" }}>
                <Link
                  href={buildPageHref(currentPage + 1)}
                  rel="next"
                  className="font-sans inline-flex items-center gap-2"
                  style={{
                    height: "44px",
                    padding: "0 20px",
                    borderRadius: "10px",
                    background: "white",
                    color: "#4a3bf1",
                    fontSize: "var(--fs-body-sm)",
                    fontWeight: 500,
                    border: "1px solid rgba(74,59,241,0.25)",
                    boxShadow:
                      "0px 3px 7px 0px rgba(0,0,0,0.02), 0px 13px 13px 0px rgba(0,0,0,0.01)",
                  }}
                >
                  View More
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3.5 8h9M8.5 4l4 4-4 4"
                      stroke="#4a3bf1"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            )}

            <div className="hidden lg:block">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={buildPageHref}
              />
            </div>
          </>
        )}
      </Container>
    </Section>
  );
}
