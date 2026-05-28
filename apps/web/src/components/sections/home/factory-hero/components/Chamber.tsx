'use client';

import { Text } from '@react-three/drei';
import type { ReactNode } from 'react';
import {
  BLOOM_LAYER,
  COLORS,
  makeChamberEdgeMaterial,
  makeChamberWallMaterial,
} from '../lib/materials';

interface ChamberProps {
  /** Center position in scene units */
  position: [number, number, number];
  /** Width × Height × Depth in scene units */
  size: [number, number, number];
  /** e.g. "[ 01 · INTAKE ]" — rendered above the chamber */
  label: string;
  children?: ReactNode;
}

export function Chamber({ position, size, label, children }: ChamberProps) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      {/* walls */}
      <mesh material={makeChamberWallMaterial()}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {/* neon edges (BloomLayer = 1 so the post pass picks them up) */}
      <lineSegments
        material={makeChamberEdgeMaterial()}
        ref={(self) => { if (self) self.layers.set(BLOOM_LAYER); }}
      >
        <edgesGeometry
          args={[
            // re-using a temporary BoxGeometry for the edge extraction
            (() => {
              const { BoxGeometry } = require('three') as typeof import('three');
              return new BoxGeometry(w, h, d);
            })(),
          ]}
        />
      </lineSegments>
      {/* label above the chamber */}
      <Text
        position={[0, h / 2 + 0.18, 0]}
        fontSize={0.11}
        color={COLORS.neonPrimary}
        letterSpacing={0.16}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {children}
    </group>
  );
}
