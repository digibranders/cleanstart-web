'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Mesh } from 'three';
import { useLoopPhase } from '../hooks/useLoopPhase';
import { getLogoForCube, type LogoSlug } from '../lib/logoPool';
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

const CUBE_SIZE = 0.6;
const FACE_OFFSET = CUBE_SIZE / 2 + 0.001; // sit just outside the face, no z-fight

/** Four vertical-face positions + outward rotations for logo planes. */
const FACES: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  { position: [0, 0, FACE_OFFSET], rotation: [0, 0, 0] }, // +Z (front)
  { position: [0, 0, -FACE_OFFSET], rotation: [0, Math.PI, 0] }, // -Z (back)
  { position: [FACE_OFFSET, 0, 0], rotation: [0, Math.PI / 2, 0] }, // +X (right)
  { position: [-FACE_OFFSET, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // -X (left)
];

export function Cube({ loopOffset, logo, railY, xSpan, orientation }: CubeProps) {
  const phaseRef = useLoopPhase(loopOffset);
  const groupRef = useRef<Group>(null);
  const dirtyRef = useRef<Mesh>(null);
  const cleanRef = useRef<Mesh>(null);

  // Cache materials so we're not recreating them on every render.
  const dirtyMat = useMemo(() => makeCubeDirtyMaterial(), []);
  const cleanMat = useMemo(() => makeCubeCleanMaterial(), []);

  // Free GPU resources when the cube unmounts (HMR, route change, viewport switch).
  useEffect(
    () => () => {
      dirtyMat.dispose();
      cleanMat.dispose();
    },
    [dirtyMat, cleanMat],
  );

  // Per-cube logo cycling. Initial logo comes from the prop; each time the cube
  // wraps the loop (x crosses from end-of-loop back to start) we advance to the
  // next entry in the logo pool.
  const [currentLogo, setCurrentLogo] = useState<LogoSlug>(logo);
  const generationRef = useRef(0);
  const lastXRef = useRef(0);

  useFrame(() => {
    const p = phaseRef.current;
    if (!groupRef.current) return;

    // Detect loop wrap: x runs monotonically from -1.0 → +1.0 then snaps back to -1.0.
    const px = p.x;
    if (lastXRef.current > 0.5 && px < -0.5) {
      generationRef.current += 1;
      setCurrentLogo(getLogoForCube(generationRef.current + (loopOffset === 0 ? 0 : 1)));
    }
    lastXRef.current = px;

    // Travel
    if (orientation === 'horizontal') {
      groupRef.current.position.x = p.x * (xSpan / 2);
      groupRef.current.position.y = railY;
    } else {
      groupRef.current.position.x = 0;
      groupRef.current.position.y = -p.x * (xSpan / 2);
    }
    groupRef.current.rotation.y += 0.01047; // 1 rev / 10s at 60fps

    // Material crossfade across phases. Dirty + Clean are both mounted; we
    // swap visibility and tween opacities so the cube reads as transitioning
    // through CleanCompile.
    let cleanWeight = 0;
    if (p.material === 'clean') cleanWeight = 1;
    else if (p.material === 'transforming') cleanWeight = Math.min(1, Math.max(0, p.dwell));

    if (dirtyRef.current && dirtyRef.current.visible !== cleanWeight < 1) {
      dirtyRef.current.visible = cleanWeight < 1;
    }
    if (cleanRef.current) {
      cleanRef.current.visible = cleanWeight > 0;
      // Tween emissiveIntensity on the clean material so the transition is felt
      const m = cleanMat;
      m.opacity = 0.4 + 0.6 * cleanWeight;
      m.emissiveIntensity = 0.3 + 0.9 * cleanWeight;
    }
    if (dirtyMat) {
      // Pulse a tiny bit of emissive on the dirty cube too so it's not pitch-black
      dirtyMat.emissiveIntensity = 0.4 + 0.2 * Math.sin(p.x * Math.PI);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dirty cube (default visible) */}
      <mesh ref={dirtyRef} material={dirtyMat}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      </mesh>
      {/* Clean cube (visibility toggled by phase) */}
      <mesh
        ref={(m) => {
          cleanRef.current = m;
          if (m) m.layers.enable(BLOOM_LAYER);
        }}
        material={cleanMat}
        visible={false}
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      </mesh>
      {/* Logo on each of the 4 vertical faces — rotates with the cube */}
      {FACES.map((face, i) => (
        <CubeLogoPlane
          key={i}
          logo={currentLogo}
          materialState={phaseRef.current.material}
          dwell={phaseRef.current.dwell}
          position={face.position}
          rotation={face.rotation}
          size={0.5}
        />
      ))}
    </group>
  );
}
