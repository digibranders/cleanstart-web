import type React from 'react';

/*
 * Figma node 732-412 — "Designed for Developer Workflows" section
 *
 * Background: white
 * Heading: ~62px Manrope Bold, #111, tracking -0.05em, centered
 *   "Developer Workflows" → purple→cyan gradient
 * 5-step pipeline visualization:
 *   - Horizontal row of numbered circles (64px, blue gradient) connected by dashed lines
 *   - Step label below each circle (Manrope Bold)
 *   - Short description below label (Sora)
 * Section padding: 80px top / 100px bottom
 */

interface StepDef {
  num: string;
  icon: React.ReactElement;
  label: string;
  desc: string;
}

function PullIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 4V18M14 18L9 13M14 18L19 13"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 22H24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BuildIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="9" height="9" rx="1.5" stroke="white" strokeWidth="2" />
      <rect x="15" y="4" width="9" height="9" rx="1.5" stroke="white" strokeWidth="2" />
      <rect x="4" y="15" width="9" height="9" rx="1.5" stroke="white" strokeWidth="2" />
      <path
        d="M17 19H23M20 16V22"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AttestIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 3L24 8V15C24 21 18.5 25 14 26.5C9.5 25 4 21 4 15V8L14 3Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14L13 17L18 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PushIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="20" height="16" rx="2" stroke="white" strokeWidth="2" />
      <circle cx="14" cy="14" r="3" stroke="white" strokeWidth="2" />
      <path
        d="M4 10H8M20 10H24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeployIcon(): React.ReactElement {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 4L26 10V18L14 24L2 18V10L14 4Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4V24M2 10L14 16L26 10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS: StepDef[] = [
  {
    num: '01',
    icon: <PullIcon />,
    label: 'Pull',
    desc: 'Start from a pre-hardened base image from the CleanStart registry',
  },
  {
    num: '02',
    icon: <BuildIcon />,
    label: 'Build',
    desc: 'Add your application layer on top of a secure foundation',
  },
  {
    num: '03',
    icon: <AttestIcon />,
    label: 'Attest',
    desc: 'SBOMs and cryptographic signatures are generated automatically',
  },
  {
    num: '04',
    icon: <PushIcon />,
    label: 'Push',
    desc: 'Publish your verified, signed image to any OCI registry',
  },
  {
    num: '05',
    icon: <DeployIcon />,
    label: 'Deploy',
    desc: 'Ship to production with built-in provenance and confidence',
  },
];

function WorkflowStep({ num, icon, label, desc }: StepDef): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center" style={{ flex: '1 1 0' }}>
      {/* Numbered circle */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #239cff 0%, #005be3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          flexShrink: 0,
          boxShadow:
            '0px 6px 14px rgba(28,60,142,0.33), inset 0px -0.23px 0.29px rgba(0,44,179,0.5), inset 0px 0.12px 0.58px rgba(255,255,255,0.81)',
          position: 'relative',
        }}
      >
        {/* Step number badge */}
        <span
          className="absolute"
          style={{
            top: '-8px',
            right: '-8px',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#131e8f',
            border: '2px solid white',
            fontSize: '10px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {num}
        </span>
        {icon}
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(20px, 2vw, 28px)',
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: '#111',
          marginBottom: '8px',
        }}
      >
        {label}
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(15px, 1.4vw, 20px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          color: '#666',
          maxWidth: '180px',
        }}
      >
        {desc}
      </p>
    </div>
  );
}

export function DeveloperWorkflows(): React.ReactElement {
  return (
    <section
      data-section="DeveloperWorkflows"
      className="relative bg-white"
      style={{ paddingTop: '80px', paddingBottom: '100px' }}
    >
      <div className="relative mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10">
        {/* Heading */}
        <h2
          className="text-center mx-auto"
          style={{
            maxWidth: '720px',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 56px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            color: '#111',
            marginBottom: '16px',
          }}
        >
          Designed for{' '}
          <span className="cs-text-gradient-impact">Developer Workflows</span>
        </h2>

        <p
          className="text-center mx-auto"
          style={{
            maxWidth: '520px',
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(18px, 1.7vw, 24px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            color: '#666',
            marginBottom: '72px',
          }}
        >
          Integrate secure container foundations into your existing CI/CD pipeline in minutes.
        </p>

        {/* ════ DESKTOP pipeline ════ */}
        <div className="hidden lg:block relative">
          {/* Connecting dashed line — runs between circles */}
          <div
            aria-hidden
            className="absolute"
            style={{
              top: '35px',
              left: 'calc(10% + 36px)',
              right: 'calc(10% + 36px)',
              height: '2px',
              background:
                'repeating-linear-gradient(90deg, rgba(19,30,143,0.3) 0px, rgba(19,30,143,0.3) 8px, transparent 8px, transparent 16px)',
            }}
          />

          <div className="flex items-start" style={{ gap: '0' }}>
            {STEPS.map((step) => (
              <WorkflowStep key={step.num} {...step} />
            ))}
          </div>
        </div>

        {/* ════ MOBILE stacked ════ */}
        <div className="lg:hidden flex flex-col items-center" style={{ gap: '40px' }}>
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center" style={{ gap: '0' }}>
              <WorkflowStep {...step} />
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    width: '2px',
                    height: '24px',
                    background: 'rgba(19,30,143,0.25)',
                    marginTop: '16px',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Command hint */}
        <div
          className="mt-12 mx-auto flex items-center justify-center gap-3"
          style={{ maxWidth: '600px' }}
        >
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#f6f6f8',
              border: '1px solid #e5e5ea',
              fontFamily: 'monospace',
              fontSize: 'clamp(0.8125rem, 0.94vw, 1rem)',
              color: '#333',
              letterSpacing: '0',
            }}
          >
            <span style={{ color: '#9a51ff', fontWeight: 600 }}>docker pull</span>
            {' registry.cleanstart.com/node:22-slim'}
          </div>
        </div>
      </div>
    </section>
  );
}
