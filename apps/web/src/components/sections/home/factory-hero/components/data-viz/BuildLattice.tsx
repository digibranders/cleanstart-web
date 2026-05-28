'use client';

import type { Object3D } from 'three';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  /** 0..1 — drives layer-by-layer build. */
  progress: number;
}

const LAYERS = 4;
const BASE_ALPHA = 0.25;

/**
 * CH3 · CLEANCOMPILE — permanent stack of build-lattice rings. Each ring
 * brightens in sequence as `progress` advances, giving a "scaffolding up"
 * read while a cube dwells. Off-dwell the rings stay at a low base alpha
 * so the chamber still reads as the forge.
 */
export function BuildLattice({ position, progress }: Props) {
  return (
    <group position={position}>
      {Array.from({ length: LAYERS }).map((_, i) => {
        const layerStart = i / LAYERS;
        const layerEnd = (i + 1) / LAYERS;
        const layerProgress = Math.min(
          1,
          Math.max(0, (progress - layerStart) / (layerEnd - layerStart)),
        );
        const alpha = BASE_ALPHA + (0.9 - BASE_ALPHA) * layerProgress;
        const y = -0.3 + i * 0.18;
        return (
          <mesh
            key={i}
            position={[0, y, 0]}
            ref={(m: Object3D | null) => {
              if (m) m.layers.enable(BLOOM_LAYER);
            }}
          >
            <torusGeometry args={[0.3, 0.012, 12, 48]} />
            <meshBasicMaterial color={COLORS.neonPrimary} transparent opacity={alpha} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}
