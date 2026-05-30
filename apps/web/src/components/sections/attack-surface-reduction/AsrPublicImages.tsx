import { Reveal } from '@/components/ui/Reveal';

/**
 * Public images are bloated — a shipping-container illustration centred with
 * four problem cards at the corners, joined by dashed connector lines.
 */
const CARDS: Array<{
  pos: 'tl' | 'tr' | 'bl' | 'br';
  title: string;
  description: string;
}> = [
  {
    pos: 'tl',
    title: 'Inherited Vulnerabilities',
    description: 'Unused packages increase exposure.',
  },
  {
    pos: 'tr',
    title: 'Too Many Components',
    description: 'Larger images expand attack paths.',
  },
  {
    pos: 'bl',
    title: 'Oversized SBOMs',
    description: 'More dependencies create more noise.',
  },
  {
    pos: 'br',
    title: 'Constant Patching',
    description: 'More packages require more fixes.',
  },
];

export function AsrPublicImages(): React.ReactElement {
  return (
    <section data-section="AsrPublicImages" className="relative overflow-hidden">
      {/* White-glow band at the top edge for the section transition. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '120px',
          background:
            'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md">
        <Reveal header>
          <h2
            className="text-center text-[#111111]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 600,
              letterSpacing: 'var(--text-t-display-2-ls)',
              lineHeight: 'var(--text-t-display-2-lh)',
              marginBottom: '48px',
            }}
          >
            Public images are{' '}
            <span
              style={{
                background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              bloated
            </span>
          </h2>
        </Reveal>
      </div>

      {/* Desktop diagram: container centre, 4 corner cards, dashed lines. */}
      <div className="hidden md:block relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pb-section-md">
        <div className="relative" style={{ aspectRatio: '1276 / 540' }}>
          {/* Soft red radial glow under the container */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '560px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,76,76,0.28) 0%, rgba(255,76,76,0) 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Dashed connector lines from card corners to container corners. */}
          <svg
            aria-hidden
            className="absolute pointer-events-none"
            viewBox="0 0 1260 540"
            preserveAspectRatio="xMidYMid meet"
            style={{ inset: 0, width: '100%', height: '100%' }}
          >
            {/* TL card → container TL */}
            <path
              d="M 303 83 L 405 83 L 405 200 L 470 200"
              stroke="rgba(255, 76, 76, 0.55)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              fill="none"
            />
            {/* TR card → container TR */}
            <path
              d="M 957 83 L 855 83 L 855 200 L 790 200"
              stroke="rgba(255, 76, 76, 0.55)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              fill="none"
            />
            {/* BL card → container BL */}
            <path
              d="M 326 367 L 425 367 L 425 340 L 470 340"
              stroke="rgba(255, 76, 76, 0.55)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              fill="none"
            />
            {/* BR card → container BR */}
            <path
              d="M 924 367 L 835 367 L 835 340 L 790 340"
              stroke="rgba(255, 76, 76, 0.55)"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              fill="none"
            />
          </svg>

          {/* Container illustration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/attack-surface-reduction/bloated-container2.png"
            alt=""
            className="absolute pointer-events-none select-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '560px',
              height: 'auto',
              maxWidth: 'none',
              zIndex: 1,
            }}
            loading="lazy"
            decoding="async"
          />

          {/* 4 cards at corner positions. */}
          {CARDS.map((card) => {
            const positionStyle: React.CSSProperties = {
              tl: { left: 0, top: 0 },
              tr: { right: 0, top: 0 },
              bl: { left: '1.8%', bottom: 0 },
              br: { right: '2.6%', bottom: 0 },
            }[card.pos];
            return (
              <div key={card.title} className="absolute" style={{ ...positionStyle, zIndex: 2 }}>
                <BloatedCard title={card.title} description={card.description} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: container then stacked cards. */}
      <div className="md:hidden mx-auto px-5 pb-12 flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/attack-surface-reduction/bloated-container2.png"
          alt=""
          className="pointer-events-none select-none"
          style={{ width: 'min(320px, 90%)', height: 'auto' }}
          loading="lazy"
          decoding="async"
        />
        {CARDS.map((card) => (
          <BloatedCard key={card.title} title={card.title} description={card.description} />
        ))}
      </div>
    </section>
  );
}

interface BloatedCardProps {
  title: string;
  description: string;
}

function BloatedCard({ title, description }: BloatedCardProps): React.ReactElement {
  return (
    <div className="relative" style={{ width: 'clamp(240px, 24vw, 303px)', maxWidth: '100%' }}>
      {/* Outer red→white border halo. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: '20px',
          background:
            'linear-gradient(135deg, rgba(255,76,76,0.45) 0%, rgba(255,255,255,0.0) 100%), #FFFFFF',
          opacity: 0.85,
        }}
      />
      {/* White inner card — 8px inset from the halo. */}
      <div
        className="relative bg-white flex items-center gap-3"
        style={{
          margin: '8px',
          padding: '16px 18px',
          borderRadius: '16px',
          minHeight: '150px',
          boxShadow:
            '0px 4px 4px 0px rgba(22,34,51,0.04), 0px 4px 24px 0px rgba(22,34,51,0.04), 0px 24px 24px 0px rgba(22,34,51,0.04), 0px 32px 32px 0px rgba(22,34,51,0.04), 0px 64px 64px 0px rgba(22,34,51,0.12), 0px 120px 120px 0px rgba(22,34,51,0.08)',
        }}
      >
        {/* Red shield icon box. */}
        <div
          className="relative shrink-0 self-start"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF4C4C 0%, #FF8A8A 100%)',
            boxShadow: '0 4px 8px -2px rgba(255,76,76,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <path
              d="M12 2L3.5 5v7c0 5 3.5 9.5 8.5 11 5-1.5 8.5-6 8.5-11V5L12 2z"
              stroke="white"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="none"
            />
            <path d="M12 8v4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="15" r="1" fill="white" />
          </svg>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p
            className="text-[#111111]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h5)',
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
            }}
          >
            {title}
          </p>
          <p
            className="text-[#444444]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-caption)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.35,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
