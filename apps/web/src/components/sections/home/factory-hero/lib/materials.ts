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
  return new MeshPhysicalMaterial({
    color: COLORS.cubeDirtyFrom,
    metalness: 0.4,
    roughness: 0.6,
  });
}

export function makeCubeCleanMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: COLORS.cubeCleanTo,
    metalness: 0.1,
    roughness: 0.2,
    transmission: 0.5,
    iridescence: 0.3,
    transparent: true,
    emissive: COLORS.cubeCleanFrom,
    emissiveIntensity: 0.4,
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
