#!/usr/bin/env node
/**
 * Wave 8 lock-in — verify imports from `@payloadcms/ui` stay on the
 * data-layer allow-list. Render-side exports (Button, Drawer, Modal,
 * Pill, etc.) are owned by `@cleanstart/ui` and must not leak in.
 *
 * Run via:
 *   pnpm --filter @cleanstart/cms verify:payload-ui
 *
 * The allow-list mirrors the contract documented in CLAUDE.md.
 *
 * This script is intentionally a small, dep-free node executable so it
 * can run in CI alongside `verify:types` without a biome plugin.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ALLOW_LIST = new Set<string>([
  'useField',
  'useFormFields',
  'useDocumentInfo',
  'useDocumentDrawer',
  'useDocumentDrawerContext',
  'useListQuery',
  'useTableColumns',
  'useSelection',
  'useAuth',
  'useConfig',
  'useLocale',
  'useTranslation',
  'useEditDepth',
  'usePayloadAPI',
  'useForm',
  'useFormSubmitted',
  'useFormProcessing',
  'useFormModified',
  'useAllFormFields',
  'useRowLabel',
  'useNav',
  'useDebounce',
  'useDebouncedCallback',
  'useDebouncedEffect',
  'useDelay',
  'useDelayedRender',
  'useHotkey',
  'useIntersect',
  'useResize',
  'useThrottledEffect',
  'useEffectEvent',
  'useUseTitleField',
  'useFieldPath',
  'useQueue',
  'useClickOutside',
  'useClickOutsideContext',
  'useDraggableSortable',
  'ListQueryProvider',
  'SelectionProvider',
  'TableColumnsProvider',
  // `RowLabelProvider` is the context-side counterpart of `useRowLabel`
  // (already allowed): it threads `path` and `rowNumber` down to nested
  // field components so they can resolve the row label without prop
  // drilling. Pure context wiring, no render surface — same shape as the
  // other *Provider entries above.
  'RowLabelProvider',
  'FieldPathContext',
  'Gutter',
  // Phase D primitives still allowed during the multi-wave migration —
  // Wave 6 + Wave 4 part 2 will remove them.
  'BulkUpload',
  'BulkUploadProvider',
  'BulkUploadDrawer',
  'useBulkUpload',
  'useBulkUploadDrawerSlug',
  'documentDrawerBaseClass',
  'getHTMLDiffComponents',
  'escapeDiffHTML',
  'unescapeDiffHTML',
  'fieldComponents',
  // ----- transitional render-side imports (TODO: remove in later waves) -----
  // `PopupList` is used in DocKebabExtras.tsx pending replacement with
  // @cleanstart/ui DropdownMenu under the kebab. Tracked as part of
  // Wave 6.
  'PopupList',
  // `RenderFields` composes the inner field tree of structural fields
  // (Group, Collapsible, Tabs, Array, Blocks). It owns the
  // intersection-observer lazy-render pipeline tied into Payload's
  // RSC route. Replacing it cleanly is a Wave 8 follow-up; until then
  // our structural field components import it to delegate inner-tree
  // composition while owning the chrome.
  'RenderFields',
  // `DocumentFields` wraps RenderFields with the <form> element,
  // autosave orchestration, server-action error boundaries, and the
  // field-state initialisation contract (initialValue vs value) that
  // Payload's RSC edit-route relies on. CmsEditView owns the chrome
  // (header, sidebar, controls) but must delegate the form body to
  // this seam — reimplementing it here would duplicate the entire
  // Payload form layer. Replace only when we have a first-party form
  // shell; track as a Wave 9+ task.
  'DocumentFields',
  // `PageControls` renders Payload's built-in pagination bar (prev /
  // next page, per-page selector). CmsListView will eventually replace
  // it with a @cleanstart/ui Pagination primitive; until that component
  // exists this stays on the list. Tracked as part of Wave 9.
  'PageControls',
  // `useStepNav` is a pure context hook — it renders nothing. It
  // manages the admin breadcrumb state. CmsListView replaces
  // DefaultListView entirely, so it must call useStepNav itself or the
  // breadcrumb stays stale on SPA nav and blank on hard refresh.
  // Functionally equivalent to useListQuery (already allowed).
  'useStepNav',
  // `useServerFunctions` is a pure data-layer hook — it exposes the
  // server-action seam (incl. `schedulePublish`) Payload uses internally,
  // and renders nothing. CmsSchedulePublishDialog calls it so the
  // `payload-jobs` row shape stays identical to Payload's stock drawer
  // (correct input shape + `waitUntil`). No render surface touched.
  'useServerFunctions',
]);

const TARGET = '@payloadcms/ui';

type Hit = {
  readonly file: string;
  readonly imported: string;
};

const walk = async (dir: string): Promise<ReadonlyArray<string>> => {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.turbo') continue;
      out.push(...(await walk(full)));
    } else if (
      e.isFile() &&
      (e.name.endsWith('.ts') ||
        e.name.endsWith('.tsx') ||
        e.name.endsWith('.js') ||
        e.name.endsWith('.jsx'))
    ) {
      out.push(full);
    }
  }
  return out;
};

const IMPORT_RX = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@payloadcms\/ui['"]/g;

const main = async (): Promise<void> => {
  const root = path.resolve(process.cwd(), 'src');
  const files = await walk(root);
  const hits: Hit[] = [];
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    if (!text.includes(TARGET)) continue;
    let match: RegExpExecArray | null;
    IMPORT_RX.lastIndex = 0;
    while ((match = IMPORT_RX.exec(text)) !== null) {
      const named = match[1] ?? '';
      const symbols = named
        .split(',')
        .map((s) => s.trim().split(/\s+as\s+/)[0]?.trim())
        .filter((s): s is string => Boolean(s));
      for (const sym of symbols) {
        if (!ALLOW_LIST.has(sym)) {
          hits.push({ file: path.relative(process.cwd(), file), imported: sym });
        }
      }
    }
  }
  if (hits.length > 0) {
    console.error(
      `\n@payloadcms/ui allow-list violation — ${hits.length} forbidden render-side import(s).\n`,
    );
    for (const h of hits) {
      console.error(`  - ${h.file} :: ${h.imported}`);
    }
    console.error(
      `\nAllowed exports live in scripts/check-payload-ui-allowlist.ts. Render-side\n` +
        `components MUST come from @cleanstart/ui. See CLAUDE.md for the contract.\n`,
    );
    process.exit(1);
  }
  console.info(
    `@payloadcms/ui import audit ✓ — ${files.length} files scanned, all imports on allow-list.`,
  );
};

void main();
