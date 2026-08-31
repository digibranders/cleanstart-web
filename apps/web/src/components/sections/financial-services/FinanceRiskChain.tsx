'use client';

import type React from 'react';
import { useState } from 'react';
import { Reveal, RevealStagger, RevealItem } from '@/components/ui/Reveal';

/*
 * "Risk Enters Long Before Production" — Supply Chain Risk Architecture.
 *
 * Direct Reference Fidelity:
 * - Stage 01: Open Source Package (White folded box with </> badges, floating blue & silver code cubes)
 * - Stage 02: Libraries & Dependencies (Multi-tiered floating architecture slabs with circuit graph nodes)
 * - Stage 03: Container Images (Hardened blue shipping container with vertical ribs and center lock seal)
 * - Stage 04: AI-Generated Code (Dark IDE screen with syntax lines and foreground </> code token)
 * - Stage 05: Build & Delivery Pipeline (Motorized conveyor belt with chrome wheels, 2 checked cubes, & articulated robotic arm)
 * - Stage 06: Financial Applications (PROMINENT terminal display with live area chart, telemetry bars, glowing donut ring, & SLSA badge on elevated cyan podium)
 */

interface StageDef {
  id: string;
  line1: string;
  line2: string;
  terminal?: boolean;
}

const STAGES: readonly StageDef[] = [
  {
    id: 'open-source',
    line1: 'Open Source',
    line2: 'Components',
  },
  {
    id: 'dependencies',
    line1: 'Libraries &',
    line2: 'Dependencies',
  },
  {
    id: 'containers',
    line1: 'Container',
    line2: 'Images',
  },
  {
    id: 'ai-code',
    line1: 'AI-Generated',
    line2: 'Code',
  },
  {
    id: 'pipeline',
    line1: 'Build & Delivery',
    line2: 'Pipeline',
  },
  {
    id: 'financial-apps',
    line1: 'Financial',
    line2: 'Applications',
    terminal: true,
  },
];

/* -------------------------------------------------------------------------- */
/*                     UNIFIED 3D PODIUM BASE COMPONENT                       */
/* -------------------------------------------------------------------------- */

/** 3D Stepped Cylindrical Showcase Base (rendered at bottom of SVG, y: 104..134) */
function BasePodium({ terminal, isHovered }: { terminal?: boolean; isHovered: boolean }): React.ReactElement {
  return (
    <g className="select-none">
      {/* 1. Floor Ambient Glow Spread */}
      <ellipse
        cx="70"
        cy="124"
        rx={terminal ? '68' : '64'}
        ry="12"
        fill={terminal ? 'rgba(44, 193, 235, 0.45)' : 'rgba(154, 81, 255, 0.28)'}
        filter="blur(6px)"
      />

      {/* 2. Concentric Security Shield Ring (Terminal Exclusive - Smooth & Crisp) */}
      {terminal ? (
        <g opacity={isHovered ? '1' : '0.75'}>
          <ellipse
            cx="70"
            cy="124"
            rx="68"
            ry="13"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.2"
            strokeDasharray="6 6"
            className="cs-shield-ring"
          />
        </g>
      ) : null}

      {/* 3. 3D Stepped Cylinder Base Body */}
      <path
        d={
          terminal
            ? 'M8,110 C8,119 36,126 70,126 C104,126 132,119 132,110 L132,118 C132,127 104,134 70,134 C36,134 8,127 8,118 Z'
            : 'M10,110 C10,118 37,125 70,125 C103,125 130,118 130,110 L130,117 C130,125 103,132 70,132 C37,132 10,125 10,117 Z'
        }
        fill="url(#podium-base-grad)"
        stroke={terminal ? '#38BDF8' : '#A5B4FC'}
        strokeWidth="0.8"
      />

      {/* 4. Top Reflective Glass/Metal Stage Surface */}
      <ellipse
        cx="70"
        cy="110"
        rx={terminal ? '64' : '60'}
        ry={terminal ? '14' : '13'}
        fill={terminal ? '#E0F7FE' : '#FFFFFF'}
        stroke="url(#podium-rim-grad)"
        strokeWidth={isHovered ? '2.2' : '1.4'}
      />

      {/* 5. Inner Concentric Refraction Bevel */}
      <ellipse
        cx="70"
        cy="110"
        rx={terminal ? '50' : '46'}
        ry={terminal ? '10' : '9'}
        fill={terminal ? 'rgba(44, 193, 235, 0.28)' : 'rgba(99, 102, 241, 0.14)'}
      />

      {/* 6. Object Contact Shadow (Anchors the object firmly ON TOP of the plate) */}
      <ellipse
        cx="70"
        cy="109"
        rx={terminal ? '42' : '36'}
        ry={terminal ? '8' : '7'}
        fill="rgba(15, 23, 42, 0.45)"
        filter="blur(2px)"
      />
    </g>
  );
}

/* -------------------------------------------------------------------------- */
/*                         STAGE MICRO-SCENE SVGS                             */
/* -------------------------------------------------------------------------- */

/** 01: Open Source — 3D Box with Floating Code Cubes */
function SceneOpenSource({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* 3D Showcase Podium */}
      <BasePodium isHovered={isHovered} />

      {/* 3D Isometric Object (Sitting ON TOP of Podium) */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
      >
        {/* Open Box Interior Shadow & Core Light */}
        <polygon points="70,58 98,72 70,86 42,72" fill="#2E1065" />
        <ellipse cx="70" cy="72" rx="20" ry="8" fill="#C084FC" opacity="0.6" />

        {/* Floating Luminous Code Cubes */}
        <g className="cs-cube-float-1">
          <polygon points="70,30 78,34 70,38 62,34" fill="#BFDBFE" />
          <polygon points="62,34 70,38 70,47 62,43" fill="#3B82F6" />
          <polygon points="70,38 78,34 78,43 70,47" fill="#1D4ED8" />
        </g>

        <g className="cs-cube-float-2">
          <polygon points="48,38 55,42 48,46 41,42" fill="#E2E8F0" />
          <polygon points="41,42 48,46 48,54 41,50" fill="#94A3B8" />
          <polygon points="48,46 55,42 55,50 48,54" fill="#64748B" />
        </g>

        <g className="cs-cube-float-3">
          <polygon points="92,38 99,42 92,46 85,42" fill="#60A5FA" />
          <polygon points="85,42 92,46 92,54 85,50" fill="#2563EB" />
          <polygon points="92,46 99,42 99,50 92,54" fill="#1E40AF" />
        </g>

        {/* Outer Box Body */}
        {/* Left Side */}
        <polygon points="42,72 70,86 70,108 42,94" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        {/* Right Side */}
        <polygon points="70,86 98,72 98,94 70,108" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />

        {/* Left Front Flap */}
        <polygon points="42,72 26,64 54,58 70,65" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        {/* Right Front Flap */}
        <polygon points="98,72 114,64 86,58 70,65" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />

        {/* Blue Code Badges `</>` */}
        <text x="56" y="96" fill="#2563EB" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">&lt;/&gt;</text>
        <text x="84" y="96" fill="#1D4ED8" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">&lt;/&gt;</text>
      </g>
    </svg>
  );
}

/** 02: Libraries & Dependencies — Multi-Tiered Slabs */
function SceneDependencies({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* 3D Showcase Podium */}
      <BasePodium isHovered={isHovered} />

      {/* 3D Isometric Object */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
      >
        {/* Tier 1 Slab (Base Tier) */}
        <polygon points="70,78 104,90 70,102 36,90" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
        <polygon points="36,90 70,102 70,108 36,96" fill="#64748B" />
        <polygon points="70,102 104,90 104,96 70,108" fill="#475569" />

        {/* Circuit Interconnect Traces */}
        <line x1="46" y1="88" x2="58" y2="81" stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="3 2" />
        <line x1="94" y1="88" x2="82" y2="81" stroke="#38BDF8" strokeWidth="2.2" strokeDasharray="3 2" />

        {/* Tier 2 Slab (Middle Blue Tier) */}
        <polygon points="70,62 96,72 70,82 44,72" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.4" />
        <polygon points="44,72 70,82 70,88 44,78" fill="#0F172A" />
        <polygon points="70,82 96,72 96,78 70,88" fill="#090D16" />

        {/* Top Tier Architectural Cubes & Graph Links */}
        {/* Center Blue Cube */}
        <polygon points="70,38 80,43 70,48 60,43" fill="#60A5FA" />
        <polygon points="60,43 70,48 70,59 60,54" fill="#2563EB" />
        <polygon points="70,48 80,43 80,54 70,59" fill="#1D4ED8" />

        {/* Left Dependency Node Cube */}
        <polygon points="50,50 56,53 50,56 44,53" fill="#93C5FD" />
        <polygon points="44,53 50,56 50,63 44,60" fill="#3B82F6" />
        <polygon points="50,56 56,53 56,60 50,63" fill="#1E40AF" />

        {/* Right Dependency Node Cube */}
        <polygon points="90,50 96,53 90,56 84,53" fill="#93C5FD" />
        <polygon points="84,53 90,56 90,63 84,60" fill="#3B82F6" />
        <polygon points="90,56 96,53 96,60 90,63" fill="#1E40AF" />
      </g>
    </svg>
  );
}

/** 03: Container Images — Hardened Shipping Container */
function SceneContainers({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* 3D Showcase Podium */}
      <BasePodium isHovered={isHovered} />

      {/* 3D Isometric Object */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
      >
        {/* Top Face */}
        <polygon points="70,44 100,56 70,68 40,56" fill="#3B82F6" stroke="#60A5FA" strokeWidth="1.2" />
        <line x1="52" y1="52" x2="82" y2="64" stroke="#1D4ED8" strokeWidth="1.5" />
        <line x1="60" y1="48" x2="90" y2="60" stroke="#1D4ED8" strokeWidth="1.5" />

        {/* Left Side (Corrugated Metal) */}
        <polygon points="40,56 70,68 70,108 40,96" fill="#2563EB" stroke="#60A5FA" strokeWidth="1.2" />
        <line x1="48" y1="59" x2="48" y2="99" stroke="#1E40AF" strokeWidth="2" />
        <line x1="55" y1="62" x2="55" y2="102" stroke="#1E40AF" strokeWidth="2" />
        <line x1="62" y1="65" x2="62" y2="105" stroke="#1E40AF" strokeWidth="2" />

        {/* Right Side (Container Door with Gear Seal) */}
        <polygon points="70,68 100,56 100,96 70,108" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="1.2" />

        {/* Center Container Lock & Gear Seal */}
        <g transform="translate(85 80)">
          <circle cx="0" cy="0" r="10" stroke="#93C5FD" strokeWidth="1.8" fill="rgba(15, 23, 42, 0.7)" />
          <circle cx="0" cy="0" r="4.5" fill="#60A5FA" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect key={angle} x="-1.5" y="-12" width="3" height="3.5" rx="0.5" fill="#93C5FD" transform={`rotate(${angle})`} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/** 04: AI-Generated Code — Sleek Dark IDE Screen */
function SceneAICode({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* 3D Showcase Podium */}
      <BasePodium isHovered={isHovered} />

      {/* 3D Isometric Object */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
      >
        {/* IDE Screen Frame */}
        <rect x="34" y="38" width="72" height="66" rx="7" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />

        {/* IDE Window Title Bar */}
        <line x1="34" y1="48" x2="106" y2="48" stroke="#1E293B" strokeWidth="1" />
        <circle cx="40" cy="43" r="1.8" fill="#EF4444" />
        <circle cx="46" cy="43" r="1.8" fill="#F59E0B" />
        <circle cx="52" cy="43" r="1.8" fill="#10B981" />

        {/* Code Syntax Lines */}
        <line x1="40" y1="56" x2="60" y2="56" stroke="#A855F7" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="64" y1="56" x2="82" y2="56" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />

        <line x1="46" y1="64" x2="76" y2="64" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="79" y1="64" x2="94" y2="64" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />

        <line x1="46" y1="72" x2="68" y2="72" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="72" y1="72" x2="88" y2="72" stroke="#EC4899" strokeWidth="2.2" strokeLinecap="round" />

        <line x1="40" y1="80" x2="54" y2="80" stroke="#A855F7" strokeWidth="2.2" strokeLinecap="round" />

        {/* Cursor Blink */}
        <rect x="58" y="78" width="2" height="4.5" fill="#38BDF8" className="cs-cursor-blink" />

        {/* Floating Foreground AI Code Cube */}
        <g transform="translate(82 72)">
          <polygon points="18,9 29,15 18,21 7,15" fill="#60A5FA" stroke="#93C5FD" strokeWidth="1" />
          <polygon points="7,15 18,21 18,34 7,28" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
          <polygon points="18,21 29,15 29,28 18,34" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="1" />
          <text x="13" y="26" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="monospace">&lt;/&gt;</text>
        </g>
      </g>
    </svg>
  );
}

/** 05: Build & Delivery Pipeline — High-Tech CI/CD Security Gate & Verified Artifact Pipeline */
function ScenePipeline({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* 3D Showcase Podium */}
      <BasePodium isHovered={isHovered} />

      {/* 3D Isometric CI/CD Pipeline & Verification Gate */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-4px)' : 'none' }}
      >
        {/* 1. CI/CD Pipeline Runner Platform */}
        <polygon points="70,68 106,82 70,96 34,82" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
        <polygon points="34,82 70,96 70,104 34,90" fill="#090D16" />
        <polygon points="70,96 106,82 106,90 70,104" fill="#060911" />

        {/* Digital Circuit Pipeline Rails */}
        <line x1="44" y1="80" x2="80" y2="94" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 2" />
        <line x1="60" y1="72" x2="96" y2="86" stroke="#9A51FF" strokeWidth="2" strokeDasharray="3 2" />

        {/* 2. Automated Security Verification Arch / Scanner Gate */}
        {/* Left Scanner Pylon */}
        <polygon points="40,36 46,32 46,74 40,78" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
        <line x1="43" y1="36" x2="43" y2="74" stroke="#38BDF8" strokeWidth="1.5" />

        {/* Right Scanner Pylon */}
        <polygon points="94,32 100,36 100,78 94,74" fill="#1E293B" stroke="#9A51FF" strokeWidth="1.2" />
        <line x1="97" y1="36" x2="97" y2="74" stroke="#9A51FF" strokeWidth="1.5" />

        {/* Overhead Verification Bridge */}
        <polygon points="40,36 94,32 100,36 46,40" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
        {/* Center Scanner Emitter Beacon */}
        <circle cx="70" cy="36" r="3.5" fill="#38BDF8" filter="drop-shadow(0 0 6px #38BDF8)" />
        <circle cx="70" cy="36" r="1.5" fill="#FFFFFF" />

        {/* Holographic Laser Verification Field Curtain */}
        <polygon points="46,40 94,36 94,74 46,78" fill="#38BDF8" fillOpacity="0.12" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* 3. Software Artifact Transformation: Code -> Verified & Signed Container */}
        {/* Unverified Inbound Code Block (Left of Gate) */}
        <g transform="translate(36 56)">
          <polygon points="10,0 20,5 10,10 0,5" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="0.8" />
          <polygon points="0,5 10,10 10,19 0,14" fill="#94A3B8" />
          <polygon points="10,10 20,5 20,14 10,19" fill="#64748B" />
          <text x="10" y="16" fill="#3B82F6" fontSize="5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">&lt;/&gt;</text>
        </g>

        {/* CleanStart Verified & Signed Container Cube (Exiting Gate, Foreground Right) */}
        <g transform="translate(62 48)">
          {/* Glowing Verification Aura */}
          <ellipse cx="14" cy="28" rx="16" ry="6" fill="rgba(44, 193, 235, 0.4)" filter="blur(3px)" />

          {/* Top Face */}
          <polygon points="14,0 28,7 14,14 0,7" fill="#60A5FA" stroke="#93C5FD" strokeWidth="1" />
          {/* Left Face (Signed with Checkmark) */}
          <polygon points="0,7 14,14 14,29 0,22" fill="#2563EB" stroke="#60A5FA" strokeWidth="1" />
          {/* Right Face (Cryptographic Attestation Seal) */}
          <polygon points="14,14 28,7 28,22 14,29" fill="#1D4ED8" stroke="#3B82F6" strokeWidth="1" />

          {/* Bold White Verified Checkmark */}
          <path d="M4,15 L8,19 L19,10" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Cryptographic Signature Key Badge */}
          <g transform="translate(21 16)">
            <circle cx="0" cy="0" r="4.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <path d="M-1.5,-1.5 L1.5,-1.5 L1.5,1.5 L-1.5,1.5 Z" fill="#38BDF8" />
          </g>
        </g>

        {/* 4. CI/CD Step Nodes: [ BUILD ] -> [ SCAN ] -> [ SIGN ] */}
        <g transform="translate(40 98)">
          <circle cx="10" cy="0" r="2.5" fill="#38BDF8" />
          <circle cx="30" cy="0" r="2.5" fill="#9A51FF" />
          <circle cx="50" cy="0" r="2.5" fill="#22C55E" />
          <line x1="13" y1="0" x2="27" y2="0" stroke="#38BDF8" strokeWidth="1" strokeDasharray="1 1" />
          <line x1="33" y1="0" x2="47" y2="0" stroke="#9A51FF" strokeWidth="1" strokeDasharray="1 1" />
        </g>
      </g>
    </svg>
  );
}

/** 06: Financial Applications — PROMINENT Institutional Display Terminal on Elevated Cyan Podium */
function SceneFinancialApps({ isHovered }: { isHovered: boolean }): React.ReactElement {
  return (
    <svg viewBox="0 0 140 140" className="h-full w-full overflow-visible select-none" fill="none" aria-hidden="true">
      {/* Elevated Luminous Podium with Concentric Cyan Shield */}
      <BasePodium terminal isHovered={isHovered} />

      {/* Prominent Institutional Monitor Terminal */}
      <g
        className="transition-transform duration-500"
        style={{ transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'scale(1.02)' }}
      >
        {/* Monitor Metallic Base Stand */}
        <ellipse cx="70" cy="107" rx="24" ry="5.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.4" />
        <rect x="68" y="92" width="4.5" height="15" fill="#1E293B" stroke="#475569" strokeWidth="1" />

        {/* Main Monitor Display Frame */}
        <rect
          x="22"
          y="26"
          width="96"
          height="68"
          rx="9"
          fill="#061024"
          stroke="#2CC1EB"
          strokeWidth="2.2"
        />

        {/* Dashboard Top Header Bar */}
        <line x1="22" y1="36" x2="118" y2="36" stroke="rgba(44, 193, 235, 0.4)" strokeWidth="1" />
        <circle cx="30" cy="31" r="2" fill="#2CC1EB" />
        <circle cx="36" cy="31" r="2" fill="#2CC1EB" opacity="0.65" />
        <circle cx="42" cy="31" r="2" fill="#2CC1EB" opacity="0.35" />

        {/* Area Chart Waveform (Left Main Panel) */}
        <path d="M30,64 Q42,46 56,56 T80,46 L80,72 L30,72 Z" fill="#38BDF8" fillOpacity="0.35" />
        <path d="M30,64 Q42,46 56,56 T80,46" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />

        {/* Telemetry Metric Bars */}
        <g fill="#2CC1EB">
          <rect x="30" y="77" width="5" height="11" rx="1" />
          <rect x="39" y="73" width="5" height="15" rx="1" />
          <rect x="48" y="79" width="5" height="9" rx="1" />
          <rect x="57" y="69" width="5" height="19" rx="1" />
        </g>

        {/* Concentric Donut Security Gauge (Upper-Right Panel) */}
        <g transform="translate(98 56)">
          <circle cx="0" cy="0" r="12" stroke="#1E293B" strokeWidth="3.6" />
          <circle cx="0" cy="0" r="12" stroke="#2CC1EB" strokeWidth="3.6" strokeDasharray="56 70" strokeLinecap="round" />
          <circle cx="0" cy="0" r="5" fill="rgba(44, 193, 235, 0.3)" />
        </g>

        {/* Verified 100% SLSA Badge Tile (Lower-Right Panel) */}
        <g transform="translate(98 80)">
          <rect x="-14" y="-6" width="28" height="12" rx="4" fill="rgba(44, 193, 235, 0.25)" stroke="#2CC1EB" strokeWidth="1.2" />
          <text x="0" y="2.5" fill="#A6ECFF" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">100% SLSA</text>
        </g>
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                           STAGE NODE COMPONENT                             */
/* -------------------------------------------------------------------------- */

function StageNode({
  stage,
  isHovered,
  onHover,
}: {
  stage: StageDef;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}): React.ReactElement {
  const { line1, line2, terminal } = stage;

  const renderScene = (): React.ReactElement => {
    switch (stage.id) {
      case 'open-source':
        return <SceneOpenSource isHovered={isHovered} />;
      case 'dependencies':
        return <SceneDependencies isHovered={isHovered} />;
      case 'containers':
        return <SceneContainers isHovered={isHovered} />;
      case 'ai-code':
        return <SceneAICode isHovered={isHovered} />;
      case 'pipeline':
        return <ScenePipeline isHovered={isHovered} />;
      case 'financial-apps':
        return <SceneFinancialApps isHovered={isHovered} />;
      default:
        return <SceneOpenSource isHovered={isHovered} />;
    }
  };

  return (
    <div
      className={`group relative flex cursor-default flex-col items-center text-center transition-transform duration-300 ${
        terminal ? 'scale-105 sm:scale-110' : ''
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* 1. Unified 3D Isometric Scene (Object Firmly ON TOP of Podium) */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: terminal
            ? 'clamp(128px, 11.2vw, 168px)'
            : 'clamp(118px, 10.4vw, 156px)',
          height: terminal
            ? 'clamp(128px, 11.2vw, 168px)'
            : 'clamp(118px, 10.4vw, 156px)',
        }}
      >
        <div className="relative h-full w-full">
          {renderScene()}
        </div>
      </div>

      {/* 2. Stage Label (Prominent Cyan Gradient for Final Stage) */}
      <h3
        className="transition-colors duration-300"
        style={{
          marginTop: 'clamp(10px, 1vw, 16px)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h5)',
          fontWeight: terminal ? 700 : 600,
          letterSpacing: '-0.03em',
          lineHeight: 1.25,
          color: terminal ? '#38BDF8' : isHovered ? '#FFFFFF' : '#E2E0F5',
          textShadow: terminal
            ? '0 0 20px rgba(56, 189, 248, 0.8), 0 0 40px rgba(44, 193, 235, 0.4)'
            : isHovered
              ? '0 0 16px rgba(179, 107, 255, 0.9)'
              : 'none',
        }}
      >
        <span className="block">{line1}</span>
        <span className="block">{line2}</span>
      </h3>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                      DESKTOP PARTICLE CONDUIT CONNECTOR                    */
/* -------------------------------------------------------------------------- */

function DesktopConduitBeam({
  index,
  isPrevHovered,
  isNextHovered,
}: {
  index: number;
  isPrevHovered: boolean;
  isNextHovered: boolean;
}): React.ReactElement {
  const isHighlit = isPrevHovered || isNextHovered;

  return (
    <div
      aria-hidden
      className="hidden shrink-0 self-center lg:flex items-center justify-center relative"
      style={{
        marginTop: 'clamp(8px, 0.8vw, 14px)',
        width: 'clamp(24px, 2.8vw, 48px)',
        height: '24px',
      }}
    >
      <svg viewBox="0 0 54 24" className="w-full h-full overflow-visible" fill="none">
        {/* Base Track */}
        <line
          x1="0"
          y1="12"
          x2="44"
          y2="12"
          stroke="url(#conduit-grad)"
          strokeWidth={isHighlit ? '2.2' : '1.4'}
          strokeLinecap="round"
          opacity={isHighlit ? '1' : '0.5'}
        />

        {/* Pulsing Flow Stream */}
        <line
          x1="0"
          y1="12"
          x2="42"
          y2="12"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeDasharray="3 6"
          strokeLinecap="round"
          className="cs-conduit-stream"
          style={{ animationDelay: `${index * -0.25}s`, opacity: isHighlit ? '1' : '0.7' }}
        />

        {/* Directional Chevron Head */}
        <path
          d="M42,7 L48,12 L42,17"
          stroke={isHighlit ? '#FFFFFF' : '#2CC1EB'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isHighlit ? '1' : '0.85'}
        />

        {/* Moving Photon Packet */}
        <circle
          cx="0"
          cy="12"
          r={isHighlit ? '3.5' : '2.4'}
          fill="#FFFFFF"
          filter="drop-shadow(0 0 6px #2CC1EB)"
          className="cs-photon-packet"
          style={{ animationDelay: `${index * -0.4}s` }}
        />
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           MAIN SECTION COMPONENT                           */
/* -------------------------------------------------------------------------- */

export function FinanceRiskChain(): React.ReactElement {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section
      data-section="FinanceRiskChain"
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)',
      }}
    >
      {/* Global Vector Filters & Shared Gradients */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          <linearGradient id="conduit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9A51FF" />
            <stop offset="100%" stopColor="#2CC1EB" />
          </linearGradient>

          <linearGradient id="podium-rim-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="podium-base-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.9" />
          </linearGradient>
        </defs>
      </svg>

      {/* Dynamic Keyframes */}
      <style>{`
        @keyframes csCubeFloat1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes csCubeFloat2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4.5px); }
        }
        @keyframes csCubeFloat3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes csCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes csConduitFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -18; }
        }
        @keyframes csShieldRingFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
        @keyframes csPhotonTravel {
          0% { transform: translateX(0px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(46px); opacity: 0; }
        }

        .cs-cube-float-1 {
          animation: csCubeFloat1 2.6s ease-in-out infinite;
        }
        .cs-cube-float-2 {
          animation: csCubeFloat2 3.1s ease-in-out infinite;
        }
        .cs-cube-float-3 {
          animation: csCubeFloat3 2.3s ease-in-out infinite;
        }
        .cs-cursor-blink {
          animation: csCursorBlink 0.9s step-end infinite;
        }
        .cs-conduit-stream {
          animation: csConduitFlow 1.2s linear infinite;
        }
        .cs-shield-ring {
          animation: csShieldRingFlow 5s linear infinite;
        }
        .cs-photon-packet {
          animation: csPhotonTravel 1.6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-cube-float-1,
          .cs-cube-float-2,
          .cs-cube-float-3,
          .cs-cursor-blink,
          .cs-conduit-stream,
          .cs-shield-ring,
          .cs-photon-packet {
            animation: none !important;
          }
        }
      `}</style>

      {/* Shared overlay meshes */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-2.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          right: '-150px',
          top: '-175px',
          width: '488px',
          height: '497px',
          transform: 'rotate(141.39deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/attack-surface-reduction/prod-mesh-1.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none mix-blend-overlay md:block"
        style={{
          left: '-147px',
          bottom: '-180px',
          width: '469px',
          height: '488px',
          transform: 'rotate(-150deg) scaleY(-1)',
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: 'clamp(60px, 8vw, 128px)',
          paddingBottom: 'clamp(56px, 7vw, 112px)',
        }}
      >
        {/* Section Header */}
        <div className="mx-auto flex max-w-[820px] flex-col items-center gap-4 text-center">
          <Reveal header>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                fontWeight: 600,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: '#ffffff',
              }}
            >
              Risk Enters Long{' '}
              <span
                style={{
                  background: 'linear-gradient(-44deg, #2CC1EB 0%, #9A51FF 65%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Before Production
              </span>
            </h2>
          </Reveal>

          <Reveal header delay={0.1} y={20}>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--fs-lead-sm)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.82)',
                maxWidth: '600px',
                margin: 0,
              }}
            >
              Every component that makes up your application can also introduce risk.
            </p>
          </Reveal>
        </div>

        {/* Continuous Infiltration Flow */}
        <div
          style={{
            marginTop: 'clamp(36px, 4.5vw, 72px)',
          }}
        >
          <RevealStagger className="flex flex-wrap items-start justify-center gap-x-2 gap-y-12 lg:flex-nowrap lg:justify-between lg:gap-x-1">
            {STAGES.map((stage, i) => (
              <div key={stage.id} className="contents">
                <RevealItem className="min-w-0 basis-[calc((100%-1rem)/2)] sm:basis-[calc((100%-2rem)/3)] lg:basis-0 lg:grow">
                  <StageNode
                    stage={stage}
                    isHovered={hoveredIndex === i}
                    onHover={(h) => setHoveredIndex(h ? i : null)}
                  />
                </RevealItem>
                {i < STAGES.length - 1 ? (
                  <DesktopConduitBeam
                    index={i}
                    isPrevHovered={hoveredIndex === i}
                    isNextHovered={hoveredIndex === i + 1}
                  />
                ) : null}
              </div>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}
