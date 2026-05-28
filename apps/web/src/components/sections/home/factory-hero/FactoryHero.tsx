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

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function FactoryHero() {
  const reduced = useReducedMotion();
  // Reduced-motion strategy (spec § 4.3): show the poster only — no R3F scene,
  // no cubes in motion, no flicker. The poster image is designed to depict a
  // "settled" state of the pipeline so the visual story still reads as still life.
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [supportsWebGL, setSupportsWebGL] = useState(true);

  useEffect(() => {
    setSupportsWebGL(hasWebGL());
    setMounted(true);
    // Tiny defer so the scene mount happens after first paint (poster already up).
    const id = window.setTimeout(() => setSceneReady(true), 200);
    return () => window.clearTimeout(id);
  }, []);

  // R3F's <Canvas> initializes its ResizeObserver on first paint, which can
  // race with our 200ms scene-mount defer and leave the canvas stuck at its
  // 300x150 default. Once the scene has mounted, fire one resize event so the
  // observer re-measures against the now-finalized parent dimensions.
  useEffect(() => {
    if (!sceneReady || reduced || !supportsWebGL) return;
    const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    return () => window.clearTimeout(id);
  }, [sceneReady, reduced, supportsWebGL]);

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
      <FactoryHeroPoster fadeOut={sceneReady && !reduced && supportsWebGL ? 1 : 0} />
      {mounted && !reduced && sceneReady && supportsWebGL && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <FactoryScene />
        </div>
      )}
    </div>
  );
}
