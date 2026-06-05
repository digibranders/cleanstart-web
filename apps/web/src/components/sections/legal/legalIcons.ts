import {
  BadgeCheck,
  Bug,
  FileCheck2,
  FileLock2,
  FileSignature,
  FileText,
  type LucideIcon,
  Scale,
  ScrollText,
  ShieldCheck,
  Stamp,
} from "lucide-react";

/**
 * Maps the CMS `icon` select value to a lucide component. Keys MUST stay in
 * sync with `LEGAL_ICON_OPTIONS` in the CMS collection
 * (apps/cms/src/payload/collections/Legal.ts) — a parity test guards this.
 */
export const LEGAL_ICONS: Record<string, LucideIcon> = {
  FileText,
  FileLock2,
  ScrollText,
  BadgeCheck,
  FileCheck2,
  Stamp,
  Bug,
  Scale,
  FileSignature,
  ShieldCheck,
};

/** Resolve an icon key to a component, falling back to FileText on drift. */
export function legalIcon(key: string | null | undefined): LucideIcon {
  return (key && LEGAL_ICONS[key]) || FileText;
}
