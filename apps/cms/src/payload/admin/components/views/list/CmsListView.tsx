'use client';

import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DropdownMenu,
  type DropdownMenuItem,
} from '@cleanstart/ui';
// useStepNav is a pure context hook (no render output) that owns the admin
// breadcrumb state. CmsListView fully replaces DefaultListView, so we must
// call it here or the breadcrumb stays stale on SPA nav and blank on hard
// refresh. Functionally equivalent to useListQuery (already on the allow-list).
import {
  Gutter,
  PageControls,
  SelectionProvider,
  useConfig,
  useListQuery,
  useStepNav,
} from '@payloadcms/ui';
import type { ClientCollectionConfig } from 'payload';
import type { ListViewClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ColumnPicker } from './ColumnPicker';
import { BulkActionBar } from './BulkActionBar';
import { ListHeader } from './ListHeader';

/**
 * Wave 3 — single shared client list view for every collection.
 *
 * Composition model: Payload's RSC pipeline (apps/cms route handlers)
 * still does the data prep (`PaginatedDocs`, default columns,
 * permissions, query presets, filter resolution). It hands us the
 * pre-rendered `Table` slot. We:
 *   1. wrap with our chrome (header, search, sort summary, column
 *      picker, bulk-action bar)
 *   2. mount `SelectionProvider` so bulk-action cells keep working
 *      (Payload's RSC pipeline already wraps us in `ListQueryProvider`
 *      — re-mounting one here would shadow `data` to undefined and
 *      crash the list view)
 *   3. delegate the actual <table> render to the supplied slot —
 *      virtualisation lands in Wave 8 hardening once column widths
 *      are stable
 *
 * Custom views.list.Component for every collection is wired in
 * payload.config.ts via `wireCustomListView` (mirrors the shape of
 * `wireCustomFields`).
 */
export const CmsListView = (props: ListViewClientProps): ReactElement => {
  const {
    collectionSlug,
    columnState,
    Table,
    BeforeList,
    BeforeListTable,
    AfterList,
    AfterListTable,
    Description,
    hasCreatePermission,
    hasDeletePermission,
    enableRowSelections,
    disableBulkDelete,
    disableBulkEdit,
    newDocumentURL,
    listMenuItems,
  } = props;

  const { config } = useConfig();
  const adminRoute = config.routes.admin as string;
  const collectionConfig = useMemo(
    () =>
      config.collections.find((c) => c.slug === collectionSlug),
    [config, collectionSlug],
  );

  const { data } = useListQuery();
  const { setStepNav } = useStepNav();

  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const menuItems: DropdownMenuItem[] = useMemo(() => {
    const items: DropdownMenuItem[] = [
      {
        kind: 'item',
        id: 'columns',
        label: 'Columns…',
        shortcut: 'C',
        onSelect: () => setColumnPickerOpen(true),
      },
    ];
    if (Array.isArray(listMenuItems) && listMenuItems.length > 0) {
      items.push({ kind: 'separator', id: 'sep-payload' });
      // Stock items rendered as raw nodes — wrap each in an item slot.
      // The dropdown contract expects label as ReactNode, so we splice
      // them in via the wrapper below.
      for (let i = 0; i < listMenuItems.length; i++) {
        items.push({
          kind: 'item',
          id: `payload-${i}`,
          label: <span>{listMenuItems[i]}</span>,
          onSelect: () => {},
        });
      }
    }
    return items;
  }, [listMenuItems]);

  const collectionLabel = useMemo(() => {
    const lbl = collectionConfig?.labels?.plural;
    if (typeof lbl === 'string') return lbl;
    if (lbl && typeof lbl === 'object' && 'en' in lbl) {
      return String((lbl as Record<string, unknown>).en ?? collectionSlug);
    }
    return collectionSlug;
  }, [collectionConfig, collectionSlug]);

  const singularLabel = useMemo(() => {
    const lbl = collectionConfig?.labels?.singular;
    if (typeof lbl === 'string') return lbl;
    if (lbl && typeof lbl === 'object' && 'en' in lbl) {
      return String((lbl as Record<string, unknown>).en ?? collectionSlug);
    }
    return collectionSlug;
  }, [collectionConfig, collectionSlug]);

  const isEmpty = data !== undefined && (data?.docs?.length ?? 0) === 0;

  useEffect(() => {
    setStepNav([{ label: collectionLabel, url: `${adminRoute}/collections/${collectionSlug}` }]);
  }, [setStepNav, collectionLabel, adminRoute, collectionSlug]);

  return (
    <SelectionProvider docs={data?.docs ?? []} totalDocs={data?.totalDocs ?? 0}>
      <div className="cs-list">
          <Gutter className="cs-list__gutter">
            {BeforeList}
            <ListHeader
              collectionLabel={collectionLabel}
              collectionSlug={collectionSlug}
              description={Description}
              hasCreatePermission={hasCreatePermission}
              newDocumentURL={newDocumentURL}
              menuAnchorRef={menuAnchorRef}
              onMenuToggle={() => setMenuOpen((o) => !o)}
            />
            <DropdownMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={menuAnchorRef}
              items={menuItems}
              ariaLabel={`${collectionLabel} actions`}
            />

            {enableRowSelections ? (
              <BulkActionBar
                collectionSlug={collectionSlug}
                {...(hasDeletePermission !== undefined ? { hasDeletePermission } : {})}
                {...(disableBulkDelete !== undefined ? { disableBulkDelete } : {})}
                {...(disableBulkEdit !== undefined ? { disableBulkEdit } : {})}
              />
            ) : null}

            {BeforeListTable}
            <section
              className={`cs-list__table${isEmpty ? ' cs-list__table--empty' : ''}`}
              aria-label={`${collectionLabel} list`}
            >
              {isEmpty ? (
                <div className="cs-list__empty">
                  <span className="cs-list__empty-title">
                    No {collectionLabel.toLowerCase()} yet
                  </span>
                  <span className="cs-list__empty-sub">
                    Create your first one to see it listed here.
                  </span>
                  {hasCreatePermission && newDocumentURL ? (
                    <a href={newDocumentURL}>Create {singularLabel}</a>
                  ) : null}
                </div>
              ) : (
                Table
              )}
            </section>
            {AfterListTable}

            {collectionConfig && (data?.docs?.length ?? 0) > 0 ? (
              <PageControls collectionConfig={collectionConfig as ClientCollectionConfig} />
            ) : null}

            {AfterList}
          </Gutter>

          <Drawer
            open={columnPickerOpen}
            onClose={() => setColumnPickerOpen(false)}
            ariaLabel="Manage columns"
            side="right"
            size="sm"
          >
            <DrawerHeader
              title="Columns"
              subtitle="Show, hide, and reorder."
              onClose={() => setColumnPickerOpen(false)}
            />
            <DrawerBody>
              <ColumnPicker columnState={columnState} />
            </DrawerBody>
          </Drawer>
      </div>
    </SelectionProvider>
  );
};

export default CmsListView;
