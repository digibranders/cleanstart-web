import type React from 'react';
import { FadeUp } from '@/components/ui/FadeUp';
import { FinanceRequirements } from './FinanceRequirements';
import { FinanceOutcomes } from './FinanceOutcomes';

/*
 * The page's closing dark passage — the conformance record and the results,
 * painted as ONE continuous gradient across two semantic sections rather than
 * two dark bands with a seam between them. Same construction as
 * CisoValidationOutcomes on the CISO page.
 *
 * Why the shared furniture lives here and not in the sections: `FadeUp` is a
 * motion div, so it establishes a stacking context. A `mix-blend-mode: screen`
 * aura inside one would blend against that context's empty backdrop instead of
 * the gradient and wash out. Holding the gradient, the mesh planes and the
 * aura at this level keeps them composited against the real background, and
 * makes the two sections read as one passage.
 */

/*
 * Stops are tuned to where the CONTENT actually falls across the combined
 * height, not spread evenly. The record occupies 0-59% and the results 59-86%;
 * the last ~14% is the clearance the footer's white CTA card overlaps. So the
 * gradient holds deep indigo through both blocks of copy and only ramps to
 * brand violet underneath the card, which is the one place that needs it.
 * Spreading a single 0-100% ramp over the pair instead put the results' white
 * text on bright violet and cost it contrast.
 */
const BLOCK_BACKGROUND =
  'linear-gradient(180deg, #151021 0%, #16123C 45%, #131E8F 78%, #2E1F9E 88%, #471EC0 100%)';

export function FinanceProofBand(): React.ReactElement {
  return (
    <div className="relative w-full overflow-hidden" style={{ background: BLOCK_BACKGROUND }}>
      {/* Grid mesh planes — the CISO outcomes decoration, read as a measured
          surface rather than another glow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: 'calc(-220 / 1920 * 100vw)',
          top: '-150px',
          width: '803px',
          height: '803px',
          opacity: 0.28,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-vector-center.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: 'calc(-340 / 1920 * 100vw)',
          bottom: '-320px',
          width: '979px',
          height: '979px',
          opacity: 0.18,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/ciso/outcomes-vector-corner.svg"
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/*
       * No aura here. The outcomes section carried a screen-blended violet one
       * when it painted its own short gradient; stretched across this passage
       * it sat directly behind the results copy and lifted that whole area
       * toward violet, costing the body text its contrast. The gradient and the
       * mesh planes already give the passage its depth.
       */}

      <div className="relative">
        <FadeUp>
          <FinanceRequirements />
        </FadeUp>
        <FadeUp>
          <FinanceOutcomes />
        </FadeUp>
      </div>
    </div>
  );
}
