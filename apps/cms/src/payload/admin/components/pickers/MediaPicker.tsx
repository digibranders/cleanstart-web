'use client';

import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Spinner,
} from '@cleanstart/ui';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

type MediaDoc = {
  readonly id: string | number;
  readonly url?: string | null;
  readonly thumbnailURL?: string | null;
  readonly filename?: string | null;
  readonly alt?: string | null;
  readonly mimeType?: string | null;
};

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect: (doc: MediaDoc) => void;
  readonly title?: string;
};

const fetchMedia = async (page: number, search: string): Promise<MediaDoc[]> => {
  const params = new URLSearchParams({
    limit: '24',
    page: String(page),
    sort: '-updatedAt',
  });
  if (search) params.set('where[filename][like]', search);
  const res = await fetch(`/api/media?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { docs?: MediaDoc[] };
  return json.docs ?? [];
};

/**
 * Wave 6 — Media picker drawer. Replaces the stock list-drawer for
 * upload-relationship surfaces. Shows a thumbnail grid with infinite
 * scroll + filename search. Selection fires `onSelect` with the full
 * media doc; the consumer translates that to whatever shape its
 * field uses (typically just the id).
 */
export const MediaPicker = (props: Props): ReactElement => {
  const { open, onClose, onSelect, title = 'Pick media' } = props;
  const [docs, setDocs] = useState<MediaDoc[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // biome-ignore lint/correctness/useExhaustiveDependencies: search-driven refetch is handled by onSearchChange (which resets page to 1)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetchMedia(page, search).then((rows) => {
      if (page === 1) setDocs(rows);
      else setDocs((prev) => [...prev, ...rows]);
      setLoading(false);
    });
  }, [open, page]);

  const onSearchChange = (next: string): void => {
    setSearch(next);
    setPage(1);
    setLoading(true);
    void fetchMedia(1, next).then((rows) => {
      setDocs(rows);
      setLoading(false);
    });
  };

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={title} side="right" size="lg">
      <DrawerHeader title={title} onClose={onClose} />
      <DrawerBody>
        <input
          type="search"
          className="cs-text-field__input"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {loading && docs.length === 0 ? (
          <div className="cs-media-picker__loading">
            <Spinner label="Loading media" />
          </div>
        ) : null}
        <ul className="cs-media-picker__grid">
          {docs.map((doc) => (
            <li key={String(doc.id)}>
              <button
                type="button"
                className="cs-media-picker__tile"
                onClick={() => onSelect(doc)}
                title={doc.filename ?? `#${doc.id}`}
              >
                {doc.thumbnailURL || doc.url ? (
                  <img
                    src={doc.thumbnailURL ?? doc.url ?? ''}
                    alt={doc.alt ?? doc.filename ?? ''}
                    loading="lazy"
                  />
                ) : (
                  <span className="cs-media-picker__tile-placeholder">
                    {doc.mimeType ?? 'file'}
                  </span>
                )}
                <span className="cs-media-picker__tile-name">
                  {doc.filename ?? `#${doc.id}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DrawerBody>
      <DrawerFooter>
        <button
          type="button"
          className="cs-btn cs-btn--subtle"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
        >
          Load more
        </button>
      </DrawerFooter>
    </Drawer>
  );
};

export default MediaPicker;
