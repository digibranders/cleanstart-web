'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { useLoopPhase } from '../hooks/useLoopPhase';
import type { LogoSlug } from '../lib/logoPool';
import { BLOOM_LAYER, makeCubeCleanMaterial, makeCubeDirtyMaterial } from '../lib/materials';
import { CubeLogoPlane } from './CubeLogoPlane';

interface CubeProps {
  /** 0 for the first cube, 5 for the second cube (5s offset). */
  loopOffset: number;
  logo: LogoSlug;
  /** Y position of the rail (constant). */
  railY: number;
  /** X span of travel: cube interpolates from -span/2 to +span/2 across the loop. */
  xSpan: number;
  /** Travel axis: 'horizontal' (desktop/mid) or 'vertical' (mobile, top→bottom). */
  orientation: 'horizontal' | 'vertical';
}

export function Cube({ loopOffset, logo, railY, xSpan, orientation }: CubeProps) {
  const phaseRef = useLoopPhase(loopOffset);
  const groupRef = useRef<Mesh>(null);

  useFrame(() => {
    const p = phaseRef.current;
    if (!groupRef.current) return;
    if (orientation === 'horizontal') {
      groupRef.current.position.x = p.x * (xSpan / 2);
      groupRef.current.position.y = railY;
    } else {
      groupRef.current.position.x = 0;
      // map +X (right) to -Y (down) so cube travels top→bottom
      groupRef.current.position.y = -p.x * (xSpan / 2);
    }
    groupRef.current.rotation.y += 0.01047; // 1 rev / 10s at 60fps (2π / 600)
  });

  // Render BOTH materials and toggle visibility — avoids material-swap cost per frame.
  // (`transforming` state shows dirty under the wireframe rebuild; spec § 4.1)
  return (
    <group ref={groupRef}>
      <mesh material={makeCubeDirtyMaterial()}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <mesh
        material={makeCubeCleanMaterial()}
        visible={false}
        onUpdate={(m) => m.layers.enable(BLOOM_LAYER)}
      >
        <boxGeometry args={[0.6, 0.6, 0.6]} />
      </mesh>
      <CubeLogoPlane
        logo={logo}
        materialState={phaseRef.current.material}
        dwell={phaseRef.current.dwell}
      />
    </group>
  );
}
