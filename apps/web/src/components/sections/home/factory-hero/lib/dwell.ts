import type { CubePhase } from './timeline';

/** Returns 0..1 dwell if cube `p` is currently inside chamber N, else 0. */
export function chamberDwell(p: CubePhase, chamberIndex: 0 | 1 | 2 | 3): number {
  switch (chamberIndex) {
    case 0:
      return p.stage === 'ch1' ? p.dwell : 0;
    case 1:
      return p.stage === 'ch2' ? p.dwell : 0;
    case 2:
      return p.stage === 'ch3-cleancompile' || p.stage === 'ch3-enter' || p.stage === 'ch3-exit'
        ? p.dwell
        : 0;
    case 3:
      return p.stage === 'ch4' ? p.dwell : 0;
  }
}
