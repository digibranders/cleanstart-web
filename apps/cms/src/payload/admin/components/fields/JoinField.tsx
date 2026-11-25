'use client';

import { useField } from '@payloadcms/ui';
import Link from 'next/link';
import type { JoinFieldClientProps } from 'payload';
import { type ReactElement, useEffect, useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

type JoinId = string | number;
type JoinDoc = { readonly id: JoinId; readonly [k: string]: unknown };

type JoinValue = {
  // Depth 0 returns bare ids; deeper reads return the related docs.
  readonly docs?: ReadonlyArray<JoinId | JoinDoc>;
  readonly hasNextPage?: boolean;
  readonly totalDocs?: number;
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

const docLabel = (doc: JoinDoc): string => {
  const person = [str(doc.firstName), str(doc.lastName)].filter(Boolean).join(' ');
  return str(doc.title) || str(doc.name) || person || str(doc.email) || `#${doc.id}`;
};

/**
 * Custom Join field. Read-only — joins are computed by Payload from
 * the related collection's relationship. We render a compact list of
 * linked docs with a count, deep-linking each to its edit view.
 */
export const JoinField = (props: JoinFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value } = useField<JoinValue | null | undefined>({ path });

  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const raw = value?.docs ?? [];
  const total = value?.totalDocs ?? raw.length;
  const targetCollection =
    typeof (field as { collection?: unknown }).collection === 'string'
      ? ((field as { collection?: string }).collection as string)
      : undefined;
  const resolved = raw.filter((d): d is JoinDoc => typeof d === 'object' && d !== null);
  const ids = raw.map((d) => (typeof d === 'object' && d !== null ? d.id : d));
  const [fetched, setFetched] = useState<Record<string, JoinDoc>>({});
  const idKey = ids.join(',');

  // biome-ignore lint/correctness/useExhaustiveDependencies: idKey stands in for the ids array
  useEffect(() => {
    if (!targetCollection || resolved.length === raw.length || ids.length === 0) return;
    const controller = new AbortController();
    const query = ids.map((id, i) => `where[id][in][${i}]=${encodeURIComponent(String(id))}`);
    fetch(`/api/${targetCollection}?depth=0&limit=${ids.length}&${query.join('&')}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then((body: { docs?: JoinDoc[] }) => {
        setFetched(Object.fromEntries((body.docs ?? []).map((d) => [String(d.id), d])));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [idKey, targetCollection]);

  const docs: JoinDoc[] = ids.map(
    (id) => resolved.find((d) => d.id === id) ?? fetched[String(id)] ?? { id },
  );

  return (
    <div className="cs-join field-type">
      <span className="field-label">{labelText}</span>
      <div className="cs-join__count">
        {total} {total === 1 ? 'item' : 'items'}
      </div>
      {docs.length > 0 ? (
        <ul className="cs-join__list">
          {docs.map((doc) => {
            const id = doc.id;
            const title = docLabel(doc);
            const href = targetCollection
              ? `/admin/collections/${targetCollection}/${id}`
              : undefined;
            return (
              <li key={String(id)} className="cs-join__row">
                {href ? (
                  <Link href={href} className="cs-join__link">
                    {title}
                  </Link>
                ) : (
                  <span>{title}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="cs-join__empty">No related items.</p>
      )}
      {description ? <p className="field-description">{description}</p> : null}
    </div>
  );
};

export default JoinField;
