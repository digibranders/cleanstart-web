import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

/*
 * The visual and layout shell lives in the shared WhyMattersGrid; this file
 * only owns the page-specific copy and per-card illustration positioning.
 */

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Up to 80% Smaller Images',
    desc: 'Reduce unnecessary runtime components',
    imgSrc: '/images/cleanstart-images/uvp-icon-smaller-images.png',
    imgAlt: '3D icon representing image size reduction',
    imgStyle: { left: '8.15%', top: '-2.03%', width: '86.53%', height: '104.52%' },
  },
  {
    title: 'Lower Memory Consumption',
    desc: 'Improve runtime efficiency.',
    imgSrc: '/images/cleanstart-images/uvp-icon-memory.png',
    imgAlt: '3D cloud icon representing memory efficiency',
    imgStyle: { left: '9.12%', top: '-0.71%', width: '83.45%', height: '100.71%' },
  },
  {
    title: 'Faster Pull Times',
    desc: 'Accelerate deployments and scaling.',
    imgSrc: '/images/cleanstart-images/uvp-icon-pull-times.png',
    imgAlt: '3D box icon representing faster container pull times',
    imgStyle: { left: '8.45%', top: '-8.18%', width: '87.16%', height: '117.27%' },
  },
  {
    title: 'Reduced Attack Surface',
    desc: 'Fewer inherited vulnerabilities and dependencies.',
    imgSrc: '/images/cleanstart-images/uvp-icon-attack-surface.png',
    imgAlt: '3D shield icon representing a reduced attack surface',
    imgStyle: { left: '15.93%', top: '1.36%', width: '72.54%', height: '96.83%' },
  },
];

export function CleanStartImagesUVP(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="CleanStartImagesPerformance"
      heading={
        <>
          {'Smaller Images. Lower '}
          <span className="cs-text-gradient-impact">Risk.</span>
        </>
      }
      subheading="And remediation falls even further behind"
      cards={CARDS}
    />
  );
}
