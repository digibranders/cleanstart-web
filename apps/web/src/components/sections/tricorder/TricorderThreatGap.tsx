import { PackagePlus, ScanEye, Waypoints, type LucideIcon } from 'lucide-react';

import { Reveal } from '@/components/ui/Reveal';
import { IconSphere } from './IconSphere';

/**
 * "Not Every Threat Has a CVE." Three claims in one joined white panel with
 * hairline dividers (the FinanceRequirements shell) and a blue icon sphere
 * per column (the SaasDemands treatment). Headings and body are the copy
 * doc's, verbatim.
 */

interface Claim {
  icon: LucideIcon;
  title: string;
  body: string;
}

const CLAIMS: readonly [Claim, Claim, Claim] = [
  {
    icon: PackagePlus,
    title: 'New Doesn’t Mean Safe',
    body: 'A new package version can be malicious before anyone has reported it.',
  },
  {
    icon: ScanEye,
    title: 'Known Doesn’t Mean Safe',
    body: 'A dependency can pass a vulnerability scan while quietly changing what it does.',
  },
  {
    icon: Waypoints,
    title: 'Safe Doesn’t Mean Isolated',
    body: 'A package may look harmless alone, while its relationships reveal a larger campaign.',
  },
];

const DIVIDER = 'rgba(154, 81, 255, 0.12)';

export function TricorderThreatGap(): React.ReactElement {
  return (
    <section
      data-section="TricorderThreatGap"
      className="relative overflow-hidden py-section-md"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F6F4FC 100%)' }}
    >
      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto flex max-w-[840px] flex-col items-center gap-4 text-center"
          style={{ marginBottom: 'clamp(36px, 4vw, 56px)' }}
        >
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                color: '#111111',
                margin: 0,
              }}
            >
              Not Every Threat <span className="cs-text-gradient-impact">Has a CVE.</span>
            </h2>
          </Reveal>
          <Reveal header delay={0.12} y={16}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(17, 17, 17, 0.75)',
                maxWidth: '640px',
                margin: 0,
                textWrap: 'balance',
              }}
            >
              The software supply chain changes faster than vulnerability databases can document it.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15} y={20}>
          <div
            className="relative grid grid-cols-1 overflow-hidden lg:grid-cols-3"
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid rgba(154, 81, 255, 0.18)',
              boxShadow:
                '0 4px 24px -4px rgba(40, 30, 90, 0.04), 0 20px 48px -12px rgba(40, 30, 90, 0.07)',
            }}
          >
            {CLAIMS.map((claim, index) => (
              <div
                key={claim.title}
                className={`flex flex-col items-center text-center md:items-start md:text-left ${
                  index < CLAIMS.length - 1 ? 'border-b lg:border-b-0 lg:border-r' : ''
                }`}
                style={{
                  borderColor: DIVIDER,
                  padding: 'clamp(28px, 2.8vw, 40px) clamp(24px, 2.4vw, 36px)',
                }}
              >
                <IconSphere icon={claim.icon} size={72} />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    color: '#111111',
                    margin: '24px 0 0',
                  }}
                >
                  {claim.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.55,
                    color: '#4A4560',
                    margin: '10px 0 0',
                    maxWidth: '340px',
                  }}
                >
                  {claim.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
