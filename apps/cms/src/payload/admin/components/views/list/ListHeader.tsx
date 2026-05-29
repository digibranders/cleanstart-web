'use client';

import { useListQuery } from '@payloadcms/ui';
import Link from 'next/link';
import type { ChangeEvent, ReactElement, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { SavedViews } from './SavedViews';

type Props = {
  readonly collectionLabel: string;
  readonly collectionSlug: string;
  readonly description?: ReactNode;
  readonly hasCreatePermission: boolean;
  readonly menuOpen?: boolean;
  readonly newDocumentURL: string;
  readonly menuAnchorRef: RefObject<HTMLButtonElement | null>;
  readonly onMenuToggle: () => void;
};

/**
 * Sticky list-view header. Owns search, "create" CTA, and the kebab
 * menu trigger. Search is debounced through `useListQuery.handleSearchChange`
 * so URL state stays canonical (matches existing Payload behaviour).
 */
export const ListHeader = (props: Props): ReactElement => {
  const {
    collectionLabel,
    description,
    hasCreatePermission,
    menuOpen = false,
    newDocumentURL,
    menuAnchorRef,
    onMenuToggle,
  } = props;
  const { query, handleSearchChange } = useListQuery();
  const [search, setSearch] = useState<string>(() =>
    typeof query.search === 'string' ? query.search : '',
  );
  const debounceRef = useRef<number | null>(null);

  // Clear any pending debounce on unmount so it cannot call
  // handleSearchChange after the list-view has been torn down.
  useEffect(() => {
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: depending on `search` would create a feedback loop with the local debounced setter
  useEffect(() => {
    const next = typeof query.search === 'string' ? query.search : '';
    if (next !== search) setSearch(next);
  }, [query.search]);

  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const next = e.target.value;
    setSearch(next);
    if (!handleSearchChange) return;
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void handleSearchChange(next);
    }, 250);
  };

  return (
    <header className="cs-list__header">
      <div className="cs-list__heading">
        <h1 className="cs-list__title">{collectionLabel}</h1>
        {description ? <div className="cs-list__description">{description}</div> : null}
      </div>
      <div className="cs-list__controls">
        <SavedViews collectionSlug={props.collectionSlug} />
        <label className="cs-list__search">
          <span className="cs-visually-hidden">Search {collectionLabel}</span>
          <input
            type="search"
            value={search}
            onChange={onChange}
            placeholder={`Search ${collectionLabel.toLowerCase()}…`}
            className="cs-list__search-input"
          />
        </label>
        <button
          ref={menuAnchorRef}
          type="button"
          className="cs-btn cs-btn--subtle cs-list__menu-trigger"
          onClick={onMenuToggle}
          aria-label={`${collectionLabel} actions`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="3" cy="8" r="1.4" fill="currentColor" />
            <circle cx="8" cy="8" r="1.4" fill="currentColor" />
            <circle cx="13" cy="8" r="1.4" fill="currentColor" />
          </svg>
        </button>
        {hasCreatePermission ? (
          <Link href={newDocumentURL} className="cs-btn cs-btn--primary">
            Create
          </Link>
        ) : null}
      </div>
    </header>
  );
};
