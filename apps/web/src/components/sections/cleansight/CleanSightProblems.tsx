import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Software Sprawl',
    desc: 'Modern environments accumulate software across images, dependencies, and registries.',
    imgSrc: '/images/cleansight/problem-shadow-containers.webp',
    imgAlt: 'Software sprawl illustration',
  },
  {
    title: 'Fragmented Visibility',
    desc: 'Disconnected tooling creates visibility gaps across software delivery environments.',
    imgSrc: '/images/cleansight/problem-fragmented-views.webp',
    imgAlt: 'Fragmented visibility illustration',
  },
  {
    title: 'Unverified Dependencies',
    desc: 'Unverified dependencies increase inherited software risk across modern environments.',
    imgSrc: '/images/cleansight/problem-unknown-image.webp',
    imgAlt: 'Unverified dependencies illustration',
  },
  {
    title: 'Compliance Pressure',
    desc: 'Incomplete software inventories increase compliance and audit complexity.',
    imgSrc: '/images/cleansight/problem-audit-complexity.webp',
    imgAlt: 'Compliance pressure illustration',
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
