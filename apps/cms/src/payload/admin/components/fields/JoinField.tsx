'use client';

import { useField } from '@payloadcms/ui';
import Link from 'next/link';
import type { JoinFieldClientProps } from 'payload';
import type { ReactElement } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

type JoinValue = {
  readonly docs?: ReadonlyArray<{ readonly id: string | number; readonly [k: string]: unknown }>;
  readonly hasNextPage?: boolean;
  readonly totalDocs?: number;
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
  const docs = value?.docs ?? [];
  const total = value?.totalDocs ?? docs.length;
  const targetCollection =
    typeof (field as { collection?: unknown }).collection === 'string'
      ? ((field as { collection?: string }).collection as string)
      : undefined;

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
            const title =
              typeof doc.title === 'string'
                ? doc.title
                : typeof doc.name === 'string'
                  ? doc.name
                  : `#${id}`;
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
