import { Color, MeshBasicMaterial, MeshPhysicalMaterial } from 'three';

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
    opacity: 0.6,
  });
}

export function makeChamberEdgeMaterial(): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: COLORS.neonPrimary });
  return m;
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
  });
}

export function makeAgentMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: COLORS.neonSecondary,
    transparent: true,
    opacity: 0.75,
  });
}
