'use client';

import type { Object3D } from 'three';
import { COLORS, BLOOM_LAYER } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  /** 0..1 — drives layer-by-layer build. 0 = hidden, 1 = full lattice. */
  progress: number;
}

const LAYERS = 3;

export function BuildLattice({ position, progress }: Props) {
  return (
    <group position={position} visible={progress > 0.01}>
      {Array.from({ length: LAYERS }).map((_, i) => {
        const layerStart = i / LAYERS;
        const layerEnd = (i + 1) / LAYERS;
        const layerAlpha = Math.min(1, Math.max(0, (progress - layerStart) / (layerEnd - layerStart)));
        const y = -0.25 + (i * 0.18);
        return (
          <mesh key={i} position={[0, y, 0]} onUpdate={(m: Object3D) => m.layers.enable(BLOOM_LAYER)}>
            <torusGeometry args={[0.28, 0.005, 8, 32]} />
            <meshBasicMaterial color={COLORS.neonPrimary} transparent opacity={0.85 * layerAlpha} />
          </mesh>
        );
      })}
    </group>
  );
}
