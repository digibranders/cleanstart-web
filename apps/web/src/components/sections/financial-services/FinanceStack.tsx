import type React from 'react';
import Image from 'next/image';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Modern Financial Applications Are More Than Code" — Clean Component Stack
 *
 * Minimalist single showcase card displaying the four core software components
 * with 3D purple artifacts and clean two-line typography.
 */

interface ComponentItem {
  icon: string;
  iconAlt: string;
  line1: string;
  line2: string;
}

const COMPONENTS: readonly [ComponentItem, ComponentItem, ComponentItem, ComponentItem] = [
  {
    icon: '/images/financial-services/icon-stack-container-images-v2.png',
    iconAlt: '3D purple container images with network share disc',
    line1: 'Container',
    line2: 'Images',
  },
  {
    icon: '/images/financial-services/icon-stack-open-source-libraries-v2.png',
    iconAlt: '3D purple open source libraries gear',
    line1: 'Open Source',
    line2: 'Libraries',
  },
  {
    icon: '/images/financial-services/icon-stack-software-dependencies-v2.png',
    iconAlt: '3D purple software dependency loops and geometry',
    line1: 'Software',
    line2: 'Dependencies',
  },
  {
    // The icon is still the AI-generated-code artifact (code brackets with
    // sparkles) and reads as AI rather than third-party supply. Regenerate it
    // in the icon-stack style before this page goes live.
    icon: '/images/financial-services/icon-stack-ai-generated-code-v2.png',
    iconAlt: '3D purple code brackets representing third party components',
    line1: 'Third Party',
    line2: 'Components',
  },
];

export function FinanceStack(): React.ReactElement {
  return (
    <section data-section="FinanceStack" className="relative bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Section Heading */}
        <div className="mx-auto text-center" style={{ marginBottom: 'clamp(36px, 4vw, 56px)' }}>
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.15,
                color: '#111111',
              }}
            >
              <span className="block">Modern Financial Applications</span>
              <span className="block cs-text-gradient-impact">Are More Than Code</span>
            </h2>
          </Reveal>
        </div>

        {/* Single Minimal Showcase Card */}
        <Reveal delay={0.1} y={20}>
          <div
            className="relative mx-auto max-w-[1180px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8FE 100%)',
              borderRadius: 'clamp(20px, 2.2vw, 28px)',
              border: '1px solid rgba(154, 81, 255, 0.14)',
              boxShadow:
                '0 4px 20px -4px rgba(40, 30, 90, 0.04), 0 20px 48px -16px rgba(40, 30, 90, 0.07)',
              padding: 'clamp(32px, 3.6vw, 48px) clamp(20px, 2.8vw, 36px)',
            }}
          >
            <RevealStagger className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-6">
              {COMPONENTS.map((item) => (
                <RevealItem key={item.line1 + item.line2} className="w-full">
                  <div className="group flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-1">
                    {/* 3D Icon Container with subtle ambient halo */}
                    <div
                      className="relative flex items-center justify-center"
                      style={{
                        width: 'clamp(140px, 12vw, 168px)',
                        height: 'clamp(130px, 11vw, 156px)',
                      }}
                    >
                      <span
                        aria-hidden
                        className="absolute rounded-full pointer-events-none transition-transform duration-500 group-hover:scale-125"
                        style={{
                          width: 'clamp(108px, 9vw, 128px)',
                          height: 'clamp(108px, 9vw, 128px)',
                          background:
                            'radial-gradient(closest-side, rgba(154, 81, 255, 0.22) 0%, rgba(154, 81, 255, 0) 74%)',
                          filter: 'blur(6px)',
                        }}
                      />
                      <Image
                        src={item.icon}
                        alt={item.iconAlt}
                        width={200}
                        height={200}
                        sizes="200px"
                        className="relative object-contain transition-transform duration-300 group-hover:scale-105"
                        style={{
                          width: 'auto',
                          height: 'clamp(120px, 10.4vw, 144px)',
                          filter: 'drop-shadow(0 10px 16px rgba(40, 20, 90, 0.10))',
                        }}
                      />
                    </div>

                    {/* Clean 2-line title */}
                    <h3
                      style={{
                        marginTop: 'clamp(14px, 1.4vw, 18px)',
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--fs-h4)',
                        fontWeight: 600,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.25,
                        color: '#111111',
                      }}
                    >
                      <span className="block">{item.line1}</span>
                      <span className="block">{item.line2}</span>
                    </h3>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
