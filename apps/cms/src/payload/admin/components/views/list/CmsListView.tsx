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
  SelectionProvider,
  TableColumnsProvider,
  useConfig,
  useListQuery,
  useStepNav,
} from '@payloadcms/ui';
import type { ListViewClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ColumnPicker } from './ColumnPicker';
import { ColumnResizer } from './ColumnResizer';
import { BulkActionBar } from './BulkActionBar';
import { ListHeader } from './ListHeader';

/** Dispatched to ColumnResizer to clear all per-editor column widths. */
const COLUMN_RESET_EVENT = 'cs-col-resize:reset';

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

  const { data, query, refineListData } = useListQuery();
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
      {
        kind: 'item',
        id: 'reset-column-widths',
        label: 'Reset column widths',
        onSelect: () => {
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent(COLUMN_RESET_EVENT));
          }
        },
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

  const activeSearch =
    typeof query.search === 'string' && query.search.trim().length > 0
      ? query.search.trim()
      : '';
  const hasActiveFilters =
    query.where !== undefined &&
    query.where !== null &&
    typeof query.where === 'object' &&
    Object.keys(query.where as Record<string, unknown>).length > 0;
  const isFiltered = activeSearch !== '' || hasActiveFilters;

  const clearLabel =
    activeSearch !== '' && hasActiveFilters
      ? 'Clear search and filters'
      : activeSearch !== ''
        ? 'Clear search'
        : 'Clear filters';

  const onClearFilters = (): void => {
    if (!refineListData) return;
    void refineListData({ search: '', where: {}, page: 1 });
  };

  // Pagination footer derived state. `pagingCounter` (1-based index of the
  // first doc on the page) gives an exact range start; `docs.length`
  // handles the final partial page so the range end never overshoots
  // totalDocs.
  const totalDocs = data?.totalDocs ?? 0;
  const currentLimit = data?.limit ?? 10;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const docsOnPage = data?.docs?.length ?? 0;
  const rangeStart = totalDocs === 0 ? 0 : (currentPage - 1) * currentLimit + 1;
  const rangeEnd = totalDocs === 0 ? 0 : rangeStart + docsOnPage - 1;
  const perPageOptions = useMemo(
    () =>
      Array.from(new Set([10, 20, 50, 100, currentLimit])).sort(
        (a, b) => a - b,
      ),
    [currentLimit],
  );

  const onPerPageChange = (next: number): void => {
    if (!refineListData || !Number.isFinite(next) || next <= 0) return;
    // Reset to page 1 — the current page may not exist at the new limit.
    void refineListData({ limit: next, page: 1 });
  };

  useEffect(() => {
    setStepNav([{ label: collectionLabel, url: `${adminRoute}/collections/${collectionSlug}` }]);
  }, [setStepNav, collectionLabel, adminRoute, collectionSlug]);

  return (
    <SelectionProvider docs={data?.docs ?? []} totalDocs={data?.totalDocs ?? 0}>
      <TableColumnsProvider collectionSlug={collectionSlug} columnState={columnState}>
        <div className="cs-list">
          <div className="cs-list__gutter">
            {BeforeList}
            <ListHeader
              collectionLabel={collectionLabel}
              collectionSlug={collectionSlug}
              description={Description}
              hasCreatePermission={hasCreatePermission}
              menuOpen={menuOpen}
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
                {...(hasCreatePermission !== undefined ? { hasCreatePermission } : {})}
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
                isFiltered ? (
                  <div className="cs-list__empty cs-list__empty--filtered">
                    <span className="cs-list__empty-title">
                      No matching {collectionLabel.toLowerCase()}
                    </span>
                    <span className="cs-list__empty-sub">
                      {activeSearch !== ''
                        ? `No ${collectionLabel.toLowerCase()} match “${activeSearch}”. Try a different term${
                            hasActiveFilters ? ' or adjust your filters' : ''
                          }.`
                        : `No ${collectionLabel.toLowerCase()} match the current filters. Try adjusting or clearing them.`}
                    </span>
                    <button
                      type="button"
                      className="cs-list__empty-action"
                      onClick={onClearFilters}
                    >
                      {clearLabel}
                    </button>
                  </div>
                ) : (
                  <div className="cs-list__empty">
                    <span className="cs-list__empty-title">
                      No {collectionLabel.toLowerCase()} yet
                    </span>
                    <span className="cs-list__empty-sub">
                      Create your first {singularLabel.toLowerCase()} to see it listed here.
                    </span>
                    {hasCreatePermission && newDocumentURL ? (
                      <a href={newDocumentURL}>Create {singularLabel.toLowerCase()}</a>
                    ) : null}
                  </div>
                )
              ) : (
                <>
                  {Table}
                  <ColumnResizer collectionSlug={collectionSlug} />
                </>
              )}
            </section>
            {AfterListTable}

            {data && totalDocs > 0 ? (
              <nav className="cs-list__pagination" aria-label="Pagination">
                <span className="cs-list__pagination-count">
                  <strong>
                    {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
                  </strong>{' '}
                  of {totalDocs.toLocaleString()}
                </span>

                <div className="cs-list__pagination-controls">
                  {totalPages > 1 ? (
                    <div className="cs-list__pagination-pages">
                      <button
                        type="button"
                        className="cs-btn cs-btn--subtle"
                        disabled={!data.hasPrevPage}
                        onClick={() => {
                          if (data.page != null && data.page > 1 && refineListData) {
                            void refineListData({ page: data.page - 1 });
                          }
                        }}
                        aria-label="Previous page"
                      >
                        ‹ Prev
                      </button>
                      <span className="cs-list__page-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        className="cs-btn cs-btn--subtle"
                        disabled={!data.hasNextPage}
                        onClick={() => {
                          if (data.page != null && refineListData) {
                            void refineListData({ page: data.page + 1 });
                          }
                        }}
                        aria-label="Next page"
                      >
                        Next ›
                      </button>
                    </div>
                  ) : null}

                  <label className="cs-list__per-page">
                    <span className="cs-list__per-page-label">Per page</span>
                    <select
                      className="cs-native-select cs-list__per-page-select"
                      value={currentLimit}
                      onChange={(e) => onPerPageChange(Number(e.target.value))}
                      aria-label="Rows per page"
                    >
                      {perPageOptions.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </nav>
            ) : null}

            {AfterList}
          </div>

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
      </TableColumnsProvider>
    </SelectionProvider>
  );
};

export default CmsListView;
