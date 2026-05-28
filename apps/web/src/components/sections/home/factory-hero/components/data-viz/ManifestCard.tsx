'use client';

import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { Group } from 'three';
import { chamberDwell } from '../../lib/dwell';
import type { CveSummary } from '../../lib/logoPool';
import { BLOOM_LAYER, COLORS } from '../../lib/materials';
import type { CubePhase } from '../../lib/timeline';

interface Props {
  position: [number, number, number];
  chamberIndex: 0 | 1 | 2 | 3;
  phaseA: MutableRefObject<CubePhase>;
  phaseB: MutableRefObject<CubePhase>;
  summaryA: CveSummary;
  summaryB: CveSummary;
}

/** CH1 · INTAKE — permanent intake arrow + CVE-summary text that brightens during dwell. */
export function ManifestCard({
  position,
  chamberIndex,
  phaseA,
  phaseB,
  summaryA,
  summaryB,
}: Props) {
  const groupRef = useRef<Group>(null);
  const lastSummaryRef = useRef<CveSummary>(summaryA);

  useFrame(() => {
    if (!groupRef.current) return;
    const a = chamberDwell(phaseA.current, chamberIndex);
    const b = chamberDwell(phaseB.current, chamberIndex);
    const progress = Math.max(a, b);
    if (a >= b && a > 0) lastSummaryRef.current = summaryA;
    else if (b > 0) lastSummaryRef.current = summaryB;
    // Brighten the whole group while a cube is dwelling
    for (const c of groupRef.current.children) {
      // biome-ignore lint/suspicious/noExplicitAny: drei Text has fillOpacity property
      const anyChild = c as any;
      if ('material' in anyChild && anyChild.material && 'opacity' in anyChild.material) {
        anyChild.material.opacity = 0.5 + 0.5 * progress;
      }
    }
  });

  const text = `${lastSummaryRef.current.cveCount} CVE · ${lastSummaryRef.current.version} · ${lastSummaryRef.current.depCount} deps`;

  return (
    <group ref={groupRef} position={position}>
      <mesh
        position={[0, -0.1, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        ref={(m) => {
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
      >
        <coneGeometry args={[0.08, 0.18, 4]} />
        <meshBasicMaterial
          color={COLORS.neonSecondary}
          toneMapped={false}
          transparent
          opacity={0.5}
        />
      </mesh>
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.055}
        color={COLORS.cveWarn}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
}
