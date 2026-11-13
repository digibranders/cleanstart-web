'use client';

import type { AudienceDraft } from '@/components/documents/doc-view';
import { type AudienceKind, PARTNER_CATEGORIES, PARTNER_CATEGORY_PLURAL, type PartnerCategory } from '@/lib/domain';

const AUDIENCES: ReadonlyArray<{ kind: AudienceKind; label: string }> = [
  { kind: 'all', label: 'Everyone' },
  { kind: 'categories', label: 'Categories' },
  { kind: 'named', label: 'Named partners' },
];

export function AudiencePicker({
  idPrefix,
  draft,
  onChange,
  error,
  disabled = false,
}: {
  idPrefix: string;
  draft: AudienceDraft;
  onChange: (next: AudienceDraft) => void;
  error: string | null;
  disabled?: boolean;
}): React.JSX.Element {
  const audId = `${idPrefix}-aud`;
  const partnersId = `${idPrefix}-pa`;
  const toggle = (category: PartnerCategory): void =>
    onChange({
      ...draft,
      categories: draft.categories.includes(category)
        ? draft.categories.filter((c) => c !== category)
        : [...draft.categories, category],
    });

  return (
    <>
      <div className="fg">
        <span id={audId} className="lbl">
          Who can open it
        </span>
        <div className="seg" role="group" aria-labelledby={audId} style={{ alignSelf: 'flex-start' }}>
          {AUDIENCES.map((a) => (
            <button
              key={a.kind}
              type="button"
              className={`seg-b${a.kind === draft.kind ? ' seg-on' : ''}`}
              aria-pressed={a.kind === draft.kind}
              disabled={disabled}
              onClick={() => onChange({ ...draft, kind: a.kind })}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      {draft.kind === 'categories' ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PARTNER_CATEGORIES.map((c) => {
              const on = draft.categories.includes(c);
              return (
                <label
                  key={c}
                  className={`badge ${on ? 'b-violet' : 'b-neutral'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    height: 26,
                    padding: '0 8px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={disabled}
                    onChange={() => toggle(c)}
                    style={{ width: 13, height: 13, margin: 0, accentColor: '#4B23C8' }}
                  />
                  {PARTNER_CATEGORY_PLURAL[c]}
                </label>
              );
            })}
          </div>
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
        </>
      ) : null}
      {draft.kind === 'named' ? (
        <div className="fg">
          <label htmlFor={partnersId} className="lbl">
            Partners
          </label>
          <input
            id={partnersId}
            className={`field${error ? ' field-err' : ''}`}
            type="text"
            value={draft.partnersText}
            disabled={disabled}
            onChange={(e) => onChange({ ...draft, partnersText: e.target.value })}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${partnersId}-err` : `${partnersId}-hint`}
          />
          {error ? (
            <span id={`${partnersId}-err`} className="err">
              {error}
            </span>
          ) : (
            <span id={`${partnersId}-hint`} className="hint">
              Separate partner names with commas.
            </span>
          )}
        </div>
      ) : null}
    </>
  );
}
