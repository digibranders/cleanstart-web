import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

/*
 * The visual and layout shell lives in the shared WhyMattersGrid; this file
 * only owns the page-specific copy and per-card illustration positioning.
 */

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Up to 80% Smaller Images',
    desc: 'Reduce unnecessary software components and dependencies.',
    imgSrc: '/images/cleanstart-images/uvp-icon-smaller-images.webp',
    imgAlt: '3D icon representing image size reduction',
    imgStyle: { left: '8.15%', top: '-2.03%', width: '86.53%', height: '104.52%' },
  },
  {
    title: 'Lower Memory Consumption',
    desc: 'Improve infrastructure efficiency and resource utilization.',
    imgSrc: '/images/cleanstart-images/uvp-icon-memory.webp',
    imgAlt: '3D cloud icon representing memory efficiency',
    imgStyle: { left: '9.12%', top: '-0.71%', width: '83.45%', height: '100.71%' },
  },
  {
    title: 'Faster Pull Times',
    desc: 'Accelerate deployments and scaling across environments.',
    imgSrc: '/images/cleanstart-images/uvp-icon-pull-times.webp',
    imgAlt: '3D box icon representing faster container pull times',
    imgStyle: { left: '8.45%', top: '-8.18%', width: '87.16%', height: '117.27%' },
  },
  {
    title: 'Reduced Inherited Exposure',
    desc: 'Fewer inherited vulnerabilities and unnecessary dependencies.',
    imgSrc: '/images/cleanstart-images/uvp-icon-attack-surface.webp',
    imgAlt: '3D shield icon representing reduced inherited exposure',
    imgStyle: { left: '15.93%', top: '1.36%', width: '72.54%', height: '96.83%' },
  },
];

export function CleanStartImagesUVP(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="CleanStartImagesPerformance"
      heading={
        <>
          {'Minimal Foundations. '}
          <span className="cs-text-gradient-impact">Reduced Inherited Risk.</span>
        </>
      }
      cards={CARDS}
    />
  );
}
