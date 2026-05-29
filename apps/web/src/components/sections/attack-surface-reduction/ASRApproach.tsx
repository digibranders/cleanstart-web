import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Minimal Foundations',
    desc: 'Only required runtime components',
    imgSrc: '/images/attack-surface-reduction/approach-icon-minimal.png',
    imgAlt: 'Minimal foundations icon',
  },
  {
    title: 'Bloat Removed',
    desc: 'No shells or unused tooling.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-bloat.png',
    imgAlt: 'Bloat removed icon',
  },
  {
    title: 'Deterministic Builds',
    desc: 'Reproducible and verifiable.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-deterministic.png',
    imgAlt: 'Deterministic builds icon',
  },
  {
    title: 'Secure Defaults',
    desc: 'Hardened by default.',
    imgSrc: '/images/attack-surface-reduction/approach-icon-secure.png',
    imgAlt: 'Secure defaults icon',
  },
];

export function ASRApproach(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="ASRApproach"
      heading={
        <>
          {'The CleanStart '}
          <span className="cs-text-gradient-impact">Approach</span>
        </>
      }
      cards={CARDS}
      showCornerGlows={false}
      showLeftGrid={false}
      showRightGrid={false}
      showBottomLeftGrid
      flushBg
    />
  );
}
