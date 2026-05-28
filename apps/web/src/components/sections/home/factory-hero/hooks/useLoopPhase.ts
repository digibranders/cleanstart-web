import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { getCubePhase, LOOP_SECONDS, type CubePhase } from '../lib/timeline';

/**
 * Tracks elapsed time at 60fps inside an R3F scene and returns a ref to the
 * latest CubePhase for the given offset. Use a ref (not state) — we update
 * every frame and do not want re-renders.
 */
export function useLoopPhase(offset: number = 0): MutableRefObject<CubePhase> {
  const phaseRef = useRef<CubePhase>(getCubePhase(0, offset));

  useFrame(({ clock }) => {
    const t = clock.elapsedTime % LOOP_SECONDS;
    phaseRef.current = getCubePhase(t, offset);
  });

  return phaseRef;
}
