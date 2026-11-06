import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Container as ContainerIcon, EyeOff, Layers, ShieldAlert } from 'lucide-react';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { H2_STYLE, LEAD_STYLE } from './type';

/*
 * "Risk Enters Long Before Deployment": the risk register, as a 2x2 under
 * hairline cross-rules on the tinted band (the SaasRisks shape).
 *
 * Line icons in violet tiles rather than the 3D renders the section above
 * uses. The four surfaces above are things the network is made of; these are
 * threats to it, and drawing them in the same glossy objects would make the
 * hazards read as products. Nothing grades the four: the brief lists them flat,
 * so there is no severity scale.
 *
 * Copy is the brief's, verbatim.
 */

interface Risk {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const RISKS: readonly [Risk, Risk, Risk, Risk] = [
  {
    Icon: ContainerIcon,
    title: 'Vulnerable Container Images',
    body: 'Inherited vulnerabilities in public base images.',
  },
  {
    Icon: Layers,
    title: 'Open Source Dependencies',
    body: 'Unseen risks from third-party software components.',
  },
  {
    Icon: ShieldAlert,
    title: 'Software Supply Chain Attacks',
    body: 'Compromised components entering network infrastructure.',
  },
  {
    Icon: EyeOff,
    title: 'Limited Software Visibility',
    body: 'Unknown assets and dependencies across distributed environments.',
  },
];

export function TelecomRisks(): React.ReactElement {
  return (
    <Section
      data-section="TelecomRisks"
      className="overflow-hidden"
      style={{ background: '#EFEDF7' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/enterprise-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: '-218px',
          top: '-139px',
          width: '488px',
          height: '496px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <Container className="relative">
        <div
          className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center"
          style={{ marginBottom: 'clamp(32px, 3.6vw, 56px)' }}
        >
          <Reveal header>
            <h2 style={{ ...H2_STYLE, color: '#111111' }}>
              Risk Enters Long <span className="cs-text-gradient-impact">Before Deployment</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.12} y={16}>
            <p style={{ ...LEAD_STYLE, color: 'rgba(17,17,17,0.75)' }}>
              Every software component powering your network can introduce risk.
            </p>
          </Reveal>
        </div>

        <RevealStagger
          className="mx-auto grid grid-cols-1 sm:grid-cols-2"
          style={{ maxWidth: '1040px' }}
        >
          {RISKS.map(({ Icon, title, body }, i) => (
            <RevealItem key={title}>
              {/* Stacked: every cell after the first takes a top rule. As a
                  2x2: only the second row does, plus a left rule on the right
                  column. Resolved here rather than by stacking `sm:border-t-0`
                  on `border-t`, which Tailwind orders against us. */}
              <div
                className={[
                  'group flex h-full items-start gap-4 border-[rgba(17,17,17,0.10)] sm:gap-5',
                  i > 0 ? 'border-t' : '',
                  i === 1 ? 'sm:border-t-0' : '',
                  i % 2 === 1 ? 'sm:border-l' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ padding: 'clamp(24px, 2.6vw, 38px) clamp(0px, 2.4vw, 40px)' }}
              >
                <span
                  aria-hidden
                  className="flex shrink-0 items-center justify-center transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F2FF 100%)',
                    border: '1px solid rgba(154,81,255,0.20)',
                    boxShadow: '0 10px 24px -14px rgba(76,40,170,0.45)',
                    color: '#7C4FF0',
                  }}
                >
                  <Icon size={24} strokeWidth={1.75} />
                </span>

                <div className="min-w-0">
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h5)',
                      fontWeight: 600,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.3,
                      color: '#111111',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.55,
                      color: 'rgba(17,17,17,0.66)',
                    }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </Container>
    </Section>
  );
}
