import Image from 'next/image';

import { Container, Section } from '@/components/layout';
import { FadeUp } from '@/components/ui/FadeUp';
import type { ResourceDetail } from '@/lib/resources';

import { FINDINGS, HERO, type Run } from './content';
import { FindingsRail } from './FindingsRail';
import { ReportDownloadButton } from './ReportDownloadButton';

const runText = (run: Run): string => (typeof run === 'string' ? run : run.strong);

export function ResearchFindings({ resource }: { resource: ResourceDetail }): React.ReactElement {
  return (
    <Section padding="lg" data-section="ResearchFindings" className="bg-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <FindingsRail
              heading={FINDINGS.heading}
              items={FINDINGS.items}
              cta={<ReportDownloadButton resource={resource} label={HERO.cta} tone="blue" />}
            />
          </div>

          <div className="flex flex-col gap-14 lg:col-span-8 lg:gap-20">
            {FINDINGS.items.map((finding) => (
              <article key={finding.id} id={finding.id} className="scroll-mt-32">
                {/* The article stays outside FadeUp: FadeUp swaps its wrapper element for
                    content below the fold, which would replace the node the rail watches. */}
                <FadeUp y={24}>
                  <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
                    <div className="flex h-[128px] w-[128px] shrink-0 items-center justify-center rounded-[24px] bg-[#F3EFFF]">
                      <Image
                        src={finding.icon}
                        alt=""
                        aria-hidden
                        width={360}
                        height={360}
                        sizes="112px"
                        className="h-[112px] w-[112px] object-contain"
                      />
                    </div>
                    <div className="max-w-[62ch]">
                      <p
                        className="text-[#6A3DF0] tabular-nums"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--fs-body-sm)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {finding.number}
                      </p>
                      <h3
                        className="mt-2 text-[#111]"
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--fs-h3)',
                          fontWeight: 600,
                          letterSpacing: '-0.02em',
                          lineHeight: 'var(--fs-h3-lh)',
                          textWrap: 'balance',
                        }}
                      >
                        {finding.title}
                      </h3>
                      <div className="mt-5 flex flex-col gap-4">
                        {finding.paragraphs.map((paragraph) => (
                          <p
                            key={paragraph.map(runText).join('').slice(0, 48)}
                            className="text-[rgba(17,17,17,0.8)] [&_strong]:font-semibold [&_strong]:text-[#111]"
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 'var(--fs-body)',
                              lineHeight: 'var(--fs-body-lh)',
                            }}
                          >
                            {paragraph.map((run) =>
                              typeof run === 'string' ? (
                                run
                              ) : (
                                <strong key={run.strong}>{run.strong}</strong>
                              ),
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeUp>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 lg:hidden">
          <ReportDownloadButton resource={resource} label={HERO.cta} tone="blue" />
        </div>
      </Container>
    </Section>
  );
}
