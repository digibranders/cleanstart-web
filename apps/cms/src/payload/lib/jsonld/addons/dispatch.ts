import type { JsonLdContext } from '../context';
import type { JsonLdBlob } from '../types';

import {
  buildBreadcrumbOverrideBlob,
  buildHowToBlob,
  buildManualFaqEntries,
  buildReviewBlob,
  buildSoftwareApplicationBlob,
  buildVideoObjectBlob,
} from './builders';
import type { BreadcrumbListAddon, SchemaAddon } from './types';

/**
 * Result of running the add-on dispatcher: blobs to append to the
 * page's `@graph`, plus side-effect signals for the main dispatcher
 * (FAQ merge, breadcrumb suppression / replacement).
 */
export interface AddonsDispatchResult {
  /** Blobs to append after Layer 1. */
  readonly appendBlobs: readonly JsonLdBlob[];
  /** When true, the auto-emitted BreadcrumbList should be dropped. */
  readonly suppressAutoBreadcrumb: boolean;
  /**
   * BreadcrumbList override from a manual add-on. Replaces the auto
   * one when set; if both this and `suppressAutoBreadcrumb` are unset
   * the auto breadcrumb is kept as-is.
   */
  readonly breadcrumbOverride: JsonLdBlob | null;
  /**
   * Manual FAQ entries to merge into any auto-emitted FAQPage. The
   * main dispatcher concatenates these into `mainEntity[]`. When no
   * auto FAQPage exists the dispatcher emits a new one carrying just
   * these entries.
   *
   * Typed as a free-form record list so it composes with any existing
   * `mainEntity[]` without an extra cast at the call site.
   */
  readonly manualFaqEntries: readonly Record<string, unknown>[];
}

const EMPTY: AddonsDispatchResult = {
  appendBlobs: [],
  suppressAutoBreadcrumb: false,
  breadcrumbOverride: null,
  manualFaqEntries: [],
};

/**
 * Walk the doc's `schemaAddons[]` array, build per-block blobs, and
 * return the composite dispatch result. Per-collection enable rules
 * (e.g. HowTo only on guides + knowledgeBase) are NOT enforced here —
 * the field-level admin UI lets editors pick from whatever the
 * collection's `schemaAddonsField` exposes; if the registry says a
 * collection shouldn't see a given add-on, that's enforced upstream by
 * filtering the block list in the field config.
 *
 * In Phase 3 we expose every block on every collection (editor
 * judgment); the per-collection allowlist can layer in later via a
 * registry in `addons/registry.ts` if/when it's needed.
 */
export const dispatchAddons = (
  ctx: JsonLdContext,
  pageUrl: string,
  rawAddons: unknown,
): AddonsDispatchResult => {
  if (!Array.isArray(rawAddons) || rawAddons.length === 0) return EMPTY;
  const addons = rawAddons as readonly SchemaAddon[];

  const appendBlobs: JsonLdBlob[] = [];
  const manualFaqEntries: Record<string, unknown>[] = [];
  let suppressAutoBreadcrumb = false;
  let breadcrumbOverride: JsonLdBlob | null = null;

  for (const addon of addons) {
    if (!addon || typeof addon !== 'object') continue;
    switch (addon.blockType) {
      case 'howTo': {
        const blob = buildHowToBlob(pageUrl, addon);
        if (blob) appendBlobs.push(blob);
        break;
      }
      case 'videoObject': {
        const blob = buildVideoObjectBlob(pageUrl, addon);
        if (blob) appendBlobs.push(blob);
        break;
      }
      case 'faqPage': {
        const entries = buildManualFaqEntries(addon);
        for (const entry of entries) {
          manualFaqEntries.push(entry as unknown as Record<string, unknown>);
        }
        break;
      }
      case 'review': {
        const blob = buildReviewBlob(pageUrl, addon);
        if (blob) appendBlobs.push(blob);
        break;
      }
      case 'softwareApp': {
        const blob = buildSoftwareApplicationBlob(pageUrl, addon);
        if (blob) appendBlobs.push(blob);
        break;
      }
      case 'breadcrumbList': {
        const bcAddon = addon as BreadcrumbListAddon;
        if (bcAddon.mode === 'suppress') {
          suppressAutoBreadcrumb = true;
        } else if (bcAddon.mode === 'replace') {
          const blob = buildBreadcrumbOverrideBlob(ctx, bcAddon);
          if (blob) {
            breadcrumbOverride = blob;
            suppressAutoBreadcrumb = true;
          }
        }
        break;
      }
      default: {
        // Future block types fall through silently — better than
        // throwing on a payload-types mismatch during a partial deploy.
        break;
      }
    }
  }

  return {
    appendBlobs,
    suppressAutoBreadcrumb,
    breadcrumbOverride,
    manualFaqEntries,
  };
};

/**
 * Apply add-on side effects to a Layer-1 blob list. Replaces /
 * suppresses BreadcrumbList in place, merges manual FAQ entries into
 * an existing FAQPage (or appends a new FAQPage carrying just the
 * manual entries when none exists), and concatenates `appendBlobs` at
 * the end. Returns a new array — never mutates the input.
 */
export const mergeAddons = (
  pageUrl: string,
  layerOne: readonly JsonLdBlob[],
  result: AddonsDispatchResult,
): JsonLdBlob[] => {
  let blobs: JsonLdBlob[] = [...layerOne];

  if (result.suppressAutoBreadcrumb) {
    blobs = blobs.filter((b) => b['@type'] !== 'BreadcrumbList');
  }
  if (result.breadcrumbOverride) {
    blobs.push(result.breadcrumbOverride);
  }

  if (result.manualFaqEntries.length > 0) {
    const faqIdx = blobs.findIndex((b) => b['@type'] === 'FAQPage');
    if (faqIdx >= 0) {
      const original = blobs[faqIdx] as JsonLdBlob & { mainEntity?: unknown };
      const existing = Array.isArray(original.mainEntity)
        ? (original.mainEntity as readonly Record<string, unknown>[])
        : [];
      const merged = [...existing, ...result.manualFaqEntries];
      blobs[faqIdx] = {
        ...original,
        mainEntity: merged,
      } as JsonLdBlob;
    } else {
      const newFaq: JsonLdBlob = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: result.manualFaqEntries as unknown as readonly Record<string, unknown>[],
      } as JsonLdBlob;
      blobs.push(newFaq);
    }
  }

  if (result.appendBlobs.length > 0) {
    blobs = [...blobs, ...result.appendBlobs];
  }

  return blobs;
};
