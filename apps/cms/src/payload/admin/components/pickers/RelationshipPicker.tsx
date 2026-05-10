'use client';

import type { ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { Combobox, type ComboboxOption } from '../ui/Combobox';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';

export type RelationshipOptionDoc = {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly thumb?: string | null;
};

export type RelationshipSelection = {
  readonly id: string;
  readonly relationTo: string;
  readonly doc: RelationshipOptionDoc;
};

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  /**
   * Collection slug(s) to query. If multiple, the picker becomes
   * polymorphic — selection emits `{ relationTo, value }` shape.
   */
  readonly relationTo: string | ReadonlyArray<string>;
  /** Existing selection(s), used to highlight the current row. */
  readonly value?: string | ReadonlyArray<string> | null;
  readonly hasMany?: boolean;
  readonly onSelect: (selection: RelationshipSelection | ReadonlyArray<RelationshipSelection>) => void;
  /** Optional Payload `where` query passed straight through to REST. */
  readonly filter?: Record<string, unknown>;
  readonly title?: string;
  /** Field that holds the display title. Defaults to `'title'` then `'name'`. */
  readonly titleField?: string;
};

type RestDoc = Record<string, unknown> & { id: string | number };

const pickThumb = (doc: RestDoc): string | null => {
  const sizes = doc.sizes as Record<string, { url?: string | null }> | undefined;
  const fromSizes = sizes?.thumb?.url ?? sizes?.card?.url;
  if (typeof fromSizes === 'string') return fromSizes;
  if (typeof doc.url === 'string') return doc.url;
  return null;
};

const pickTitle = (doc: RestDoc, preferred?: string): string => {
  if (preferred && typeof doc[preferred] === 'string' && (doc[preferred] as string).trim()) {
    return doc[preferred] as string;
  }
  for (const key of ['title', 'name', 'filename', 'label', 'question']) {
    const v = doc[key];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return String(doc.id);
};

type CollectionResults = {
  readonly relationTo: string;
  readonly docs: ReadonlyArray<RestDoc>;
};

const fetchCollection = async (
  slug: string,
  query: string,
  filter: Record<string, unknown> | undefined,
  signal: AbortSignal,
): Promise<CollectionResults> => {
  const url = new URL(`/api/${slug}`, window.location.origin);
  url.searchParams.set('limit', '24');
  url.searchParams.set('depth', '0');
  url.searchParams.set('sort', '-updatedAt');
  if (query.trim().length > 0) {
    // `like` is the safest cross-field default. Field-specific filters
    // override via `filter` prop.
    url.searchParams.set('where[or][0][title][like]', query.trim());
    url.searchParams.set('where[or][1][name][like]', query.trim());
    url.searchParams.set('where[or][2][filename][like]', query.trim());
  }
  if (filter) {
    for (const [key, raw] of Object.entries(filter)) {
      url.searchParams.set(`where[${key}]`, typeof raw === 'string' ? raw : JSON.stringify(raw));
    }
  }
  const res = await fetch(url.toString(), { credentials: 'include', signal });
  if (!res.ok) return { relationTo: slug, docs: [] };
  const json = (await res.json()) as { docs?: ReadonlyArray<RestDoc> };
  return { relationTo: slug, docs: Array.isArray(json.docs) ? json.docs : [] };
};

/**
 * Drawer-hosted relationship picker. Replaces Payload's `useListDrawer`
 * for the field surface. Polymorphic when `relationTo` is an array — each
 * collection contributes a header row, results merge into one Combobox.
 */
export const RelationshipPicker = (props: Props): ReactElement => {
  const {
    open,
    onClose,
    relationTo,
    value,
    hasMany = false,
    onSelect,
    filter,
    title,
    titleField,
  } = props;

  const titleId = useId();
  const slugs = useMemo<ReadonlyArray<string>>(
    () => (Array.isArray(relationTo) ? relationTo : [relationTo as string]),
    [relationTo],
  );

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReadonlyArray<CollectionResults>>([]);
  const [loading, setLoading] = useState(false);
  const [staged, setStaged] = useState<ReadonlyArray<RelationshipSelection>>([]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    const id = window.setTimeout(() => {
      Promise.all(slugs.map((slug) => fetchCollection(slug, query, filter, controller.signal)))
        .then((all) => {
          if (controller.signal.aborted) return;
          setResults(all);
        })
        .catch((err: unknown) => {
          if ((err as Error)?.name !== 'AbortError') setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [open, query, slugs, filter]);

  useEffect(() => {
    if (!open) {
      setStaged([]);
      setQuery('');
    }
  }, [open]);

  const flat = useMemo<ReadonlyArray<ComboboxOption<string>>>(() => {
    const out: Array<ComboboxOption<string>> = [];
    for (const group of results) {
      for (const doc of group.docs) {
        const id = String(doc.id);
        const option: ComboboxOption<string> = {
          value: `${group.relationTo}:${id}`,
          label: pickTitle(doc, titleField),
          thumb: pickThumb(doc),
        };
        if (slugs.length > 1) {
          out.push({ ...option, description: group.relationTo });
        } else {
          out.push(option);
        }
      }
    }
    return out;
  }, [results, slugs.length, titleField]);

  const docByOptionValue = useMemo<Map<string, { relationTo: string; doc: RestDoc }>>(() => {
    const map = new Map<string, { relationTo: string; doc: RestDoc }>();
    for (const group of results) {
      for (const doc of group.docs) {
        map.set(`${group.relationTo}:${String(doc.id)}`, { relationTo: group.relationTo, doc });
      }
    }
    return map;
  }, [results]);

  const stagedKey = useMemo(() => {
    const set = new Set<string>();
    for (const s of staged) set.add(`${s.relationTo}:${s.id}`);
    return set;
  }, [staged]);

  const isHighlighted = useCallback(
    (optionValue: string): boolean => {
      if (stagedKey.has(optionValue)) return true;
      if (value == null) return false;
      const idPart = optionValue.split(':')[1] ?? '';
      if (Array.isArray(value)) return value.map(String).includes(idPart);
      return String(value) === idPart;
    },
    [stagedKey, value],
  );

  const handlePick = (optionValue: string): void => {
    const hit = docByOptionValue.get(optionValue);
    if (!hit) return;
    const selection: RelationshipSelection = {
      id: String(hit.doc.id),
      relationTo: hit.relationTo,
      doc: {
        id: String(hit.doc.id),
        title: pickTitle(hit.doc, titleField),
        thumb: pickThumb(hit.doc),
      },
    };
    if (!hasMany) {
      onSelect(selection);
      onClose();
      return;
    }
    setStaged((prev) =>
      prev.some((s) => s.relationTo === selection.relationTo && s.id === selection.id)
        ? prev.filter((s) => !(s.relationTo === selection.relationTo && s.id === selection.id))
        : [...prev, selection],
    );
  };

  const commitMulti = (): void => {
    onSelect(staged);
    onClose();
  };

  const renderOption = (opt: ComboboxOption<string>): ReactElement => {
    const highlighted = isHighlighted(opt.value);
    return (
      <>
        {opt.thumb ? (
          <img className="cs-combobox__thumb" src={opt.thumb} alt="" />
        ) : null}
        <span className="cs-combobox__option-text">
          <span className="cs-combobox__option-label">
            {opt.label}
            {highlighted ? <span className="cs-relationship-picker__check"> ✓</span> : null}
          </span>
          {opt.description ? (
            <span className="cs-combobox__option-description">{opt.description}</span>
          ) : null}
        </span>
      </>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} size="lg">
      <DialogHeader
        id={titleId}
        title={title ?? (hasMany ? 'Pick documents' : 'Pick a document')}
        description={slugs.join(' · ')}
        onClose={onClose}
      />
      <DialogBody>
        <Combobox
          options={flat}
          query={query}
          onQueryChange={setQuery}
          onChange={handlePick}
          loading={loading}
          autoFocus
          ariaLabel="Search documents"
          renderOption={renderOption}
        />
      </DialogBody>
      {hasMany ? (
        <DialogFooter>
          <span className="cs-relationship-picker__count">
            {staged.length} selected
          </span>
          <button type="button" className="cs-btn cs-btn--subtle" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="cs-btn cs-btn--primary"
            onClick={commitMulti}
            disabled={staged.length === 0}
          >
            Add {staged.length > 0 ? `(${staged.length})` : ''}
          </button>
        </DialogFooter>
      ) : null}
    </Dialog>
  );
};
