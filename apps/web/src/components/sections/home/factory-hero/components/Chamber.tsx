'use client';

import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { BoxGeometry } from 'three';
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
  // Cache one BoxGeometry per chamber size for edges extraction.
  const edgeBox = useMemo(() => new BoxGeometry(w, h, d), [w, h, d]);
  useEffect(() => () => edgeBox.dispose(), [edgeBox]);

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
        <edgesGeometry args={[edgeBox]} />
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
