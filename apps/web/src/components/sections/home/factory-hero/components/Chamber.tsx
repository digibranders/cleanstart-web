'use client';

import { Edges, Text } from '@react-three/drei';
import type { ReactNode } from 'react';
import { COLORS, makeChamberWallMaterial } from '../lib/materials';

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
      {/* walls — translucent dark glass */}
      <mesh material={makeChamberWallMaterial()}>
        <boxGeometry args={[w, h, d]} />
        {/* neon edges via drei <Edges> — thick, unlit, picked up by bloom */}
        <Edges
          linewidth={3}
          threshold={15}
          color={COLORS.neonPrimary}
        />
      </mesh>
      {/* label above the chamber */}
      <Text
        position={[0, h / 2 + 0.18, 0]}
        fontSize={0.14}
        color={COLORS.neonPrimary}
        letterSpacing={0.16}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor={COLORS.neonPrimary}
      >
        {label}
      </Text>
      {children}
    </group>
  );
}
