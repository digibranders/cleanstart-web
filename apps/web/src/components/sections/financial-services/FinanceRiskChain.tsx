import type React from 'react';
import { Fragment } from 'react';
import Image from 'next/image';
import { FlowArrow } from '@/components/ui/FlowArrow';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

/*
 * "Risk Enters Long Before Production" — the site's canonical dark band
 * (#151021 → #131E8F → #471EC0) with the shared overlay meshes, carrying the
 * proposal's six-stage supply chain.
 *
 * The connector is the site's own FlowArrow — the dotted tail that flows
 * rightward into a chevron, staggered per gap the way home/ProcessBand
 * staggers it — so the chain reads as one continuous accumulation arriving at
 * the institution. It sits in the gutter BETWEEN nodes rather than running
 * through them, which the previous hairline did.
 *
 * The first four stages reuse the exact icons the section above assigns to the
 * same components, so the chain reads as those components moving downstream
 * rather than as a new set of objects. Copy is the proposal's, verbatim; the
 * two-line labels match the proposal's own reference for this section.
 */

interface Stage {
  icon: string;
  iconAlt: string;
  /** Split across two lines so all six labels are the same depth. */
  line1: string;
  line2: string;
  /** The terminal node — what everything upstream arrives at. */
  terminal?: boolean;
}

const STAGES: readonly Stage[] = [
  {
    icon: '/images/compare/icon-origin.webp',
    iconAlt: '3D icon of a component block with an origin marker',
    line1: 'Open Source',
    line2: 'Components',
  },
  {
    icon: '/images/compare/icon-provenance.webp',
    iconAlt: '3D icon of linked component blocks',
    line1: 'Libraries &',
    line2: 'Dependencies',
  },
  {
    icon: '/images/cleanstart-images/uvp-icon-smaller-images.webp',
    iconAlt: '3D icon of stacked container blocks',
    line1: 'Container',
    line2: 'Images',
  },
  {
    icon: '/images/compare/icon-ai-bom.webp',
    iconAlt: '3D icon of a document with a processor chip',
    line1: 'AI-Generated',
    line2: 'Code',
  },
  {
    icon: '/images/attack-surface-reduction/deploy-icon.webp',
    iconAlt: '3D icon of a delivery pipeline',
    line1: 'Build & Delivery',
    line2: 'Pipeline',
  },
  {
    icon: '/images/compare/icon-regulatory.webp',
    iconAlt: '3D icon of a financial institution with a shield',
    line1: 'Financial',
    line2: 'Applications',
    terminal: true,
  },
];

function StageNode({ icon, iconAlt, line1, line2, terminal }: Stage): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative flex items-center justify-center"
        style={{ height: 'var(--fin-icon)' }}
      >
        {/* Halo — seats the object on the band. Cyan at the destination, violet
            at every stage that is still a software component. */}
        <span
          aria-hidden
          className="absolute"
          style={{
            width: 'calc(var(--fin-icon) * 1.34)',
            height: 'calc(var(--fin-icon) * 1.34)',
            borderRadius: '50%',
            background: terminal
              ? 'radial-gradient(closest-side, rgba(44,193,235,0.36) 0%, rgba(44,193,235,0) 72%)'
              : 'radial-gradient(closest-side, rgba(154,81,255,0.30) 0%, rgba(154,81,255,0) 72%)',
          }}
        />
        <Image
          src={icon}
          alt={iconAlt}
          width={144}
          height={144}
          sizes="144px"
          className="relative object-contain"
          style={{ height: 'var(--fin-icon)', width: 'auto' }}
        />
      </div>

      <h3
        style={{
          marginTop: 'clamp(14px, 1.4vw, 20px)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h5)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.3,
          color: terminal ? '#A6ECFF' : '#ffffff',
        }}
      >
        {/* Two spans rather than a <br /> — the repo bans <br /> in copy, and
            block spans keep the label one accessible string. */}
        <span className="block">{line1}</span>
        <span className="block">{line2}</span>
      </h3>
    </div>
  );
}

export function FinanceRiskChain(): React.ReactElement {
  return (
    <section
      data-section="FinanceRiskChain"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      {/* Shared overlay meshes — the decoration this dark band always carries. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          right: '-150px',
          top: '-175px',
          width: '488px',
          height: '497px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          left: '-147px',
          bottom: '-180px',
          width: '469px',
          height: '488px',
          transform: 'rotate(-150deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(60px, 8vw, 128px)',
          paddingBottom: 'clamp(56px, 7vw, 112px)',
        }}
      >
        <div className="mx-auto flex max-w-[820px] flex-col items-center gap-5 text-center">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: '#ffffff',
              }}
            >
              Risk Enters Long{' '}
              <span
                style={{
                  background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Before Production
              </span>
            </h2>
          </Reveal>

          <Reveal header delay={0.15} y={20}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.8)',
                maxWidth: '600px',
                margin: 0,
              }}
            >
              Vulnerabilities and unknowns are introduced at every step of the software supply
              chain.
            </p>
          </Reveal>
        </div>

        {/*
         * One row, one set of headings. It wraps two-up then three-up and only
         * becomes a single line at lg, where the arrows appear — so there is no
         * second mobile copy of the six labels in the DOM.
         */}
        {/* The custom property lives on a plain wrapper: RevealStagger's `style`
            is a MotionStyle, which a CSSProperties cast does not satisfy under
            the build's stricter type check. */}
        <div
          style={
            {
              marginTop: 'clamp(48px, 6.2vw, 96px)',
              // Read by the node's icon box and by each arrow's offset, so the
              // arrows land on the icons' centre line at every width.
              '--fin-icon': 'clamp(84px, 7.4vw, 108px)',
            } as React.CSSProperties
          }
        >
          <RevealStagger className="flex flex-wrap items-start justify-center gap-x-4 gap-y-10 lg:flex-nowrap lg:justify-between lg:gap-x-2">
            {STAGES.map((stage, i) => (
              <Fragment key={stage.line1}>
                <RevealItem
                  // The basis subtracts the row gap, otherwise 2 or 3 items at
                  // a flat 1/2 or 1/3 overflow the line and wrap one short.
                  className="min-w-0 basis-[calc((100%-1rem)/2)] sm:basis-[calc((100%-2rem)/3)] lg:basis-0 lg:grow"
                >
                  <StageNode {...stage} />
                </RevealItem>
                {i < STAGES.length - 1 ? (
                  <FlowArrow
                    scale={1.3}
                    className="hidden shrink-0 self-start lg:flex"
                    style={
                      {
                        // Half the icon box, less half the arrow's LAYOUT
                        // height (13px). `scale` transforms about the centre,
                        // so the scaled height never enters the offset.
                        marginTop: 'calc(var(--fin-icon) / 2 - 6.5px)',
                        '--arrow-delay': `${i * 0.12}s`,
                      } as React.CSSProperties
                    }
                  />
                ) : null}
              </Fragment>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
