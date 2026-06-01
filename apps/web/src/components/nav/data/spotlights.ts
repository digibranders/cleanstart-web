export type SpotlightCard =
  | { kind: 'event'; title: string; slug: string; startsAt: string }
  | { kind: 'webinar'; title: string; slug: string; startsAt: string }
  | { kind: 'careers'; openRoles: number }
  | { kind: 'cms'; headline: string; sub?: string; ctaLabel: string; ctaHref: string; image?: string }
  | { kind: 'evergreen'; id: 'bulletin' | 'community' };

export const BULLETIN_EVERGREEN: SpotlightCard = { kind: 'evergreen', id: 'bulletin' };
// Company's evergreen fallback when there are no open roles: point people to the
// open-source community instead of ending the menu on a "not hiring" note.
export const COMMUNITY_EVERGREEN: SpotlightCard = { kind: 'evergreen', id: 'community' };

type CmsSpotlight = {
  headline: string;
  sub?: string;
  ctaLabel: string;
  ctaHref: string;
  image?: string;
  expiresAt?: string;
};

function isExpired(expiresAt: string | undefined, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < now;
}

function toCmsCard(cms: CmsSpotlight): SpotlightCard {
  const card: Extract<SpotlightCard, { kind: 'cms' }> = {
    kind: 'cms',
    headline: cms.headline,
    ctaLabel: cms.ctaLabel,
    ctaHref: cms.ctaHref,
  };
  if (cms.sub !== undefined) card.sub = cms.sub;
  if (cms.image !== undefined) card.image = cms.image;
  return card;
}

export async function resolveResourcesSpotlight(deps: {
  now: Date;
  fetchNextEvent: () => Promise<{ title: string; slug: string; startsAt: string } | null>;
  fetchNextWebinar: () => Promise<{ title: string; slug: string; startsAt: string } | null>;
  fetchSpotlightGlobal: () => Promise<CmsSpotlight | null>;
}): Promise<SpotlightCard> {
  const event = await deps.fetchNextEvent();
  if (event) return { kind: 'event', ...event };

  const webinar = await deps.fetchNextWebinar();
  if (webinar) return { kind: 'webinar', ...webinar };

  const cms = await deps.fetchSpotlightGlobal();
  if (cms && !isExpired(cms.expiresAt, deps.now)) return toCmsCard(cms);

  return BULLETIN_EVERGREEN;
}

export async function resolveCompanySpotlight(deps: {
  now: Date;
  fetchOpenRoles: () => Promise<number>;
  fetchSpotlightGlobal: () => Promise<CmsSpotlight | null>;
}): Promise<SpotlightCard> {
  const roles = await deps.fetchOpenRoles();
  if (roles > 0) return { kind: 'careers', openRoles: roles };

  const cms = await deps.fetchSpotlightGlobal();
  if (cms && !isExpired(cms.expiresAt, deps.now)) return toCmsCard(cms);

  return COMMUNITY_EVERGREEN;
}
