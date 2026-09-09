import { z } from 'zod';

import { type LeadAttribution, deriveChannel } from './lead-handlers/attribution';

/**
 * Wire shape for marketing attribution, shared by every public submission
 * endpoint so a field accepted on one form is accepted identically on the
 * others.
 *
 * `channel` is deliberately absent: the endpoint derives it server-side from
 * the UTMs, click IDs and referrer, so a submitter cannot label their own
 * traffic as paid search.
 */

export const utmSchema = z
  .object({
    campaign: z.string().max(256).optional(),
    source: z.string().max(256).optional(),
    medium: z.string().max(256).optional(),
    term: z.string().max(256).optional(),
    content: z.string().max(256).optional(),
  })
  .optional();

export const attributionSchema = z
  .object({
    device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    gclid: z.string().max(512).optional(),
    fbclid: z.string().max(512).optional(),
    liFatId: z.string().max(512).optional(),
    firstTouch: z
      .object({
        source: z.string().max(256).optional(),
        medium: z.string().max(256).optional(),
        campaign: z.string().max(256).optional(),
        term: z.string().max(256).optional(),
        content: z.string().max(256).optional(),
        landingPage: z.string().max(2048).optional(),
        referrer: z.string().max(2048).optional(),
        at: z.string().datetime().optional(),
      })
      .optional(),
  })
  .optional();

export type UtmInput = z.infer<typeof utmSchema>;
export type AttributionInput = z.infer<typeof attributionSchema>;

/**
 * Builds the stored attribution object from a submission's `utm` and
 * `attribution` payloads.
 *
 * `channel` is always derived here rather than read from the client, so a
 * submitter cannot label their own traffic. Returns undefined when there is no
 * signal at all, so an untagged submission stores nothing rather than an object
 * full of empty strings.
 */
export const buildAttribution = (input: {
  utm?: UtmInput;
  attribution?: AttributionInput;
}): LeadAttribution | undefined => {
  if (input.attribution == null && input.utm == null) return undefined;
  return {
    ...(input.attribution ?? {}),
    channel: deriveChannel({
      utm: input.utm,
      referrer: input.attribution?.firstTouch?.referrer,
      gclid: input.attribution?.gclid,
      fbclid: input.attribution?.fbclid,
      liFatId: input.attribution?.liFatId,
    }),
  };
};

/**
 * Flattens attribution into the null-filled shape Payload's generated types
 * want. The DB columns are nullable, and `exactOptionalPropertyTypes` makes
 * `undefined` and `null` incompatible, so every key is written explicitly.
 *
 * Shared by the four public submission endpoints so a field cannot be stored on
 * one form and quietly dropped on another.
 */
export const attributionColumns = (input: {
  utm?: UtmInput;
  attribution?: LeadAttribution | undefined;
}) => {
  const utm = input.utm ?? {};
  const attribution = input.attribution ?? {};
  const firstTouch = attribution.firstTouch ?? {};
  return {
    utm: {
      campaign: utm.campaign ?? null,
      source: utm.source ?? null,
      medium: utm.medium ?? null,
      term: utm.term ?? null,
      content: utm.content ?? null,
    },
    attribution: {
      channel: attribution.channel ?? null,
      device: attribution.device ?? null,
      gclid: attribution.gclid ?? null,
      fbclid: attribution.fbclid ?? null,
      liFatId: attribution.liFatId ?? null,
      firstTouch: {
        source: firstTouch.source ?? null,
        medium: firstTouch.medium ?? null,
        campaign: firstTouch.campaign ?? null,
        term: firstTouch.term ?? null,
        content: firstTouch.content ?? null,
        landingPage: firstTouch.landingPage ?? null,
        referrer: firstTouch.referrer ?? null,
        at: firstTouch.at ?? null,
      },
    },
  };
};
