'use client';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, ShaderMaterial } from 'three';
import { getLogoAssetUrl, type LogoSlug } from '../lib/logoPool';
import { BLOOM_LAYER } from '../lib/materials';
import type { CubeMaterial } from '../lib/timeline';

interface Props {
  logo: LogoSlug;
  /** Drives the grayscale ↔ color crossfade. */
  materialState: CubeMaterial;
  /** 0..1 dwell within the current stage — used to ease the crossfade. */
  dwell: number;
  /** Position relative to the cube center (one of the 4 vertical faces). */
  position: [number, number, number];
  /** Rotation so the plane faces outward from that face. */
  rotation: [number, number, number];
  /** Plane size in scene units. */
  size?: number;
}

/**
 * A logo plane mounted on a single face of the cube. Multiple instances are
 * mounted by Cube.tsx (one per visible face), so the logo travels + rotates
 * WITH the cube and remains visible regardless of which side is facing camera.
 *
 * A fragment shader crossfades the logo from grayscale (dirty) to full color
 * (clean), and adjusts alpha so the dirty cube reads as "marked".
 */
export function CubeLogoPlane({
  logo,
  materialState,
  dwell,
  position,
  rotation,
  size = 0.48,
}: Props) {
  const texture = useTexture(getLogoAssetUrl(logo));
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (materialRef.current) {
      let color = 0;
      if (materialState === 'clean') color = 1;
      else if (materialState === 'transforming') color = Math.min(1, Math.max(0, dwell));
      materialRef.current.uniforms.uColor!.value = color;
    }
    if (meshRef.current) {
      if (materialState === 'clean') meshRef.current.layers.enable(BLOOM_LAYER);
      else meshRef.current.layers.disable(BLOOM_LAYER);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        uniforms={{
          uMap: { value: texture },
          uColor: { value: materialState === 'clean' ? 1 : 0 },
          uTint: { value: [0.353, 0.29, 0.471] }, // #5a4a78 normalized
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform sampler2D uMap;
          uniform float uColor;
          uniform vec3 uTint;
          varying vec2 vUv;
          void main() {
            vec4 tex = texture2D(uMap, vUv);
            float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
            vec3 dirty = vec3(gray) * uTint;
            vec3 final = mix(dirty, tex.rgb, uColor);
            float alpha = tex.a * mix(0.7, 1.0, uColor);
            gl_FragColor = vec4(final, alpha);
          }
        `}
      />
    </mesh>
  );
}
