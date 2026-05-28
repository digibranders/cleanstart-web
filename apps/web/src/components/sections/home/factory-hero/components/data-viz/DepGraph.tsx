'use client';

import { Line, Text } from '@react-three/drei';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';

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
  /** 0..1 progress through the dep-graph window. */
  progress: number;
}

/**
 * CH2 · AI LOGIC — permanent 4-node dep-graph skeleton. Edges + nodes always
 * visible at low opacity; brighten + flip red→cyan when a cube is dwelling.
 */
export function DepGraph({ position, progress }: Props) {
  const dwellAlpha = Math.min(1, Math.max(0, (progress - 0.05) / 0.3));
  const flipPhase = Math.min(1, Math.max(0, (progress - 0.5) / 0.3));
  const baseAlpha = 0.35; // always-visible base
  const edgeAlpha = baseAlpha + 0.5 * dwellAlpha;
  const nodeAlpha = baseAlpha + 0.65 * dwellAlpha;

  return (
    <group position={position}>
      {/* edges (always visible, brighten on dwell) */}
      {NODES.map((n) => (
        <Line
          key={`edge-${n.label}`}
          points={[[0, 0, 0], n.pos]}
          color={COLORS.neonPrimary}
          lineWidth={1.5}
          transparent
          opacity={edgeAlpha}
        />
      ))}
      {/* nodes — vulnerable ones flip from red → cyan during dwell */}
      {NODES.map((n) => {
        const color = n.vulnerable
          ? flipPhase > 0.5
            ? COLORS.neonPrimary
            : COLORS.cveWarn
          : COLORS.neonPrimary;
        return (
          <group key={n.label} position={n.pos}>
            <mesh
              ref={(m) => {
                if (m) m.layers.enable(BLOOM_LAYER);
              }}
            >
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={nodeAlpha} toneMapped={false} />
            </mesh>
            <Text
              position={[0.07, 0, 0]}
              fontSize={0.04}
              color={COLORS.neonSecondary}
              anchorX="left"
              fillOpacity={Math.max(0.5, nodeAlpha)}
            >
              {n.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
