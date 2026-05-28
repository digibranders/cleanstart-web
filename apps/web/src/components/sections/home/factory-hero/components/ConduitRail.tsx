'use client';

import { Line } from '@react-three/drei';
import type { Object3D } from 'three';
import { BLOOM_LAYER, COLORS } from '../lib/materials';

interface Props {
  length: number; // scene units
  y: number;
}

export function ConduitRail({ length, y }: Props) {
  return (
    <Line
      points={[
        [-length / 2, y, 0],
        [length / 2, y, 0],
      ]}
      color={COLORS.neonPrimary}
      lineWidth={1.5}
      dashed
      dashScale={6}
      dashSize={0.04}
      gapSize={0.08}
      transparent
      opacity={0.6}
      ref={(l: Object3D | null) => { if (l) l.layers.enable(BLOOM_LAYER); }}
    />
  );
}
