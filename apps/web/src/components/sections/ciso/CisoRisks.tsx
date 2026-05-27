import type React from 'react';
import { WhyMattersGrid, type WhyCard } from '../_shared/WhyMattersGrid';

/*
 * "Most Container Risk Is Inherited" — uses the shared WhyMattersGrid layout
 * (for-developers "Why Does It Matter" pattern).
 */

const CARDS: readonly [WhyCard, WhyCard, WhyCard, WhyCard] = [
  {
    title: 'Bloated Public Images',
    desc: 'Unnecessary packages increase exposure.',
    imgSrc: '/images/ciso/risks-icon-bloated.png',
    imgAlt: 'Bloated public images icon',
    imgStyle: { left: '8.15%', top: '-2.03%', width: '86.53%', height: '104.52%' },
  },
  {
    title: 'Inherited Vulnerabilities',
    desc: 'Most container risk originates upstream',
    imgSrc: '/images/ciso/risks-icon-inherited.png',
    imgAlt: 'Inherited vulnerabilities icon',
    imgStyle: { left: '9.12%', top: '-0.71%', width: '83.45%', height: '100.71%' },
  },
  {
    title: 'Expanding Attack Surface',
    desc: 'Large dependency trees increase operational complexity.',
    imgSrc: '/images/ciso/risks-icon-attack.png',
    imgAlt: 'Expanding attack surface icon',
    imgStyle: { left: '8.45%', top: '-8.18%', width: '87.16%', height: '117.27%' },
  },
  {
    title: 'Remediation Backlogs',
    desc: 'Security teams spend time triaging inherited risk.',
    imgSrc: '/images/ciso/risks-icon-backlogs.png',
    imgAlt: 'Remediation backlogs icon',
    imgStyle: { left: '15.93%', top: '1.36%', width: '72.54%', height: '96.83%' },
  },
];

export function CisoRisks(): React.ReactElement {
  return (
    <WhyMattersGrid
      dataSection="CisoRisks"
      heading="Most Container Risk Is Inherited"
      cards={CARDS}
    />
  );
}
