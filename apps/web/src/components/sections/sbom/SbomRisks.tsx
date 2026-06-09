import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Incomplete Visibility',
    desc: 'Missing packages and dependencies hide risk.',
    imgSrc: '/images/sbom/risk-icon-incomplete.webp',
    imgAlt: 'Incomplete Visibility icon',
  },
  {
    title: 'Broken Traceability',
    desc: 'Disconnected inventories weaken provenance and software integrity.',
    imgSrc: '/images/sbom/risk-icon-traceability.webp',
    imgAlt: 'Broken Traceability icon',
  },
  {
    title: 'Stale Data',
    desc: 'Static SBOMs quickly become outdated.',
    imgSrc: '/images/sbom/risk-icon-stale.webp',
    imgAlt: 'Stale Data icon',
  },
  {
    title: 'Governance Gaps',
    desc: 'Incomplete inventories increase audit complexity.',
    imgSrc: '/images/sbom/risk-icon-compliance.webp',
    imgAlt: 'Governance Gaps icon',
  },
];

export function SbomRisks(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="SbomRisks"
      heading={
        <>
          <span className="block">Static SBOMs Create</span>
          <span className="cs-text-gradient-impact block">Blind Spots</span>
        </>
      }
      cards={CARDS}
      showCornerGlows={false}
      showLeftGrid={false}
    />
  );
}
