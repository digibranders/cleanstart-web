import { BoxGeometry } from 'three';

/**
 * The artifact cube. Spec § 3.4: chamfered cube, 0.6 units. We use a plain
 * BoxGeometry for v1; the chamfered edges come from the wireframe edge pass
 * mounted as a child <LineSegments> in Cube.tsx.
 */
export function buildCubeGeometry(): BoxGeometry {
  return new BoxGeometry(0.6, 0.6, 0.6);
}

/**
 * Agent body geometry. Spec § 3.5: small rounded-box.
 * Bumped from spec 0.22 to 0.34 so agents read as recognizable elements at
 * desktop camera distance. Spec called for "small geometric worker", not
 * "invisible dot" — this restores the design-intent silhouette.
 */
export function buildAgentGeometry(): BoxGeometry {
  return new BoxGeometry(0.34, 0.34, 0.22);
}
