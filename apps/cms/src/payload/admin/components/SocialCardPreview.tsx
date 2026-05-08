'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

type Platform = 'facebook' | 'x' | 'linkedin';

type SocialCardPreviewProps = {
  /** Effective OG image URL (after fallback chain). */
  imageUrl?: string | null;
  /** Effective OG title (after fallback chain). */
  title?: string | null;
  /** Effective OG description (after fallback chain). */
  description?: string | null;
  /** Effective canonical URL (host shown in card chrome). */
  canonicalUrl?: string | null;
};

/**
 * Live mock of how this page will appear when shared on Facebook,
 * X (Twitter), and LinkedIn. Rendered from the same OG title /
 * description / image / canonical the JSON-LD + (future) HTML meta
 * tags consume, so editors can see the social card without having
 * to publish-and-share.
 *
 * Three tabs over a single card surface — each platform has its own
 * crop / typography / character truncation rules. The implementation
 * matches each platform's documented public spec as of 2026:
 *   - Facebook OGP: 1200×630, ~95-char title cap before "...", ~3-line
 *     description truncation
 *   - X (summary_large_image): 1200×675, ~70-char title, no
 *     description on most clients
 *   - LinkedIn: 1200×627, ~150-char title, no description on most
 *     clients
 *
 * The truncation lengths are conservative (real platforms vary by
 * client and viewport) — better to show the editor a short version
 * than over-promise space they may not have.
 */
export const SocialCardPreview = (props: SocialCardPreviewProps): ReactElement => {
  const [active, setActive] = useState<Platform>('facebook');
  const title = props.title?.trim() || 'Untitled';
  const description = props.description?.trim() || '';
  const imageUrl = props.imageUrl?.trim() || null;
  const host = (() => {
    try {
      return props.canonicalUrl ? new URL(props.canonicalUrl).hostname.replace(/^www\./, '') : '';
    } catch {
      return '';
    }
  })();

  const TABS: { key: Platform; label: string }[] = [
    { key: 'facebook', label: 'Facebook' },
    { key: 'x', label: 'X' },
    { key: 'linkedin', label: 'LinkedIn' },
  ];

  return (
    <div className="cs-social-preview">
      <div className="cs-social-preview__tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={
              active === tab.key
                ? 'cs-social-preview__tab cs-social-preview__tab--active'
                : 'cs-social-preview__tab'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cs-social-preview__stage" data-platform={active}>
        {active === 'facebook' && (
          <FacebookCard imageUrl={imageUrl} title={title} description={description} host={host} />
        )}
        {active === 'x' && <XCard imageUrl={imageUrl} title={title} host={host} />}
        {active === 'linkedin' && (
          <LinkedInCard imageUrl={imageUrl} title={title} host={host} />
        )}
      </div>
    </div>
  );
};

const truncate = (s: string, n: number): string =>
  s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;

const Thumb = ({
  imageUrl,
  aspect,
}: {
  imageUrl: string | null;
  aspect: '1.91:1' | '1.78:1' | '1.91:1-li';
}): ReactElement => {
  const className = `cs-social-preview__thumb cs-social-preview__thumb--${aspect.replace(/[:.]/g, '_')}`;
  return (
    <div className={className} aria-hidden="true">
      {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : <span>No image</span>}
    </div>
  );
};

const FacebookCard = ({
  imageUrl,
  title,
  description,
  host,
}: {
  imageUrl: string | null;
  title: string;
  description: string;
  host: string;
}): ReactElement => (
  <div className="cs-social-preview__card cs-social-preview__card--fb">
    <Thumb imageUrl={imageUrl} aspect="1.91:1" />
    <div className="cs-social-preview__meta">
      <div className="cs-social-preview__host">{host || 'cleanstart.com'}</div>
      <div className="cs-social-preview__title">{truncate(title, 95)}</div>
      {description && (
        <div className="cs-social-preview__desc">{truncate(description, 200)}</div>
      )}
    </div>
  </div>
);

const XCard = ({
  imageUrl,
  title,
  host,
}: {
  imageUrl: string | null;
  title: string;
  host: string;
}): ReactElement => (
  <div className="cs-social-preview__card cs-social-preview__card--x">
    <Thumb imageUrl={imageUrl} aspect="1.78:1" />
    <div className="cs-social-preview__x-overlay">
      <div className="cs-social-preview__title cs-social-preview__title--x">
        {truncate(title, 70)}
      </div>
      <div className="cs-social-preview__host cs-social-preview__host--x">
        {host || 'cleanstart.com'}
      </div>
    </div>
  </div>
);

const LinkedInCard = ({
  imageUrl,
  title,
  host,
}: {
  imageUrl: string | null;
  title: string;
  host: string;
}): ReactElement => (
  <div className="cs-social-preview__card cs-social-preview__card--li">
    <Thumb imageUrl={imageUrl} aspect="1.91:1-li" />
    <div className="cs-social-preview__meta">
      <div className="cs-social-preview__title">{truncate(title, 150)}</div>
      <div className="cs-social-preview__host">{host || 'cleanstart.com'}</div>
    </div>
  </div>
);
