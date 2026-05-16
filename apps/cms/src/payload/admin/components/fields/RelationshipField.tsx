'use client';

import { useField } from '@payloadcms/ui';
import type { RelationshipFieldClientProps } from 'payload';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { QuickCreateDialog } from '@cleanstart/ui';

import { QUICK_CREATE_CONFIG } from '../../lib/quick-create-config';
import { Popover } from '../ui/Popover';
import { Spinner } from '../ui/Spinner';

// =============================================================================
// Row-rendering hints — which fields to surface as primary / secondary in the
// dropdown row for each collection. Falls back to a sensible default. Tune
// per-collection here rather than per-field across 16+ files.
// =============================================================================
type ChipLayout = 'inline' | 'stacked';

type RowHint = {
  readonly primary: ReadonlyArray<string>;
  readonly secondary: ReadonlyArray<string>;
  /**
   * Whether to render a leading avatar / thumb on each dropdown row +
   * pill. People + media → true. Content collections → false (initials
   * on a list of titles is noise).
   */
  readonly showThumb?: boolean;
  /**
   * Whether the "+ New" inline-create affordance is offered. Off for
   * content collections (you don't create a blog post from a relationship
   * picker). Field-level `admin.allowCreate: false` always wins.
   */
  readonly showCreate?: boolean;
  /**
   * How current selections render:
   *  - `'inline'`: chips wrap inside the same bordered field as the
   *    search input, Gmail-recipient style. Best for compact selections
   *    (people, taxonomies, single relations).
   *  - `'stacked'`: each chip is a full-width row above the input,
   *    showing title + type + colored status badge. Best for content
   *    references like Related Posts where editors want at-a-glance
   *    publish-state visibility.
   */
  readonly chipLayout?: ChipLayout;
  /**
   * Display label for the type-badge on stacked chips. Defaults to a
   * Title-Case version of the collection slug.
   */
  readonly typeLabel?: string;
};

const DEFAULT_HINT: RowHint = {
  primary: ['title', 'name', 'filename', 'label', 'question'],
  secondary: [],
  showThumb: true,
  // Default to no "+ New" affordance. Quick-create is the only
  // supported create path; collections opt in by adding an entry to
  // `QUICK_CREATE_CONFIG` AND setting `showCreate: true` in `ROW_HINTS`.
  showCreate: false,
  chipLayout: 'inline',
};

const ROW_HINTS: Record<string, RowHint> = {
  // People + media: inline chips, photo thumbs.
  authors: { primary: ['name'], secondary: ['role', 'location'], showThumb: true, showCreate: true, chipLayout: 'inline' },
  users: { primary: ['email'], secondary: ['name', 'role'], showThumb: true, showCreate: false, chipLayout: 'inline' },
  media: { primary: ['filename'], secondary: ['mimeType', 'alt'], showThumb: true, showCreate: false, chipLayout: 'inline' },

  // Content collections: stacked chips with status badge, no thumbs.
  blogs: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Blog' },
  news: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'News' },
  guides: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Guide' },
  resources: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Resource' },
  pages: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Page' },
  knowledgeBase: { primary: ['title'], secondary: ['slug'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'KB' },
  events: { primary: ['title'], secondary: ['startsAt'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Event' },
  webinars: { primary: ['title'], secondary: ['startsAt'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Webinar' },
  jobs: { primary: ['title'], secondary: ['location'], showThumb: false, showCreate: false, chipLayout: 'stacked', typeLabel: 'Job' },

  // Taxonomies / pickers: inline chips, no thumb, "+ New" allowed.
  categories: { primary: ['name', 'title'], secondary: [], showThumb: false, showCreate: true, chipLayout: 'inline' },
  newsCategories: { primary: ['name', 'title'], secondary: ['slug'], showThumb: false, showCreate: true, chipLayout: 'inline' },
  knowledgeCategories: { primary: ['name', 'title'], secondary: ['slug'], showThumb: false, showCreate: true, chipLayout: 'inline' },
  jobLocations: { primary: ['city'], secondary: ['country'], showThumb: false, showCreate: true, chipLayout: 'inline' },
  forms: { primary: ['name'], secondary: ['slug'], showThumb: false, showCreate: true, chipLayout: 'inline' },
  redirects: { primary: ['from'], secondary: ['to'], showThumb: false, showCreate: false, chipLayout: 'inline' },
};

const titleCaseSlug = (slug: string): string =>
  slug
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

const pickFieldString = (
  doc: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): string | undefined => {
  for (const key of keys) {
    const v = doc[key];
    if (typeof v === 'string' && v.trim().length > 0) return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
};

const pickThumb = (doc: Record<string, unknown>): string | null => {
  // Media docs: thumb / card sizes are preferred over full-size.
  const sizes = doc.sizes as Record<string, { url?: string | null }> | undefined;
  const fromSizes = sizes?.thumb?.url ?? sizes?.card?.url;
  if (typeof fromSizes === 'string') return fromSizes;
  if (typeof doc.url === 'string') return doc.url;
  // Authors etc. with a `photo` relationship — depth=1 returns nested doc.
  const photo = doc.photo as Record<string, unknown> | string | null | undefined;
  if (photo && typeof photo === 'object') {
    const p = photo as { url?: string; sizes?: Record<string, { url?: string }> };
    return p.sizes?.thumb?.url ?? p.url ?? null;
  }
  return null;
};

// =============================================================================
// Stored-value normalisation. Payload accepts several shapes for relationship
// values — single id, array of ids, polymorphic { relationTo, value }, or
// array of those. We always reduce to a stable list of EntryRefs and write
// back in the same shape we received.
// =============================================================================
type EntryRef = { id: string; relationTo: string };
type StoredValue =
  | string
  | number
  | { relationTo: string; value: string | number }
  | ReadonlyArray<string | number | { relationTo: string; value: string | number }>
  | null
  | undefined;

const normalise = (raw: StoredValue, fallbackRelationTo: string): ReadonlyArray<EntryRef> => {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const out: EntryRef[] = [];
  for (const item of list) {
    if (item == null) continue;
    if (typeof item === 'string' || typeof item === 'number') {
      out.push({ id: String(item), relationTo: fallbackRelationTo });
    } else if (typeof item === 'object' && 'relationTo' in item && 'value' in item) {
      out.push({ id: String(item.value), relationTo: item.relationTo });
    }
  }
  return out;
};

const toStored = (
  entries: ReadonlyArray<EntryRef>,
  relationTo: string | string[],
  hasMany: boolean,
): StoredValue => {
  const polymorphic = Array.isArray(relationTo);
  const mapped = entries.map((e) =>
    polymorphic ? { relationTo: e.relationTo, value: e.id } : e.id,
  );
  if (hasMany) return mapped;
  return mapped[0] ?? null;
};

// =============================================================================
// Resolved doc cache — small in-memory map of id → display fields.
// REST is hit once per (collection, id), then served from cache. Survives
// re-mounts (module-scoped Map).
// =============================================================================
type ResolvedDoc = {
  id: string;
  relationTo: string;
  primary: string;
  /** Generic free-form secondary text (slug / role / location / etc.). */
  secondary?: string;
  /** `_status` field if the collection has draft/published versioning. */
  status?: string;
  thumb?: string | null;
};

const docCache = new Map<string, ResolvedDoc>();

const docToResolved = (
  doc: Record<string, unknown>,
  relationTo: string,
): ResolvedDoc => {
  const hint = ROW_HINTS[relationTo] ?? DEFAULT_HINT;
  const id = String(doc.id ?? '');
  const primary = pickFieldString(doc, hint.primary) ?? id;
  const secondaryRaw = pickFieldString(doc, hint.secondary);
  const status = typeof doc._status === 'string' ? (doc._status as string) : undefined;
  const result: ResolvedDoc = {
    id,
    relationTo,
    primary,
    thumb: pickThumb(doc),
  };
  if (secondaryRaw) result.secondary = secondaryRaw;
  if (status) result.status = status;
  return result;
};

const fetchOne = async (relationTo: string, id: string): Promise<ResolvedDoc> => {
  const cacheKey = `${relationTo}:${id}`;
  const hit = docCache.get(cacheKey);
  if (hit) return hit;
  try {
    const res = await fetch(`/api/${relationTo}/${id}?depth=1`, { credentials: 'include' });
    if (!res.ok) {
      const fallback: ResolvedDoc = { id, relationTo, primary: id };
      docCache.set(cacheKey, fallback);
      return fallback;
    }
    const json = (await res.json()) as Record<string, unknown>;
    const resolved = docToResolved(json, relationTo);
    docCache.set(cacheKey, resolved);
    return resolved;
  } catch {
    return { id, relationTo, primary: id };
  }
};

type SearchResults = ReadonlyArray<ResolvedDoc>;

const fetchSearch = async (
  slugs: ReadonlyArray<string>,
  query: string,
  filter: Record<string, unknown> | undefined,
  signal: AbortSignal,
): Promise<SearchResults> => {
  const all: ResolvedDoc[] = [];
  await Promise.all(
    slugs.map(async (slug) => {
      const url = new URL(`/api/${slug}`, window.location.origin);
      url.searchParams.set('limit', '20');
      url.searchParams.set('depth', '1');
      url.searchParams.set('sort', '-updatedAt');
      const trimmed = query.trim();
      if (trimmed.length > 0) {
        // Search across the most likely title-bearing fields. `or` array
        // syntax matches any of them.
        url.searchParams.set('where[or][0][title][like]', trimmed);
        url.searchParams.set('where[or][1][name][like]', trimmed);
        url.searchParams.set('where[or][2][filename][like]', trimmed);
        url.searchParams.set('where[or][3][email][like]', trimmed);
      }
      if (filter) {
        for (const [k, v] of Object.entries(filter)) {
          url.searchParams.set(`where[${k}]`, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
      const res = await fetch(url.toString(), { credentials: 'include', signal });
      if (!res.ok) return;
      const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
      for (const doc of json.docs ?? []) {
        const resolved = docToResolved(doc, slug);
        docCache.set(`${slug}:${resolved.id}`, resolved);
        all.push(resolved);
      }
    }),
  );
  return all;
};

// =============================================================================
// Component
// =============================================================================
export const RelationshipField = (props: RelationshipFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage, customComponents } = useField<StoredValue>({
    path,
  });

  const hasMany = field.hasMany === true;
  const relationToProp = field.relationTo as string | string[];
  const slugs = useMemo<ReadonlyArray<string>>(
    () => (Array.isArray(relationToProp) ? relationToProp : [relationToProp]),
    [relationToProp],
  );
  const fallbackRelationTo = slugs[0] ?? '';
  const readOnly = field.admin?.readOnly === true;
  const filter = (field as { filterOptions?: Record<string, unknown> }).filterOptions;

  const entries = useMemo(() => normalise(value, fallbackRelationTo), [value, fallbackRelationTo]);
  const entriesKey = useMemo(
    () => entries.map((e) => `${e.relationTo}:${e.id}`).join('|'),
    [entries],
  );

  // Resolve titles for current selection pills.
  const [pills, setPills] = useState<ReadonlyArray<ResolvedDoc>>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: entriesKey is the content key for `entries`; using the array reference would refetch on every form tick
  useEffect(() => {
    let cancelled = false;
    if (entries.length === 0) {
      setPills([]);
      return () => {
        cancelled = true;
      };
    }
    void Promise.all(entries.map((e) => fetchOne(e.relationTo, e.id))).then((resolved) => {
      if (!cancelled) setPills(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [entriesKey]);

  // Search state.
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const inputWrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const labelId = useId();

  // Debounced search.
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      fetchSearch(slugs, query, filter, controller.signal)
        .then((docs) => {
          if (controller.signal.aborted) return;
          setResults(docs);
          setActiveIdx(0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setResults([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query, slugs, filter]);

  // Filter out already-selected from the dropdown (only relevant for hasMany).
  const visibleResults = useMemo(() => {
    if (!hasMany) return results;
    const selected = new Set(entries.map((e) => `${e.relationTo}:${e.id}`));
    return results.filter((r) => !selected.has(`${r.relationTo}:${r.id}`));
  }, [results, entries, hasMany]);

  const commit = useCallback(
    (next: ReadonlyArray<EntryRef>): void => {
      setValue(toStored(next, relationToProp, hasMany));
    },
    [relationToProp, hasMany, setValue],
  );

  const handlePick = useCallback(
    (doc: ResolvedDoc): void => {
      const ref: EntryRef = { id: doc.id, relationTo: doc.relationTo };
      if (!hasMany) {
        commit([ref]);
      } else if (!entries.some((e) => e.id === ref.id && e.relationTo === ref.relationTo)) {
        commit([...entries, ref]);
      }
      // Close the dropdown after every pick — single or hasMany. Editor
      // re-clicks the input to add the next one. Less surprising than the
      // dropdown lingering open with the just-picked item now missing
      // from the visible list.
      setOpen(false);
      setQuery('');
    },
    [hasMany, entries, commit],
  );

  const handleRemove = useCallback(
    (ref: EntryRef): void => {
      commit(entries.filter((e) => !(e.id === ref.id && e.relationTo === ref.relationTo)));
    },
    [entries, commit],
  );

  const handleCreated = useCallback(
    (id: string): void => {
      // Use the first relationTo when polymorphic — create flow targets one.
      const ref: EntryRef = { id, relationTo: slugs[0] ?? fallbackRelationTo };
      if (!hasMany) {
        commit([ref]);
      } else if (!entries.some((e) => e.id === ref.id && e.relationTo === ref.relationTo)) {
        commit([...entries, ref]);
      }
      setCreateOpen(false);
    },
    [hasMany, entries, slugs, fallbackRelationTo, commit],
  );

  const onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIdx((i) => Math.min(visibleResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const target = visibleResults[activeIdx];
      if (target) {
        e.preventDefault();
        handlePick(target);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    } else if (e.key === 'Backspace' && query === '' && entries.length > 0) {
      // Backspace on empty input removes the last pill — common combobox UX.
      const last = entries[entries.length - 1];
      if (last) handleRemove(last);
    }
  };

  // --- Rendering ---
  const labelText =
    typeof field.label === 'string'
      ? field.label
      : typeof field.label === 'object' && field.label && 'en' in field.label
        ? String((field.label as Record<string, unknown>).en ?? path)
        : path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;

  const Label = customComponents?.Label;
  const Description = customComponents?.Description;
  const ErrorRender = customComponents?.Error;

  // Per-collection rendering hints driven by the first relationTo slug.
  const primaryHint = ROW_HINTS[slugs[0] ?? ''] ?? DEFAULT_HINT;
  const showThumb = primaryHint.showThumb !== false;
  const chipLayout: ChipLayout = primaryHint.chipLayout ?? 'inline';
  const allowCreate =
    (field.admin as { allowCreate?: boolean } | undefined)?.allowCreate !== false;
  // "+ New" only renders for collections that have a quick-create
  // config — DEFAULT_HINT.showCreate is `false` so unknown collections
  // never offer the affordance. This makes the visible "+ New" set
  // declaratively driven from QUICK_CREATE_CONFIG.
  const quickCreateTarget = slugs[0] ?? fallbackRelationTo;
  const quickCreateConfig = QUICK_CREATE_CONFIG[quickCreateTarget];
  const showCreate = primaryHint.showCreate !== false && allowCreate && quickCreateConfig != null;

  const quickCreateNode =
    createOpen && quickCreateConfig ? (
      <QuickCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={quickCreateConfig.title}
        fields={quickCreateConfig.fields}
        supportsDrafts={quickCreateConfig.supportsDrafts}
        onCheckSlug={async (slug) => {
          const url = new URL(`/api/${quickCreateTarget}`, window.location.origin);
          url.searchParams.set('where[slug][equals]', slug);
          url.searchParams.set('limit', '1');
          url.searchParams.set('depth', '0');
          const res = await fetch(url.toString(), { credentials: 'include' });
          if (!res.ok) return { available: true };
          const json = (await res.json()) as { docs?: unknown[] };
          return { available: (json.docs ?? []).length === 0 };
        }}
        onSubmit={async (values, intent) => {
          const url = new URL(`/api/${quickCreateTarget}`, window.location.origin);
          if (quickCreateConfig.supportsDrafts) {
            url.searchParams.set('draft', String(intent === 'draft'));
          }
          // Strip empty optional fields so we don't write empty strings
          // for fields the editor left untouched. Required + slug fields
          // are already gated non-empty by the dialog's submit guard.
          const body: Record<string, unknown> = {};
          for (const [key, raw] of Object.entries(values)) {
            const trimmed = typeof raw === 'string' ? raw.trim() : raw;
            if (trimmed === '' || trimmed == null) continue;
            body[key] = trimmed;
          }
          if (quickCreateConfig.supportsDrafts) {
            body._status = intent === 'draft' ? 'draft' : 'published';
          }
          const res = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const text = await res.text();
            let message = `Create failed (${res.status})`;
            try {
              const parsed = JSON.parse(text) as { errors?: { message?: string }[] };
              const first = parsed.errors?.[0]?.message;
              if (first) message = first;
            } catch {
              // body wasn't JSON — keep generic message
            }
            throw new Error(message);
          }
          const json = (await res.json()) as { doc?: { id: string | number }; id?: string | number };
          const id = json.doc?.id ?? json.id;
          if (id == null) throw new Error('Create succeeded but no id returned.');
          return { id };
        }}
        onCreated={(id, intent) => {
          handleCreated(String(id));
          try {
            window.dispatchEvent(
              new CustomEvent('cs-cms:toast', {
                detail: {
                  message:
                    intent === 'draft'
                      ? `Draft ${quickCreateConfig.title.toLowerCase().replace(/^new /, '')} created.`
                      : `${quickCreateConfig.title.replace(/^New /, '')} published.`,
                  type: 'success',
                  action: {
                    label: 'Fill in profile →',
                    href: `/admin/collections/${quickCreateTarget}/${id}`,
                  },
                },
              }),
            );
          } catch {
            // toast is best-effort
          }
        }}
      />
    ) : null;

  // Render a single pill — used only for hasMany stacked layout.
  const renderPill = (pill: ResolvedDoc): ReactElement => {
    const hint = ROW_HINTS[pill.relationTo] ?? DEFAULT_HINT;
    const typeLabel = hint.typeLabel ?? titleCaseSlug(pill.relationTo);
    const status = pill.status?.toLowerCase();
    return (
      <span
        key={`${pill.relationTo}:${pill.id}`}
        className={`cs-relationship-field__pill cs-relationship-field__pill--${chipLayout}`}
      >
        {showThumb && pill.thumb ? (
          <img className="cs-relationship-field__thumb" src={pill.thumb} alt="" />
        ) : null}
        <span className="cs-relationship-field__pill-text" title={pill.primary}>
          <span className="cs-relationship-field__pill-primary">{pill.primary}</span>
          {chipLayout === 'inline' && pill.secondary ? (
            <span className="cs-relationship-field__pill-secondary">{pill.secondary}</span>
          ) : null}
        </span>
        {chipLayout === 'stacked' ? (
          <span className="cs-relationship-field__pill-badges">
            <span className="cs-relationship-field__pill-type">{typeLabel}</span>
            {status ? (
              <span
                className={`cs-relationship-field__pill-status cs-relationship-field__pill-status--${status}`}
              >
                {status}
              </span>
            ) : null}
          </span>
        ) : null}
        {!readOnly ? (
          <button
            type="button"
            className="cs-relationship-field__pill-remove"
            onClick={() => handleRemove({ id: pill.id, relationTo: pill.relationTo })}
            aria-label={`Remove ${pill.primary}`}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </span>
    );
  };

  // ─── Single-select: cs-collections-select style (same as SelectField / integrations forms) ───
  if (!hasMany) {
    const selectedPill = pills[0] ?? null;
    const isEmpty = selectedPill === null;
    const listboxId = `${labelId}-listbox`;

    const singleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setActiveIdx((i) => Math.min(i + 1, visibleResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        const target = visibleResults[activeIdx];
        if (target) { e.preventDefault(); handlePick(target); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        setQuery('');
      }
    };

    return (
      <div className={`field-type relationship${showError ? ' field-type--error' : ''}`}>
        {Label ?? (
          <span className="field-label" id={labelId}>
            {labelText}
            {field.required ? <span className="required" aria-hidden="true"> *</span> : null}
          </span>
        )}

        <div className={`cs-collections-select${open ? ' is-open' : ''}${showError ? ' cs-collections-select--error' : ''}`}>
          <div
            className="cs-collections-select__control"
            onClick={() => !readOnly && inputRef.current?.focus()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !readOnly) inputRef.current?.focus();
            }}
          >
            {!readOnly ? (
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-activedescendant={
                  open && visibleResults[activeIdx]
                    ? `${listboxId}-opt-${activeIdx}`
                    : undefined
                }
                aria-labelledby={labelId}
                className="cs-collections-select__input"
                value={open ? query : (selectedPill?.primary ?? '')}
                placeholder={isEmpty ? `Search ${slugs.join(' / ')}…` : ''}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setActiveIdx(0);
                }}
                onFocus={(e) => {
                  setOpen(true);
                  if (!isEmpty) { setQuery(''); e.target.select(); }
                }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={singleKeyDown}
              />
            ) : (
              <span className="cs-collections-select__input cs-collections-select__input--readonly">
                {selectedPill?.primary ?? <em>No selection</em>}
              </span>
            )}

            {loading ? (
              <span className="cs-relationship-field__loading">
                <Spinner size="sm" label="Searching" />
              </span>
            ) : null}

            {!isEmpty && !readOnly ? (
              <button
                type="button"
                className="cs-collections-select__reset"
                aria-label="Clear selection"
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit([]);
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                ×
              </button>
            ) : null}

            {showCreate ? (
              <button
                type="button"
                className="cs-relationship-field__new"
                onClick={() => setCreateOpen(true)}
                title={`Create new ${slugs[0]}`}
                aria-label={`Create new ${slugs[0]}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span>New</span>
              </button>
            ) : null}
          </div>

          {open && !readOnly ? (
            <div
              id={listboxId}
              // biome-ignore lint/a11y/useSemanticElements: custom select listbox; div is required here because a <select> cannot participate in a combobox composite widget
              role="listbox"
              tabIndex={-1}
              aria-label={labelText}
              className="cs-collections-select__dropdown"
            >
              {loading && visibleResults.length === 0 ? (
                <div className="cs-collections-select__empty">Searching…</div>
              ) : visibleResults.length === 0 ? (
                <div className="cs-collections-select__empty">
                  {query ? `No matches for "${query}"` : 'No options'}
                </div>
              ) : (
                visibleResults.map((doc, i) => {
                  const docHint = ROW_HINTS[doc.relationTo] ?? DEFAULT_HINT;
                  const showBadges = docHint.chipLayout === 'stacked';
                  const docTypeLabel = showBadges ? (docHint.typeLabel ?? titleCaseSlug(doc.relationTo)) : null;
                  const status = showBadges ? doc.status?.toLowerCase() : undefined;
                  return (
                    <button
                      key={`${doc.relationTo}:${doc.id}`}
                      id={`${listboxId}-opt-${i}`}
                      type="button"
                      // biome-ignore lint/a11y/useSemanticElements: option inside a custom listbox; native <option> is only valid inside <select>
                      role="option"
                      tabIndex={-1}
                      aria-selected={selectedPill?.id === doc.id}
                      className={`cs-collections-select__option${i === activeIdx ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handlePick(doc);
                      }}
                    >
                      <span className="cs-collections-select__opt-label">{doc.primary}</span>
                      {doc.secondary ? (
                        <span className="cs-collections-select__opt-slug">{doc.secondary}</span>
                      ) : null}
                      {showBadges && (docTypeLabel || status) ? (
                        <span className="cs-relationship-field__pill-badges">
                          {docTypeLabel ? <span className="cs-relationship-field__pill-type">{docTypeLabel}</span> : null}
                          {status ? <span className={`cs-relationship-field__pill-status cs-relationship-field__pill-status--${status}`}>{status}</span> : null}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </div>

        {Description ?? (description ? <p className="field-description">{description}</p> : null)}
        {ErrorRender ??
          (showError && errorMessage ? (
            <output className="field-error" aria-live="polite">
              {errorMessage}
            </output>
          ) : null)}

        {quickCreateNode}
      </div>
    );
  }

  // ─── Multi-select: chip + Popover layout ────────────────────────────────────
  return (
    <div
      className={`field-type relationship cs-relationship-field${
        showError ? ' cs-relationship-field--error' : ''
      }${readOnly ? ' cs-relationship-field--readonly' : ''}${
        showThumb ? '' : ' cs-relationship-field--no-thumb'
      } cs-relationship-field--${chipLayout}`}
    >
      {Label ?? (
        <span className="field-label" id={labelId}>
          {labelText}
          {field.required ? <span className="required" aria-hidden="true"> *</span> : null}
        </span>
      )}

      <div className="cs-relationship-field__control">
        {chipLayout === 'stacked' && pills.length > 0 ? (
          <div className="cs-relationship-field__pills cs-relationship-field__pills--stacked" aria-label="Selected">
            {pills.map(renderPill)}
          </div>
        ) : null}

        {!readOnly ? (
          <div
            className={`cs-relationship-field__inputrow${
              chipLayout === 'inline' && pills.length > 0
                ? ' cs-relationship-field__inputrow--has-chips'
                : ''
            }`}
            ref={inputWrapRef}
            onClick={(e) => {
              if (e.target === e.currentTarget) inputRef.current?.focus();
            }}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                inputRef.current?.focus();
              }
            }}
          >
            {chipLayout === 'inline' && pills.length > 0 ? pills.map(renderPill) : null}

            <input
              ref={inputRef}
              type="search"
              className="cs-relationship-field__input"
              placeholder={pills.length === 0 ? `Search ${slugs.join(' / ')}…` : 'Add more…'}
              value={query}
              onChange={onInputChange}
              onFocus={() => setOpen(true)}
              onKeyDown={onInputKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-controls={`${labelId}-listbox`}
              aria-autocomplete="list"
              aria-labelledby={labelId}
            />
            {loading ? (
              <span className="cs-relationship-field__loading">
                <Spinner size="sm" label="Searching" />
              </span>
            ) : null}
            {showCreate ? (
              <button
                type="button"
                className="cs-relationship-field__new"
                onClick={() => setCreateOpen(true)}
                title={`Create new ${slugs[0]}`}
                aria-label={`Create new ${slugs[0]}`}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 3v10M3 8h10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span>New</span>
              </button>
            ) : null}
          </div>
        ) : pills.length === 0 ? (
          <span className="cs-relationship-field__empty">No selection</span>
        ) : (
          chipLayout === 'inline' ? (
            <div className="cs-relationship-field__pills cs-relationship-field__pills--inline-readonly">
              {pills.map(renderPill)}
            </div>
          ) : null
        )}
      </div>

      {Description ?? (description ? <p className="field-description">{description}</p> : null)}
      {ErrorRender ??
        (showError && errorMessage ? (
          <output className="field-error" aria-live="polite">
            {errorMessage}
          </output>
        ) : null)}

      <Popover
        open={open && !readOnly}
        onClose={() => setOpen(false)}
        anchorRef={inputWrapRef}
        placement="bottom-start"
        offset={4}
        className="cs-relationship-field__popover"
        ariaLabel={`${labelText} results`}
        restoreFocus={false}
        matchAnchorWidth
      >
        <div id={`${labelId}-listbox`} className="cs-relationship-field__results">
          {loading && visibleResults.length === 0 ? (
            <div className="cs-relationship-field__hint">Searching…</div>
          ) : visibleResults.length === 0 ? (
            <div className="cs-relationship-field__hint">
              {query ? `No matches for "${query}"` : 'No more documents'}
            </div>
          ) : (
            visibleResults.map((doc, i) => {
              const docHint = ROW_HINTS[doc.relationTo] ?? DEFAULT_HINT;
              const docTypeLabel = docHint.typeLabel ?? titleCaseSlug(doc.relationTo);
              const showBadges = docHint.chipLayout === 'stacked';
              const status = doc.status?.toLowerCase();
              return (
                <button
                  key={`${doc.relationTo}:${doc.id}`}
                  type="button"
                  className={`cs-relationship-field__row${
                    i === activeIdx ? ' is-active' : ''
                  }`}
                  onClick={() => handlePick(doc)}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {showThumb ? (
                    doc.thumb ? (
                      <img className="cs-relationship-field__row-thumb" src={doc.thumb} alt="" />
                    ) : (
                      <span className="cs-relationship-field__row-thumb cs-relationship-field__row-thumb--initials">
                        {doc.primary.slice(0, 2).toUpperCase()}
                      </span>
                    )
                  ) : null}
                  <span className="cs-relationship-field__row-text">
                    <span className="cs-relationship-field__row-primary">{doc.primary}</span>
                    {!showBadges && doc.secondary ? (
                      <span className="cs-relationship-field__row-secondary">
                        {doc.secondary}
                      </span>
                    ) : null}
                  </span>
                  {showBadges ? (
                    <span className="cs-relationship-field__pill-badges">
                      <span className="cs-relationship-field__pill-type">{docTypeLabel}</span>
                      {status ? (
                        <span
                          className={`cs-relationship-field__pill-status cs-relationship-field__pill-status--${status}`}
                        >
                          {status}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                  {slugs.length > 1 && !showBadges ? (
                    <span className="cs-relationship-field__row-collection">
                      {doc.relationTo}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </Popover>

      {quickCreateNode}
    </div>
  );
};

export default RelationshipField;
