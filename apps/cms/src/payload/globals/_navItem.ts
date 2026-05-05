import type { Field } from 'payload';

import { isValidExternalLink } from '../lib/url-shape';

/**
 * Discriminated nav-item shape shared by mainNav and footerNav columns.
 *
 * Mega-menu columns reuse the same item shape (one level of nesting only —
 * mega-menu inside mega-menu is forbidden by config). The mega-menu kind is
 * top-level only: nav columns inside footerNav use the same shape via
 * footerNav.columns[].items[].
 *
 * `kind: 'cta'` requires a target (internal doc) OR an href (external URL).
 * The validate function below enforces "exactly one of those is set".
 */
export const navItemFields: Field[] = [
  {
    name: 'kind',
    type: 'select',
    required: true,
    defaultValue: 'internal-doc',
    options: [
      { label: 'Internal doc', value: 'internal-doc' },
      { label: 'External URL', value: 'external-url' },
      { label: 'CTA', value: 'cta' },
    ],
  },
  { name: 'label', type: 'text', required: true },
  {
    name: 'target',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      description:
        'Stored as a doc ID. URL auto-resolves at render — slug changes propagate without editor action.',
      condition: (_data, sibling) =>
        sibling?.kind === 'internal-doc' || sibling?.kind === 'cta',
    },
    validate: (
      value: unknown,
      { siblingData }: { siblingData?: { kind?: string; href?: string | null } },
    ): true | string => {
      if (siblingData?.kind === 'internal-doc' && value == null) {
        return 'Internal-doc nav items need a target page.';
      }
      if (siblingData?.kind === 'cta') {
        const hasTarget = value != null;
        const hasHref =
          typeof siblingData.href === 'string' && siblingData.href.trim().length > 0;
        if (!hasTarget && !hasHref) {
          return 'CTA needs either a target page or an external URL.';
        }
      }
      return true;
    },
  },
  {
    name: 'href',
    type: 'text',
    admin: {
      description: 'External URL. Validated against the allowed link shapes at save.',
      condition: (_data, sibling) =>
        sibling?.kind === 'external-url' || sibling?.kind === 'cta',
    },
    validate: (
      value: string | string[] | null | undefined,
      { siblingData }: { siblingData?: { kind?: string } },
    ): true | string => {
      if (siblingData?.kind === 'external-url') {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'External-url nav items need an href.';
        }
        if (!isValidExternalLink(value)) {
          return 'href must be https?://, /path, mailto:, or tel:.';
        }
      }
      if (siblingData?.kind === 'cta' && typeof value === 'string' && value.length > 0) {
        if (!isValidExternalLink(value)) {
          return 'href must be https?://, /path, mailto:, or tel:.';
        }
      }
      return true;
    },
  },
  {
    name: 'targetBlank',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      condition: (_data, sibling) =>
        sibling?.kind === 'external-url' || sibling?.kind === 'cta',
    },
  },
  {
    name: 'variant',
    type: 'select',
    defaultValue: 'primary',
    options: [
      { label: 'Primary', value: 'primary' },
      { label: 'Secondary', value: 'secondary' },
      { label: 'Ghost', value: 'ghost' },
    ],
    admin: {
      condition: (_data, sibling) => sibling?.kind === 'cta',
    },
  },
  {
    name: 'trackingId',
    type: 'text',
    admin: {
      description: 'Custom analytics event id emitted on click.',
      condition: (_data, sibling) => sibling?.kind === 'cta',
    },
  },
];
