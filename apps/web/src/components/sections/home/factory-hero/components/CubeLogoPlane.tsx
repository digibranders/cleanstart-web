'use client';

import { Billboard, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, ShaderMaterial } from 'three';
import { type LogoSlug, getLogoAssetUrl } from '../lib/logoPool';
import { BLOOM_LAYER } from '../lib/materials';
import type { CubeMaterial } from '../lib/timeline';

interface Props {
  logo: LogoSlug;
  /** Drives the grayscale ↔ color crossfade. */
  materialState: CubeMaterial;
  /** 0..1 dwell within the current stage — used to ease the crossfade. */
  dwell: number;
}

/**
 * Billboarded logo plane mounted just in front of the cube. Always camera-facing.
 * Uses a small fragment shader to crossfade from grayscale (dirty) to color (clean).
 */
export function CubeLogoPlane({ logo, materialState, dwell }: Props) {
  const texture = useTexture(getLogoAssetUrl(logo));
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (!materialRef.current) return;
    // Color amount: 0 = grayscale, 1 = full color.
    let color = 0;
    if (materialState === 'clean') color = 1;
    else if (materialState === 'transforming') color = Math.min(1, Math.max(0, dwell));
    materialRef.current.uniforms.uColor!.value = color;
  });

  return (
    <Billboard>
      <mesh
        ref={meshRef}
        position={[0, 0, 0.32]}
        onUpdate={(m) => {
          if (materialState === 'clean') m.layers.enable(BLOOM_LAYER);
          else m.layers.disable(BLOOM_LAYER);
        }}
      >
        <planeGeometry args={[0.72, 0.72]} />
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
              float alpha = tex.a * mix(0.75, 1.0, uColor);
              gl_FragColor = vec4(final, alpha);
            }
          `}
        />
      </mesh>
    </Billboard>
  );
}
