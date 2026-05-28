'use client';

import { useLoopPhase } from '../hooks/useLoopPhase';
import { getCveSummaryFor, getLogoForCube } from '../lib/logoPool';
import { BuildLattice } from './data-viz/BuildLattice';
import { DepGraph } from './data-viz/DepGraph';
import { ManifestCard } from './data-viz/ManifestCard';
import { SbomTicker } from './data-viz/SbomTicker';

interface Props {
  /** 0..3 — which chamber this content belongs to. */
  chamberIndex: 0 | 1 | 2 | 3;
}

/**
 * Mounts the right per-chamber data-viz component and hands it the two
 * cube phase refs so it can sample which cube is currently dwelling and
 * drive its own per-frame visuals without forcing a React re-render.
 */
export function ChamberContents({ chamberIndex }: Props) {
  const phaseA = useLoopPhase(0);
  const phaseB = useLoopPhase(5.0);
  // Static summaries — could become props per cube generation later.
  const summaryA = getCveSummaryFor(getLogoForCube(0));
  const summaryB = getCveSummaryFor(getLogoForCube(1));

  switch (chamberIndex) {
    case 0:
      return (
        <ManifestCard
          position={[0, 0.6, 0.4]}
          chamberIndex={chamberIndex}
          phaseA={phaseA}
          phaseB={phaseB}
          summaryA={summaryA}
          summaryB={summaryB}
        />
      );
    case 1:
      return (
        <DepGraph
          position={[0, 0, 0.2]}
          chamberIndex={chamberIndex}
          phaseA={phaseA}
          phaseB={phaseB}
        />
      );
    case 2:
      return (
        <BuildLattice
          position={[0, 0, 0]}
          chamberIndex={chamberIndex}
          phaseA={phaseA}
          phaseB={phaseB}
        />
      );
    case 3:
      return (
        <SbomTicker
          position={[0.4, 0.3, 0.3]}
          chamberIndex={chamberIndex}
          phaseA={phaseA}
          phaseB={phaseB}
        />
      );
  }
}
