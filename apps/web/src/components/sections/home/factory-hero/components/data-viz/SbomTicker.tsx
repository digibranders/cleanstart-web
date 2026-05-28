'use client';

import { Text } from '@react-three/drei';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';

const HASH_ROWS = [
  '7f3a2c d91b',
  '8e4d a2f1',
  'b7c8 4509',
  '1ad2 6f3e',
  'c5e9 8a01',
  '2b6f e74c',
  'f30a 9d51',
];

interface Props {
  position: [number, number, number];
  /** 0..1 — progress through the SBOM print window. */
  progress: number;
}

/**
 * CH4 · ATTEST·SHIP — permanent printer head + signature stamp. While a cube
 * is dwelling, hash rows print out below the head in monospace.
 */
export function SbomTicker({ position, progress }: Props) {
  const rowsShown = Math.floor(progress * HASH_ROWS.length);
  return (
    <group position={position}>
      {/* Permanent printer head (always visible) */}
      <mesh
        position={[-0.05, 0.08, 0]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <boxGeometry args={[0.16, 0.06, 0.08]} />
        <meshBasicMaterial color={COLORS.neonSecondary} toneMapped={false} />
      </mesh>
      {/* Permanent signature seal circle (always visible) */}
      <mesh
        position={[-0.2, 0.08, 0]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <ringGeometry args={[0.04, 0.06, 24]} />
        <meshBasicMaterial color={COLORS.neonPrimary} toneMapped={false} side={2} />
      </mesh>
      {/* Hash rows print out during dwell */}
      {HASH_ROWS.slice(0, rowsShown).map((row, i) => (
        <Text
          key={i}
          position={[0, -0.02 - i * 0.05, 0]}
          fontSize={0.035}
          color={COLORS.neonPrimary}
          anchorX="left"
        >
          {row}
        </Text>
      ))}
    </group>
  );
}
