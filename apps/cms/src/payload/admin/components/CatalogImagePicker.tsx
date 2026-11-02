'use client';

import { useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useId, useMemo, useState } from 'react';

import { filterCatalogNames } from '../../lib/catalog-images';
import { Combobox, type ComboboxOption } from './ui/Combobox';
import { Dialog, DialogBody, DialogHeader } from './ui/Dialog';

type Props = {
  readonly path: string;
  readonly label: string;
  readonly description?: string;
};

type Names = { phase: 'idle' } | { phase: 'loading' } | { phase: 'ready'; names: string[] } | { phase: 'failed' };

/** Enough rows to scroll through; typing narrows the rest. */
const MAX_ROWS = 300;

const noteStyle = {
  display: 'block',
  marginTop: '0.25rem',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  color: 'var(--theme-text-soft, var(--theme-elevation-600))',
} as const;

const loadNames = async (): Promise<string[] | null> => {
  try {
    const res = await fetch('/api/catalog-images', { credentials: 'include' });
    if (!res.ok) return null;
    const body = (await res.json()) as { available?: boolean; names?: string[] };
    return body.available === true && Array.isArray(body.names) ? body.names : null;
  } catch {
    return null;
  }
};

/**
 * Picker for a catalog image name, in place of a text box where the editor
 * had to type the portal name exactly. Reads the list from
 * `/api/catalog-images` the first time it opens. The stored value stays the
 * plain name, so the web app reads it the same way as before.
 */
export const CatalogImagePicker = ({ path, label, description }: Props): ReactElement => {
  const { value, setValue } = useField<string | null>({ path });
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [names, setNames] = useState<Names>({ phase: 'idle' });

  useEffect(() => {
    if (!open || names.phase !== 'idle') return;
    setNames({ phase: 'loading' });
    loadNames().then((loaded) => setNames(loaded ? { phase: 'ready', names: loaded } : { phase: 'failed' }));
  }, [open, names.phase]);

  const options = useMemo<ReadonlyArray<ComboboxOption<string>>>(
    () =>
      names.phase === 'ready'
        ? filterCatalogNames(names.names, query)
            .slice(0, MAX_ROWS)
            .map((name) => ({ value: name, label: name }))
        : [],
    [names, query],
  );

  const chosen = typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  const close = (): void => {
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="field-type" style={{ marginBottom: '1.25rem' }}>
      <span className="field-label">{label}</span>
      {description ? <span style={noteStyle}>{description}</span> : null}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          {chosen ? <code>{chosen}</code> : <span style={noteStyle}>Automatic, click to choose one</span>}
        </span>
        <button type="button" className="cs-btn cs-btn--subtle" onClick={() => setOpen(true)}>
          {chosen ? 'Change image' : 'Choose image'}
        </button>
        {chosen ? (
          <button type="button" className="cs-btn cs-btn--subtle" onClick={() => setValue(null)}>
            Clear
          </button>
        ) : null}
      </div>

      <Dialog open={open} onClose={close} labelledBy={titleId} size="lg">
        <DialogHeader
          id={titleId}
          title="Pick a catalog image"
          description="From images.cleanstart.com"
          onClose={close}
        />
        <DialogBody>
          <Combobox
            options={options}
            value={chosen}
            query={query}
            onQueryChange={setQuery}
            onChange={(name) => {
              setValue(name);
              close();
            }}
            loading={names.phase === 'loading'}
            emptyLabel={names.phase === 'failed' ? 'The catalog could not be loaded just now.' : 'No images match.'}
            autoFocus
            ariaLabel="Search catalog images"
          />
        </DialogBody>
      </Dialog>
    </div>
  );
};
