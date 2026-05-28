'use client';

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Chamber } from './components/Chamber';
import { Cube } from './components/Cube';
import { Agent } from './components/Agent';
import { ConduitRail } from './components/ConduitRail';
import { FloorGrid } from './components/FloorGrid';
import { getLogoForCube } from './lib/logoPool';

const RAIL_Y = 0.0;
const X_SPAN = 6.4; // total travel width in scene units

const CHAMBER_POSITIONS: { x: number; label: string }[] = [
  { x: -2.4, label: '[ 01 · INTAKE ]' },
  { x: -0.8, label: '[ 02 · AI_LOGIC ]' },
  { x:  0.9, label: '[ 03 · CLEANCOMPILE ]' },
  { x:  2.5, label: '[ 04 · ATTEST·SHIP ]' },
];

const CHAMBER_SIZE: [number, number, number] = [1.5, 1.4, 1.0];

const AGENT_OFFSETS: [number, number, number][] = [
  [-0.55,  0.45, 0.3],
  [ 0.55,  0.45, 0.3],
  [ 0.00, -0.55, 0.3],
];

export function FactoryScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4.0], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.15} color="#dab6f3" />
      <pointLight position={[0, 2, 2]} intensity={0.4} color="#2cc1eb" />

      <ConduitRail length={X_SPAN} y={RAIL_Y} />
      <FloorGrid width={X_SPAN + 1} depth={3} y={-0.95} />

      {CHAMBER_POSITIONS.map((c, i) => (
        <Chamber key={i} position={[c.x, RAIL_Y, 0]} size={CHAMBER_SIZE} label={c.label}>
          {AGENT_OFFSETS.map((off, j) => (
            <Agent key={j} position={off} driftSeed={i + j * 0.5} />
          ))}
        </Chamber>
      ))}

      <Cube loopOffset={0}   logo={getLogoForCube(0)} railY={RAIL_Y} xSpan={X_SPAN} />
      <Cube loopOffset={5.0} logo={getLogoForCube(1)} railY={RAIL_Y} xSpan={X_SPAN} />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.3} luminanceSmoothing={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
