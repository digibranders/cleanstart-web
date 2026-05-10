'use client';

import { RenderFields } from '@payloadcms/ui';
import type { TabsFieldClientProps } from 'payload';
import type { ReactElement } from 'react';
import { useId, useState } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

/**
 * Custom Tabs field. Renders a horizontal tablist + tabpanel pair,
 * one tab per `field.tabs[]` entry. Inner field tree per tab is
 * delegated to Payload's `RenderFields`.
 *
 * Keyboard: Left/Right arrows move between tabs (W3C tablist
 * pattern), Home/End jump, Tab leaves the tablist into the panel.
 */
export const TabsField = (props: TabsFieldClientProps): ReactElement => {
  const { field, path, schemaPath, permissions, readOnly, forceRender } = props;
  const baseId = useId();
  const tabs = (field.tabs ?? []) as ReadonlyArray<{
    label?: unknown;
    name?: string;
    fields: unknown[];
  }>;

  const [activeIdx, setActiveIdx] = useState(0);

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (tabs.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % tabs.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + tabs.length) % tabs.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIdx(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIdx(tabs.length - 1);
    }
  };

  return (
    <div className="cs-tabs">
      <div
        className="cs-tabs__list"
        role="tablist"
        onKeyDown={onKey}
      >
        {tabs.map((t, i) => {
          const isActive = i === activeIdx;
          const tabId = `${baseId}-tab-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          const tabLabel = labelOf(t.label) || t.name || `Tab ${i + 1}`;
          return (
            <button
              key={tabId}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              className={`cs-tabs__tab${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => {
        if (i !== activeIdx) return null;
        const tabId = `${baseId}-tab-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        const childPath = t.name ? `${path ? `${path}.` : ''}${t.name}` : path;
        return (
          <div
            key={panelId}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className="cs-tabs__panel"
          >
            <RenderFields
              fields={t.fields as never}
              parentPath={childPath ?? ''}
              parentSchemaPath={schemaPath ?? ''}
              parentIndexPath=""
              permissions={
                permissions && typeof permissions === 'object' && 'fields' in permissions
                  ? (permissions.fields as Record<string, never>) ?? {}
                  : {}
              }
              readOnly={readOnly ?? false}
              {...(forceRender !== undefined ? { forceRender } : {})}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TabsField;
