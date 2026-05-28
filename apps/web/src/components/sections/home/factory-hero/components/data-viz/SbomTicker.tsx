'use client';

import { Text } from '@react-three/drei';
import { COLORS } from '../../lib/materials';

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

export function SbomTicker({ position, progress }: Props) {
  const rowsShown = Math.floor(progress * HASH_ROWS.length);
  return (
    <group position={position} visible={rowsShown > 0}>
      {HASH_ROWS.slice(0, rowsShown).map((row, i) => (
        <Text
          key={i}
          position={[0, -i * 0.06, 0]}
          fontSize={0.035}
          color={COLORS.neonPrimary}
          anchorX="left"
          font="ui-monospace"
        >
          {row}
        </Text>
      ))}
    </group>
  );
}
