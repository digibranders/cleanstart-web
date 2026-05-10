/**
 * Typed CSS-variable names for the CleanStart admin design system.
 * Source of truth for the *values* lives in
 * `apps/cms/src/app/(payload)/styles/_tokens.scss`. This file mirrors
 * the names so React code can reference them without typoing.
 *
 * Usage:
 *   import { tokens } from '@cleanstart/ui';
 *   <div style={{ color: `var(${tokens.text})` }} />
 */

export const tokens = {
  // Brand ramps — cyan
  cyan50: '--cs-cyan-50',
  cyan100: '--cs-cyan-100',
  cyan200: '--cs-cyan-200',
  cyan300: '--cs-cyan-300',
  cyan400: '--cs-cyan-400',
  cyan500: '--cs-cyan-500',
  cyan600: '--cs-cyan-600',
  cyan700: '--cs-cyan-700',
  cyan800: '--cs-cyan-800',
  cyan900: '--cs-cyan-900',
  blue500: '--cs-blue-500',
  blue600: '--cs-blue-600',
  blue700: '--cs-blue-700',
  purple500: '--cs-purple-500',
  purple700: '--cs-purple-700',
  ink950: '--cs-ink-950',

  // Semantic
  textLink: '--cs-text-link',
  textLinkHover: '--cs-text-link-hover',

  // Type
  fontBody: '--font-body',
  fontDisplay: '--font-display',
  fontMono: '--font-mono',

  // Spacing
  space1: '--cs-space-1',
  space2: '--cs-space-2',
  space3: '--cs-space-3',
  space4: '--cs-space-4',
  space6: '--cs-space-6',
  space8: '--cs-space-8',
  space12: '--cs-space-12',
  space16: '--cs-space-16',

  // Radius
  radiusChip: '--cs-radius-chip',
  radiusInput: '--cs-radius-input',
  radiusCard: '--cs-radius-card',
  radiusModal: '--cs-radius-modal',

  // Motion
  motionMicro: '--cs-motion-micro',
  motionMacro: '--cs-motion-macro',
  motionModal: '--cs-motion-modal',

  // Tints
  tintBrandSoft: '--cs-tint-brand-soft',
  tintBrandMedium: '--cs-tint-brand-medium',
  tintFocusRing: '--cs-tint-focus-ring',
  tintFocusGlow: '--cs-tint-focus-glow',

  // Shadows
  shadowInputRest: '--cs-shadow-input-rest',
  shadowInputFocus: '--cs-shadow-input-focus',
  shadowPress: '--cs-shadow-press',
  shadowPressSoft: '--cs-shadow-press-soft',
  shadowLiftSm: '--cs-shadow-lift-sm',
  shadowLiftMd: '--cs-shadow-lift-md',

  // Layout
  navWidth: '--nav-width',
} as const;

export type TokenName = (typeof tokens)[keyof typeof tokens];

/**
 * Theme switcher — Payload exposes `[data-theme="dark"|"light"]` on the
 * <html>. Use this helper when you need to read it in a component.
 */
export const themeAttr = 'data-theme';
