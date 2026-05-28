'use client';

import { Line, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Color, Mesh } from 'three';
import { chamberDwell } from '../../lib/dwell';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';
import type { CubePhase } from '../../lib/timeline';

interface NodeDef {
  pos: [number, number, number];
  label: string;
  vulnerable: boolean;
}

const NODES: NodeDef[] = [
  { pos: [-0.35, 0.3, 0], label: 'openssl', vulnerable: true },
  { pos: [0.35, 0.3, 0], label: 'libc', vulnerable: false },
  { pos: [-0.35, -0.3, 0], label: 'zlib', vulnerable: false },
  { pos: [0.35, -0.3, 0], label: 'curl', vulnerable: true },
];

interface Props {
  position: [number, number, number];
  chamberIndex: 0 | 1 | 2 | 3;
  phaseA: MutableRefObject<CubePhase>;
  phaseB: MutableRefObject<CubePhase>;
}

/** CH2 · AI LOGIC — dep-graph skeleton always visible; brighten + flip on dwell. */
export function DepGraph({ position, chamberIndex, phaseA, phaseB }: Props) {
  const nodeRefs = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const a = chamberDwell(phaseA.current, chamberIndex);
    const b = chamberDwell(phaseB.current, chamberIndex);
    const progress = Math.max(a, b);
    const flipPhase = Math.min(1, Math.max(0, (progress - 0.5) / 0.3));
    NODES.forEach((n, i) => {
      const m = nodeRefs.current[i];
      if (!m) return;
      const mat = m.material as unknown as { color: Color; opacity: number };
      if (n.vulnerable) {
        mat.color.copy(flipPhase > 0.5 ? COLORS.neonPrimary : COLORS.cveWarn);
      } else {
        mat.color.copy(COLORS.neonPrimary);
      }
      mat.opacity = 0.4 + 0.55 * progress;
    });
  });

  return (
    <group position={position}>
      {NODES.map((n) => (
        <Line
          key={`edge-${n.label}`}
          points={[[0, 0, 0], n.pos]}
          color={COLORS.neonPrimary}
          lineWidth={1.5}
          transparent
          opacity={0.5}
        />
      ))}
      {NODES.map((n, i) => (
        <group key={n.label} position={n.pos}>
          <mesh
            ref={(m) => {
              nodeRefs.current[i] = m;
              if (m) m.layers.enable(BLOOM_LAYER);
            }}
          >
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial
              color={n.vulnerable ? COLORS.cveWarn : COLORS.neonPrimary}
              transparent
              opacity={0.4}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0.07, 0, 0]}
            fontSize={0.04}
            color={COLORS.neonSecondary}
            anchorX="left"
          >
            {n.label}
          </Text>
        </group>
      ))}
    </group>
  );
}
