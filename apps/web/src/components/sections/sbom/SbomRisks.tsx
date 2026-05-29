import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Incomplete Visibility',
    desc: 'Missing packages and dependencies hide risk.',
    imgSrc: '/images/sbom/risk-icon-incomplete.png',
    imgAlt: 'Incomplete Visibility icon',
  },
  {
    title: 'Broken Traceability',
    desc: 'Disconnected inventories weaken provenance tracking.',
    imgSrc: '/images/sbom/risk-icon-traceability.png',
    imgAlt: 'Broken Traceability icon',
  },
  {
    title: 'Stale Data',
    desc: 'Static SBOMs quickly become outdated.',
    imgSrc: '/images/sbom/risk-icon-stale.png',
    imgAlt: 'Stale Data icon',
  },
  {
    title: 'Compliance Exposure',
    desc: 'Incomplete inventories increase audit complexity.',
    imgSrc: '/images/sbom/risk-icon-compliance.png',
    imgAlt: 'Compliance Exposure icon',
  },
];

export function SbomRisks(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="SbomRisks"
      heading={
        <>
          <span className="block">Static SBOMs Create</span>
          <span className="block">
            {'Blind '}
            <span className="cs-text-gradient-impact">Spots</span>
          </span>
        </>
      }
      cards={CARDS}
      showCornerGlows={false}
      showLeftGrid={false}
    />
  );
}
