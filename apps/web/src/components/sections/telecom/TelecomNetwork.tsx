import type React from 'react';
import Image from 'next/image';
import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';
import { H2_STYLE } from './type';

/*
 * "Modern Telecom Networks Need More": the four surfaces a network now runs on,
 * strung along one signal backbone. A light pulse travels the rail left to
 * right and each node pings as it passes, so the section reads as one network
 * rather than four unrelated tiles. Pulse and pings are CSS (globals.css,
 * `cs-tel-*`), transform/opacity only, and hidden under reduced motion; the
 * static rail stays.
 *
 * Ping delays are where the pulse crosses each node: the pulse spot travels
 * from -10% to 110% of the rail over 4.8s at linear timing, and the nodes sit
 * at 12.5/37.5/62.5/87.5%, so (p + 0.1) / 1.2 * 4.8s = 0.9, 1.9, 2.9, 3.9s.
 *
 * Below lg the rail is dropped and the four stack two-up: a backbone that
 * wraps onto two lines reads as two networks.
 *
 * Copy is the brief's, except the Network Functions line, where "telecom" is
 * dropped so the text sets on two lines like the other three.
 */

interface Surface {
  icon: string;
  iconAlt: string;
  title: string;
  body: string;
  pingDelay: string;
}

const SURFACES: readonly [Surface, Surface, Surface, Surface] = [
  {
    icon: '/images/telecom/icon-cloud-native.webp',
    iconAlt: '3D violet cloud with a network node',
    title: 'Cloud-Native Networks',
    body: 'Software-defined networks across cloud and edge environments.',
    pingDelay: '0.9s',
  },
  {
    icon: '/images/telecom/icon-network-functions.webp',
    iconAlt: '3D cluster of stacked violet server modules',
    title: 'Network Functions',
    body: 'Modern network services operate across distributed environments.',
    pingDelay: '1.9s',
  },
  {
    icon: '/images/telecom/icon-open-source.webp',
    iconAlt: '3D violet code brackets on a rounded tile',
    title: 'Open Source Components',
    body: 'Libraries and dependencies powering telecom applications.',
    pingDelay: '2.9s',
  },
  {
    icon: '/images/telecom/icon-distributed.webp',
    iconAlt: '3D violet radio mast broadcasting signal waves',
    title: 'Distributed Infrastructure',
    body: 'Complex, multi-vendor environments requiring consistent security.',
    pingDelay: '3.9s',
  },
];

/** The node a surface hangs from: a ringed dot on the rail, pinging as the pulse crosses it. */
function RailNode({ pingDelay }: { pingDelay: string }): React.ReactElement {
  return (
    <span aria-hidden className="relative hidden h-4 w-4 items-center justify-center lg:flex">
      <span
        className="cs-tel-ping absolute inset-[-10px] rounded-full"
        style={{ border: '1.5px solid rgba(124,79,240,0.55)', animationDelay: pingDelay }}
      />
      <span
        className="relative h-4 w-4 rounded-full"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid rgba(124,79,240,0.55)',
          boxShadow: '0 0 0 4px rgba(154,81,255,0.08)',
        }}
      />
      <span className="absolute h-1.5 w-1.5 rounded-full" style={{ background: '#7C4FF0' }} />
    </span>
  );
}

export function TelecomNetwork(): React.ReactElement {
  return (
    <Section data-section="TelecomNetwork" className="overflow-hidden bg-white">
      <Container>
        <Reveal header className="mx-auto max-w-[820px] text-center">
          <h2 style={{ ...H2_STYLE, color: '#111111' }}>
            Modern Telecom Networks <span className="cs-text-gradient-impact">Need More</span>
          </h2>
        </Reveal>

        <div className="relative mx-auto max-w-[1200px]" style={{ marginTop: 'clamp(40px, 4.4vw, 64px)' }}>
          {/* The backbone. Its top matches the node row below: icon stage
              height plus half a node. Fades out at both ends so it reads as
              a link that continues past the frame, not a bar with caps. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 hidden overflow-hidden lg:block"
            style={{ top: 'calc(clamp(132px, 10.4vw, 150px) + 7px)', height: '2px' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(154,81,255,0) 0%, rgba(154,81,255,0.28) 10%, rgba(44,193,235,0.28) 90%, rgba(44,193,235,0) 100%)',
              }}
            />
            <div
              className="cs-tel-signal absolute inset-0"
              style={{
                background:
                  'radial-gradient(closest-side, rgba(124,79,240,0.95), rgba(44,193,235,0.5) 45%, rgba(44,193,235,0) 100%)',
                backgroundSize: '220px 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </div>

          <RevealStagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            style={{ columnGap: 'clamp(20px, 2.4vw, 36px)', rowGap: 'clamp(40px, 5vw, 56px)' }}
          >
            {SURFACES.map((s, i) => (
              <RevealItem key={s.title} className="flex flex-col items-center text-center">
                <div
                  className="group relative flex w-full items-end justify-center"
                  style={{ height: 'clamp(132px, 10.4vw, 150px)' }}
                >
                  <span
                    aria-hidden
                    className="absolute bottom-2 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full transition-transform duration-500 group-hover:scale-125"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(154,81,255,0.22) 0%, rgba(154,81,255,0) 74%)',
                      filter: 'blur(6px)',
                    }}
                  />
                  <Image
                    src={s.icon}
                    alt={s.iconAlt}
                    width={240}
                    height={240}
                    sizes="140px"
                    priority={i === 0}
                    className="relative object-contain transition-transform duration-300 group-hover:-translate-y-1"
                    style={{
                      width: 'auto',
                      height: 'clamp(116px, 9.4vw, 136px)',
                      filter: 'drop-shadow(0 12px 18px rgba(40,20,90,0.12))',
                    }}
                  />
                </div>

                <RailNode pingDelay={s.pingDelay} />

                <h3
                  style={{
                    marginTop: 'clamp(16px, 1.6vw, 24px)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h5)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.25,
                    color: '#111111',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    marginTop: '8px',
                    maxWidth: '30ch',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--fs-body-sm)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.55,
                    color: 'rgba(17,17,17,0.66)',
                  }}
                >
                  {s.body}
                </p>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Container>
    </Section>
  );
}
