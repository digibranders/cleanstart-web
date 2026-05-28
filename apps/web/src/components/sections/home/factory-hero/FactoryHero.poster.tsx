'use client';

import Image from 'next/image';
import poster from './assets/hero-poster.jpg';

interface Props {
  /** 0..1 — when 0 poster is fully opaque, when 1 it has faded out. */
  fadeOut: number;
}

export function FactoryHeroPoster({ fadeOut }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 1 - fadeOut,
        transition: 'opacity 400ms ease-out',
        pointerEvents: 'none',
      }}
    >
      <Image src={poster} alt="" priority fill sizes="100vw" style={{ objectFit: 'cover' }} />
    </div>
  );
}
