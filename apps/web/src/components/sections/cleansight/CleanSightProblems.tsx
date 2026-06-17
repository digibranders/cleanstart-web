import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Software Sprawl',
    desc: 'Modern environments inherit thousands of software components across images, dependencies, and registries.',
    imgSrc: '/images/cleansight/problem-shadow-containers.webp',
    imgAlt: 'Software sprawl illustration',
  },
  {
    title: 'Fragmented Visibility',
    desc: 'Disconnected tooling creates operational blind spots across software delivery environments.',
    imgSrc: '/images/cleansight/problem-fragmented-views.webp',
    imgAlt: 'Fragmented visibility illustration',
  },
  {
    title: 'Unverified Dependencies',
    desc: 'Limited dependency visibility increases inherited software risk across modern infrastructure.',
    imgSrc: '/images/cleansight/problem-unknown-image.webp',
    imgAlt: 'Unverified dependencies illustration',
  },
  {
    title: 'Continuous Compliance Pressure',
    desc: 'Incomplete software inventories increase audit complexity across regulated environments.',
    imgSrc: '/images/cleansight/problem-audit-complexity.webp',
    imgAlt: 'Continuous compliance pressure illustration',
  },
];

export function CleanSightProblems(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="CleanSightProblems"
      heading={
        <>
          <span className="block">When Visibility Alone</span>
          <span className="block">
            {'Isn’t '}
            <span className="cs-text-gradient-impact">Enough</span>
          </span>
        </>
      }
      cards={CARDS}
      showCornerGlows={false}
    />
  );
}
