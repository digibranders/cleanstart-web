'use client';

import { useFormFields } from '@payloadcms/ui';
import type { ReactElement } from 'react';

const chip = (tone: 'ok' | 'warn' | 'plain'): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 12,
  background:
    tone === 'ok' ? 'var(--theme-success-100)' : tone === 'warn' ? 'var(--theme-warning-100)' : 'var(--theme-elevation-100)',
  color:
    tone === 'ok' ? 'var(--theme-success-800)' : tone === 'warn' ? 'var(--theme-warning-800)' : 'var(--theme-elevation-800)',
});

const ago = (iso: string): string => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
};

/**
 * Top of the video edit screen: the video itself and the facts about it on YouTube, so an editor
 * sees what they are filing before they scroll to the fields. Shows nothing on a video that has not
 * been saved yet, because there is no YouTube id to show.
 */
export const VideoSourceSummary = (): ReactElement | null => {
  const [externalId, youtubeTitle, privacy, embeddable, fetchedAt] = useFormFields(([fields]) => [
    fields.externalId?.value,
    fields['source.title']?.value,
    fields['source.privacyStatus']?.value,
    fields['source.embeddable']?.value,
    fields['source.fetchedAt']?.value,
  ]);
  if (typeof externalId !== 'string' || externalId.length === 0) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${externalId}`;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
      <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${externalId}/mqdefault.jpg`}
          alt="Open the video on YouTube"
          width={192}
          height={108}
          style={{ display: 'block', width: 192, height: 108, objectFit: 'cover', borderRadius: 8 }}
        />
      </a>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)' }}>Title on YouTube</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
          {typeof youtubeTitle === 'string' && youtubeTitle ? youtubeTitle : 'Not synced yet'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {typeof privacy === 'string' ? <span style={chip(privacy === 'private' ? 'warn' : 'ok')}>{privacy === 'public' ? 'Public' : privacy === 'unlisted' ? 'Unlisted' : 'Private'}</span> : null}
          {embeddable === true ? <span style={chip('ok')}>Can embed</span> : null}
          {embeddable === false ? <span style={chip('warn')}>Can't be embedded</span> : null}
          {typeof fetchedAt === 'string' ? (
            // The age depends on the clock, which differs between the server render and the browser.
            <span style={chip('plain')} suppressHydrationWarning>
              Synced {ago(fetchedAt)}
            </span>
          ) : null}
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
            Open on YouTube
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoSourceSummary;
