import type React from 'react';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Modern Applications Demand More" — the page's opening claim strip.
 *
 * This proposal is five groups of four: demands, risks, delivery pillars and
 * outcomes all arrive as four items with one line each, and the product section
 * adds a four-step loop on top. Rendering them all the same way would give the
 * page four near-identical rows, so each quartet gets a different form. This is
 * the lightest: four columns held apart by hairlines, no card chrome.
 *
 * The icons were wrong and are now fixed. They were flat line glyphs sitting in
 * pale rounded squares — a treatment that appears nowhere else on this site.
 * CleanStart has exactly two icon conventions:
 *
 *   - the blue gradient sphere, used for capabilities and process steps
 *     (CisoEnterprise, both Foundation sections)
 *   - purple 3D rendered artifacts, used for things — components, risks,
 *     delivery pillars
 *
 * These four are capabilities, so they take the sphere. That also keeps them
 * clearly apart from the risk register and the delivery matrix further down the
 * page, which both use the purple artifacts, so the page still reads as four
 * distinct quartets rather than the same treatment four times.
 *
 * The sphere is written out here rather than imported because both Foundation
 * sections already keep their own copy; extracting it is a job for whoever
 * needs the fourth one.
 *
 * Copy is the proposal's, verbatim.
 */

interface Demand {
  icon: string;
  title: string;
  body: string;
}

const DEMANDS: readonly [Demand, Demand, Demand, Demand] = [
  {
    icon: '/images/for-developers/workflows/icon-faster-builds.svg',
    title: 'Release Faster',
    body: 'Accelerate delivery without compromising security.',
  },
  {
    // Not modern-icon-security.svg: that one is 300x150, and a 2:1 glyph
    // contained inside a circle renders half the height of its 40x40
    // neighbours. This one is near-square.
    icon: '/images/fips/maturity-icon-harden.svg',
    title: 'Reduce Risk',
    body: 'Limit exposure with secure software components.',
  },
  {
    // Was icon-sboms.svg, which reads as a package rather than as seeing.
    // maturity-icon-monitor is the same filled family as the harden icon two
    // rows up, so it matches the set as well as the label.
    icon: '/images/fips/maturity-icon-monitor.svg',
    title: 'Improve Visibility',
    body: 'Know what enters your software supply chain.',
  },
  {
    icon: '/images/for-developers/workflows/icon-cicd-pipelines.svg',
    title: 'Build Securely',
    body: 'Integrate security into development workflows.',
  },
];

/** The site's blue gradient sphere — the CisoEnterprise icon treatment. */
function IconSphere({ icon }: { icon: string }): React.ReactElement {
  return (
    <div
      aria-hidden
      className="relative flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: 'clamp(60px, 4.8vw, 74px)',
        height: 'clamp(60px, 4.8vw, 74px)',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
        boxShadow:
          '0px 6.171px 14.537px 0px rgba(28,60,142,0.33), inset 0px -0.233px 0.291px 0px rgba(0,44,179,0.5), inset 0px 0.116px 0.582px 0px rgba(255,255,255,0.81)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        aria-hidden
        style={{ width: '56%', height: '56%', objectFit: 'contain' }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function SaasDemands(): React.ReactElement {
  return (
    <section data-section="SaasDemands" className="relative bg-white py-section-md">
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <div
          className="mx-auto max-w-[760px] text-center"
          style={{ marginBottom: 'clamp(32px, 3.6vw, 52px)' }}
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
              Modern Applications <span className="cs-text-gradient-impact">Demand More</span>
            </h2>
          </Reveal>
        </div>

        <RevealStagger className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-0">
          {DEMANDS.map((demand, i) => (
            <RevealItem key={demand.title} className="min-w-0">
              {/* All three elements share one centre axis. An earlier pass
                  centred the icon and title over a left-aligned body, which
                  read as a mistake rather than a choice.

                  Padding is symmetric (lg:px-8 on every column, not lg:pl-8 on
                  the bordered ones plus a right-only inline value): centred
                  content in an asymmetrically padded box sits off the column's
                  true centre. */}
              <div
                className={
                  i > 0
                    ? 'flex flex-col items-center text-center lg:border-l lg:border-[rgba(17,17,17,0.08)] lg:px-8'
                    : 'flex flex-col items-center text-center lg:px-8'
                }
              >
                <IconSphere icon={demand.icon} />

                <h3
                  style={{
                    margin: 'clamp(16px, 1.6vw, 22px) 0 0',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h5)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.25,
                    color: '#111111',
                  }}
                >
                  {demand.title}
                </h3>

                <p
                  style={{
                    margin: '10px 0 0',
                    maxWidth: '30ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.55,
                    color: 'rgba(17,17,17,0.68)',
                  }}
                >
                  {demand.body}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
