import type React from 'react';
import Image from 'next/image';

/*
 * The hero artifact: a padlock set in a glass cube, ringed by three orbits.
 *
 * The cube is a rendered asset (keyed from black to a real alpha channel, so it
 * composites straight onto the hero mesh). The orbits are code, because a ring
 * that has to pass behind the cube and in front of it cannot be baked into one
 * flat image. Each orbit is drawn twice: the upper half in a layer under the
 * render, the lower half in a layer over it. A short bright dash travels each
 * ring on the same keyframes in both layers, so it reads as one comet that
 * slips behind the cube and comes back around the front.
 *
 * Motion is decorative and collapses to a still image under reduced motion
 * (see the cs-pqc-* rules in globals.css).
 */

const VIEW = 600;
const CX = VIEW / 2;
const CY = VIEW / 2;
const RX = 288;
const RY = 98;
const ELLIPSE = `M ${CX - RX} ${CY} a ${RX} ${RY} 0 1 0 ${RX * 2} 0 a ${RX} ${RY} 0 1 0 ${-RX * 2} 0`;

interface Orbit {
  rotate: number;
  duration: string;
  delay: string;
}

const ORBITS: readonly [Orbit, Orbit, Orbit] = [
  { rotate: 0, duration: '13s', delay: '0s' },
  { rotate: 60, duration: '17s', delay: '-4s' },
  { rotate: 120, duration: '21s', delay: '-9s' },
];

type Half = 'back' | 'front';

function OrbitLayer({ half }: { half: Half }): React.ReactElement {
  const front = half === 'front';
  const gradId = `pqc-orbit-grad-${half}`;
  const clipId = `pqc-orbit-clip-${half}`;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${front ? 'z-[2]' : 'z-0'}`}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="40" y1="120" x2="560" y2="480">
          <stop offset="0" stopColor="#2CC1EB" />
          <stop offset="1" stopColor="#9A51FF" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y={front ? CY : 0} width={VIEW} height={VIEW / 2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {ORBITS.map((o) => (
          <g key={o.rotate} transform={`rotate(${o.rotate} ${CX} ${CY})`}>
            <path d={ELLIPSE} stroke={`url(#${gradId})`} strokeWidth={front ? 1.6 : 1.2} opacity={front ? 0.8 : 0.42} />
            <path
              d={ELLIPSE}
              pathLength={1000}
              className="cs-pqc-comet"
              style={{ '--dur': o.duration, '--d': o.delay } as React.CSSProperties}
              stroke="#6EC8FF"
              strokeWidth={front ? 9 : 6}
              strokeLinecap="round"
              strokeDasharray="110 890"
              opacity={0.16}
            />
            <path
              d={ELLIPSE}
              pathLength={1000}
              className="cs-pqc-comet"
              style={{ '--dur': o.duration, '--d': o.delay } as React.CSSProperties}
              stroke="#8FE3FF"
              strokeWidth={front ? 2.6 : 2}
              strokeLinecap="round"
              strokeDasharray="80 920"
              opacity={front ? 1 : 0.7}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function PqcHeroArt({ className }: { className?: string }): React.ReactElement {
  return (
    <div className={className}>
      <div className="cs-pqc-float relative aspect-square w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] aspect-square w-[80%] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(44,193,235,0.26) 0%, rgba(124,79,240,0.18) 55%, rgba(124,79,240,0) 100%)',
          }}
        />
        <OrbitLayer half="back" />
        <Image
          src="/images/pqc/hero-lock.webp"
          alt="A padlock set into a glass cube on a glowing platform, ringed by three orbits"
          fill
          sizes="(min-width: 1280px) 560px, (min-width: 1024px) 40vw, 72vw"
          className="z-[1] object-contain"
        />
        <OrbitLayer half="front" />
      </div>
    </div>
  );
}
