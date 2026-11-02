import Image from 'next/image';

import { HeroReveal } from '@/components/ui/Reveal';
import { ScanRequestForm } from '@/components/sections/forms/ScanRequestForm';

/**
 * Campaign hero: the pitch on the left, the lead form on the right so the ask
 * is on screen with the headline. On mobile the DOM order (copy, form,
 * dashboard) is the reading order, so the form lands before the screenshot.
 * The dashboard is cropped by the section's bottom edge on purpose: it reads
 * as the product rising out of the page rather than a pasted screenshot.
 */
export function ScanHero(): React.ReactElement {
  return (
    <section
      data-section="ScanHero"
      className="relative overflow-hidden"
      style={{
        background:
          'linear-gradient(179.996deg, rgb(21,16,33) 12%, rgb(16,18,62) 28%, rgb(19,30,143) 58%, rgb(71,30,192) 82%, rgb(71,31,195) 100%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-24 hidden h-[380px] w-[380px] select-none rounded-full md:block"
        style={{
          background:
            'radial-gradient(closest-side, rgba(192,59,255,0.38) 0%, rgba(192,59,255,0) 70%)',
          filter: 'blur(44px)',
        }}
      />

      <div
        className="relative mx-auto grid max-w-[var(--container-default)] gap-x-14 gap-y-10 px-6 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-x-[clamp(40px,5vw,88px)]"
        style={{ paddingTop: 'calc(clamp(96px, 9vw, 132px) + var(--cs-header-extra))' }}
      >
        <div className="flex flex-col text-center lg:text-left">
          <HeroReveal y={50} duration={1.0} lcp>
            <h1
              className="text-white"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h1)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 'var(--fs-h1-lh)',
                textWrap: 'balance',
              }}
            >
              Discover hidden container risk across your{' '}
              <span className="cs-text-gradient-impact">hybrid environment</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              className="mx-auto mt-5 max-w-[520px] text-white lg:mx-0"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                opacity: 0.8,
                textWrap: 'balance',
              }}
            >
              Containers inherit packages and base images. See what came with them, where it runs,
              and who owns the fix.
            </p>
          </HeroReveal>
        </div>

        <HeroReveal
          y={40}
          delay={0.25}
          duration={1.0}
          className="w-full lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pb-[clamp(48px,5vw,80px)]"
        >
          <div id="scan-form" className="scroll-mt-28">
            <ScanRequestForm />
          </div>
        </HeroReveal>

        <HeroReveal
          y={40}
          delay={0.35}
          duration={1.0}
          className="mt-auto w-full lg:col-start-1 lg:row-start-2"
        >
          <div
            className="relative mx-auto w-full max-w-[640px] overflow-hidden lg:mx-0"
            style={{
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.14)',
              borderBottom: 'none',
              boxShadow: '0 -24px 80px -24px rgba(44,193,235,0.35)',
            }}
          >
            <Image
              src="/images/cleansight/hero-dashboard-v2.webp"
              alt="The CleanSight dashboard showing clusters, discovered images, scanned images and packages, with a vulnerability distribution chart"
              width={1018}
              height={581}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="block h-auto w-full"
              priority
            />
          </div>
        </HeroReveal>
      </div>
    </section>
  );
}
