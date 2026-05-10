'use client';

import { useAllFormFields, useField } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useId, useMemo, useState } from 'react';

import { Dialog, DialogBody, DialogHeader } from './ui/Dialog';

// Schema-add-on block catalogue — kept in lockstep with SCHEMA_ADDON_BLOCKS
// in `apps/cms/src/payload/fields/schema-addons.ts`. Slug + label + helper
// copy are duplicated here so the picker modal works on the client without
// importing the server-side block defs.
type AddonOption = {
  readonly slug: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
};

const ADDON_OPTIONS: ReadonlyArray<AddonOption> = [
  {
    slug: 'howTo',
    label: 'HowTo',
    description: 'Step-by-step guide. Eligible for Google\'s "How-to" rich result.',
    icon: '🪜',
  },
  {
    slug: 'videoObject',
    label: 'Video',
    description: 'Embedded video metadata. Required for Video search results.',
    icon: '🎬',
  },
  {
    slug: 'faqPage',
    label: 'FAQ',
    description: 'Q&A pairs. Eligible for FAQ rich-result accordion in SERP.',
    icon: '❓',
  },
  {
    slug: 'review',
    label: 'Review',
    description: 'Third-party review with rating. Drives star-rating snippets.',
    icon: '⭐',
  },
  {
    slug: 'softwareApp',
    label: 'Software / App',
    description: 'SoftwareApplication metadata for apps, SaaS, downloads.',
    icon: '⚙️',
  },
  {
    slug: 'breadcrumbList',
    label: 'Breadcrumb override',
    description: 'Manual breadcrumb path override. Use only when auto-emitted breadcrumbs are wrong.',
    icon: '🧭',
  },
];

type Entry = { blockType?: string; id?: string };

// Tiny ID — Payload accepts any string for the per-row `id` field. This
// only needs to be unique within the array.
const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const optionLabel = (slug: string | undefined): string => {
  if (!slug) return 'Unknown';
  const opt = ADDON_OPTIONS.find((o) => o.slug === slug);
  return opt?.label ?? slug;
};

/**
 * Read-only chips + custom add button, designed to live INSIDE the
 * Schema (JSON-LD) preview card. Renders one chip per existing
 * `schemaAddons` entry showing its block-type label, plus a "+ Add"
 * trigger that opens the type-picker modal.
 *
 * The standalone `schemaAddons` field still mounts elsewhere in the
 * sidebar (its label/description/empty-state suppressed via SCSS) so
 * Payload's per-block forms (HowTo's name/description/steps[], etc.)
 * stay editable. This section is purely the entry-point UI.
 */
// Map of our card slug (matches the block.slug in schema-addons.ts) to the
// human label Payload's stock blocks-drawer renders on its thumbnail-card
// button. Payload uses `block.labels.singular` for the card text, so we
// match against that. Keep in sync with schema-addons.ts.
const STOCK_DRAWER_LABELS: Record<string, string> = {
  howTo: 'HowTo',
  videoObject: 'Video',
  faqPage: 'FAQ entry',
  review: 'Review',
  softwareApp: 'Software',
  breadcrumbList: 'Breadcrumb override',
};

/**
 * Drive Payload's stock blocks-drawer programmatically. The stock UI is
 * CSS-hidden but still mounted — clicking its toggler from JS opens the
 * drawer (also hidden), and clicking the thumbnail-card matching the
 * block label appends the block via Payload's own internal handlers,
 * which means schemaPath, sub-state, validators, and field rendering
 * all set up correctly. We never reimplement that.
 *
 * Returns a Promise that resolves when the row has been appended (or
 * timeout if the drawer didn't appear).
 */
const driveStockDrawerToAdd = async (slug: string): Promise<void> => {
  const labelToFind = STOCK_DRAWER_LABELS[slug];
  if (!labelToFind) return;

  const toggler = document.querySelector<HTMLButtonElement>(
    '[id$="field-schemaAddons"] .blocks-field__drawer-toggler',
  );
  toggler?.click();

  // Poll for the drawer to appear (Payload mounts it asynchronously).
  for (let i = 0; i < 40; i++) {
    const drawer = document.querySelector('.drawer--is-open');
    if (drawer) {
      const buttons = Array.from(drawer.querySelectorAll<HTMLButtonElement>('button'));
      const target = buttons.find((b) => b.textContent?.trim() === labelToFind);
      if (target) {
        target.click();
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  }
};

export const SchemaAddonsSection = (): ReactElement => {
  // Payload's blocks-field stores `schemaAddons` itself as a row-count
  // (number) in form state, then individual block fields at indexed
  // paths (`schemaAddons.0.blockType`, `schemaAddons.0.id`, etc.). We
  // read the full form-fields map and pull each row's blockType so the
  // chip overview shows the right label.
  const [allFields] = useAllFormFields();
  const { value: rowCount } = useField<number | null | undefined>({
    path: 'schemaAddons',
  });
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const existing = useMemo<ReadonlyArray<Entry>>(() => {
    const count = typeof rowCount === 'number' ? rowCount : 0;
    if (count === 0) return [];
    const out: Entry[] = [];
    for (let i = 0; i < count; i++) {
      const blockTypeField = allFields[`schemaAddons.${i}.blockType`];
      const idField = allFields[`schemaAddons.${i}.id`];
      const entry: Entry = {};
      if (typeof blockTypeField?.value === 'string') entry.blockType = blockTypeField.value;
      if (typeof idField?.value === 'string' || typeof idField?.value === 'number') {
        entry.id = String(idField.value);
      }
      out.push(entry);
    }
    return out;
  }, [allFields, rowCount]);

  const addBlock = useCallback(
    (slug: string): void => {
      void driveStockDrawerToAdd(slug);
      setOpen(false);
    },
    [],
  );

  // Mirror the same trick for removal — click the stock per-row remove
  // affordance rather than mutating value directly. That keeps Payload
  // happy about its sub-state and validators.
  const removeAt = useCallback((idx: number): void => {
    const row = document.getElementById(`schemaAddons-row-${idx}`);
    const removeBtn = row?.querySelector<HTMLButtonElement>(
      '.array-actions__remove, .array-actions__action--remove, [aria-label="Remove" i], button[title*="Remove" i]',
    );
    removeBtn?.click();
  }, []);

  return (
    <div className="cs-schema-addons">
      <div className="cs-schema-addons__header">
        <span className="cs-schema-addons__heading">Layered add-ons</span>
        <button
          type="button"
          className="cs-schema-addons__trigger"
          onClick={() => setOpen(true)}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span>Add</span>
        </button>
      </div>
      {existing.length === 0 ? (
        <p className="cs-schema-addons__empty">
          No add-ons. Layer in HowTo, Video, FAQ, Review, etc. to unlock rich-result
          eligibility on top of the auto-emitted JSON-LD.
        </p>
      ) : (
        <div className="cs-schema-addons__chips">
          {existing.map((entry, i) => (
            <span
              key={entry.id ?? `${entry.blockType}-${i}`}
              className="cs-schema-addons__chip"
            >
              <span className="cs-schema-addons__chip-label">
                {optionLabel(entry.blockType)}
              </span>
              <button
                type="button"
                className="cs-schema-addons__chip-remove"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${optionLabel(entry.blockType)}`}
              >
                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l10 10M13 3L3 13"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} size="lg">
        <DialogHeader
          id={titleId}
          title="Add schema add-on"
          description="Layer extra Schema.org types on top of the auto-emitted JSON-LD."
          onClose={() => setOpen(false)}
        />
        <DialogBody>
          <div className="cs-schema-addons__grid">
            {ADDON_OPTIONS.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                className="cs-schema-addons__card"
                onClick={() => addBlock(opt.slug)}
              >
                <span className="cs-schema-addons__icon" aria-hidden="true">
                  {opt.icon}
                </span>
                <span className="cs-schema-addons__card-text">
                  <span className="cs-schema-addons__card-title">{opt.label}</span>
                  <span className="cs-schema-addons__card-desc">{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
};

/**
 * Legacy entry point — still mounted via `beforeInput` on the
 * schemaAddons field. Now suppressed via SCSS along with the rest of
 * the standalone field chrome; kept exported so the existing config
 * import path keeps resolving.
 */
export const SchemaAddonsAdder = (): ReactElement => {
  const { value, setValue } = useField<ReadonlyArray<Entry> | null | undefined>({
    path: 'schemaAddons',
  });
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const existing = useMemo<ReadonlyArray<Entry>>(
    () => (Array.isArray(value) ? value : []),
    [value],
  );

  const addBlock = useCallback(
    (slug: string): void => {
      const next: Entry[] = [...existing, { blockType: slug, id: newId() }];
      setValue(next);
      setOpen(false);
    },
    [existing, setValue],
  );

  return (
    <div className="cs-schema-addons">
      <button
        type="button"
        className="cs-schema-addons__trigger"
        onClick={() => setOpen(true)}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span>Add schema add-on</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} size="lg">
        <DialogHeader
          id={titleId}
          title="Add schema add-on"
          description="Layer extra Schema.org types on top of the auto-emitted JSON-LD."
          onClose={() => setOpen(false)}
        />
        <DialogBody>
          <div className="cs-schema-addons__grid">
            {ADDON_OPTIONS.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                className="cs-schema-addons__card"
                onClick={() => addBlock(opt.slug)}
              >
                <span className="cs-schema-addons__icon" aria-hidden="true">
                  {opt.icon}
                </span>
                <span className="cs-schema-addons__card-text">
                  <span className="cs-schema-addons__card-title">{opt.label}</span>
                  <span className="cs-schema-addons__card-desc">{opt.description}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
};

export default SchemaAddonsAdder;
