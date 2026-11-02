import { Check, X } from 'lucide-react';

import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

const WITHOUT: readonly string[] = [
  'Dashboards full of findings',
  'No clear path to resolution',
  'Findings pile up and fatigue sets in',
  'Real risk goes unaddressed',
];

const WITH: readonly string[] = [
  'Which vulnerable containers to remove first',
  'How to reduce exposure quickly',
  'How to fix it, in specific steps',
  'Prioritized actions, not a longer list',
];

function Panel({
  title,
  items,
  positive,
}: {
  title: string;
  items: readonly string[];
  positive: boolean;
}): React.ReactElement {
  const Icon = positive ? Check : X;
  return (
    <div
      className="h-full rounded-[20px] p-6 sm:p-8"
      style={{
        background: positive
          ? 'linear-gradient(160deg, rgba(44,193,235,0.16) 0%, rgba(154,81,255,0.18) 100%)'
          : 'rgba(255,255,255,0.04)',
        border: positive ? '1px solid rgba(44,193,235,0.45)' : '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <h3
        className="text-white"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h4)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h3>
      <ul className="mt-5 flex flex-col gap-3.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-white"
            style={{ fontSize: 'var(--fs-body)', lineHeight: 1.45 }}
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{
                background: positive ? 'rgba(44,193,235,0.25)' : 'rgba(255,255,255,0.1)',
                color: positive ? '#2CC1EB' : 'rgba(255,255,255,0.65)',
              }}
            >
              <Icon size={14} strokeWidth={2.25} />
            </span>
            <span style={{ opacity: positive ? 1 : 0.8 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScanFallsShort(): React.ReactElement {
  return (
    <Section
      padding="lg"
      data-section="ScanFallsShort"
      className="overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgb(21,16,33) 0%, rgb(16,18,62) 55%, rgb(19,30,143) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 hidden h-[420px] w-[420px] select-none rounded-full md:block"
        style={{
          background:
            'radial-gradient(closest-side, rgba(154,81,255,0.4) 0%, rgba(154,81,255,0) 70%)',
          filter: 'blur(50px)',
        }}
      />
      <Container className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[clamp(48px,6vw,104px)]">
          <Reveal header>
            <h2
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 'var(--fs-h2-lh)',
                textWrap: 'balance',
              }}
            >
              Why traditional scanning <span className="cs-text-gradient-impact">falls short</span>
            </h2>
            <p
              className="mt-6 max-w-[780px] text-white"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                textWrap: 'pretty',
              }}
            >
              Knowing you have vulnerable containers is not the same as being able to do something
              about it.
            </p>
            <p
              className="mt-5 max-w-[720px] text-white"
              style={{ fontSize: 'var(--fs-body)', lineHeight: 'var(--fs-body-lh)', opacity: 0.72 }}
            >
              Many organizations have invested heavily in visibility tooling only to find themselves
              with dashboards full of findings and no clear path to resolution. Security teams need
              more than a list. They need remediation guidance: specific, prioritized actions that
              tell them which vulnerable containers to remove first, how to reduce exposure quickly,
              and how to fix it. Without that, findings pile up, fatigue sets in, and real risk goes
              unaddressed.
            </p>
          </Reveal>

          <RevealStagger gap={0.12} className="flex flex-col gap-5">
            <RevealItem>
              <Panel title="A list of findings" items={WITHOUT} positive={false} />
            </RevealItem>
            <RevealItem>
              <Panel title="A path to resolution" items={WITH} positive />
            </RevealItem>
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
