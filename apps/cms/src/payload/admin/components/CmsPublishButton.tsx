'use client';

import { DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import {
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useLocale,
} from '@payloadcms/ui';
import { formatAdminURL, hasScheduledPublishEnabled } from 'payload/shared';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SchedulePublishDialog } from './SchedulePublishDialog';

/**
 * CleanStart replacement for Payload's stock PublishButton — rendered
 * as a split-button:
 *
 *   [ Publish ▾ ]
 *      └ Schedule publish…   (drafts-enabled collections only;
 *                             disabled while the doc is unsaved)
 *
 * Primary click submits with `_status: 'published'` against the standard
 * collection/global endpoint — identical to the stock button. The
 * chevron drops a single-item menu that opens our SchedulePublishDialog
 * in controlled mode. Stock SubMenuPopupContent + ScheduleDrawer stay
 * disabled (we never call them), so editors only ever see CleanStart
 * surfaces.
 */
const CalendarIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.25" />
    <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

export const CmsPublishButton = (): ReactElement | null => {
  const {
    id,
    collectionSlug,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo();
  const { config, getEntityConfig } = useConfig();
  const { submit } = useForm();
  const modified = useFormModified();
  const { code: localeCode } = useLocale();

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const apiRoute = config.routes?.api ?? '/api';

  const entityConfig = useMemo(() => {
    if (collectionSlug) return getEntityConfig({ collectionSlug });
    if (globalSlug) return getEntityConfig({ globalSlug });
    return undefined;
  }, [collectionSlug, globalSlug, getEntityConfig]);

  const canSchedule =
    entityConfig != null && hasScheduledPublishEnabled(entityConfig) && id != null;
  const hasNewerVersions = unpublishedVersionCount > 0;
  const canPublish =
    hasPublishPermission &&
    (modified || hasNewerVersions || !hasPublishedDoc) &&
    uploadStatus !== 'uploading';

  const publish = useCallback(async (): Promise<void> => {
    if (uploadStatus === 'uploading') return;
    const params = new URLSearchParams({ depth: '0' });
    if (localeCode) params.set('locale', localeCode);
    const basePath = globalSlug
      ? `/globals/${globalSlug}`
      : `/${collectionSlug ?? ''}${id ? `/${id}` : ''}`;
    const action = formatAdminURL({
      apiRoute,
      path: `${basePath}?${params.toString()}` as `/${string}`,
    });
    const result = await submit({
      action,
      overrides: { _status: 'published' },
    });
    if (result) {
      setUnpublishedVersionCount(0);
      setMostRecentVersionIsAutosaved(false);
      setHasPublishedDoc(true);
    }
  }, [
    apiRoute,
    collectionSlug,
    globalSlug,
    id,
    localeCode,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    submit,
    uploadStatus,
  ]);

  // Cmd/Ctrl-Shift-S opens the schedule dialog — only when canSchedule and
  // the dialog is not already open (guard prevents double-open).
  useEffect(() => {
    if (!canSchedule) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        (e.key === 'S' || e.key === 's') &&
        id != null
      ) {
        e.preventDefault();
        setScheduleOpen((prev) => (prev ? prev : true));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [canSchedule, id]);

  const items = useMemo<DropdownMenuItem[]>(
    () => [
      {
        kind: 'item',
        id: 'schedule',
        icon: <CalendarIcon />,
        label: id == null ? 'Save a draft first to schedule' : 'Schedule publish…',
        disabled: id == null,
        ...(id == null ? {} : { shortcut: '⌘⇧S' }),
        onSelect: () => setScheduleOpen(true),
      },
    ],
    [id],
  );

  if (!hasPublishPermission) return null;

  return (
    <div className="cs-publish-menu" ref={anchorRef}>
      <button
        type="button"
        id="action-save"
        className="btn btn--style-primary btn--size-medium btn--withoutPopup cs-publish-menu__inline"
        disabled={!canPublish}
        onClick={() => void publish()}
      >
        Publish
      </button>
      {canSchedule ? (
        <>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium cs-publish-menu__chevron"
            aria-label="More publish actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M3 4.5l3 3 3-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <DropdownMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            anchorRef={anchorRef}
            items={items}
            placement="bottom-end"
            ariaLabel="Publish actions"
          />
          <SchedulePublishDialog
            open={scheduleOpen}
            onClose={() => setScheduleOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
};

export default CmsPublishButton;
