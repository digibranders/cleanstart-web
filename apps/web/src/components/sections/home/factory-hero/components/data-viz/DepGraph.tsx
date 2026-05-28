'use client';

import { Line, Text } from '@react-three/drei';
import { COLORS } from '../../lib/materials';

interface Node {
  pos: [number, number, number];
  label: string;
  /** If true, starts red and flips to cyan during the chamber's active window. */
  vulnerable: boolean;
}

const NODES: Node[] = [
  { pos: [-0.35, 0.3, 0], label: 'openssl', vulnerable: true },
  { pos: [0.35, 0.3, 0], label: 'libc', vulnerable: false },
  { pos: [-0.35, -0.3, 0], label: 'zlib', vulnerable: false },
  { pos: [0.35, -0.3, 0], label: 'curl', vulnerable: true },
];

interface Props {
  position: [number, number, number];
  /** 0..1 progress through the dep-graph window: 0 = invisible, 0.4 = graph fully drawn, 0.7 = red→cyan flip. */
  progress: number;
}

export function DepGraph({ position, progress }: Props) {
  const graphAlpha = Math.min(1, Math.max(0, (progress - 0.05) / 0.3));
  const flipPhase = Math.min(1, Math.max(0, (progress - 0.5) / 0.3));

  return (
    <group position={position} visible={graphAlpha > 0.01}>
      {NODES.map((n) => (
        <Line
          key={`edge-${n.label}`}
          points={[[0, 0, 0], n.pos]}
          color={COLORS.neonPrimary}
          lineWidth={1}
          transparent
          opacity={0.5 * graphAlpha}
        />
      ))}
      {NODES.map((n) => {
        const color = n.vulnerable
          ? flipPhase > 0.5
            ? COLORS.neonPrimary
            : COLORS.cveWarn
          : COLORS.neonPrimary;
        return (
          <group key={n.label} position={n.pos}>
            <mesh>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={graphAlpha} />
            </mesh>
            <Text
              position={[0.08, 0, 0]}
              fontSize={0.045}
              color={COLORS.neonSecondary}
              anchorX="left"
              fillOpacity={graphAlpha}
            >
              {n.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
