'use client';

import { ConfirmDialog, DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import {
  useConfig,
  useDocumentInfo,
  useForm,
  useFormModified,
  useLocale,
} from '@payloadcms/ui';
import { formatAdminURL, hasDraftsEnabled, hasScheduledPublishEnabled } from 'payload/shared';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SchedulePublishDialog } from './SchedulePublishDialog';
import { showToast } from './ToastBus';

/**
 * CleanStart replacement for Payload's stock PublishButton — rendered
 * as a split-button:
 *
 *   [ Publish ▾ ]
 *      ├ Schedule publish…   (drafts-enabled collections only)
 *      ┊ ─────────────
 *      └ Unpublish           (danger; published docs only)
 *
 * Primary click submits with `_status: 'published'` against the standard
 * collection/global endpoint — identical to the stock button. The
 * chevron drops a menu with Schedule publish… (opens SchedulePublishDialog
 * in controlled mode) and Unpublish, which mirrors Payload's stock
 * UnpublishButton (PATCH `_status: 'draft'`, all locales) behind a
 * ConfirmDialog. The native kebab Unpublish entry is hidden via CSS
 * (`#action-unpublish` in _buttons.scss) so the action lives in one place.
 * Stock SubMenuPopupContent + ScheduleDrawer stay disabled (we never call
 * them), so editors only ever see CleanStart surfaces.
 */
const CalendarIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M1 5.5h12" stroke="currentColor" strokeWidth="1.25" />
    <path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

const UnpublishIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M1.5 7s2-3.75 5.5-3.75S12.5 7 12.5 7s-2 3.75-5.5 3.75S1.5 7 1.5 7Z"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <circle cx="7" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.25" />
    <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);

export const CmsPublishButton = (): ReactElement | null => {
  const {
    id,
    collectionSlug,
    data,
    globalSlug,
    hasPublishedDoc,
    hasPublishPermission,
    isTrashed,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
    unpublishedVersionCount,
    uploadStatus,
  } = useDocumentInfo();
  const { config, getEntityConfig } = useConfig();
  const { reset, submit } = useForm();
  const modified = useFormModified();
  const { code: localeCode } = useLocale();

  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [unpublishBusy, setUnpublishBusy] = useState(false);

  const apiRoute = config.routes?.api ?? '/api';

  const entityConfig = useMemo(() => {
    if (collectionSlug) return getEntityConfig({ collectionSlug });
    if (globalSlug) return getEntityConfig({ globalSlug });
    return undefined;
  }, [collectionSlug, globalSlug, getEntityConfig]);

  const canSchedule =
    entityConfig != null && hasScheduledPublishEnabled(entityConfig) && id != null;
  const canUnpublish =
    hasPublishPermission === true &&
    hasPublishedDoc === true &&
    isTrashed !== true &&
    entityConfig != null &&
    hasDraftsEnabled(entityConfig);
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

  // Mirrors Payload's stock UnpublishButton: a direct PATCH (POST for
  // globals) of `_status: 'draft'` against the saved document — it does NOT
  // submit the form, so unsaved/invalid edits don't block unpublishing.
  // `unpublishAllLocales` matches the stock primary action.
  const handleUnpublish = useCallback(async (): Promise<void> => {
    if (id == null && !globalSlug) return;
    setUnpublishBusy(true);
    try {
      const params = new URLSearchParams({
        depth: '0',
        'fallback-locale': 'null',
        unpublishAllLocales: 'true',
      });
      const basePath = globalSlug
        ? `/globals/${globalSlug}`
        : `/${collectionSlug ?? ''}/${id ?? ''}`;
      const action = formatAdminURL({
        apiRoute,
        path: `${basePath}?${params.toString()}` as `/${string}`,
      });
      const res = await fetch(action, {
        method: globalSlug ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _status: 'draft' }),
      });
      if (res.status === 200) {
        await reset({ ...(data ?? {}), _status: 'draft' });
        setUnpublishedVersionCount(1);
        setMostRecentVersionIsAutosaved(false);
        setHasPublishedDoc(false);
        setUnpublishOpen(false);
        showToast({ message: 'Unpublished — the document is now a draft.', type: 'success' });
      } else {
        let message = 'Could not unpublish the document.';
        try {
          const json = (await res.json()) as {
            errors?: { message?: string }[];
            error?: string;
          };
          message = json.errors?.[0]?.message ?? json.error ?? message;
        } catch {
          // Non-JSON error body — keep the default message.
        }
        showToast({ message, type: 'error' });
      }
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Failed to unpublish the document.',
        type: 'error',
      });
    } finally {
      setUnpublishBusy(false);
    }
  }, [
    apiRoute,
    collectionSlug,
    data,
    globalSlug,
    id,
    reset,
    setHasPublishedDoc,
    setMostRecentVersionIsAutosaved,
    setUnpublishedVersionCount,
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

  const items = useMemo<DropdownMenuItem[]>(() => {
    const arr: DropdownMenuItem[] = [];

    if (canSchedule) {
      arr.push({
        kind: 'item',
        id: 'schedule',
        icon: <CalendarIcon />,
        label: 'Schedule publish…',
        shortcut: '⌘⇧S',
        onSelect: () => setScheduleOpen(true),
      });
    }

    if (canUnpublish) {
      if (arr.length > 0) arr.push({ kind: 'separator', id: 'sep-unpublish' });
      arr.push({
        kind: 'item',
        id: 'unpublish',
        tone: 'danger',
        icon: <UnpublishIcon />,
        label: 'Unpublish',
        onSelect: () => setUnpublishOpen(true),
      });
    }

    return arr;
  }, [canSchedule, canUnpublish]);

  if (!hasPublishPermission) return null;

  const hasMenu = items.length > 0;

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
      {hasMenu ? (
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
        </>
      ) : null}
      {canSchedule ? (
        <SchedulePublishDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      ) : null}
      {canUnpublish ? (
        <ConfirmDialog
          open={unpublishOpen}
          onClose={() => (unpublishBusy ? undefined : setUnpublishOpen(false))}
          onConfirm={() => void handleUnpublish()}
          title="Unpublish this document?"
          description="The document reverts to a draft and stops appearing on the live site. You can republish it at any time."
          confirmLabel={unpublishBusy ? 'Unpublishing…' : 'Unpublish'}
          cancelLabel="Keep published"
          tone="danger"
          busy={unpublishBusy}
        />
      ) : null}
    </div>
  );
};

export default CmsPublishButton;
