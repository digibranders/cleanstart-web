'use client';

import { COLORS } from '../lib/materials';

interface Props {
  width: number;
  depth: number;
  y: number;
}

export function FloorGrid({ width, depth, y }: Props) {
  // grid: 60px cells per spec at 1px ≈ 0.005 units => 0.3 units per cell
  return (
    <gridHelper
      args={[
        Math.max(width, depth),
        Math.ceil(Math.max(width, depth) / 0.3),
        COLORS.neonPrimary,
        COLORS.neonPrimary,
      ]}
      position={[0, y, 0]}
    />
  );
}
