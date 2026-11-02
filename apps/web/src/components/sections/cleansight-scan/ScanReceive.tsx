import Image from 'next/image';
import { BarChart3, ListChecks, ScanEye, Wrench, type LucideIcon } from 'lucide-react';

import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

interface Deliverable {
  icon: LucideIcon;
  term: string;
  detail: string;
}

const DELIVERABLES: readonly Deliverable[] = [
  {
    icon: ScanEye,
    term: 'Complete Runtime Visibility',
    detail: "Know exactly what's running in production: every container across every cluster.",
  },
  {
    icon: BarChart3,
    term: 'Risk Visibility Reports',
    detail:
      'Prioritize risks by severity with added runtime context, including how many running containers are affected.',
  },
  {
    icon: ListChecks,
    term: 'Vulnerable Image Identification',
    detail:
      "Identify which container images contain vulnerabilities, where they're deployed, and which teams own them.",
  },
  {
    icon: Wrench,
    term: 'Actionable Remediation Recommendations',
    detail: 'Get immediate remediation guidance to eliminate risks from vulnerable containers.',
  },
];

export function ScanReceive(): React.ReactElement {
  return (
    <Section
      padding="md"
      data-section="ScanReceive"
      className="overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F1FF 100%)' }}
    >
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-[clamp(48px,6vw,104px)]">
          <Reveal header className="lg:sticky lg:top-28">
            <h2
              className="text-[#0F123E]"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 'var(--fs-h2-lh)',
                textWrap: 'balance',
              }}
            >
              What customers <span className="cs-text-gradient-impact">receive</span>
            </h2>
            <div
              className="relative mt-8 overflow-hidden rounded-[20px] bg-[#0B0F14]"
              style={{
                border: '1px solid rgba(71,30,192,0.25)',
                boxShadow: '0 30px 70px -30px rgba(71,30,192,0.55)',
              }}
            >
              <Image
                src="/images/cleansight/cs-stack-results.webp"
                alt="The CleanSight remediation summary showing running containers, vulnerable images and the overall vulnerability reduction"
                width={1800}
                height={1544}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="block h-auto w-full"
              />
            </div>
          </Reveal>

          <RevealStagger gap={0.1} className="flex flex-col gap-4">
            {DELIVERABLES.map(({ icon: Icon, term, detail }) => (
              <RevealItem key={term}>
                <div
                  className="flex gap-5 rounded-[20px] bg-white p-6 sm:p-7"
                  style={{
                    border: '1px solid rgba(71,30,192,0.12)',
                    boxShadow: '0 18px 40px -28px rgba(71,30,192,0.35)',
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                    style={{
                      background: 'linear-gradient(135deg, #471EC0 0%, #2F49E5 100%)',
                      color: '#fff',
                    }}
                  >
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3
                      className="text-[#0F123E]"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h4)',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        lineHeight: 'var(--fs-h4-lh)',
                      }}
                    >
                      {term}
                    </h3>
                    <p
                      className="mt-1.5 text-[#111111]"
                      style={{
                        fontSize: 'var(--fs-body)',
                        lineHeight: 'var(--fs-body-lh)',
                        opacity: 0.78,
                      }}
                    >
                      {detail}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
