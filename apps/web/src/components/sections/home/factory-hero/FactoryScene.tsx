'use client';

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Agent } from './components/Agent';
import { Chamber } from './components/Chamber';
import { ChamberContents } from './components/ChamberContents';
import { ConduitRail } from './components/ConduitRail';
import { Cube } from './components/Cube';
import { FloorGrid } from './components/FloorGrid';
import { useViewportMode } from './hooks/useViewportMode';
import { getLogoForCube } from './lib/logoPool';

const X_SPAN = 4.6; // total travel width in scene units (matches camera fov)

const HORIZONTAL: { x: number; y: number; label: string }[] = [
  { x: -1.5, y: 0, label: '[ 01 · INTAKE ]' },
  { x: -0.5, y: 0, label: '[ 02 · AI_LOGIC ]' },
  { x: 0.5, y: 0, label: '[ 03 · CLEANCOMPILE ]' },
  { x: 1.5, y: 0, label: '[ 04 · ATTEST·SHIP ]' },
];

const VERTICAL: { x: number; y: number; label: string }[] = [
  { x: 0, y: 2.0, label: '[ 01 · INTAKE ]' },
  { x: 0, y: 0.7, label: '[ 02 · AI_LOGIC ]' },
  { x: 0, y: -0.7, label: '[ 03 · CLEANCOMPILE ]' },
  { x: 0, y: -2.0, label: '[ 04 · ATTEST·SHIP ]' },
];

const CHAMBER_SIZE: [number, number, number] = [0.95, 1.2, 0.9];

const AGENT_OFFSETS: [number, number, number][] = [
  [-0.55, 0.45, 0.3],
  [0.55, 0.45, 0.3],
  [0.0, -0.55, 0.3],
];

export function FactoryScene() {
  const mode = useViewportMode();
  const chambers = mode === 'mobile' ? VERTICAL : HORIZONTAL;
  const showAgents = mode !== 'mobile';
  const cameraPos: [number, number, number] = mode === 'mobile' ? [0, 0, 5.0] : [0, 0.4, 4.5];
  const cameraFov = mode === 'mobile' ? 50 : 52;
  const cubeXSpan = mode === 'mobile' ? 5.0 : X_SPAN;
  const orientation = mode === 'mobile' ? 'vertical' : 'horizontal';

  // R3F's ResizeObserver runs on Canvas mount; if the parent measured 0x0 at
  // that instant (likely under our dynamic import + suspense delay), the
  // canvas stays at its 300x150 default. Fire resize events shortly after
  // mount so the observer re-measures against the now-finalized parent.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ids = [16, 100, 300, 600].map((delay) =>
      window.setTimeout(() => window.dispatchEvent(new Event('resize')), delay),
    );
    return () => {
      for (const id of ids) window.clearTimeout(id);
    };
  }, []);

  return (
    <Canvas
      camera={{ position: cameraPos, fov: cameraFov }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Brighter scene lights so chambers + cubes read clearly */}
      <ambientLight intensity={0.6} color="#dab6f3" />
      <pointLight position={[0, 3, 3]} intensity={1.2} color="#2cc1eb" />
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#dab6f3" />
      <pointLight position={[3, 2, 2]} intensity={0.6} color="#dab6f3" />
      <directionalLight position={[0, 4, 2]} intensity={0.5} color="#ffffff" />

      <ConduitRail length={X_SPAN} y={0} />
      <FloorGrid width={X_SPAN + 1} depth={3} y={-0.95} />

      {chambers.map((c, i) => (
        <Chamber key={i} position={[c.x, c.y, 0]} size={CHAMBER_SIZE} label={c.label}>
          {showAgents &&
            AGENT_OFFSETS.map((off, j) => (
              <Agent key={j} position={off} driftSeed={i + j * 0.5} />
            ))}
          <ChamberContents chamberIndex={i as 0 | 1 | 2 | 3} />
        </Chamber>
      ))}

      <Cube
        loopOffset={0}
        logo={getLogoForCube(0)}
        railY={0}
        xSpan={cubeXSpan}
        orientation={orientation}
      />
      <Cube
        loopOffset={5.0}
        logo={getLogoForCube(1)}
        railY={0}
        xSpan={cubeXSpan}
        orientation={orientation}
      />

      <EffectComposer>
        <Bloom
          intensity={1.8}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.6}
          mipmapBlur
          radius={0.7}
        />
      </EffectComposer>
    </Canvas>
  );
}
