import { Color, DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';

/**
 * Bloom layer constant. Objects on this layer are processed by the selective
 * bloom pass in FactoryScene. Body geometry stays on layer 0 (default).
 */
export const BLOOM_LAYER = 1;

/** Brand palette tokens duplicated here as Three.js Colors. Mirrors spec § 3.2. */
export const COLORS = {
  neonPrimary: new Color('#2cc1eb'),
  neonSecondary: new Color('#dab6f3'),
  cveWarn: new Color('#ff4d6d'),
  cubeDirtyFrom: new Color('#2a1a4d'),
  cubeDirtyTo: new Color('#0d0a1f'),
  cubeCleanFrom: new Color('#dab6f3'),
  cubeCleanTo: new Color('#2cc1eb'),
  chamberWall: new Color('#0d0a1f'),
} as const;

export function makeChamberWallMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: COLORS.chamberWall,
    metalness: 0.2,
    roughness: 0.85,
    transparent: true,
    opacity: 0.18,
    side: DoubleSide,
  });
}

export function makeChamberEdgeMaterial(): MeshBasicMaterial {
  // toneMapped: false keeps the neon color saturated through R3F's ACES tone map,
  // so the bloom pass picks up a luminance bright enough to glow strongly.
  return new MeshBasicMaterial({ color: COLORS.neonPrimary, toneMapped: false });
}

export function makeCubeDirtyMaterial(): MeshPhysicalMaterial {
  // Dirty cube — dim purple body with subtle emissive purple glow so it reads
  // as "the artifact" not "a void". Emissive intensity is animated by Cube.tsx.
  return new MeshPhysicalMaterial({
    color: COLORS.cubeDirtyFrom,
    metalness: 0.3,
    roughness: 0.55,
    transparent: true,
    opacity: 0.85,
    emissive: COLORS.cubeDirtyFrom,
    emissiveIntensity: 0.45,
  });
}

export function makeCubeCleanMaterial(): MeshPhysicalMaterial {
  // Clean cube — glassy translucent cyan with strong emissive cyan glow so
  // it reads as "transformed" once it exits CleanCompile.
  return new MeshPhysicalMaterial({
    color: COLORS.cubeCleanTo,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.5,
    iridescence: 0.4,
    transparent: true,
    opacity: 0.9,
    emissive: COLORS.cubeCleanFrom,
    emissiveIntensity: 0.9,
  });
}

export function makeAgentMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: COLORS.neonSecondary,
    transparent: true,
    opacity: 0.9,
    toneMapped: false,
  });
}
