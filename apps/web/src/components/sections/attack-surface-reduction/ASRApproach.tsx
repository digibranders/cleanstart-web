import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Existing Workflows',
    desc: 'Fits existing development workflows.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-minimal.webp',
    imgAlt: 'Existing workflows icon',
  },
  {
    title: 'Existing Toolchains',
    desc: 'Works across modern CI/CD pipelines.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-bloat.webp',
    imgAlt: 'Existing toolchains icon',
  },
  {
    title: 'Existing Environments',
    desc: 'Cloud, on-premises, or regulated.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-deterministic.webp',
    imgAlt: 'Existing environments icon',
  },
  {
    title: 'Secure Defaults',
    desc: 'Hardened by default.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-secure.webp',
    imgAlt: 'Secure defaults icon',
  },
];

export function ASRApproach(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="ASRApproach"
      heading={
        <>
          {'Deploy '}
          <span className="cs-text-gradient-impact">Without Disruption</span>
        </>
      }
      cards={CARDS}
      theme="dark"
      showCornerGlows={false}
      showLeftGrid={false}
      showRightGrid={false}
    />
  );
}
