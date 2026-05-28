'use client';

import { Text } from '@react-three/drei';
import type { CveSummary } from '../../lib/logoPool';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  summary: CveSummary;
  /** Opacity 0..1 — driven by the parent based on the cube's CH1 dwell window. */
  visibility: number;
}

/**
 * CH1 · INTAKE — permanent intake-dock indicator (arrow) plus a CVE-summary
 * text that brightens when a cube is inside the chamber.
 */
export function ManifestCard({ position, summary, visibility }: Props) {
  const active = Math.max(0.3, visibility); // keep a visible baseline
  const text = `${summary.cveCount} CVE · ${summary.version} · ${summary.depCount} deps`;
  return (
    <group position={position}>
      {/* Permanent intake-dock arrow head (always visible) */}
      <mesh
        position={[0, -0.1, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <coneGeometry args={[0.08, 0.18, 4]} />
        <meshBasicMaterial color={COLORS.neonSecondary} toneMapped={false} />
      </mesh>
      {/* CVE summary text — brightens during dwell */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.055}
        color={COLORS.cveWarn}
        anchorX="center"
        anchorY="middle"
        fillOpacity={active}
      >
        {text}
      </Text>
    </group>
  );
}
