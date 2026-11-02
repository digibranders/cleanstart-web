import Link from 'next/link';
import { BadgeCheck, Hammer, Layers, Minimize2, Repeat2, type LucideIcon } from 'lucide-react';

import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

interface Differentiator {
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Column span in the 6-column grid at lg. */
  span: string;
  tone: 'light' | 'violet' | 'dark';
}

const ITEMS: readonly Differentiator[] = [
  {
    icon: Layers,
    title: 'Trusted replacement images',
    desc: 'Drop-in replacements for the images you already run.',
    span: 'lg:col-span-3',
    tone: 'dark',
  },
  {
    icon: Hammer,
    title: 'Built from source',
    desc: 'Every package is compiled from source, not pulled in as an opaque binary.',
    span: 'lg:col-span-3',
    tone: 'light',
  },
  {
    icon: Repeat2,
    title: 'Reproducible builds',
    desc: 'The same inputs produce the same image, so anyone can check the result.',
    span: 'lg:col-span-2',
    tone: 'light',
  },
  {
    icon: Minimize2,
    title: 'Minimal attack surface',
    desc: 'Only what the workload needs, so there is less to exploit.',
    span: 'lg:col-span-2',
    tone: 'violet',
  },
  {
    icon: BadgeCheck,
    title: 'Verifiable software foundations',
    desc: 'Provenance you can check, not just trust.',
    span: 'lg:col-span-2',
    tone: 'light',
  },
];

const TONES = {
  light: {
    background: 'linear-gradient(180deg, #F7F5FF 0%, #F0EDFF 100%)',
    border: '1px solid rgba(71,30,192,0.12)',
    color: '#0F123E',
    badgeBg: 'rgba(71,30,192,0.08)',
    badgeColor: '#471EC0',
    descOpacity: 0.75,
  },
  violet: {
    background: 'linear-gradient(135deg, #471EC0 0%, #2F49E5 100%)',
    border: '1px solid transparent',
    color: '#ffffff',
    badgeBg: 'rgba(255,255,255,0.14)',
    badgeColor: '#ffffff',
    descOpacity: 0.88,
  },
  dark: {
    background: 'linear-gradient(160deg, #151021 0%, #10123E 55%, #1E2BA8 100%)',
    border: '1px solid transparent',
    color: '#ffffff',
    badgeBg: 'rgba(255,255,255,0.12)',
    badgeColor: '#2CC1EB',
    descOpacity: 0.8,
  },
} as const;

export function ScanDifferentiators(): React.ReactElement {
  return (
    <Section padding="lg" data-section="ScanDifferentiators" className="bg-white">
      <Container>
        <Reveal header className="max-w-[760px]">
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
            The <span className="cs-text-gradient-impact">CleanStart</span> difference
          </h2>
        </Reveal>

        <RevealStagger
          gap={0.08}
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-6 lg:gap-5"
        >
          {ITEMS.map(({ icon: Icon, title, desc, span, tone }) => {
            const t = TONES[tone];
            return (
              <RevealItem key={title} className={span}>
                <div
                  className="flex h-full min-h-[200px] flex-col justify-between gap-8 rounded-[20px] p-6 sm:p-7"
                  style={{ background: t.background, border: t.border, color: t.color }}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-11 w-11 items-center justify-center rounded-[12px]"
                    style={{ background: t.badgeBg, color: t.badgeColor }}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h4)',
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        lineHeight: 'var(--fs-h4-lh)',
                      }}
                    >
                      {title}
                    </h3>
                    <p
                      className="mt-2"
                      style={{
                        fontSize: 'var(--fs-body-sm)',
                        lineHeight: 1.55,
                        opacity: t.descOpacity,
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>

        <Reveal header y={20} className="mt-12 flex justify-center">
          <Link
            href="#scan-form"
            className="cs-btn-blue"
            style={
              {
                '--cs-btn-h': '48px',
                '--cs-btn-px': '22px',
                '--cs-btn-fs': '16px',
              } as React.CSSProperties
            }
          >
            <span>Get my free scan</span>
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}
