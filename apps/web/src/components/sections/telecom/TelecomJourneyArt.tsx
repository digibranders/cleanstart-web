'use client';

import type React from 'react';
import { useRef } from 'react';
import Image from 'next/image';
import { useRevealInView } from '@/components/ui/Reveal';
import { REVEAL_VIEWPORT } from '@/lib/motion';

/*
 * The three Discover / Standardize / Operate artworks, assembled from separate
 * layers so each part can move on its own (keyframes: globals.css, `cs-tj-*`).
 *
 * The layers were not peeled out of the flat renders: the pixels hidden behind
 * an object do not exist in a flat image. Each scene was rendered again as an
 * exploded view, every part floating apart on one camera, then keyed and split,
 * so the parts line up exactly when re-stacked here.
 *
 * Discover   the magnifier drops in, then sweeps the platform on a slow loop;
 *            a light spot on the platform tracks it. Hover lifts the lens.
 * Standardize four tiles arrive scattered and askew, straighten, then settle
 *            into one aligned stack: the step's own story. Hover explodes the
 *            stack back apart. The tiles in the render overlap in perspective,
 *            so only the top one was fully visible: it is cut out and copied
 *            four times. The platform's back corner, which the lowest tile hid
 *            in the render, was rebuilt by extending its two visible back edges,
 *            so every tile is free to move, the lowest included.
 * Operate    a straight-on gear set upright in a CSS 3D plane, so it turns in
 *            its own plane instead of spinning flat like a sticker. Stacked
 *            copies pushed back in z give it thickness. Hover adds a second,
 *            faster turn on top, so the speed-up never jumps.
 *
 * Positions are percentages of each scene's frame, measured from the renders.
 * Everything starts on reveal (`data-on`) and is static under reduced motion.
 */

type Variant = 'discover' | 'standardize' | 'operate';

interface Layer {
  src: string;
  w: number;
  h: number;
}

const DISCOVER_PLATFORM: Layer = { src: '/images/telecom/journey/discover-platform.webp', w: 790, h: 326 };
const LENS: Layer = { src: '/images/telecom/journey/discover-lens.webp', w: 490, h: 415 };
const STD_PLATFORM: Layer = { src: '/images/telecom/journey/standardize-base.webp', w: 682, h: 420 };
const TILE: Layer = { src: '/images/telecom/journey/standardize-tile.webp', w: 379, h: 199 };
const GEAR: Layer = { src: '/images/telecom/journey/gear.webp', w: 852, h: 851 };

/** Discover and Operate share the discover render's frame (790 x 816). */
const OPEN_FRAME = '790 / 816';
/** The standardize render, trimmed to the exploded stack and platform (682 x 700). */
const STACK_FRAME = '682 / 700';

/*
 * Tiles, top to bottom. `top` is the settled stack: 38 render px apart, the
 * lowest resting just above the platform face. `lift` is the exploded spacing
 * (95 render px apart) as a share of the tile's own 199px height; `jx`/`jr`
 * are the scattered, askew arrival. Lowest tile arrives first.
 */
const TILES = [
  { top: '31.57%', lift: '-111.06%', jx: '-18%', jr: '-8deg', delay: '0.3s' },
  { top: '37%', lift: '-82.41%', jx: '16%', jr: '7deg', delay: '0.2s' },
  { top: '42.43%', lift: '-53.77%', jx: '-12%', jr: '-5deg', delay: '0.1s' },
  { top: '47.86%', lift: '-25.13%', jx: '10%', jr: '5deg', delay: '0s' },
] as const;

function LayerImg({ layer, sizes }: { layer: Layer; sizes: string }): React.ReactElement {
  return (
    <Image
      src={layer.src}
      alt=""
      aria-hidden
      width={layer.w}
      height={layer.h}
      sizes={sizes}
      draggable={false}
      className="block h-auto w-full select-none"
    />
  );
}

function Discover(): React.ReactElement {
  return (
    <>
      <span className="cs-tj-layer" style={{ left: 0, top: '60.05%', width: '100%' }}>
        <LayerImg layer={DISCOVER_PLATFORM} sizes="240px" />
      </span>
      <span
        aria-hidden
        className="cs-tj-spot absolute rounded-full"
        style={{ left: '33%', top: '66%', width: '34%', height: '12%' }}
      />
      <span className="cs-tj-layer cs-tj-lens-in" style={{ left: '20%', top: '6%', width: '62.03%' }}>
        <span className="cs-tj-lens-hover block">
          <span className="cs-tj-lens-scan block">
            <LayerImg layer={LENS} sizes="150px" />
          </span>
        </span>
      </span>
    </>
  );
}

function Standardize(): React.ReactElement {
  return (
    <>
      <span className="cs-tj-layer" style={{ left: 0, top: '40%', width: '100%' }}>
        <LayerImg layer={STD_PLATFORM} sizes="200px" />
      </span>
      {[...TILES].reverse().map((t) => (
        <span
          key={t.top}
          className="cs-tj-layer"
          style={{ left: '22.29%', top: t.top, width: '55.57%' }}
        >
          <span
            className="cs-tj-tile-lift block"
            style={{ '--lift': t.lift } as React.CSSProperties}
          >
            <span
              className="cs-tj-tile-in block"
              style={
                { '--lift': t.lift, '--jx': t.jx, '--jr': t.jr, '--d': t.delay } as React.CSSProperties
              }
            >
              <LayerImg layer={TILE} sizes="110px" />
            </span>
          </span>
        </span>
      ))}
    </>
  );
}

function Operate(): React.ReactElement {
  return (
    <>
      <span className="cs-tj-layer" style={{ left: 0, top: '60.05%', width: '100%' }}>
        <LayerImg layer={DISCOVER_PLATFORM} sizes="240px" />
      </span>
      <span
        aria-hidden
        className="cs-tj-glow absolute rounded-full"
        style={{ left: '27%', top: '68%', width: '46%', height: '14%' }}
      />
      <span
        className="cs-tj-layer cs-tj-gear-in"
        style={{ left: '23%', top: '27.5%', width: '54%', perspective: '900px' }}
      >
        <span className="cs-tj-gear-plane block">
          <span className="cs-tj-gear-boost block">
            <span className="cs-tj-gear-spin relative block">
              {[4, 3, 2, 1].map((depth) => (
                <span
                  key={depth}
                  className="cs-tj-gear-depth absolute inset-0"
                  style={{ '--z': `${-depth * 2.5}px`, '--b': `${0.42 + depth * 0.02}` } as React.CSSProperties}
                >
                  <LayerImg layer={GEAR} sizes="120px" />
                </span>
              ))}
              <span className="relative block">
                <LayerImg layer={GEAR} sizes="120px" />
              </span>
            </span>
          </span>
        </span>
      </span>
    </>
  );
}

const SCENES: Record<Variant, { frame: string; label: string; Scene: () => React.ReactElement }> = {
  discover: {
    frame: OPEN_FRAME,
    label: 'A magnifying glass sweeping across a violet platform',
    Scene: Discover,
  },
  standardize: {
    frame: STACK_FRAME,
    label: 'Scattered tiles straightening into one aligned stack on a violet platform',
    Scene: Standardize,
  },
  operate: {
    frame: OPEN_FRAME,
    label: 'A gear turning steadily on a violet platform',
    Scene: Operate,
  },
};

export function TelecomJourneyArt({ variant }: { variant: Variant }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const on = useRevealInView(ref, REVEAL_VIEWPORT);
  const { frame, label, Scene } = SCENES[variant];
  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-on={on ? '' : undefined}
      className="cs-tj relative h-full"
      style={{ aspectRatio: frame }}
    >
      <Scene />
    </div>
  );
}
