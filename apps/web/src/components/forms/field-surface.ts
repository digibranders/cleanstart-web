import type { CSSProperties } from "react";

/**
 * Input surfaces for the public forms.
 *
 * Two designed surfaces exist. The marketing forms (Book a Demo, Contact, Deal
 * Registration, Become a Partner) share one; the careers application page was
 * designed with its own taller, whiter, rounder treatment. They are declared
 * here as named variants rather than duplicated per form, so a field dropped
 * into either page inherits the right one and the difference stays visible in
 * one place if design later converges them.
 */

export const FIELD_BORDER_ERROR = "#D14343";
export const FIELD_ERROR_TEXT = "#D14343";

export type FieldVariant = "marketing" | "careers";
export type FieldHeight = "sm" | "md";

const HEIGHTS: Record<FieldHeight, string> = { sm: "40px", md: "48px" };

interface VariantSpec {
  background: string;
  border: string;
  borderWidth: string;
  borderRadius: string;
  fontFamily: string;
  fontWeight: number;
  padding: string;
  /** Overrides the `size` prop, which the careers surface does not vary. */
  fixedHeight?: string;
  label: CSSProperties;
}

const VARIANTS: Record<FieldVariant, VariantSpec> = {
  marketing: {
    background: "#FBFBFB",
    border: "#DDDDDD",
    borderWidth: "1.5px",
    borderRadius: "8px",
    fontFamily: "var(--font-display), 'Manrope', sans-serif",
    fontWeight: 500,
    padding: "10px 14px",
    label: {
      fontFamily: "var(--font-display, 'Manrope'), sans-serif",
      fontSize: "var(--fs-input-label)",
      fontWeight: 400,
      lineHeight: 1.2,
      color: "#111111",
      marginBottom: "8px",
    },
  },
  careers: {
    background: "#FFFFFF",
    border: "rgba(17,17,17,0.12)",
    borderWidth: "1px",
    borderRadius: "10px",
    fontFamily: "var(--font-sans), sans-serif",
    fontWeight: 400,
    padding: "0 14px",
    fixedHeight: "44px",
    label: {
      fontFamily: "var(--font-sans), sans-serif",
      fontSize: "var(--fs-caption)",
      fontWeight: 500,
      lineHeight: 1.2,
      color: "rgba(17,17,17,0.7)",
      letterSpacing: "-0.005em",
      marginBottom: "6px",
    },
  },
};

export const fieldBorderColor = (variant: FieldVariant): string => VARIANTS[variant].border;

export const fieldLabelStyle = (variant: FieldVariant): CSSProperties =>
  VARIANTS[variant].label;

export interface FieldSurfaceOptions {
  variant?: FieldVariant;
  size?: FieldHeight;
  invalid?: boolean;
  /** Multi-line fields grow instead of locking to a fixed height. */
  multiline?: boolean;
}

/**
 * `--fs-input` is pinned at 16px. Anything smaller makes iOS Safari zoom the
 * viewport on focus, which shifts the whole page mid-typing.
 */
export const fieldSurfaceStyle = ({
  variant = "marketing",
  size = "sm",
  invalid = false,
  multiline = false,
}: FieldSurfaceOptions = {}): CSSProperties => {
  const spec = VARIANTS[variant];
  const height = spec.fixedHeight ?? HEIGHTS[size];
  return {
    background: spec.background,
    border: `${spec.borderWidth} solid ${invalid ? FIELD_BORDER_ERROR : spec.border}`,
    borderRadius: spec.borderRadius,
    fontFamily: spec.fontFamily,
    fontWeight: spec.fontWeight,
    fontSize: "var(--fs-input)",
    lineHeight: multiline ? 1.5 : 1.125,
    color: "#111111",
    // A fixed-height input centres its text with the height itself, so vertical
    // padding would push it off-centre.
    padding: multiline ? "10px 14px" : spec.padding,
    ...(multiline ? { minHeight: "88px" } : { height }),
  };
};

/**
 * The keyboard focus indicator.
 *
 * `:focus-visible` rather than `:focus`, so a mouse click on a button does not
 * ring but Tab does. Browsers deliberately still match it on text inputs when
 * clicked, which is wanted: you need to see where the caret is.
 *
 * Expressed as an outline, not a border, for two reasons. The border is set
 * through an inline style, and inline always beats a class, so a border-based
 * ring silently would not render. An outline also sits outside the box, so
 * nothing reflows when it appears.
 *
 * #3960F9 measures 4.8:1 on the marketing surface and 5.0:1 on the careers
 * one, against the 3:1 that WCAG 1.4.11 asks of a non-text indicator.
 */
export const FIELD_FOCUS_RING = "cs-field";

export const FIELD_SURFACE_CLASS =
  `block w-full outline-none transition-colors placeholder:text-[#A3A3A3] ${FIELD_FOCUS_RING}`;
