'use client';

import { useConfig, useListQuery } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { ListFilterFieldConfig } from './list-filter-config';
import { LIST_FILTER_FIELDS } from './list-filter-config';
import type { FilterPillOption } from './MultiSelectFilterPill';
import { MultiSelectFilterPill } from './MultiSelectFilterPill';
import { selectionsFromWhere, whereWithSelections } from './list-filter-where';

type Props = {
  readonly collectionSlug: string;
};

const relationshipOptionsCache = new Map<string, Promise<FilterPillOption[]>>();

const fetchRelationshipOptions = (
  serverURL: string,
  apiRoute: string,
  relationTo: string,
  labelField: string,
): Promise<FilterPillOption[]> => {
  const cacheKey = `${relationTo}:${labelField}`;
  const cached = relationshipOptionsCache.get(cacheKey);
  if (cached) return cached;

  const promise = fetch(
    `${serverURL}${apiRoute}/${relationTo}?limit=200&depth=0&sort=${labelField}`,
    { credentials: 'include' },
  )
    .then((res) => (res.ok ? res.json() : { docs: [] }))
    .then((body: { docs?: Array<Record<string, unknown>> }) =>
      (body.docs ?? []).map((doc) => ({
        value: String(doc.id),
        label: String(doc[labelField] ?? doc.id),
      })),
    )
    .catch(() => []);

  relationshipOptionsCache.set(cacheKey, promise);
  return promise;
};

/**
 * Multiselect filter row for the list view, configured per collection via
 * `LIST_FILTER_FIELDS`. Reads/writes the shared list `where` clause through
 * `useListQuery`, so it composes with search, saved views, and the
 * "Clear filters" action already wired in `CmsListView`.
 */
export const ListFilterBar = (props: Props): ReactElement | null => {
  const { collectionSlug } = props;
  const fields = LIST_FILTER_FIELDS[collectionSlug];
  const { query, refineListData } = useListQuery();
  const { config } = useConfig();

  const [optionsByField, setOptionsByField] = useState<Record<string, FilterPillOption[]>>({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!fields) return;
    const serverURL = config.serverURL ?? '';
    const apiRoute = config.routes?.api ?? '/api';
    const relationshipFields = fields.filter(
      (f): f is Extract<ListFilterFieldConfig, { kind: 'relationship' }> =>
        f.kind === 'relationship',
    );
    if (relationshipFields.length === 0) return;

    setLoadingFields(new Set(relationshipFields.map((f) => f.name)));
    let cancelled = false;

    void Promise.all(
      relationshipFields.map((f) =>
        fetchRelationshipOptions(serverURL, apiRoute, f.relationTo, f.labelField ?? 'name').then(
          (opts) => [f.name, opts] as const,
        ),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setOptionsByField(Object.fromEntries(entries));
      setLoadingFields(new Set());
    });

    return () => {
      cancelled = true;
    };
  }, [fields, config.serverURL, config.routes?.api]);

  const selections = useMemo(
    () => (fields ? selectionsFromWhere(query.where, fields) : {}),
    [query.where, fields],
  );

  if (!fields) return null;

  const onFieldChange = (field: ListFilterFieldConfig, next: ReadonlyArray<string>): void => {
    if (!refineListData) return;
    const nextSelections = { ...selections, [field.name]: next };
    void refineListData({ where: whereWithSelections(query.where, fields, nextSelections), page: 1 });
  };

  const onClearAll = (): void => {
    if (!refineListData) return;
    void refineListData({ where: whereWithSelections(query.where, fields, {}), page: 1 });
  };

  const hasAnySelection = fields.some((f) => (selections[f.name]?.length ?? 0) > 0);

  return (
    // biome-ignore lint/a11y/useSemanticElements: this groups a row of independent filter pills, not a <form> — a <fieldset> here would need a wrapping <form> it doesn't have
    <div className="cs-filter-bar" role="group" aria-label="Filters">
      {fields.map((field) => {
        const options: ReadonlyArray<FilterPillOption> =
          field.kind === 'options' ? field.options : (optionsByField[field.name] ?? []);
        return (
          <MultiSelectFilterPill
            key={field.name}
            label={field.label}
            options={options}
            selected={selections[field.name] ?? []}
            loading={loadingFields.has(field.name)}
            onChange={(next) => onFieldChange(field, next)}
          />
        );
      })}
      {hasAnySelection ? (
        <button type="button" className="cs-filter-bar__clear-all" onClick={onClearAll}>
          Clear all
        </button>
      ) : null}
    </div>
  );
};
