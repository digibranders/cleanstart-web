'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { buildAgentGeometry } from '../lib/geometry';
import { BLOOM_LAYER, COLORS, makeAgentMaterial } from '../lib/materials';

interface AgentProps {
  /** Base corner position inside the chamber. */
  position: [number, number, number];
  /** Phase offset so the 3 agents don't all drift in lockstep. */
  driftSeed: number;
}

const DRIFT_AMOUNT = 0.12;

export function Agent({ position, driftSeed }: AgentProps) {
  const groupRef = useRef<Group>(null);
  const geometry = useMemo(() => buildAgentGeometry(), []);
  const material = useMemo(() => makeAgentMaterial(), []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime + driftSeed;
    groupRef.current.position.x = position[0] + Math.sin(t * 0.7) * DRIFT_AMOUNT;
    groupRef.current.position.y = position[1] + Math.cos(t * 0.5) * DRIFT_AMOUNT;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh geometry={geometry} material={material} />
      {/* Glowing top antenna so they read as a distinct shape, on bloom layer */}
      <mesh
        position={[0, 0.28, 0]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={COLORS.neonSecondary} toneMapped={false} />
      </mesh>
    </group>
  );
}
