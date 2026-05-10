'use client';

import { useField } from '@payloadcms/ui';
import type { PointFieldClientProps } from 'payload';
import type { ChangeEvent, ReactElement } from 'react';
import { useId } from 'react';

const labelOf = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'en' in raw) {
    return String((raw as Record<string, unknown>).en ?? '');
  }
  return '';
};

const parse = (raw: string): number | null => {
  if (raw === '') return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : null;
};

/**
 * GeoJSON Point field — stored as `[lng, lat]`. UI splits to two number
 * inputs so editors can type without remembering the array order.
 * Storage shape stays unchanged ([lng, lat]) so no schema migration.
 */
export const PointField = (props: PointFieldClientProps): ReactElement => {
  const { field, path } = props;
  const { value, setValue, showError, errorMessage } = useField<
    [number, number] | null | undefined
  >({ path });

  const baseId = useId();
  const lngId = `${baseId}-lng`;
  const latId = `${baseId}-lat`;
  const labelText = labelOf(field.label) || path;
  const description =
    typeof field.admin?.description === 'string' ? field.admin.description : undefined;
  const readOnly = field.admin?.readOnly === true;

  const lng = value?.[0] ?? null;
  const lat = value?.[1] ?? null;

  const onChange = (which: 'lng' | 'lat') => (e: ChangeEvent<HTMLInputElement>): void => {
    const next = parse(e.target.value);
    const nextLng = which === 'lng' ? next : lng;
    const nextLat = which === 'lat' ? next : lat;
    if (nextLng == null && nextLat == null) {
      setValue(null);
      return;
    }
    setValue([nextLng ?? 0, nextLat ?? 0]);
  };

  return (
    <div
      className={`field-type point cs-point-field${showError ? ' cs-point-field--error' : ''}`}
    >
      <span className="field-label">
        {labelText}
        {field.required ? (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      <div className="cs-point-field__row">
        <label className="cs-point-field__cell" htmlFor={lngId}>
          <span className="cs-point-field__cell-label">Longitude</span>
          <input
            id={lngId}
            type="number"
            inputMode="decimal"
            step="any"
            min={-180}
            max={180}
            className="cs-text-field__input"
            value={lng ?? ''}
            onChange={onChange('lng')}
            readOnly={readOnly}
            aria-readonly={readOnly || undefined}
          />
        </label>
        <label className="cs-point-field__cell" htmlFor={latId}>
          <span className="cs-point-field__cell-label">Latitude</span>
          <input
            id={latId}
            type="number"
            inputMode="decimal"
            step="any"
            min={-90}
            max={90}
            className="cs-text-field__input"
            value={lat ?? ''}
            onChange={onChange('lat')}
            readOnly={readOnly}
            aria-readonly={readOnly || undefined}
          />
        </label>
      </div>
      {description ? <p className="field-description">{description}</p> : null}
      {showError && errorMessage ? (
        <output className="field-error" aria-live="polite">
          {errorMessage}
        </output>
      ) : null}
    </div>
  );
};

export default PointField;
