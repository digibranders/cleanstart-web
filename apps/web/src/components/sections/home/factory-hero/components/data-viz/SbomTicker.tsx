'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { chamberDwell } from '../../lib/dwell';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';
import type { CubePhase } from '../../lib/timeline';

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
  chamberIndex: 0 | 1 | 2 | 3;
  phaseA: MutableRefObject<CubePhase>;
  phaseB: MutableRefObject<CubePhase>;
}

/** CH4 · ATTEST·SHIP — permanent printer + signature seal; hash rows print on dwell. */
export function SbomTicker({ position, chamberIndex, phaseA, phaseB }: Props) {
  const [rowsShown, setRowsShown] = useState(0);
  const lastShownRef = useRef(0);

  useFrame(() => {
    const a = chamberDwell(phaseA.current, chamberIndex);
    const b = chamberDwell(phaseB.current, chamberIndex);
    const progress = Math.max(a, b);
    const target = Math.floor(progress * HASH_ROWS.length);
    if (target !== lastShownRef.current) {
      lastShownRef.current = target;
      setRowsShown(target);
    }
  });

  return (
    <group position={position}>
      <mesh
        position={[-0.05, 0.08, 0]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <boxGeometry args={[0.16, 0.06, 0.08]} />
        <meshBasicMaterial color={COLORS.neonSecondary} toneMapped={false} />
      </mesh>
      <mesh
        position={[-0.2, 0.08, 0]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <ringGeometry args={[0.04, 0.06, 24]} />
        <meshBasicMaterial color={COLORS.neonPrimary} toneMapped={false} side={2} />
      </mesh>
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
