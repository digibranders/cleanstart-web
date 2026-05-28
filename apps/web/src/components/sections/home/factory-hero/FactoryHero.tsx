'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FactoryHeroPoster } from './FactoryHero.poster';
import { useReducedMotion } from './hooks/useReducedMotion';

const FactoryScene = dynamic(() => import('./FactoryScene').then((m) => m.FactoryScene), {
  ssr: false,
});

const ARIA_LABEL =
  'CleanStart Factory pipeline: vulnerable upstream container images (such as nginx, postgres, redis) enter on the left, pass through four hardening stages — Intake, AI Logic Engine, CleanCompile, Attest and Handoff — and exit signed, verified, and CVE-free on the right.';

export function FactoryHero() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Tiny defer so the scene mount happens after first paint (poster already up).
    const id = window.setTimeout(() => setSceneReady(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      role="img"
      aria-label={ARIA_LABEL}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <FactoryHeroPoster fadeOut={sceneReady && !reduced ? 1 : 0} />
      {mounted && !reduced && sceneReady && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FactoryScene />
        </div>
      )}
    </div>
  );
}
