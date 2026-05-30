import React from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/ui/Reveal';

interface Benefit {
  title: string;
  desc: string;
}

const BENEFITS: Benefit[] = [
  { title: 'Reduced Security Exposure', desc: 'Fewer inherited vulnerabilities.' },
  { title: 'Smaller CVE Backlogs', desc: 'Less remediation overhead.' },
  { title: 'Faster Compliance Reviews', desc: 'Cleaner, simpler SBOMs.' },
  { title: 'Lower Operational Overhead', desc: 'Less patching and maintenance.' },
];

export function ASRDelivers(): React.ReactElement {
  return (
    <section
      data-section="ASRDelivers"
      className="relative isolate overflow-hidden"
      aria-labelledby="asr-delivers-title"
    >
      {/* Portrait crop below md, full-bleed photo at md and above. */}
      <Image
        src="/images/attack-surface-reduction/business-photo-mobile.png"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center md:hidden"
        style={{ filter: 'blur(1.5px)', transform: 'scale(1.01)' }}
        priority={false}
      />
      <Image
        src="/images/attack-surface-reduction/s4-person.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center hidden md:block"
        style={{ filter: 'blur(1.5px)', transform: 'scale(1.01)' }}
        priority={false}
      />

      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(20,12,55,0.92) 0%, rgba(50,25,135,0.78) 35%, rgba(70,30,180,0.45) 65%, rgba(70,30,180,0.10) 100%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-lg">
        <div className="max-w-[519px]">
          <Reveal header>
            <h2
              id="asr-delivers-title"
              className="font-display text-white"
              style={{
                fontSize: 'var(--fs-h2)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              What this delivers for{' '}
              <span className="cs-text-gradient-impact">your business</span>
            </h2>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-6 sm:mt-14 lg:hidden">
          {BENEFITS.map((b, i) => (
            <React.Fragment key={b.title}>
              <BenefitBlock benefit={b} variant="mobile" />
              {i < BENEFITS.length - 1 && <HorizontalDivider />}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden lg:mt-[120px] lg:flex lg:items-start lg:justify-between lg:gap-6">
          {BENEFITS.map((b, i) => (
            <React.Fragment key={b.title}>
              <BenefitBlock benefit={b} variant="desktop" />
              {i < BENEFITS.length - 1 && <VerticalDivider />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitBlock({
  benefit,
  variant,
}: {
  benefit: Benefit;
  variant: 'mobile' | 'desktop';
}) {
  if (variant === 'mobile') {
    return (
      <div className="flex w-[222px] flex-col gap-3">
        <div
          className="font-display text-white"
          style={{
            fontSize: 'var(--fs-h3)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
          }}
        >
          {benefit.title}
        </div>
        <div
          className="text-white"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--fs-lead)',
            fontWeight: 400,
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
          }}
        >
          {benefit.desc}
        </div>
      </div>
    );
  }
  return (
    <div className="flex shrink-0 flex-col">
      <div
        className="font-display text-white"
        style={{
          fontSize: 'var(--fs-h3)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          maxWidth: '219px',
        }}
      >
        {benefit.title}
      </div>
      <div
        className="mt-5 max-w-[219px] text-white"
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '20px',
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
        }}
      >
        {benefit.desc}
      </div>
    </div>
  );
}

function VerticalDivider() {
  return (
    <div
      aria-hidden
      className="h-[109px] w-px shrink-0 self-stretch"
      style={{
        background:
          'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.3%, rgba(153,153,153,0) 99.2%)',
      }}
    />
  );
}

function HorizontalDivider() {
  return (
    <div
      aria-hidden
      className="h-px w-[147px] shrink-0"
      style={{
        background:
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 49.32%, rgba(153,153,153,0) 99.18%)',
      }}
    />
  );
}
