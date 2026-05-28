'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Mesh } from 'three';
import { chamberDwell } from '../../lib/dwell';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';
import type { CubePhase } from '../../lib/timeline';

interface Props {
  position: [number, number, number];
  chamberIndex: 0 | 1 | 2 | 3;
  phaseA: MutableRefObject<CubePhase>;
  phaseB: MutableRefObject<CubePhase>;
}

const LAYERS = 4;
const BASE_ALPHA = 0.25;

/** CH3 · CLEANCOMPILE — stack of wireframe rings; brighten in sequence on dwell. */
export function BuildLattice({ position, chamberIndex, phaseA, phaseB }: Props) {
  const ringRefs = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const a = chamberDwell(phaseA.current, chamberIndex);
    const b = chamberDwell(phaseB.current, chamberIndex);
    const progress = Math.max(a, b);
    ringRefs.current.forEach((m, i) => {
      if (!m) return;
      const layerStart = i / LAYERS;
      const layerEnd = (i + 1) / LAYERS;
      const layerProg = Math.min(
        1,
        Math.max(0, (progress - layerStart) / (layerEnd - layerStart)),
      );
      const mat = m.material as unknown as { opacity: number };
      mat.opacity = BASE_ALPHA + (0.9 - BASE_ALPHA) * layerProg;
    });
  });

  return (
    <group position={position}>
      {Array.from({ length: LAYERS }).map((_, i) => {
        const y = -0.3 + i * 0.18;
        return (
          <mesh
            key={i}
            position={[0, y, 0]}
            ref={(m) => {
              ringRefs.current[i] = m;
              if (m) m.layers.enable(BLOOM_LAYER);
            }}
          >
            <torusGeometry args={[0.3, 0.012, 12, 48]} />
            <meshBasicMaterial
              color={COLORS.neonPrimary}
              transparent
              opacity={BASE_ALPHA}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}
