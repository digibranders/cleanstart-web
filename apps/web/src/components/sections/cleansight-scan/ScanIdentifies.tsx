import Image from 'next/image';
import {
  Boxes,
  Network,
  PackageSearch,
  Route,
  Scale,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

import { Container, Section } from '@/components/layout';
import { Reveal, RevealItem, RevealStagger } from '@/components/ui/Reveal';

interface Capability {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const INVENTORY: Capability = {
  icon: Boxes,
  title: 'Container inventory',
  desc: 'Every image and running container across your clusters, in one view.',
};

const SMALL: readonly Capability[] = [
  {
    icon: ShieldAlert,
    title: 'Inherited vulnerabilities',
    desc: 'CVEs that arrived with base images and packages, ranked with runtime context.',
  },
  {
    icon: Network,
    title: 'Dependencies',
    desc: 'The open source packages inside each image, down to the version.',
  },
  {
    icon: PackageSearch,
    title: 'Unsupported images',
    desc: 'Images that no longer receive upstream security fixes.',
  },
  {
    icon: Scale,
    title: 'License exposure',
    desc: 'Package licenses that may create legal or compliance risk.',
  },
];

const REMEDIATION: Capability = {
  icon: Route,
  title: 'Remediation paths',
  desc: 'Specific, prioritized steps to remove the risk, including a trusted replacement image where one exists.',
};

const tileBase = 'relative overflow-hidden rounded-[20px] p-6 sm:p-7';

function IconBadge({
  icon: Icon,
  onDark = false,
}: { icon: LucideIcon; onDark?: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="inline-flex h-11 w-11 items-center justify-center rounded-[12px]"
      style={{
        background: onDark ? 'rgba(255,255,255,0.12)' : 'rgba(71,30,192,0.08)',
        color: onDark ? '#ffffff' : '#471EC0',
      }}
    >
      <Icon size={22} strokeWidth={1.75} />
    </span>
  );
}

export function ScanIdentifies(): React.ReactElement {
  return (
    <Section padding="lg" data-section="ScanIdentifies" className="bg-white">
      <Container>
        <Reveal header className="max-w-[760px]">
          <p
            className="text-[#111111]"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-lead-sm)',
              letterSpacing: '-0.02em',
              lineHeight: 1.5,
              opacity: 0.8,
              textWrap: 'pretty',
            }}
          >
            Containers don&apos;t get built from scratch, they inherit layers of open source
            packages, base images, and dependencies. Most organizations have no clear view into what
            vulnerabilities came along for the ride, where they&apos;re running, or who&apos;s
            responsible for fixing them.
          </p>
          <h2
            className="mt-10 text-[#0F123E]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h2)',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 'var(--fs-h2-lh)',
              textWrap: 'balance',
            }}
          >
            What CleanSight <span className="cs-text-gradient-impact">identifies</span>
          </h2>
        </Reveal>

        <RevealStagger
          gap={0.07}
          className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-5"
        >
          <RevealItem className="md:col-span-2 lg:row-span-2">
            <div
              className={`${tileBase} flex h-full min-h-[360px] flex-col justify-between`}
              style={{
                background: 'linear-gradient(160deg, #151021 0%, #10123E 45%, #1E2BA8 100%)',
                color: '#ffffff',
              }}
            >
              <div className="relative z-10 max-w-[360px]">
                <IconBadge icon={INVENTORY.icon} onDark />
                <h3
                  className="mt-4"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 'var(--fs-h3-lh)',
                  }}
                >
                  {INVENTORY.title}
                </h3>
                <p
                  className="mt-2"
                  style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, opacity: 0.8 }}
                >
                  {INVENTORY.desc}
                </p>
              </div>
              <div className="relative -mb-7 mt-8 -mr-7 self-end sm:-mr-8">
                <Image
                  src="/images/cleansight/cs-stack-scan.webp"
                  alt="CleanSight scan results listing the images discovered across a cluster"
                  width={1800}
                  height={1375}
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="block h-auto w-full max-w-[560px] rounded-tl-[16px]"
                  style={{ border: '1px solid rgba(255,255,255,0.14)' }}
                />
              </div>
            </div>
          </RevealItem>

          {SMALL.map(({ icon, title, desc }) => (
            <RevealItem key={title}>
              <div
                className={`${tileBase} flex h-full min-h-[200px] flex-col justify-between gap-8`}
                style={{
                  background: 'linear-gradient(180deg, #F7F5FF 0%, #F0EDFF 100%)',
                  border: '1px solid rgba(71,30,192,0.12)',
                }}
              >
                <IconBadge icon={icon} />
                <div>
                  <h3
                    className="text-[#0F123E]"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-h5)',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 'var(--fs-h5-lh)',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-2 text-[#111111]"
                    style={{ fontSize: 'var(--fs-body-sm)', lineHeight: 1.55, opacity: 0.75 }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            </RevealItem>
          ))}

          <RevealItem className="md:col-span-2 lg:col-span-4">
            <div
              className={`${tileBase} flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6`}
              style={{
                background: 'linear-gradient(100deg, #471EC0 0%, #2F49E5 60%, #2CC1EB 130%)',
                color: '#ffffff',
              }}
            >
              <IconBadge icon={REMEDIATION.icon} onDark />
              <div className="sm:flex sm:flex-1 sm:items-center sm:justify-between sm:gap-10">
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-h3)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 'var(--fs-h3-lh)',
                  }}
                >
                  {REMEDIATION.title}
                </h3>
                <p
                  className="mt-2 max-w-[520px] sm:mt-0"
                  style={{ fontSize: 'var(--fs-body)', lineHeight: 1.5, opacity: 0.88 }}
                >
                  {REMEDIATION.desc}
                </p>
              </div>
            </div>
          </RevealItem>
        </RevealStagger>
      </Container>
    </Section>
  );
}
