'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { buildAgentGeometry } from '../lib/geometry';
import { makeAgentMaterial } from '../lib/materials';

interface AgentProps {
  /** Base corner position inside the chamber. */
  position: [number, number, number];
  /** Phase offset so the 3 agents don't all drift in lockstep. */
  driftSeed: number;
}

const DRIFT_AMOUNT = 0.12;

export function Agent({ position, driftSeed }: AgentProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime + driftSeed;
    meshRef.current.position.x = position[0] + Math.sin(t * 0.7) * DRIFT_AMOUNT;
    meshRef.current.position.y = position[1] + Math.cos(t * 0.5) * DRIFT_AMOUNT;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={buildAgentGeometry()}
      material={makeAgentMaterial()}
      position={position}
    />
  );
}
