import type { JsonLdContext } from './context';
import { type AuthorSource, personRefId } from './person';
import {
  imageObjectFromMedia,
  onlyResolved,
  type ResolvedMedia,
} from './shared';
import type { JsonLdBlob } from './types';

/**
 * Event-attendance mode discriminator. Webinars are always Online;
 * physical events default to Offline. Mixed (in-person + livestream)
 * is supported but requires explicit caller opt-in.
 */
export type EventAttendanceMode = 'Online' | 'Offline' | 'Mixed';

const ATTENDANCE_MODE_URI: Record<EventAttendanceMode, string> = {
  Online: 'https://schema.org/OnlineEventAttendanceMode',
  Offline: 'https://schema.org/OfflineEventAttendanceMode',
  Mixed: 'https://schema.org/MixedEventAttendanceMode',
};

export interface EventSource {
  /** Canonical absolute URL — used for both `@id` and `mainEntityOfPage`. */
  readonly url: string;
  readonly title: string;
  readonly description?: string | null;
  readonly heroImage?: ResolvedMedia | null;
  readonly startsAt?: string | null;
  readonly endsAt?: string | null;
  readonly attendanceMode: EventAttendanceMode;
  /** Place name for offline / mixed events. Falls back to "TBA" when missing. */
  readonly venue?: string | null;
  /**
   * Virtual-location URL for online / mixed events. Should point at
   * the live stream / recording. Falls back to the event's own URL so
   * Schema.org's required `location.url` is never empty.
   */
  readonly virtualUrl?: string | null;
  /** Authors registered as speakers / presenters. */
  readonly speakers?: readonly (AuthorSource | number | null | undefined)[] | null;
  /** External or in-house registration URL. Becomes the Offer.url. */
  readonly registrationUrl?: string | null;
  /** Cancelled / postponed override. Defaults to EventScheduled. */
  readonly status?: 'scheduled' | 'cancelled' | 'postponed';
  /** Optional max attendees. Encoded as Offer.eligibleQuantity. */
  readonly capacity?: number | null;
  /**
   * Original start date before the event was rescheduled. Surfaced as
   * Schema.org Event.previousStartDate when present — Google's
   * official reschedule signal that lets SERP show "rescheduled from
   * X" without losing the rich-result chip.
   */
  readonly previousStartDate?: string | null;
}

const STATUS_URI: Record<NonNullable<EventSource['status']>, string> = {
  scheduled: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
  postponed: 'https://schema.org/EventPostponed',
};

const buildLocation = (
  ctx: JsonLdContext,
  source: EventSource,
): Record<string, unknown> => {
  if (source.attendanceMode === 'Online') {
    return {
      '@type': 'VirtualLocation',
      url: source.virtualUrl && source.virtualUrl.length > 0 ? source.virtualUrl : source.url,
    };
  }
  // Offline + Mixed both carry a Place. Mixed additionally surfaces the
  // virtual URL — schema.org allows `location` to be an array, so we
  // append a VirtualLocation when both signals are present.
  const place: Record<string, unknown> = {
    '@type': 'Place',
    name: source.venue && source.venue.length > 0 ? source.venue : 'To be announced',
    // We don't capture structured addresses today. Editors can add a
    // PostalAddress when the venue field is upgraded.
  };
  if (source.attendanceMode === 'Mixed' && source.virtualUrl) {
    return [
      place,
      { '@type': 'VirtualLocation', url: source.virtualUrl },
    ] as unknown as Record<string, unknown>;
  }
  void ctx; // referenced for future address composition; silence noUnusedParameters
  return place;
};

const buildPerformers = (
  ctx: JsonLdContext,
  speakers: EventSource['speakers'],
): unknown[] => {
  const resolved = onlyResolved(
    speakers as readonly (Record<string, unknown> | number | null | undefined)[] | null,
  ) as AuthorSource[];
  const out: unknown[] = [];
  for (const speaker of resolved) {
    if (!speaker.slug || !speaker.name) continue;
    const id = personRefId(ctx, speaker);
    if (!id) continue;
    out.push({
      '@type': 'Person',
      '@id': id,
      name: speaker.name,
    });
  }
  return out;
};

/**
 * Schema.org Event blob. Used for both `events` (typically offline /
 * mixed) and `webinars` (always online — caller passes
 * `attendanceMode: 'Online'`).
 *
 * Returns null when the bare-minimum required fields (title, url,
 * startsAt) are missing — Google's Rich Results test marks Events
 * without a startDate as invalid, so we'd rather emit nothing.
 */
export const buildEventBlob = (
  ctx: JsonLdContext,
  source: EventSource,
): JsonLdBlob | null => {
  if (!source.title || !source.url || !source.startsAt) return null;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': source.url,
    name: source.title,
    startDate: source.startsAt,
    eventAttendanceMode: ATTENDANCE_MODE_URI[source.attendanceMode],
    eventStatus: STATUS_URI[source.status ?? 'scheduled'],
    location: buildLocation(ctx, source),
    organizer: { '@id': ctx.organizationId },
  };

  if (source.endsAt) blob.endDate = source.endsAt;
  if (source.description) blob.description = source.description;
  if (source.previousStartDate && source.status === 'postponed') {
    blob.previousStartDate = source.previousStartDate;
  }

  const image = imageObjectFromMedia(source.heroImage);
  if (image) blob.image = image;

  const performers = buildPerformers(ctx, source.speakers);
  if (performers.length > 0) blob.performer = performers;

  if (source.registrationUrl && source.registrationUrl.length > 0) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: source.registrationUrl,
      availability: 'https://schema.org/InStock',
      // Schema.org requires `price` on Offer; we encode "free to
      // register" rather than omitting (omission triggers a Google
      // warning on event eligibility).
      price: '0',
      priceCurrency: 'USD',
    };
    if (typeof source.capacity === 'number' && source.capacity > 0) {
      offer.eligibleQuantity = {
        '@type': 'QuantitativeValue',
        maxValue: source.capacity,
      };
    }
    blob.offers = offer;
  }

  return blob as JsonLdBlob;
};
