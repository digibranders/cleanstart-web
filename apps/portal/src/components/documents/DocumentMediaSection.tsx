'use client';

import { useState } from 'react';
import { attachMedia } from '@/components/documents/media-client';
import { useToast } from '@/components/ui/toast';
import type { DocumentDto } from '@/lib/dto';
import { removeDocumentMediaAction } from '@/server/actions/documents';
import { MEDIA_ACCEPT, MEDIA_KINDS, MEDIA_LABEL, type MediaKind } from '@/server/files/media';

const TITLE: Record<MediaKind, string> = { poster: 'Poster image', captions: 'Captions' };
const HINT: Record<MediaKind, string> = {
  poster: 'Shown before the video plays. PNG or JPG, up to 2 MB.',
  captions: 'A WebVTT file (.vtt), up to 500 KB. Partners can turn captions on in the player.',
};

/** Staff, videos only: the optional poster image and captions file, added and removed straight away (each is its own saved change). */
export function DocumentMediaSection({ doc, onChanged }: { doc: DocumentDto; onChanged: (doc: DocumentDto) => void }): React.JSX.Element {
  const toast = useToast();
  const [has, setHas] = useState<Record<MediaKind, boolean>>({ poster: doc.hasPoster, captions: doc.hasCaptions });
  const [busy, setBusy] = useState<MediaKind | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const apply = (kind: MediaKind, next: DocumentDto): void => {
    setHas({ poster: next.hasPoster, captions: next.hasCaptions });
    onChanged(next);
    toast(`Saved the ${MEDIA_LABEL[kind]}`);
  };
  const upload = async (kind: MediaKind, file: File): Promise<void> => {
    setBusy(kind);
    setProgress(0);
    setError(null);
    const result = await attachMedia({ documentId: doc.id, kind, file, onProgress: setProgress });
    setBusy(null);
    if (!result.ok) return setError(result.error.message);
    apply(kind, result.data);
  };
  const remove = async (kind: MediaKind): Promise<void> => {
    setBusy(kind);
    setError(null);
    const result = await removeDocumentMediaAction({ id: doc.id, kind });
    setBusy(null);
    if (!result.ok) return setError(result.error.message);
    apply(kind, result.data);
  };

  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <legend className="lbl">Poster and captions</legend>
      {MEDIA_KINDS.map((kind) => (
        <div key={kind} className="fg" style={{ minWidth: 0 }}>
          <span className="lbl" style={{ fontWeight: 500 }}>
            {TITLE[kind]}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="t-sec tnum" role="status" style={{ fontSize: 13 }}>
              {busy === kind ? `Uploading ${progress}%` : has[kind] ? 'Added' : 'None'}
            </span>
            <label className="btn btn-s" style={{ cursor: busy ? 'default' : 'pointer' }}>
              {has[kind] ? 'Replace' : 'Add'}
              <span className="sr"> {MEDIA_LABEL[kind]}</span>
              <input
                type="file"
                className="sr"
                accept={MEDIA_ACCEPT[kind]}
                disabled={busy !== null}
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = '';
                  if (picked) void upload(kind, picked);
                }}
              />
            </label>
            {has[kind] ? (
              <button type="button" className="btn btn-d" disabled={busy !== null} onClick={() => void remove(kind)}>
                Remove<span className="sr"> {MEDIA_LABEL[kind]}</span>
              </button>
            ) : null}
          </div>
          <span className="hint">{HINT[kind]}</span>
        </div>
      ))}
      {error ? (
        <div className="note note-amber" role="alert">
          <span>{error}</span>
        </div>
      ) : null}
    </fieldset>
  );
}
