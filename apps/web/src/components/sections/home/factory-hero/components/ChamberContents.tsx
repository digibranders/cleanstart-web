'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useLoopPhase } from '../hooks/useLoopPhase';
import { getCveSummaryFor, getLogoForCube } from '../lib/logoPool';
import type { CubePhase } from '../lib/timeline';
import { BuildLattice } from './data-viz/BuildLattice';
import { DepGraph } from './data-viz/DepGraph';
import { ManifestCard } from './data-viz/ManifestCard';
import { SbomTicker } from './data-viz/SbomTicker';

interface Props {
  /** 0..3 — which chamber this content belongs to. */
  chamberIndex: 0 | 1 | 2 | 3;
}

/**
 * Drives the data-viz inside one chamber based on whichever cube (A or B) is
 * currently passing through. Both cube phase refs are sampled per frame.
 */
export function ChamberContents({ chamberIndex }: Props) {
  const phaseA = useLoopPhase(0);
  const phaseB = useLoopPhase(5.0);
  const localRef = useRef({ progress: 0, summary: getCveSummaryFor(getLogoForCube(0)) });

  useFrame(() => {
    const inChamber = (p: CubePhase): number => {
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
    };
    const a = inChamber(phaseA.current);
    const b = inChamber(phaseB.current);
    localRef.current.progress = Math.max(a, b);
    if (a > b) localRef.current.summary = getCveSummaryFor(getLogoForCube(0));
    else if (b > 0) localRef.current.summary = getCveSummaryFor(getLogoForCube(1));
  });

  switch (chamberIndex) {
    case 0:
      return (
        <ManifestCard
          position={[0, 0.6, 0.4]}
          summary={localRef.current.summary}
          visibility={localRef.current.progress}
        />
      );
    case 1:
      return <DepGraph position={[0, 0, 0.2]} progress={localRef.current.progress} />;
    case 2:
      return <BuildLattice position={[0, 0, 0]} progress={localRef.current.progress} />;
    case 3:
      return <SbomTicker position={[0.4, 0.3, 0.3]} progress={localRef.current.progress} />;
  }
}
