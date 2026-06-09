import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Shadow Containers',
    desc: 'Untracked workloads increase exposure.',
    imgSrc: '/images/cleansight/problem-shadow-containers.webp',
    imgAlt: 'Shadow container illustration',
  },
  {
    title: 'Fragmented Views',
    desc: 'Disconnected tools create operational gaps.',
    imgSrc: '/images/cleansight/problem-fragmented-views.webp',
    imgAlt: 'Fragmented views illustration',
  },
  {
    title: 'Unknown Image Contents',
    desc: 'Inherited dependencies hide risk.',
    imgSrc: '/images/cleansight/problem-unknown-image.webp',
    imgAlt: 'Unknown image contents illustration',
  },
  {
    title: 'Audit Complexity',
    desc: 'Incomplete visibility slows compliance efforts.',
    imgSrc: '/images/cleansight/problem-audit-complexity.webp',
    imgAlt: 'Audit complexity illustration',
  },
];

export function CleanSightProblems(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="CleanSightProblems"
      heading={
        <>
          <span className="block">When Container Visibility</span>
          <span className="block">
            {'Falls Short, '}
            <span className="cs-text-gradient-impact">Risk Grows</span>
          </span>
        </>
      }
      subheading="And remediation falls even further behind"
      cards={CARDS}
      showCornerGlows={false}
    />
  );
}
