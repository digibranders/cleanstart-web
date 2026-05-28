'use client';

import { Text } from '@react-three/drei';
import type { CveSummary } from '../../lib/logoPool';
import { COLORS } from '../../lib/materials';

interface Props {
  position: [number, number, number];
  summary: CveSummary;
  /** Opacity 0..1 — driven by the parent based on the cube's CH1 dwell window. */
  visibility: number;
}

export function ManifestCard({ position, summary, visibility }: Props) {
  const text = `🔴 ${summary.cveCount} CVE · ${summary.version} · ${summary.depCount} deps`;
  return (
    <group position={position} visible={visibility > 0.01}>
      <Text
        fontSize={0.08}
        color={COLORS.neonSecondary}
        anchorX="center"
        anchorY="middle"
        fillOpacity={visibility}
      >
        {text}
      </Text>
    </group>
  );
}
