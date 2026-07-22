'use client';

import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';

import { resolveInternalPath, toStoredUrl } from './internal-routes';
import { type InternalPick, LinkInternalSearch } from './LinkInternalSearch';

import './LinkPopover.scss';

export type LinkPopoverDoc = {
  collection: string;
  id: string;
  title?: string;
};

export type LinkPopoverValue = {
  doc: LinkPopoverDoc | null;
  // When linkType is 'internal', either `doc` is set (CMS-managed
  // page) OR `url` is a relative path like `/about-us` / `#anchor`
  // for static pages that aren't in the CMS. Exactly one is set.
  internalPath: string | null;
  linkType: 'external' | 'internal';
  newTab: boolean;
  rel: string;
  url: string;
};

const REL_OPTIONS = ['follow', 'nofollow', 'sponsored', 'ugc'] as const;

const POPOVER_WIDTH = 360;
const POPOVER_HEIGHT_ESTIMATE = 260;
const VIEWPORT_PAD = 8;

const computePosition = (
  rect: DOMRect,
  anchorElem: HTMLElement | null,
): { left: number; top: number } => {
  const containerRect = anchorElem?.getBoundingClientRect();
  const offsetLeft = containerRect ? containerRect.left : 0;
  const offsetTop = containerRect ? containerRect.top : 0;

  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 768;

  let left = rect.left;
  if (left + POPOVER_WIDTH > viewportWidth - VIEWPORT_PAD) {
    left = viewportWidth - POPOVER_WIDTH - VIEWPORT_PAD;
  }
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

  let top = rect.bottom + 8;
  if (top + POPOVER_HEIGHT_ESTIMATE > viewportHeight - VIEWPORT_PAD) {
    top = rect.top - POPOVER_HEIGHT_ESTIMATE - 8;
  }
  if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;

  return { left: left - offsetLeft, top: top - offsetTop };
};

type Props = {
  /** The selection rect used to position the popover. */
  anchorRect: DOMRect;
  /**
   * The container element the popover is portalled into (the editor's
   * parent element). Passed down from `LinkPopoverPlugin` so
   * `computePosition` offsets correctly for whichever editor instance
   * opened the popover — avoiding the `document.querySelector` bug that
   * picks the first editor on multi-editor pages.
   */
  anchorElem: HTMLElement;
  initial: LinkPopoverValue;
  mode: 'create' | 'edit';
  onClose: () => void;
  onRemove: () => void;
  onSave: (value: LinkPopoverValue) => void;
};

export const LinkPopover = forwardRef<HTMLDivElement, Props>(
  function LinkPopover(
    { anchorRect, anchorElem, initial, mode, onClose: _onClose, onRemove, onSave },
    ref,
  ) {
    const [linkType, setLinkType] = useState<LinkPopoverValue['linkType']>(
      initial.linkType,
    );
    const [url, setUrl] = useState(initial.url);
    const [doc, setDoc] = useState<LinkPopoverDoc | null>(initial.doc);
    const [internalPath, setInternalPath] = useState<string | null>(
      initial.internalPath,
    );
    const [newTab, setNewTab] = useState(initial.newTab);
    const [rel, setRel] = useState(initial.rel);
    const [relTouched, setRelTouched] = useState(false);
    // In edit mode the checkbox starts "touched": the stored value is the
    // editor's earlier decision and must not be overridden by the auto-sync
    // below just because the popover re-opened on an external link.
    const [newTabTouched, setNewTabTouched] = useState(mode === 'edit');
    const idBase = useId();
    const externalInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (linkType === 'external') {
        externalInputRef.current?.focus();
        externalInputRef.current?.select();
      }
    }, [linkType]);

    useEffect(() => {
      if (relTouched) return;
      setRel(linkType === 'internal' ? 'follow' : 'nofollow');
    }, [linkType, relTouched]);

    // External links leave the site, so they default to a new tab; internal
    // links stay same-tab. Follows the link type — including the automatic
    // flip to External when a foreign URL is pasted into the internal box —
    // until the editor touches the checkbox themselves.
    useEffect(() => {
      if (newTabTouched) return;
      setNewTab(linkType === 'external');
    }, [linkType, newTabTouched]);

    // The parent fetches the doc title async (edit mode) — when it
    // arrives, fold it into our local `doc` so the search input shows
    // "Blog: <Title>" instead of "blogs/<id>". Only patches the title
    // field on the same id; user-driven changes to `doc` are preserved.
    useEffect(() => {
      const incomingTitle = initial.doc?.title;
      const incomingId = initial.doc?.id;
      if (!incomingTitle || !incomingId) return;
      setDoc((current) => {
        if (!current || current.id !== incomingId) return current;
        if (current.title === incomingTitle) return current;
        return { ...current, title: incomingTitle };
      });
    }, [initial.doc?.id, initial.doc?.title]);

    const position = useMemo(
      () => computePosition(anchorRect, anchorElem),
      [anchorRect, anchorElem],
    );

    const isInternal = linkType === 'internal';

    const handleInternalSelect = (pick: InternalPick): void => {
      if (pick.kind === 'doc') {
        // Resolve the doc to a concrete public path. We then save as
        // `linkType: 'custom'` (see LinkPopoverPlugin.handleSave) so
        // the rendered <a> gets a real href — Payload's LinkNode only
        // sets href on custom-type links. Doc title/label are stashed
        // on `doc` purely for the input display in edit mode.
        const path = resolveInternalPath(pick.collection, pick.slug);
        setDoc({
          collection: pick.collection,
          id: pick.id,
          title: pick.title,
        });
        setInternalPath(path);
        return;
      }
      if (pick.kind === 'external') {
        // Editor pasted a foreign URL into the Internal box — flip
        // the radio to External and prefill the URL field. The
        // `relTouched` reset isn't fired so default rel auto-flips
        // to `nofollow` per the existing radio→rel sync effect.
        setLinkType('external');
        setUrl(pick.url);
        setDoc(null);
        setInternalPath(null);
        return;
      }
      setInternalPath(pick.url);
      setDoc(null);
    };

    const submit = (event?: React.FormEvent): void => {
      event?.preventDefault();
      if (isInternal) {
        // Both doc-picks and free-typed paths save the same way: as
        // a custom URL link. Doc-picks have a resolved path in
        // `internalPath` from handleInternalSelect; free-typed paths
        // set internalPath directly. Saving as `linkType: 'custom'`
        // ensures the editor renders a real `<a href>` instead of a
        // bare `<a>` (Payload's LinkNode.createDOM gates href on
        // linkType === 'custom').
        if (internalPath) {
          onSave({
            doc: null,
            internalPath,
            linkType,
            newTab,
            rel,
            url: internalPath,
          });
        }
        return;
      }
      const trimmed = url.trim();
      if (!trimmed) return;
      onSave({
        doc: null,
        internalPath: null,
        linkType,
        newTab,
        rel,
        url: trimmed,
      });
    };

    const canSubmit = isInternal
      ? internalPath != null && internalPath.length > 0
      : url.trim().length > 0;

    // Where "Open link ↗" goes. Internal paths resolve to the public site
    // URL (toStoredUrl prefixes the site origin) — a bare `/about-us` would
    // otherwise open on the CMS origin. Always a new tab: navigating the
    // admin tab away from an open editor loses unsaved work.
    const visitHref = isInternal
      ? internalPath
        ? toStoredUrl(internalPath)
        : null
      : url.trim() || null;

    const initialDocDisplay = doc?.title
      ? `${doc.title}`
      : doc
        ? `${doc.collection}/${doc.id}`
        : (internalPath ?? '');

    return (
      <div
        aria-label={mode === 'create' ? 'Create link' : 'Edit link'}
        className="cs-link-popover"
        ref={ref}
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
      >
        <form className="cs-link-popover__form" onSubmit={submit}>
          <fieldset className="cs-link-popover__radios">
            <legend className="cs-link-popover__sr">Link type</legend>
            <label className="cs-link-popover__radio">
              <input
                checked={linkType === 'internal'}
                name={`${idBase}-type`}
                onChange={() => setLinkType('internal')}
                type="radio"
                value="internal"
              />
              <span>Internal</span>
            </label>
            <label className="cs-link-popover__radio">
              <input
                checked={linkType === 'external'}
                name={`${idBase}-type`}
                onChange={() => setLinkType('external')}
                type="radio"
                value="external"
              />
              <span>External</span>
            </label>
          </fieldset>

          {isInternal ? (
            <div className="cs-link-popover__field">
              <span className="cs-link-popover__label">Search content</span>
              <LinkInternalSearch
                initialDisplay={initialDocDisplay}
                onSelect={handleInternalSelect}
                selectedDisplay={doc?.title}
              />
            </div>
          ) : (
            <label className="cs-link-popover__field">
              <span className="cs-link-popover__label">URL</span>
              <input
                className="cs-link-popover__input"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com"
                ref={externalInputRef}
                type="url"
                value={url}
              />
            </label>
          )}

          <div className="cs-link-popover__row">
            <label className="cs-link-popover__check">
              <input
                checked={newTab}
                onChange={(event) => {
                  setNewTab(event.target.checked);
                  setNewTabTouched(true);
                }}
                type="checkbox"
              />
              <span>Open in new tab</span>
            </label>

            <label className="cs-link-popover__check">
              <span className="cs-link-popover__label cs-link-popover__label--inline">
                rel
              </span>
              <select
                className="cs-link-popover__select"
                onChange={(event) => {
                  setRel(event.target.value);
                  setRelTouched(true);
                }}
                value={rel}
              >
                {REL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="cs-link-popover__actions">
            {mode === 'edit' ? (
              <span className="cs-link-popover__actions-left">
                <button
                  className="cs-link-popover__btn cs-link-popover__btn--ghost"
                  onClick={onRemove}
                  type="button"
                >
                  Remove link
                </button>
                {visitHref ? (
                  <a
                    className="cs-link-popover__btn cs-link-popover__btn--ghost"
                    href={visitHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open ↗
                  </a>
                ) : null}
              </span>
            ) : (
              <span />
            )}
            <button
              className="cs-link-popover__btn cs-link-popover__btn--primary"
              disabled={!canSubmit}
              type="submit"
            >
              {mode === 'edit' ? 'Update' : 'Add link'}
            </button>
          </div>
        </form>
      </div>
    );
  },
);
